const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema({
  providerName: {
    type: String,
    required: [true, "Provider name is required"],
    trim: true,
  },
  vehicleType: {
    type: String,
    required: [true, "Vehicle type is required"],
    trim: true,
  },
  vehicleNumber: {
    type: String,
    required: [true, "Vehicle number is required"],
    trim: true,
  },
  fromLocation: {
    type: String,
    required: [true, "From location is required"],
    trim: true,
  },
  toLocation: {
    type: String,
    required: [true, "To location is required"],
    trim: true,
  },
  pickupDate: {
    type: String,
    required: [true, "Pickup date is required"],
    trim: true,
  },
  departureTime: {
    type: String,
    trim: true,
    default: "",
  },
  totalCapacityCBM: {
    type: Number,
    required: [true, "Total capacity in CBM is required"],
  },
  availableCapacityCBM: {
    type: Number,
    required: [true, "Available capacity in CBM is required"],
  },
  maxWeightKG: {
    type: Number,
    required: [true, "Maximum weight in KG is required"],
  },
  availableWeightKG: {
    type: Number,
    required: [true, "Available weight in KG is required"],
  },
  pricePerCBM: {
    type: Number,
  },
  status: {
    type: String,
    default: "Available",
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Vehicle", vehicleSchema);
