import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Slider,
  Box,
  TextField,
  Stack,
} from "@mui/material";
import DeviceAnalytics from "./DeviceAnalytics";

function App() {
  // Devices fetched from the DB on mount
  const [devices, setDevices] = useState([]);

  // Dialog to edit sensor data
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedDeviceIndex, setSelectedDeviceIndex] = useState(null);

  // Dialog to add a new device
  const [openAddDialog, setOpenAddDialog] = useState(false);

  // The new device being typed in the form
  const [newDevice, setNewDevice] = useState({
    Did: "",
    waterFlow: [], // Initialize as empty array for multiple readings
    pressure: [], // Initialize as empty array for multiple readings
    temperature: [], // Initialize as empty array for multiple readings
  });

  /**
   * 1) Fetch from DB on first render
   */
useEffect(() => {
  fetch("http://localhost:5001/api/devices")
    .then((res) => res.json())
    .then((data) => {
      // Normalize data to ensure we only store the latest values of waterFlow, pressure, and temperature
      const normalizedDevices = data.map(device => ({
        ...device,
        waterFlow: Array.isArray(device.waterFlow) && device.waterFlow.length > 0 ? device.waterFlow[device.waterFlow.length - 1] : 0,
        pressure: Array.isArray(device.pressure) && device.pressure.length > 0 ? device.pressure[device.pressure.length - 1] : 0,
        temperature: Array.isArray(device.temperature) && device.temperature.length > 0 ? device.temperature[device.temperature.length - 1] : 0
      }));
      setDevices(normalizedDevices);
    })
    .catch((err) => console.error("Error fetching devices:", err));
}, []);

  

  /**
   * 2) Random update effect (every second)
   *    Remove or modify if not needed.
   */
  useEffect(() => {
    const interval = setInterval(() => {
      
      setDevices((prevDevices) => {
        // 1) Generate updated sensor data for each device
        const updatedDevices = prevDevices.map((device) => ({
          ...device,
          waterFlow: Math.abs(
            parseFloat((device.waterFlow + (Math.random() * 2 - 1)).toFixed(2))
          ),
          pressure: Math.abs(
            parseFloat((device.pressure + (Math.random() * 2 - 1)).toFixed(2))
          ),
          temperature: Math.abs(
            parseFloat(
              (device.temperature + (Math.random() * 2 - 1)).toFixed(2)
            )
          ),
        }
      ));

        // 2) Post updated data to the server endpoint
        fetch("http://localhost:5001/api/devices/bulk", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedDevices),
        })
          .then((res) => res.json())
          .then((data) => {
            console.log("Bulk update response:", data);
          })
          .catch((error) =>
            console.error("Error posting updated devices:", error)
          );

        // 3) Return the updated array to setDevices
        return updatedDevices;
      });
    }, 5000);

    // Cleanup the interval on component unmount
    return () => clearInterval(interval);
  }, [devices]);

  // --------------------------
  // Sensor-editing dialog
  // --------------------------
  const handleRowClick = (index) => {
    setSelectedDeviceIndex(index);
    setOpenDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
  };

  // Slider changes for the selected device
  const handleSliderChange = (field, newValue) => {
    setDevices((prevDevices) => {
      const updated = [...prevDevices];
      updated[selectedDeviceIndex] = {
        ...updated[selectedDeviceIndex],
        [field]: newValue,
      };
      return updated;
    });
  };

  const selectedDevice =
    selectedDeviceIndex !== null ? devices[selectedDeviceIndex] : null;

  // --------------------------
  // "Add Device" dialog
  // --------------------------
  const handleOpenAddDialog = () => {
    setNewDevice({
      Did: "",
      waterFlow: 0,
      pressure: 0,
      temperature: 0,
    });
    setOpenAddDialog(true);
  };

  const handleCloseAddDialog = () => {
    setOpenAddDialog(false);
  };

  // Function to add a new device
  const handleAddDevice = () => {
    // Check if all required fields are filled (assuming Did is necessary to create a new entry)
    if (!newDevice.Did) {
      alert("Please fill in all required fields.");
      return;
    }

    fetch("http://localhost:5001/api/devices", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newDevice),
    })
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        console.log("Add device response:", data);
        setDevices([...devices, newDevice]); // Assuming the server returns the created device
        handleCloseAddDialog(); // Close the dialog upon successful addition
      })
      .catch((error) => {
        console.error("Error adding new device:", error);
        alert("Failed to add device: " + error.message); // Optionally alert the user
      });
  };

  /**
   * Called whenever any field in newDevice changes.
   * 1) Update local `newDevice`.
   * 2) Immediately POST to the server (creating or re-creating).
   *    - In reality, you might want to do a "PUT / upsert" or add a debounce.
   */
  const handleNewDeviceFieldChange = (field, value) => {
    setNewDevice((prev) => {
      const updated = { ...prev, [field]: value };

      // We only attempt to POST if Did and location are not empty
      // (to avoid sending incomplete data for every single keystroke).
      // You can remove or adjust this condition if desired.
      if (updated.Did) {
        fetch("http://localhost:5001/api/devices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updated),
        })
          .then((res) => res.json())
          .then((data) => {
            console.log("Dynamic DB update response:", data);
          })
          .catch((err) =>
            console.error("Error dynamically creating device:", err)
          );
      }

      return updated;
    });
  };

  return (
    <Container maxWidth="md" sx={{ marginTop: 4 }}>
      <Typography variant="h4" gutterBottom>
        Water Management System
      </Typography>

      {/* Button to open "Add Device" dialog */}
      <Button variant="contained" sx={{ mb: 2 }} onClick={handleOpenAddDialog}>
        Add Device
      </Button>

      {/* Table of current devices */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <strong>Device ID</strong>
              </TableCell>
              <TableCell>
                <strong>Water Flow (L/s)</strong>
              </TableCell>
              <TableCell>
                <strong>Pressure (psi)</strong>
              </TableCell>
              <TableCell>
                <strong>Temperature (°C)</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {devices.map((device, index) => (
              <TableRow
                key={device.Did}
                hover
                style={{ cursor: "pointer" }}
                onClick={() => handleRowClick(index)}
              >
                <TableCell>{device.Did}</TableCell>
                <TableCell>{device.waterFlow}</TableCell>
                <TableCell>{device.pressure}</TableCell>
                <TableCell>{device.temperature}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog for adjusting sensor data */}
      <Dialog
        open={openDialog}
        onClose={handleDialogClose}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Adjust Sensor Data</DialogTitle>
        <DialogContent dividers>
          {selectedDevice && (
            <>
              <Box sx={{ mt: 2 }}>
                <Typography gutterBottom>Water Flow (L/s)</Typography>
                <Slider
                  value={selectedDevice.waterFlow}
                  min={0}
                  max={500}
                  step={1}
                  onChange={(e, val) => handleSliderChange("waterFlow", val)}
                />
                <Typography variant="body2">
                  Current: {selectedDevice.waterFlow.toFixed(2)}
                </Typography>
              </Box>

              <Box sx={{ mt: 4 }}>
                <Typography gutterBottom>Pressure (psi)</Typography>
                <Slider
                  value={selectedDevice.pressure}
                  min={0}
                  max={150}
                  step={1}
                  onChange={(e, val) => handleSliderChange("pressure", val)}
                />
                <Typography variant="body2">
                  Current: {selectedDevice.pressure.toFixed(2)}
                </Typography>
              </Box>

              <Box sx={{ mt: 4 }}>
                <Typography gutterBottom>Temperature (°C)</Typography>
                <Slider
                  value={selectedDevice.temperature}
                  min={0}
                  max={100}
                  step={1}
                  onChange={(e, val) => handleSliderChange("temperature", val)}
                />
                <Typography variant="body2">
                  Current: {selectedDevice.temperature.toFixed(2)}
                </Typography>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog for ADDING a new device */}
      <Dialog
        open={openAddDialog}
        onClose={handleCloseAddDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Add New Device</DialogTitle>
        <DialogContent dividers>
          {/* As user types, we call handleNewDeviceFieldChange immediately */}
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              label="Device ID"
              value={newDevice.Did}
              onChange={(e) =>
                handleNewDeviceFieldChange("Did", e.target.value)
              }
              fullWidth
            />
            <TextField
              label="Water Flow (L/s)"
              type="number"
              value={newDevice.waterFlow}
              onChange={(e) =>
                handleNewDeviceFieldChange(
                  "waterFlow",
                  parseFloat(e.target.value) || 0
                )
              }
              fullWidth
            />
            <TextField
              label="Pressure (psi)"
              type="number"
              value={newDevice.pressure}
              onChange={(e) =>
                handleNewDeviceFieldChange(
                  "pressure",
                  parseFloat(e.target.value) || 0
                )
              }
              fullWidth
            />
            <TextField
              label="Temperature (°C)"
              type="number"
              value={newDevice.temperature}
              onChange={(e) =>
                handleNewDeviceFieldChange(
                  "temperature",
                  parseFloat(e.target.value) || 0
                )
              }
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          {/* You can decide what "Add" does now—maybe just close the dialog */}
          <Button onClick={handleCloseAddDialog} variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleAddDevice} variant="contained">
            Done
          </Button>
        </DialogActions>
      </Dialog>
      {selectedDevice?<DeviceAnalytics deviceId={selectedDevice.Did} />:<>No Data</>}
    </Container>
  );
}

export default App;
