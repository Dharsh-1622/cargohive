const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    required: [true, "Booking ID is required"],
    trim: true,
    index: true,
  },
  traderId: {
    type: String,
    trim: true,
    default: "",
  },
  traderName: {
    type: String,
    trim: true,
    default: "",
  },
  providerId: {
    type: String,
    trim: true,
    default: "",
  },
  providerName: {
    type: String,
    trim: true,
    default: "",
  },
  vehicleId: {
    type: String,
    trim: true,
    default: "",
  },
  vehicleNumber: {
    type: String,
    trim: true,
    default: "",
  },
  route: {
    type: mongoose.Schema.Types.Mixed,
    default: [],
  },
  cargoName: {
    type: String,
    trim: true,
    default: "",
  },
  cbm: {
    type: Number,
    required: true,
  },
  weight: {
    type: Number,
    default: 0,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  advanceAmount: {
    type: Number,
    required: true,
  },
  remainingAmount: {
    type: Number,
    required: true,
  },
  amountPaid: {
    type: Number,
    required: true,
  },
  paymentType: {
    type: String,
    enum: ["advance", "final"],
    default: "advance",
  },
  paymentMethod: {
    type: String,
    trim: true,
    default: "Razorpay",
  },
  razorpayOrderId: {
    type: String,
    trim: true,
    default: "",
  },
  razorpayPaymentId: {
    type: String,
    trim: true,
    sparse: true,
    index: true,
  },
  razorpaySignature: {
    type: String,
    trim: true,
    default: "",
  },
  status: {
    type: String,
    enum: [
      "Payment Pending",
      "Advance Paid",
      "Confirmed",
      "In Transit",
      "Delivered",
      "Final Payment Pending",
      "Fully Paid",
      "Failed",
    ],
    default: "Advance Paid",
  },
  receiptNumber: {
    type: String,
    trim: true,
    default: "",
  },
  paymentDate: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Payment", paymentSchema);
