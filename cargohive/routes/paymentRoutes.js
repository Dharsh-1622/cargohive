const express = require("express");
const crypto = require("crypto");
const mongoose = require("mongoose");
let Razorpay;
try {
  Razorpay = require("razorpay");
} catch (e) {
  Razorpay = null;
}
const Payment = require("../models/Payment");

const router = express.Router();

// In-memory payment ledger for immediate duplicate checking & offline fallback
const inMemoryPayments = new Map();
const inMemoryOrders = new Map();

function isDbConnected() {
  return mongoose.connection && mongoose.connection.readyState === 1;
}

// Helper to initialize Razorpay instance if keys are available
function getRazorpayInstance() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!Razorpay || !key_id || !key_secret || key_id.includes("placeholder")) {
    return null;
  }
  try {
    return new Razorpay({
      key_id: key_id.trim(),
      key_secret: key_secret.trim(),
    });
  } catch (err) {
    console.warn("Failed to instantiate Razorpay client:", err.message);
    return null;
  }
}

// 1. GET /api/payment/config - Return public Razorpay Key ID (never expose secret)
router.get("/config", (req, res) => {
  const keyId = process.env.RAZORPAY_KEY_ID || "rzp_test_51CargoHiveTest";
  res.status(200).json({
    success: true,
    keyId: keyId,
    currency: "INR",
  });
});

// Helper to query payment records safely (memory + DB)
async function findExistingPayment(filter) {
  for (const p of inMemoryPayments.values()) {
    let match = true;
    for (const key of Object.keys(filter)) {
      if (filter[key] && typeof filter[key] === "object" && filter[key].$in) {
        if (!filter[key].$in.includes(p[key])) match = false;
      } else if (p[key] !== filter[key]) {
        match = false;
      }
    }
    if (match) return p;
  }
  if (isDbConnected()) {
    try {
      return await Payment.findOne(filter).maxTimeMS(2000);
    } catch (e) {
      console.warn("DB findOne warning:", e.message);
    }
  }
  return null;
}

// 2. POST /api/payment/create-order - Create Razorpay order with split calculation
router.post("/create-order", async (req, res) => {
  try {
    const {
      bookingId,
      totalAmount,
      cbm,
      pricePerCBM,
      paymentType = "advance", // 'advance' (50%) or 'final' (50%)
      shipmentStatus,
      traderName,
      traderEmail,
    } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Validation failed: bookingId is required.",
      });
    }

    // 1. Calculate total amount
    let calculatedTotal = 0;
    if (totalAmount !== undefined && totalAmount !== null && Number(totalAmount) > 0) {
      calculatedTotal = Number(totalAmount);
    } else if (cbm && pricePerCBM) {
      calculatedTotal = Math.round(Number(cbm) * Number(pricePerCBM));
    } else {
      calculatedTotal = 2880; // Demo default fallback: 2.40 CBM * ₹1,200 = ₹2,880
    }

    // 2. Split payment: Advance = 50%, Remaining = 50%
    const advanceAmount = Math.round(calculatedTotal * 0.5);
    const remainingAmount = calculatedTotal - advanceAmount;

    let payableAmount = 0;

    // Check paymentType and business rules
    if (paymentType === "final") {
      // Final payment requirement: available ONLY when shipment status is 'Delivered'
      if (shipmentStatus && shipmentStatus !== "Delivered") {
        return res.status(400).json({
          success: false,
          message:
            "Final payment is available only when shipment status is Delivered. Current status: " +
            shipmentStatus,
        });
      }

      // Duplicate payment protection: check if already fully paid
      const existingFinal = await findExistingPayment({
        bookingId: String(bookingId).trim(),
        paymentType: "final",
        status: "Fully Paid",
      });
      if (existingFinal) {
        return res.status(400).json({
          success: false,
          message: "Duplicate payment rejected: This booking is already Fully Paid.",
        });
      }

      payableAmount = remainingAmount;
    } else {
      // Advance payment (default)
      // Duplicate payment protection: check if advance already paid
      const existingAdvance = await findExistingPayment({
        bookingId: String(bookingId).trim(),
        paymentType: "advance",
        status: { $in: ["Advance Paid", "Fully Paid"] },
      });
      if (existingAdvance) {
        return res.status(400).json({
          success: false,
          message:
            "Duplicate payment rejected: Advance payment is already completed for this booking.",
        });
      }

      payableAmount = advanceAmount;
    }

    // 3. Create Razorpay order (amounts in paise)
    const amountInPaise = Math.round(payableAmount * 100);
    const keyId = process.env.RAZORPAY_KEY_ID || "rzp_test_51CargoHiveTest";
    let orderId = "";

    const rzp = getRazorpayInstance();
    if (rzp) {
      try {
        const order = await rzp.orders.create({
          amount: amountInPaise,
          currency: "INR",
          receipt: `rcpt_${String(bookingId).replace(/[^a-zA-Z0-9]/g, "").slice(-8)}_${paymentType}`,
          notes: {
            bookingId: String(bookingId),
            paymentType: paymentType,
            totalAmount: calculatedTotal,
            payableAmount: payableAmount,
          },
        });
        orderId = order.id;
      } catch (rzpErr) {
        console.warn("Razorpay API create order warning:", rzpErr.message);
        orderId = `order_test_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      }
    } else {
      orderId = `order_test_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    }

    res.status(200).json({
      success: true,
      orderId: orderId,
      amount: payableAmount,
      amountInPaise: amountInPaise,
      currency: "INR",
      keyId: keyId,
      bookingId: bookingId,
      paymentType: paymentType,
      totalAmount: calculatedTotal,
      advanceAmount: advanceAmount,
      remainingAmount: remainingAmount,
    });
  } catch (error) {
    console.error("Error creating payment order:", error);
    res.status(500).json({
      success: false,
      message: "Server error creating payment order",
      error: error.message,
    });
  }
});

// 3. POST /api/payment/verify - Verify payment & save to database (with duplicate protection)
router.post("/verify", async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingId,
      paymentType = "advance",
      totalAmount,
      advanceAmount,
      remainingAmount,
      amountPaid,
      traderId,
      traderName,
      providerId,
      providerName,
      vehicleId,
      vehicleNumber,
      route,
      cargoName,
      cbm,
      weight,
      paymentMethod = "Razorpay",
    } = req.body;

    if (!bookingId || !razorpay_payment_id) {
      return res.status(400).json({
        success: false,
        message: "Validation failed: bookingId and razorpay_payment_id are required.",
      });
    }

    const cleanPaymentId = String(razorpay_payment_id).trim();
    const cleanBookingId = String(bookingId).trim();

    // 1. DUPLICATE PAYMENT PROTECTION: Check if this razorpay_payment_id is already processed
    const duplicateTxn = await findExistingPayment({ razorpayPaymentId: cleanPaymentId });
    if (duplicateTxn) {
      return res.status(400).json({
        success: false,
        message: "Duplicate payment rejected: Transaction " + cleanPaymentId + " has already been processed.",
        payment: duplicateTxn,
      });
    }

    // Check if the booking has already completed this phase
    if (paymentType === "advance") {
      const existingAdv = await findExistingPayment({
        bookingId: cleanBookingId,
        paymentType: "advance",
        status: { $in: ["Advance Paid", "Fully Paid"] },
      });
      if (existingAdv) {
        return res.status(400).json({
          success: false,
          message: "Duplicate payment rejected: Advance payment is already recorded for booking " + cleanBookingId,
        });
      }
    } else if (paymentType === "final") {
      const existingFin = await findExistingPayment({
        bookingId: cleanBookingId,
        paymentType: "final",
        status: "Fully Paid",
      });
      if (existingFin) {
        return res.status(400).json({
          success: false,
          message: "Duplicate payment rejected: Final payment is already recorded for booking " + cleanBookingId,
        });
      }
    }

    // 2. Verify Signature if real Razorpay secret is present
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (
      secret &&
      !secret.includes("secret_placeholder") &&
      razorpay_order_id &&
      razorpay_signature &&
      !razorpay_order_id.startsWith("order_test_")
    ) {
      const body = razorpay_order_id + "|" + cleanPaymentId;
      const expectedSignature = crypto
        .createHmac("sha256", secret.trim())
        .update(body.toString())
        .digest("hex");

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({
          success: false,
          message: "Payment verification failed: Invalid transaction signature.",
        });
      }
    }

    // 3. Calculate financial values
    const numTotal = Number(totalAmount) || 2880;
    const numAdvance = advanceAmount !== undefined ? Number(advanceAmount) : Math.round(numTotal * 0.5);
    const numRemaining = remainingAmount !== undefined ? Number(remainingAmount) : numTotal - numAdvance;
    const numPaid = Number(amountPaid) || (paymentType === "final" ? numRemaining : numAdvance);

    const resultingStatus = paymentType === "final" ? "Fully Paid" : "Advance Paid";
    const receiptNumber = `RCPT-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;

    const paymentRecord = {
      bookingId: cleanBookingId,
      traderId: traderId ? String(traderId).trim() : "",
      traderName: traderName ? String(traderName).trim() : "Trader",
      providerId: providerId ? String(providerId).trim() : "",
      providerName: providerName ? String(providerName).trim() : "Provider",
      vehicleId: vehicleId ? String(vehicleId).trim() : "",
      vehicleNumber: vehicleNumber ? String(vehicleNumber).trim() : "",
      route: route || [],
      cargoName: cargoName ? String(cargoName).trim() : "General Cargo",
      cbm: Number(cbm) || 2.4,
      weight: Number(weight) || 0,
      totalAmount: numTotal,
      advanceAmount: numAdvance,
      remainingAmount: paymentType === "final" ? 0 : numRemaining,
      amountPaid: numPaid,
      paymentType: paymentType,
      paymentMethod: String(paymentMethod).trim(),
      razorpayOrderId: razorpay_order_id ? String(razorpay_order_id).trim() : "",
      razorpayPaymentId: cleanPaymentId,
      razorpaySignature: razorpay_signature ? String(razorpay_signature).trim() : "",
      status: resultingStatus,
      receiptNumber: receiptNumber,
      paymentDate: new Date(),
    };

    // Store in memory cache
    inMemoryPayments.set(cleanPaymentId, paymentRecord);
    inMemoryPayments.set(`${cleanBookingId}_${paymentType}`, paymentRecord);

    // Save to MongoDB if connected
    if (isDbConnected()) {
      try {
        const payment = new Payment(paymentRecord);
        await payment.save();
      } catch (dbErr) {
        console.warn("MongoDB payment save error:", dbErr.message);
      }
    }

    res.status(200).json({
      success: true,
      message: paymentType === "final" ? "Final payment successful. Booking is Fully Paid!" : "Advance payment successful. Booking confirmed!",
      payment: paymentRecord,
      receipt: {
        company: "CargoHive",
        receiptNumber: paymentRecord.receiptNumber,
        bookingId: paymentRecord.bookingId,
        trader: paymentRecord.traderName,
        provider: paymentRecord.providerName,
        route: paymentRecord.route,
        cargo: paymentRecord.cargoName,
        cbm: paymentRecord.cbm,
        weight: paymentRecord.weight,
        totalAmount: paymentRecord.totalAmount,
        amountPaid: paymentRecord.amountPaid,
        remainingAmount: paymentRecord.remainingAmount,
        paymentStatus: paymentRecord.status,
        paymentDate: paymentRecord.paymentDate,
        paymentMethod: paymentRecord.paymentMethod,
        transactionId: paymentRecord.razorpayPaymentId,
      },
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({
      success: false,
      message: "Server error verifying payment",
      error: error.message,
    });
  }
});


// 4. POST /api/payment/failure - Record failed payment attempt
router.post("/failure", async (req, res) => {
  try {
    const {
      bookingId,
      paymentType = "advance",
      errorReason = "Payment failed or cancelled",
      errorCode = "PAYMENT_CANCELLED",
      totalAmount,
      cbm,
    } = req.body;

    const failedPayment = new Payment({
      bookingId: bookingId ? String(bookingId).trim() : "UNKNOWN",
      totalAmount: Number(totalAmount) || 0,
      advanceAmount: 0,
      remainingAmount: Number(totalAmount) || 0,
      amountPaid: 0,
      cbm: Number(cbm) || 0,
      paymentType: paymentType,
      status: "Failed",
      paymentMethod: "Razorpay (Failed)",
      receiptNumber: "",
      paymentDate: new Date(),
    });

    if (isDbConnected()) {
      try {
        await failedPayment.save();
      } catch (e) {
        console.warn("DB failedPayment save error:", e.message);
      }
    }

    res.status(200).json({
      success: false,
      message: "Payment failure recorded",
      reason: errorReason,
      allowRetry: true,
    });
  } catch (error) {
    console.error("Error logging payment failure:", error);
    res.status(500).json({
      success: false,
      message: "Server error logging payment failure",
      error: error.message,
    });
  }
});

// 5. GET /api/payment/status/:bookingId - Fetch payment details for a booking
router.get("/status/:bookingId", async (req, res) => {
  try {
    const bookingId = String(req.params.bookingId).trim();
    let payments = [];

    for (const p of inMemoryPayments.values()) {
      if (p.bookingId === bookingId) payments.push(p);
    }

    if (isDbConnected()) {
      try {
        const dbPayments = await Payment.find({ bookingId }).sort({ createdAt: -1 });
        if (dbPayments && dbPayments.length > 0) payments = dbPayments;
      } catch (e) {
        console.warn("DB find status warning:", e.message);
      }
    }

    if (!payments || payments.length === 0) {
      return res.status(200).json({
        success: true,
        bookingId,
        paymentStatus: "Payment Pending",
        payments: [],
      });
    }

    const latest = payments[0];
    const advanceRecord = payments.find((p) => p.paymentType === "advance" && p.status === "Advance Paid");
    const finalRecord = payments.find((p) => p.paymentType === "final" && p.status === "Fully Paid");

    let status = "Payment Pending";
    if (finalRecord) {
      status = "Fully Paid";
    } else if (advanceRecord) {
      status = "Advance Paid";
    }

    res.status(200).json({
      success: true,
      bookingId,
      status,
      latest,
      advanceRecord,
      finalRecord,
      allPayments: payments,
    });
  } catch (error) {
    console.error("Error getting payment status:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching payment status",
      error: error.message,
    });
  }
});

// 6. GET /api/payment/receipt/:bookingId - Get receipt details
router.get("/receipt/:bookingId", async (req, res) => {
  try {
    const bookingId = String(req.params.bookingId).trim();
    const payment = await findExistingPayment({
      bookingId,
      status: { $in: ["Advance Paid", "Fully Paid"] },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "No successful payment found for booking ID: " + bookingId,
      });
    }

    res.status(200).json({
      success: true,
      receipt: {
        company: "CargoHive",
        receiptNumber: payment.receiptNumber || ("RCPT-" + Date.now().toString().slice(-6)),
        bookingId: payment.bookingId,
        trader: payment.traderName,
        provider: payment.providerName,
        route: payment.route,
        cargo: payment.cargoName,
        cbm: payment.cbm,
        weight: payment.weight,
        totalAmount: payment.totalAmount,
        amountPaid: payment.amountPaid,
        remainingAmount: payment.remainingAmount,
        paymentStatus: payment.status,
        paymentDate: payment.paymentDate,
        paymentMethod: payment.paymentMethod,
        transactionId: payment.razorpayPaymentId,
      },
    });
  } catch (error) {
    console.error("Error fetching receipt:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching receipt",
      error: error.message,
    });
  }
});


module.exports = router;
