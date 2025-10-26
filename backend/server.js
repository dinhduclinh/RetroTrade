const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();
const connectDB = require("./src/config/db");
const router = require("./src/routes/index")

const cron = require("node-cron");
const {
  updateTrendingItems,
} = require("./src/controller/products/updateTrending.controller");

require("dotenv").config();

const corsOptions = {
  origin: [
    process.env.FRONTEND_URL || "http://localhost:3000",
    "http://localhost:3000",
    "http://127.0.0.1:3000"
  ],
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));

// Log CORS requests
app.use((req, res, next) => {
  next();
});

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// cập nhật lúc 0h mỗi ngày
cron.schedule('0 0 * * *', updateTrendingItems);

// Test CORS route
app.get('/api/v1/test-cors', (req, res) => {
  res.json({ 
    message: 'CORS is working!', 
    origin: req.headers.origin,
    timestamp: new Date().toISOString()
  });
});

// Routes
router(app);

// DB connect
connectDB()
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.log(err));

app.listen(process.env.PORT, () =>
  console.log(`🚀 Server running on port ${process.env.PORT}`)
);
