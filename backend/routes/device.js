const express = require("express");
const router = express.Router();
const Device = require("../models/Device");

// GET ALL DEVICES
router.get("/", async (req, res) => {
  try {
    const devices = await Device.find();
    res.json(devices);
  } catch (error) {
    console.error("Error fetching devices:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post('/bulk', async (req, res) => {
    const updates = req.body;
    // Assume updates is an array of device objects with at least the fields waterFlow, pressure, temperature

    updates.map(async (item)=>{
        const device = await Device.findById(item._id);
        if(device){
            device.waterFlow.push(item.waterFlow);
            device.pressure.push(item.pressure);
            device.temperature.push(item.temperature);
            await device.save();
        }
    })

    res.status(200).json({ message: "Devices updated successfully", updates });
});


// GET ONE DEVICE BY DID
router.get("/:did", async (req, res) => {
  try {
    const device = await Device.findOne({ Did: req.params.did });
    if (!device) {
      return res.status(404).json({ message: "Device not found" });
    }
    res.json(device);
  } catch (error) {
    console.error("Error fetching device:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// CREATE A DEVICE
router.post("/", async (req, res) => {
  try {
    const { Did } = req.body;
    const existing = await Device.findOne({ Did });
    if (existing) {
      return res.status(400).json({ message: "Device with this ID already exists." });
    }
    const newDevice = new Device(req.body);
    await newDevice.save();
    res.status(201).json({ message: "Device created successfully", device: newDevice });
  } catch (error) {
    console.error("Error creating device:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// UPDATE A DEVICE (PUSH NEW SENSOR DATA)
router.put("/:did", async (req, res) => {
  try {
    const { waterFlow, pressure, temperature } = req.body;
    const device = await Device.findOne({ Did: req.params.did });
    if (!device) {
      return res.status(404).json({ message: "Device not found" });
    }
    device.waterFlow.push(waterFlow);
    device.pressure.push(pressure);
    device.temperature.push(temperature);
    await device.save();
    res.json({ message: "Device updated successfully", device });
  } catch (error) {
    console.error("Error updating device:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE A DEVICE
router.delete("/:did", async (req, res) => {
  try {
    const deleted = await Device.findOneAndDelete({ Did: req.params.did });
    if (!deleted) {
      return res.status(404).json({ message: "Device not found" });
    }
    res.json({ message: "Device deleted successfully" });
  } catch (error) {
    console.error("Error deleting device:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
