import React, { useState, useEffect, useCallback } from "react";
import { Routes, Route } from "react-router-dom";
import axios from "axios";
import CustomerForm from "./Components/CustomerForm";
import CustomerList from "./Components/CustomerList";
import CustomerDetails from "./Components/CustomerDetails";

function App() {
  const [customers, setCustomers] = useState([]);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [appError, setAppError] = useState(null);

  const fetchCustomers = useCallback(async () => {
    try {
      setAppError(null);
      const response = await axios.get("http://localhost:5000/api/customers");
      setCustomers(response.data);
    } catch (error) {
      const errorMsg =
        error.response?.data?.error || error.message || "Failed to fetch customers";
      setAppError(errorMsg);
      console.error("Error fetching customers:", errorMsg);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const addCustomer = useCallback(
    async (customer) => {
      try {
        setAppError(null);
        await axios.post("http://localhost:5000/api/customers", customer);
        await fetchCustomers();
        return { success: true };
      } catch (error) {
        const errBody = error.response?.data || { message: error.message };
        const message =
          errBody.error || errBody.message || JSON.stringify(errBody);
        setAppError(message);
        console.error("Failed to add customer:", message);
        return { success: false, error: message };
      }
    },
    [fetchCustomers]
  );

  const updateCustomer = useCallback(
    async (id, customer) => {
      try {
        setAppError(null);
        await axios.put(`http://localhost:5000/api/customers/${id}`, customer);
        await fetchCustomers();
        setEditingCustomer(null);
        return { success: true };
      } catch (error) {
        const errBody = error.response?.data || { message: error.message };
        const message =
          errBody.error || errBody.message || JSON.stringify(errBody);
        setAppError(message);
        console.error("Failed to update customer:", message);
        return { success: false, error: message };
      }
    },
    [fetchCustomers]
  );

  const deleteCustomer = useCallback(
    async (id) => {
      try {
        setAppError(null);
        await axios.delete(`http://localhost:5000/api/customers/${id}`);
        await fetchCustomers();
      } catch (error) {
        const errorMsg =
          error.response?.data?.error || error.message || "Failed to delete customer";
        setAppError(errorMsg);
        console.error("Failed to delete customer:", errorMsg);
      }
    },
    [fetchCustomers]
  );

  const addTransaction = useCallback(
    async (customerId, transaction) => {
      try {
        setAppError(null);
        await axios.post(
          `http://localhost:5000/api/customers/${customerId}/transactions`,
          transaction
        );
        await fetchCustomers();
      } catch (error) {
        const errorMsg =
          error.response?.data?.error || error.message || "Failed to add transaction";
        setAppError(errorMsg);
        console.error("Failed to add transaction:", errorMsg);
        throw error;
      }
    },
    [fetchCustomers]
  );

  const updateTransaction = useCallback(
    async (customerId, transactionId, transaction) => {
      try {
        setAppError(null);
        await axios.put(
          `http://localhost:5000/api/customers/${customerId}/transactions/${transactionId}`,
          transaction
        );
        await fetchCustomers();
      } catch (error) {
        const errorMsg =
          error.response?.data?.error || error.message || "Failed to update transaction";
        setAppError(errorMsg);
        console.error("Failed to update transaction:", errorMsg);
        throw error;
      }
    },
    [fetchCustomers]
  );

  const deleteTransaction = useCallback(
    async (customerId, transactionId) => {
      try {
        setAppError(null);
        await axios.delete(
          `http://localhost:5000/api/customers/${customerId}/transactions/${transactionId}`
        );
        await fetchCustomers();
      } catch (error) {
        const errorMsg =
          error.response?.data?.error || error.message || "Failed to delete transaction";
        setAppError(errorMsg);
        console.error("Failed to delete transaction:", errorMsg);
        throw error;
      }
    },
    [fetchCustomers]
  );

  const startEditing = useCallback(async (customerOrId) => {
    try {
      setAppError(null);
      const isObject = typeof customerOrId === "object" && customerOrId !== null;
      const id = isObject ? customerOrId.id : customerOrId;

      let customer = null;
      if (isObject && customerOrId.place !== undefined) {
        customer = customerOrId;
      } else {
        const resp = await axios.get(`http://localhost:5000/api/customers/${id}`);
        customer = resp.data;
      }

      setEditingCustomer(customer);
    } catch (err) {
      const errorMsg =
        err.response?.data?.error || err.message || "Failed to load customer";
      setAppError(errorMsg);
      console.error("Failed to load customer for editing:", errorMsg);
      alert(`Error: ${errorMsg}`);
    }
  }, []);

  const clearEditing = useCallback(() => {
    setEditingCustomer(null);
    setAppError(null);
  }, []);

  return (
    <div className="container">
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <h1 style={{ margin: "10px 0", color: "#333" }}>Annamalaiyar Traders</h1>
        <p style={{ margin: "5px 0", color: "#666", fontSize: "14px" }}>
          VOC Nagar 4th Street, Thiruvannamalai
        </p>
        <p style={{ margin: "5px 0", color: "#666", fontSize: "14px" }}>
          Ph.no: 9092208303
        </p>
      </div>

      {appError && (
        <div
          style={{
            margin: "10px",
            padding: "12px",
            background: "#f8d7da",
            color: "#721c24",
            border: "1px solid #f5c6cb",
            borderRadius: "5px",
          }}
        >
          Error: {appError}
        </div>
      )}

      <Routes>
        <Route
          path="/"
          element={
            <div className="grid">
              <div className="card">
                <h2>Add Customer</h2>
                <CustomerForm
                  addCustomer={addCustomer}
                  updateCustomer={updateCustomer}
                  customerToEdit={editingCustomer}
                  clearEditing={clearEditing}
                />
              </div>
              <div className="card">
                <h2>Customers & Outstanding Balance</h2>
                <p style={{ marginBottom: 8 }}>
                  Click a customer to view full history and add credit/payment.
                </p>
                <CustomerList
                  customers={customers}
                  deleteCustomer={deleteCustomer}
                  startEditing={startEditing}
                />
              </div>
            </div>
          }
        />
        <Route
          path="/customer/:id"
          element={
            <CustomerDetails
              customers={customers}
              addTransaction={addTransaction}
              updateCustomer={updateCustomer}
              updateTransaction={updateTransaction}
              deleteTransaction={deleteTransaction}
            />
          }
        />
      </Routes>
    </div>
  );
}

export default App;

















/*import React, { useState, useEffect, useCallback } from "react";
import { Routes, Route } from "react-router-dom";
import axios from "axios";
import CustomerForm from "./Components/CustomerForm";
import CustomerList from "./Components/CustomerList";
import CustomerDetails from "./Components/CustomerDetails";

function App() {
  const [customers, setCustomers] = useState([]);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [appError, setAppError] = useState(null);

  const fetchCustomers = useCallback(async () => {
    try {
      setAppError(null);
      const response = await axios.get("http://localhost:5000/api/customers");
      setCustomers(response.data);
    } catch (error) {
      const errorMsg =
        error.response?.data?.error || error.message || "Failed to fetch customers";
      setAppError(errorMsg);
      console.error("Error fetching customers:", errorMsg);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const addCustomer = useCallback(
    async (customer) => {
      try {
        setAppError(null);
        await axios.post("http://localhost:5000/api/customers", customer);
        await fetchCustomers();
        return { success: true };
      } catch (error) {
        const errBody = error.response?.data || { message: error.message };
        const message =
          errBody.error || errBody.message || JSON.stringify(errBody);
        setAppError(message);
        console.error("Failed to add customer:", message);
        return { success: false, error: message };
      }
    },
    [fetchCustomers]
  );

  const updateCustomer = useCallback(
    async (id, customer) => {
      try {
        setAppError(null);
        await axios.put(`http://localhost:5000/api/customers/${id}`, customer);
        await fetchCustomers();
        setEditingCustomer(null);
        return { success: true };
      } catch (error) {
        const errBody = error.response?.data || { message: error.message };
        const message =
          errBody.error || errBody.message || JSON.stringify(errBody);
        setAppError(message);
        console.error("Failed to update customer:", message);
        return { success: false, error: message };
      }
    },
    [fetchCustomers]
  );

  const deleteCustomer = useCallback(
    async (id) => {
      try {
        setAppError(null);
        await axios.delete(`http://localhost:5000/api/customers/${id}`);
        await fetchCustomers();
      } catch (error) {
        const errorMsg =
          error.response?.data?.error || error.message || "Failed to delete customer";
        setAppError(errorMsg);
        console.error("Failed to delete customer:", errorMsg);
      }
    },
    [fetchCustomers]
  );

  const addTransaction = useCallback(
    async (customerId, transaction) => {
      try {
        setAppError(null);
        await axios.post(
          `http://localhost:5000/api/customers/${customerId}/transactions`,
          transaction
        );
        await fetchCustomers();
      } catch (error) {
        const errorMsg =
          error.response?.data?.error || error.message || "Failed to add transaction";
        setAppError(errorMsg);
        console.error("Failed to add transaction:", errorMsg);
        throw error;
      }
    },
    [fetchCustomers]
  );

  const updateTransaction = useCallback(
    async (customerId, transactionId, transaction) => {
      try {
        setAppError(null);
        await axios.put(
          `http://localhost:5000/api/customers/${customerId}/transactions/${transactionId}`,
          transaction
        );
        await fetchCustomers();
      } catch (error) {
        const errorMsg =
          error.response?.data?.error || error.message || "Failed to update transaction";
        setAppError(errorMsg);
        console.error("Failed to update transaction:", errorMsg);
        throw error;
      }
    },
    [fetchCustomers]
  );

  const deleteTransaction = useCallback(
    async (customerId, transactionId) => {
      try {
        setAppError(null);
        await axios.delete(
          `http://localhost:5000/api/customers/${customerId}/transactions/${transactionId}`
        );
        await fetchCustomers();
      } catch (error) {
        const errorMsg =
          error.response?.data?.error || error.message || "Failed to delete transaction";
        setAppError(errorMsg);
        console.error("Failed to delete transaction:", errorMsg);
        throw error;
      }
    },
    [fetchCustomers]
  );

  const startEditing = useCallback(async (customerOrId) => {
    try {
      setAppError(null);
      const isObject = typeof customerOrId === "object" && customerOrId !== null;
      const id = isObject ? customerOrId.id : customerOrId;

      let customer = null;
      if (isObject && customerOrId.place !== undefined) {
        customer = customerOrId;
      } else {
        const resp = await axios.get(`http://localhost:5000/api/customers/${id}`);
        customer = resp.data;
      }

      setEditingCustomer(customer);
    } catch (err) {
      const errorMsg =
        err.response?.data?.error || err.message || "Failed to load customer";
      setAppError(errorMsg);
      console.error("Failed to load customer for editing:", errorMsg);
      alert(`Error: ${errorMsg}`);
    }
  }, []);

  const clearEditing = useCallback(() => {
    setEditingCustomer(null);
    setAppError(null);
  }, []);

  return (
    <div className="container">
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <h1 style={{ margin: "10px 0", color: "#333" }}>Annamalaiyar Traders</h1>
      </div>

      {appError && (
        <div
          style={{
            margin: "10px",
            padding: "12px",
            background: "#f8d7da",
            color: "#721c24",
            border: "1px solid #f5c6cb",
            borderRadius: "5px",
          }}
        >
          Error: {appError}
        </div>
      )}

      <Routes>
        <Route
          path="/"
          element={
            <div className="grid">
              <div className="card">
                <h2>Add Customer</h2>
                <CustomerForm
                  addCustomer={addCustomer}
                  updateCustomer={updateCustomer}
                  customerToEdit={editingCustomer}
                  clearEditing={clearEditing}
                />
              </div>
              <div className="card">
                <h2>Customers & Outstanding Balance</h2>
                <p style={{ marginBottom: 8 }}>
                  Click a customer to view full history and add credit/payment.
                </p>
                <CustomerList
                  customers={customers}
                  deleteCustomer={deleteCustomer}
                  startEditing={startEditing}
                />
              </div>
            </div>
          }
        />
        <Route
          path="/customer/:id"
          element={
            <CustomerDetails
              customers={customers}
              addTransaction={addTransaction}
              updateCustomer={updateCustomer}
              updateTransaction={updateTransaction}
              deleteTransaction={deleteTransaction}
            />
          }
        />
      </Routes>
    </div>
  );
}

export default App;

*/









