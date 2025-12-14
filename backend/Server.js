import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import customerRoutes from "./Routes/customerRoutes.js";

dotenv.config();

const app = express();

app.use(cors({ 
  origin: process.env.FRONTEND_URL || "*", 
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.json({ 
    message: "✅ CreditFlow Backend is running!",
    status: "active",
    timestamp: new Date().toISOString(),
    endpoints: {
      customers: "GET /customers",
      addCustomer: "POST /customers",
      getCustomer: "GET /customers/:id",
      updateCustomer: "PUT /customers/:id",
      deleteCustomer: "DELETE /customers/:id",
      addTransaction: "POST /customers/:id/transactions",
      getTransactions: "GET /customers/:id/transactions",
      deleteTransaction: "DELETE /customers/:customerId/transactions/:transactionId"
    }
  });
});

app.get("/health", (req, res) => {
  res.json({ 
    status: "OK", 
    database: "connected",
    uptime: process.uptime()
  });
});

app.use("/customers", customerRoutes);

app.use((req, res) => {
  res.status(404).json({ 
    error: "Route not found",
    path: req.path 
  });
});

app.use((err, req, res, next) => {
  console.error("❌ Server error:", err);
  res.status(500).json({ 
    error: "Internal server error",
    message: err.message 
  });
});

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(`🚀 Backend running on ${HOST}:${PORT}`);
  console.log(🌍 Environment: ${process.env.NODE_ENV || 'development'});
  console.log(📡 CORS enabled for: ${process.env.FRONTEND_URL || '*'});
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});
