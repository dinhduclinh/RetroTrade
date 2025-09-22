const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const userRoutes = require("./src/routes/index");
const connectDB = require("./src/config/db");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use(userRoutes);

// DB connect
connectDB()
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.log(err));

app.listen(process.env.PORT, () =>
  console.log(`🚀 Server running on port ${process.env.PORT}`)
);
