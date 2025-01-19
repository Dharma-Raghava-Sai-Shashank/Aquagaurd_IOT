const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 5001;

// MongoDB Connection
mongoose.set("strictQuery", false);
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to mongodb database");
  })
  .catch((err) => console.log(err));

const deviceRoutes = require("./routes/device");
app.use("/api/devices", deviceRoutes);

// Default Route
app.get("/", (req, res) => {
  res.send("Server is running...");
});

// Start the Server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
