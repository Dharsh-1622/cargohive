const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const path = require("path");
const Vehicle = require("./models/Vehicle");
const paymentRoutes = require("./routes/paymentRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));
app.use("/api/payment", paymentRoutes);

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "CargoHive backend is running"
    });
});

// POST /api/vehicles - Save a vehicle to MongoDB
app.post("/api/vehicles", async (req, res) => {
    try {
        const {
            providerName,
            vehicleType,
            vehicleNumber,
            fromLocation,
            toLocation,
            pickupDate,
            departureTime,
            totalCapacityCBM,
            availableCapacityCBM,
            maxWeightKG,
            availableWeightKG,
            pricePerCBM,
            status
        } = req.body;

        // 1. Required fields check
        if (
            !providerName ||
            !vehicleType ||
            !vehicleNumber ||
            !fromLocation ||
            !toLocation ||
            !pickupDate ||
            totalCapacityCBM === undefined ||
            totalCapacityCBM === null ||
            totalCapacityCBM === "" ||
            availableCapacityCBM === undefined ||
            availableCapacityCBM === null ||
            availableCapacityCBM === "" ||
            maxWeightKG === undefined ||
            maxWeightKG === null ||
            maxWeightKG === "" ||
            availableWeightKG === undefined ||
            availableWeightKG === null ||
            availableWeightKG === ""
        ) {
            return res.status(400).json({
                success: false,
                message: "Validation failed: All required fields must be filled."
            });
        }

        // Required text fields cannot be empty
        if (
            !String(providerName).trim() ||
            !String(vehicleType).trim() ||
            !String(vehicleNumber).trim() ||
            !String(fromLocation).trim() ||
            !String(toLocation).trim() ||
            !String(pickupDate).trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Validation failed: Required text fields cannot be empty."
            });
        }

        // 2. Numeric range validations
        const numTotalCapacity = Number(totalCapacityCBM);
        const numAvailableCapacity = Number(availableCapacityCBM);
        const numMaxWeight = Number(maxWeightKG);
        const numAvailableWeight = Number(availableWeightKG);

        if (
            isNaN(numTotalCapacity) ||
            isNaN(numAvailableCapacity) ||
            isNaN(numMaxWeight) ||
            isNaN(numAvailableWeight)
        ) {
            return res.status(400).json({
                success: false,
                message: "Validation failed: Capacity and weight values must be valid numbers."
            });
        }

        if (numTotalCapacity <= 0) {
            return res.status(400).json({
                success: false,
                message: "Validation failed: totalCapacityCBM must be greater than 0."
            });
        }

        if (numAvailableCapacity < 0) {
            return res.status(400).json({
                success: false,
                message: "Validation failed: availableCapacityCBM must be greater than or equal to 0."
            });
        }

        if (numAvailableCapacity > numTotalCapacity) {
            return res.status(400).json({
                success: false,
                message: "Validation failed: availableCapacityCBM cannot be greater than totalCapacityCBM."
            });
        }

        if (numMaxWeight <= 0) {
            return res.status(400).json({
                success: false,
                message: "Validation failed: maxWeightKG must be greater than 0."
            });
        }

        if (numAvailableWeight < 0) {
            return res.status(400).json({
                success: false,
                message: "Validation failed: availableWeightKG must be greater than or equal to 0."
            });
        }

        if (numAvailableWeight > numMaxWeight) {
            return res.status(400).json({
                success: false,
                message: "Validation failed: availableWeightKG cannot be greater than maxWeightKG."
            });
        }

        const vehicle = new Vehicle({
            providerName: String(providerName).trim(),
            vehicleType: String(vehicleType).trim(),
            vehicleNumber: String(vehicleNumber).trim(),
            fromLocation: String(fromLocation).trim(),
            toLocation: String(toLocation).trim(),
            pickupDate: String(pickupDate).trim(),
            departureTime: departureTime ? String(departureTime).trim() : "",
            totalCapacityCBM: numTotalCapacity,
            availableCapacityCBM: numAvailableCapacity,
            maxWeightKG: numMaxWeight,
            availableWeightKG: numAvailableWeight,
            pricePerCBM: pricePerCBM !== undefined && pricePerCBM !== "" ? Number(pricePerCBM) : undefined,
            status: status ? String(status).trim() : "Available"
        });

        const savedVehicle = await vehicle.save();

        res.status(201).json({
            success: true,
            message: "Vehicle added successfully",
            data: savedVehicle
        });
    } catch (error) {
        console.error("Error saving vehicle:", error);
        res.status(500).json({
            success: false,
            message: "Server error: Failed to save vehicle",
            error: error.message
        });
    }
});

// GET /api/vehicles - Return all vehicles
app.get("/api/vehicles", async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(200).json({
                success: true,
                count: 0,
                data: [],
                message: "MongoDB in offline mode"
            });
        }
        const vehicles = await Vehicle.find().sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: vehicles.length,
            data: vehicles
        });
    } catch (error) {
        console.error("Error fetching vehicles:", error);
        res.status(500).json({
            success: false,
            message: "Server error: Failed to fetch vehicles",
            error: error.message
        });
    }
});

mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("✅ MongoDB connected successfully");

        app.listen(process.env.PORT || 5000, () => {
            console.log("🚀 CargoHive server running on port 5000");
        });
    })
    .catch((error) => {
        console.error("❌ MongoDB connection failed");
        console.error(error.message);

        app.listen(process.env.PORT || 5000, () => {
            console.log("🚀 CargoHive server running on port 5000 (MongoDB offline fallback active)");
        });
    });