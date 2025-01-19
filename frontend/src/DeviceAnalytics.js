import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  Slider,
  Alert
} from '@mui/material';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import FilterListIcon from '@mui/icons-material/FilterList'; // Importing FilterList icon

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend);

function DeviceAnalytics({ deviceId }) {
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState({});
  const [chartType, setChartType] = useState('line');
  const [dataRange, setDataRange] = useState([0, 24]);
  const [tempDataRange, setTempDataRange] = useState([0, 24]);
  const [maxDataPoints, setMaxDataPoints] = useState(100);
  const [dataAvailable, setDataAvailable] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`http://localhost:5001/api/devices/${deviceId}`)
      .then(res => res.json())
      .then(device => {
        if (!device || (!device.waterFlow.length && !device.pressure.length && !device.temperature.length)) {
          setDataAvailable(false);
          setLoading(false);
          return;
        }
        setMaxDataPoints(Math.max(device.waterFlow.length, device.pressure.length, device.temperature.length));
        processData(device, [0, Math.max(device.waterFlow.length, device.pressure.length, device.temperature.length)]);
        setLoading(false);
        setDataAvailable(true);
      })
      .catch(error => {
        console.error("Error fetching device data:", error);
        setLoading(false);
        setDataAvailable(false);
      });
  }, [deviceId]);

  const processData = (device) => {
    const maxIndex = Math.min(
      device.waterFlow.length,
      device.pressure.length,
      device.temperature.length,
      dataRange[1]
    );
    const minIndex = Math.max(0, dataRange[0]);

    const labels = Array.from({ length: maxIndex - minIndex }, (_, i) => i + minIndex);
    const waterFlowData = device.waterFlow.slice(minIndex, maxIndex);
    const pressureData = device.pressure.slice(minIndex, maxIndex);
    const temperatureData = device.temperature.slice(minIndex, maxIndex);

    setChartData({
      labels,
      datasets: [
        {
          label: 'Water Flow (L/s)',
          data: waterFlowData,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
        },
        {
          label: 'Pressure (psi)',
          data: pressureData,
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
        },
        {
          label: 'Temperature (°C)',
          data: temperatureData,
          borderColor: 'rgb(53, 162, 235)',
          backgroundColor: 'rgba(53, 162, 235, 0.5)',
        }
      ]
    });
  };

  if (loading) {
    return <CircularProgress />;
  }

  if (!dataAvailable) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center' }}>
        <Alert severity="info">No data available for this device.</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Device Analytics: {deviceId}
      </Typography>

      {/* Slider for selecting the range of data points */}
      <Typography gutterBottom>Adjust data range:</Typography>
      <Slider
        value={tempDataRange}
        onChange={(event, newValue) => setTempDataRange(newValue)}
        valueLabelDisplay="auto"
        min={0}
        max={maxDataPoints - 1}
        marks
        step={1}
        disableSwap
      />

      {/* Button to apply the filter */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
        <Box>
          <Button variant="contained" onClick={() => setChartType('line')} sx={{ mr: 1 }}>Line Chart</Button>
          <Button variant="contained" onClick={() => setChartType('bar')} sx={{ mr: 1 }}>Bar Chart</Button>
          <Button variant="contained" onClick={() => setChartType('pie')}>Pie Chart</Button>
        </Box>
        {/* Applying a custom style for the Filter button */}
        <Button variant="contained" color="success" onClick={() => setTempDataRange(dataRange)} startIcon={<FilterListIcon />} sx={{ ml: 2 }}>
          Filter Data
        </Button>
      </Box>

      {/* Conditionally render charts */}
      {chartType === 'line' && <Line data={chartData} />}
      {chartType === 'bar' && <Bar data={chartData} />}
      {chartType === 'pie' && <Pie data={chartData} />}
    </Box>
  );
}

export default DeviceAnalytics;
