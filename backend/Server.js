import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import customerRoutes from "./Routes/customerRoutes.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors({ 
  origin: "*", 
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true 
}));
app.use(express.json());

// Test route - to verify backend is working
app.get("/", (req, res) => {
  res.json({ 
    message: "✅ CreditFlow Backend is running!",
    endpoints: {
      customers: "/customers",
      addCustomer: "POST /customers",
      getCustomer: "/customers/:id",
      addTransaction: "POST /customers/:id/transactions"
    }
  });
});

// Mount customer routes
app.use("/customers", customerRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(🚀 Backend running on port ${PORT});
});
