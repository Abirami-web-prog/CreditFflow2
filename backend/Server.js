{"id":"59210","variant":"standard","title":"Final server.js backend file"}
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";

// Load .env
dotenv.config();

const app = express();

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);
app.use(express.json());

// Database connection
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || process.env.DB_PASS,
  database: process.env.DB_DATABASE || process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

// Make pool global
app.set("db", pool);

// ---------------------------
//        API ROUTES
// ---------------------------
import customerRoutes from "./routes/customers.js"; // YOUR ROUTER FILE
app.use("/customers", customerRoutes);

// ---------------------------
//     SERVE REACT FRONTEND
// ---------------------------
const frontendPath = path.join(__dirname, "../frontend/build");
app.use(express.static(frontendPath));

app.get("*", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

// ---------------------------
//        START SERVER
// ---------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});
