const mongoose = require("mongoose");

const DeviceSchema = new mongoose.Schema({
  Did: {
    type: String,
    required: true,
    unique: true
  },
  waterFlow: [Number], // Array of numbers for water flow readings
  pressure: [Number],  // Array of numbers for pressure readings
  temperature: [Number], // Array of numbers for temperature readings
}, {
  timestamps: true // Document level timestamps
});

module.exports = mongoose.model("Device", DeviceSchema);
