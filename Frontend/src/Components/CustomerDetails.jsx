import React, { useState, useRef, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import PropTypes from "prop-types";


function CustomerDetails({
  customers,
  addTransaction,
  updateCustomer,
  updateTransaction,
  deleteTransaction,
}) {
  const { id } = useParams();
  const componentRef = useRef();

  const [amount, setAmount] = useState("");
  const [type, setType] = useState("credit");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editMobile, setEditMobile] = useState("");
  const [editPlace, setEditPlace] = useState("");

  const [editingTransaction, setEditingTransaction] = useState(null);

  

  const customer = customers.find((c) => c.id === parseInt(id));

  useEffect(() => {
    if (customer) {
      setEditName(customer.name || "");
      setEditMobile(customer.mobile || "");
      setEditPlace(customer.place || "");
      setError(null);
      setSuccessMsg(null);
    }
  }, [customer]);

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  const handleAddTransaction = useCallback(async () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setError("Please enter a valid positive amount.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    const newTransaction = {
      date: new Date().toISOString().split("T")[0],
      type,
      amount: amt,
      description: description || "",
    };

    try {
      await addTransaction(parseInt(id), newTransaction);
      setAmount("");
      setDescription("");
      setType("credit");
      setSuccessMsg("Transaction added successfully!");
    } catch (err) {
      setError("Failed to add transaction. Please try again.");
      console.error("Add transaction error:", err);
    } finally {
      setLoading(false);
    }
  }, [amount, type, description, id, addTransaction]);

  const handleUpdateCustomer = useCallback(async () => {
    if (!editName.trim() || !editMobile.trim() || !editPlace.trim()) {
      setError("Name, Mobile, and Place are required.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await updateCustomer(parseInt(id), {
        name: editName.trim(),
        mobile: editMobile.trim(),
        place: editPlace.trim(),
      });
      setIsEditing(false);
      setSuccessMsg("Customer updated successfully!");
    } catch (err) {
      setError("Failed to update customer. Please try again.");
      console.error("Update customer error:", err);
    } finally {
      setLoading(false);
    }
  }, [editName, editMobile, editPlace, id, updateCustomer]);

  const handleEditTransaction = useCallback((transaction, index) => {
    const transactionId = transaction.id ?? transaction.transaction_id ?? null;
    // Ensure date is in YYYY-MM-DD format
    let dateValue = transaction.date;
    if (dateValue) {
      // Remove time portion if it exists (handles ISO format)
      dateValue = dateValue.split("T")[0];
      // Also handle UTC format (ends with Z)
      dateValue = dateValue.split("Z")[0];
    }
    setEditingTransaction({
      ...transaction,
      date: dateValue || new Date().toISOString().split("T")[0],
      index,
      transactionId,
    });
    setError(null);
    setSuccessMsg(null);
  }, []);

  const handleSaveTransaction = useCallback(async () => {
    if (!editingTransaction) return;

    const amt = parseFloat(editingTransaction.amount);
    if (isNaN(amt) || amt <= 0) {
      setError("Please enter a valid positive amount.");
      return;
    }

    // Ensure date is in YYYY-MM-DD format
    let dateValue = editingTransaction.date;
    if (dateValue && dateValue.includes("T")) {
      dateValue = dateValue.split("T")[0];
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await updateTransaction(
        parseInt(id),
        editingTransaction.transactionId,
        {
          date: dateValue,
          type: editingTransaction.type,
          amount: amt,
          description: editingTransaction.description || "",
        }
      );
      setEditingTransaction(null);
      setSuccessMsg("Transaction updated successfully!");
    } catch (err) {
      setError("Failed to update transaction. Please try again.");
      console.error("Update transaction error:", err);
    } finally {
      setLoading(false);
    }
  }, [editingTransaction, id, updateTransaction]);

  const handleCancelEdit = useCallback(() => {
    setEditingTransaction(null);
    setError(null);
    setSuccessMsg(null);
  }, []);

  const handleDeleteTransaction = useCallback(
    async (index) => {
      if (!customer || !customer.transactions) {
        setError("Customer or transactions data not found.");
        return;
      }

      if (window.confirm("Delete this transaction?")) {
        setLoading(true);
        setError(null);
        setSuccessMsg(null);
        try {
          const t = customer.transactions[index];
          const transactionId = t?.id ?? t?.transaction_id ?? null;

          if (!transactionId) {
            setError("Transaction ID not found.");
            return;
          }

          await deleteTransaction(parseInt(id), transactionId);
          setSuccessMsg("Transaction deleted successfully!");
        } catch (err) {
          setError("Failed to delete transaction. Please try again.");
          console.error("Delete transaction error:", err);
        } finally {
          setLoading(false);
        }
      }
    },
    [id, customer, deleteTransaction]
  );

  const formattedBalance =
    customer?.outstanding_balance !== undefined
      ? parseFloat(customer.outstanding_balance).toFixed(2)
      : "0.00";

  return (
    <div key={id} ref={componentRef} className="printable-content">
      {error && (
        <p
          style={{
            color: "red",
            padding: "10px",
            backgroundColor: "#ffe6e6",
            borderRadius: "5px",
          }}
        >
          {error}
        </p>
      )}
      {successMsg && (
        <p
          style={{
            color: "green",
            padding: "10px",
            backgroundColor: "#e6ffe6",
            borderRadius: "5px",
          }}
        >
          {successMsg}
        </p>
      )}

      <Link className="back link-btn no-print" to="/">
        Back
      </Link>

      {!customer ? (
        <p>Customer not found</p>
      ) : isEditing ? (
        <div style={{ display: "grid", gap: 8, marginBottom: 12 }} className="no-print">
          <h2>Edit Customer</h2>
          <input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Name"
            style={{ padding: "8px" }}
          />
          <input
            value={editMobile}
            onChange={(e) => setEditMobile(e.target.value)}
            placeholder="Mobile"
            style={{ padding: "8px" }}
          />
          <input
            value={editPlace}
            onChange={(e) => setEditPlace(e.target.value)}
            placeholder="Place"
            style={{ padding: "8px" }}
          />
          <div className="btn-row">
            <button
              onClick={handleUpdateCustomer}
              style={{ padding: "8px 16px" }}
              disabled={loading}
            >
              {loading ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              style={{ padding: "8px 16px", marginLeft: 8 }}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: 12 }}>
          <h2>
            {customer.name} ({customer.mobile})
          </h2>
          <div className="kpi no-print">
            <span className="pill">Place: {customer.place}</span>
            <span className="pill">Outstanding: Rs {formattedBalance}</span>
            <button
              onClick={() => setIsEditing(true)}
              style={{ padding: "8px 16px" }}
            >
              Edit Customer
            </button>
          </div>
          <div className="print-only">
            <p>Place: {customer.place}</p>
            <p>Outstanding Balance: Rs {formattedBalance}</p>
          </div>
        </div>
      )}

      <h3>Transactions</h3>
      <table className="table" style={{ marginBottom: 16 }}>
        <thead>
          <tr>
            <th>#</th>
            <th>Date</th>
            <th>Description</th>
            <th>Type</th>
            <th>Amount (Rs)</th>
            <th className="no-print">Actions</th>
          </tr>
        </thead>
        <tbody>
          {customer?.transactions && customer.transactions.length > 0 ? (
            customer.transactions.map((t, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                {editingTransaction?.index === i ? (
                  <td
                    colSpan="5"
                    className="no-print"
                    style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}
                  >
                    <input
                      type="date"
                      value={editingTransaction.date}
                      onChange={(e) =>
                        setEditingTransaction({
                          ...editingTransaction,
                          date: e.target.value,
                        })
                      }
                      style={{ padding: "8px" }}
                    />
                    <input
                      type="text"
                      placeholder="Description"
                      value={editingTransaction.description}
                      onChange={(e) =>
                        setEditingTransaction({
                          ...editingTransaction,
                          description: e.target.value,
                        })
                      }
                      style={{ padding: "8px" }}
                    />
                    <select
                      value={editingTransaction.type}
                      onChange={(e) =>
                        setEditingTransaction({
                          ...editingTransaction,
                          type: e.target.value,
                        })
                      }
                      style={{ padding: "8px" }}
                    >
                      <option value="credit">Credit (Bought)</option>
                      <option value="payment">Payment</option>
                    </select>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editingTransaction.amount}
                      onChange={(e) =>
                        setEditingTransaction({
                          ...editingTransaction,
                          amount: e.target.value,
                        })
                      }
                      style={{ padding: "8px" }}
                    />
                  </td>
                ) : (
                  <>
                    <td>{t.date}</td>
                    <td>{t.description || "-"}</td>
                    <td>{t.type === "credit" ? "Credit (Bought)" : "Payment"}</td>
                    <td>{parseFloat(t.amount).toFixed(2)}</td>
                  </>
                )}
                <td className="btn-row no-print" style={{ whiteSpace: "nowrap" }}>
                  {editingTransaction?.index === i ? (
                    <>
                      <button
                        onClick={handleSaveTransaction}
                        style={{ padding: "8px 16px" }}
                        disabled={loading}
                      >
                        {loading ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        style={{ padding: "8px 16px", marginLeft: 8 }}
                        disabled={loading}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEditTransaction(t, i)}
                        style={{ padding: "8px 16px" }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTransaction(i)}
                        style={{ padding: "8px 16px", marginLeft: 8 }}
                        disabled={loading}
                      >
                        {loading ? "Deleting..." : "Delete"}
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6}>No transactions yet.</td>
            </tr>
          )}
        </tbody>
      </table>

      <h3 className="no-print">Add Transaction</h3>
      <div
        className="btn-row no-print"
        style={{ alignItems: "center", gap: 8, flexWrap: "wrap" }}
      >
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          style={{ padding: "8px" }}
        >
          <option value="credit">Credit (Bought)</option>
          <option value="payment">Payment</option>
        </select>
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={{ padding: "8px" }}
        />
        <input
          type="text"
          placeholder="Description (e.g., Products)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ padding: "8px" }}
        />
        <button
          onClick={handleAddTransaction}
          disabled={loading || !amount || parseFloat(amount) <= 0}
          style={{ padding: "8px 16px" }}
        >
          {loading ? "Adding..." : "Add"}
        </button>
      </div>
    </div>
  );
}

CustomerDetails.propTypes = {
  customers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      mobile: PropTypes.string.isRequired,
      place: PropTypes.string.isRequired,
      outstanding_balance: PropTypes.number,
      transactions: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
          transaction_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
          date: PropTypes.string.isRequired,
          type: PropTypes.oneOf(["credit", "payment"]).isRequired,
          amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
            .isRequired,
          description: PropTypes.string,
        })
      ),
    })
  ).isRequired,
  addTransaction: PropTypes.func.isRequired,
  updateCustomer: PropTypes.func.isRequired,
  updateTransaction: PropTypes.func.isRequired,
  deleteTransaction: PropTypes.func.isRequired,
};

export default CustomerDetails;









/*import React, { useState, useRef, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import PropTypes from "prop-types";


function CustomerDetails({
  customers,
  addTransaction,
  updateCustomer,
  updateTransaction,
  deleteTransaction,
}) {
  const { id } = useParams();
  const componentRef = useRef();

  const [amount, setAmount] = useState("");
  const [type, setType] = useState("credit");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editMobile, setEditMobile] = useState("");
  const [editPlace, setEditPlace] = useState("");

  const [editingTransaction, setEditingTransaction] = useState(null);

  

  const customer = customers.find((c) => c.id === parseInt(id));

  useEffect(() => {
    if (customer) {
      setEditName(customer.name || "");
      setEditMobile(customer.mobile || "");
      setEditPlace(customer.place || "");
      setError(null);
      setSuccessMsg(null);
    }
  }, [customer]);

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  const handleAddTransaction = useCallback(async () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setError("Please enter a valid positive amount.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    const newTransaction = {
      date: new Date().toISOString().split("T")[0],
      type,
      amount: amt,
      description: description || "",
    };

    try {
      await addTransaction(parseInt(id), newTransaction);
      setAmount("");
      setDescription("");
      setType("credit");
      setSuccessMsg("Transaction added successfully!");
    } catch (err) {
      setError("Failed to add transaction. Please try again.");
      console.error("Add transaction error:", err);
    } finally {
      setLoading(false);
    }
  }, [amount, type, description, id, addTransaction]);

  const handleUpdateCustomer = useCallback(async () => {
    if (!editName.trim() || !editMobile.trim() || !editPlace.trim()) {
      setError("Name, Mobile, and Place are required.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await updateCustomer(parseInt(id), {
        name: editName.trim(),
        mobile: editMobile.trim(),
        place: editPlace.trim(),
      });
      setIsEditing(false);
      setSuccessMsg("Customer updated successfully!");
    } catch (err) {
      setError("Failed to update customer. Please try again.");
      console.error("Update customer error:", err);
    } finally {
      setLoading(false);
    }
  }, [editName, editMobile, editPlace, id, updateCustomer]);

  const handleEditTransaction = useCallback((transaction, index) => {
    const transactionId = transaction.id ?? transaction.transaction_id ?? null;
    // Ensure date is in YYYY-MM-DD format
    let dateValue = transaction.date;
    if (dateValue) {
      // Remove time portion if it exists (handles ISO format)
      dateValue = dateValue.split("T")[0];
      // Also handle UTC format (ends with Z)
      dateValue = dateValue.split("Z")[0];
    }
    setEditingTransaction({
      ...transaction,
      date: dateValue || new Date().toISOString().split("T")[0],
      index,
      transactionId,
    });
    setError(null);
    setSuccessMsg(null);
  }, []);

  const handleSaveTransaction = useCallback(async () => {
    if (!editingTransaction) return;

    const amt = parseFloat(editingTransaction.amount);
    if (isNaN(amt) || amt <= 0) {
      setError("Please enter a valid positive amount.");
      return;
    }

    // Ensure date is in YYYY-MM-DD format
    let dateValue = editingTransaction.date;
    if (dateValue && dateValue.includes("T")) {
      dateValue = dateValue.split("T")[0];
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await updateTransaction(
        parseInt(id),
        editingTransaction.transactionId,
        {
          date: dateValue,
          type: editingTransaction.type,
          amount: amt,
          description: editingTransaction.description || "",
        }
      );
      setEditingTransaction(null);
      setSuccessMsg("Transaction updated successfully!");
    } catch (err) {
      setError("Failed to update transaction. Please try again.");
      console.error("Update transaction error:", err);
    } finally {
      setLoading(false);
    }
  }, [editingTransaction, id, updateTransaction]);

  const handleCancelEdit = useCallback(() => {
    setEditingTransaction(null);
    setError(null);
    setSuccessMsg(null);
  }, []);

  const handleDeleteTransaction = useCallback(
    async (index) => {
      if (!customer || !customer.transactions) {
        setError("Customer or transactions data not found.");
        return;
      }

      if (window.confirm("Delete this transaction?")) {
        setLoading(true);
        setError(null);
        setSuccessMsg(null);
        try {
          const t = customer.transactions[index];
          const transactionId = t?.id ?? t?.transaction_id ?? null;

          if (!transactionId) {
            setError("Transaction ID not found.");
            return;
          }

          await deleteTransaction(parseInt(id), transactionId);
          setSuccessMsg("Transaction deleted successfully!");
        } catch (err) {
          setError("Failed to delete transaction. Please try again.");
          console.error("Delete transaction error:", err);
        } finally {
          setLoading(false);
        }
      }
    },
    [id, customer, deleteTransaction]
  );

  const formattedBalance =
    customer?.outstanding_balance !== undefined
      ? parseFloat(customer.outstanding_balance).toFixed(2)
      : "0.00";

  return (
    <div key={id} ref={componentRef} className="printable-content">
      {error && (
        <p
          style={{
            color: "red",
            padding: "10px",
            backgroundColor: "#ffe6e6",
            borderRadius: "5px",
          }}
        >
          {error}
        </p>
      )}
      {successMsg && (
        <p
          style={{
            color: "green",
            padding: "10px",
            backgroundColor: "#e6ffe6",
            borderRadius: "5px",
          }}
        >
          {successMsg}
        </p>
      )}

      <Link className="back link-btn no-print" to="/">
        Back
      </Link>

      {!customer ? (
        <p>Customer not found</p>
      ) : isEditing ? (
        <div style={{ display: "grid", gap: 8, marginBottom: 12 }} className="no-print">
          <h2>Edit Customer</h2>
          <input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Name"
            style={{ padding: "8px" }}
          />
          <input
            value={editMobile}
            onChange={(e) => setEditMobile(e.target.value)}
            placeholder="Mobile"
            style={{ padding: "8px" }}
          />
          <input
            value={editPlace}
            onChange={(e) => setEditPlace(e.target.value)}
            placeholder="Place"
            style={{ padding: "8px" }}
          />
          <div className="btn-row">
            <button
              onClick={handleUpdateCustomer}
              style={{ padding: "8px 16px" }}
              disabled={loading}
            >
              {loading ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              style={{ padding: "8px 16px", marginLeft: 8 }}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: 12 }}>
          <h2>
            {customer.name} ({customer.mobile})
          </h2>
          <div className="kpi no-print">
            <span className="pill">Place: {customer.place}</span>
            <span className="pill">Outstanding: Rs {formattedBalance}</span>
            <button
              onClick={() => setIsEditing(true)}
              style={{ padding: "8px 16px" }}
            >
              Edit Customer
            </button>
          </div>
          <div className="print-only">
            <p>Place: {customer.place}</p>
            <p>Outstanding Balance: Rs {formattedBalance}</p>
          </div>
        </div>
      )}

      <h3>Transactions</h3>
      <table className="table" style={{ marginBottom: 16 }}>
        <thead>
          <tr>
            <th>#</th>
            <th>Date</th>
            <th>Description</th>
            <th>Type</th>
            <th>Amount (Rs)</th>
            <th className="no-print">Actions</th>
          </tr>
        </thead>
        <tbody>
          {customer?.transactions && customer.transactions.length > 0 ? (
            customer.transactions.map((t, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                {editingTransaction?.index === i ? (
                  <td
                    colSpan="5"
                    className="no-print"
                    style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}
                  >
                    <input
                      type="date"
                      value={editingTransaction.date}
                      onChange={(e) =>
                        setEditingTransaction({
                          ...editingTransaction,
                          date: e.target.value,
                        })
                      }
                      style={{ padding: "8px" }}
                    />
                    <input
                      type="text"
                      placeholder="Description"
                      value={editingTransaction.description}
                      onChange={(e) =>
                        setEditingTransaction({
                          ...editingTransaction,
                          description: e.target.value,
                        })
                      }
                      style={{ padding: "8px" }}
                    />
                    <select
                      value={editingTransaction.type}
                      onChange={(e) =>
                        setEditingTransaction({
                          ...editingTransaction,
                          type: e.target.value,
                        })
                      }
                      style={{ padding: "8px" }}
                    >
                      <option value="credit">Credit (Bought)</option>
                      <option value="payment">Payment</option>
                    </select>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editingTransaction.amount}
                      onChange={(e) =>
                        setEditingTransaction({
                          ...editingTransaction,
                          amount: e.target.value,
                        })
                      }
                      style={{ padding: "8px" }}
                    />
                  </td>
                ) : (
                  <>
                    <td>{t.date}</td>
                    <td>{t.description || "-"}</td>
                    <td>{t.type === "credit" ? "Credit (Bought)" : "Payment"}</td>
                    <td>{parseFloat(t.amount).toFixed(2)}</td>
                  </>
                )}
                <td className="btn-row no-print" style={{ whiteSpace: "nowrap" }}>
                  {editingTransaction?.index === i ? (
                    <>
                      <button
                        onClick={handleSaveTransaction}
                        style={{ padding: "8px 16px" }}
                        disabled={loading}
                      >
                        {loading ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        style={{ padding: "8px 16px", marginLeft: 8 }}
                        disabled={loading}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEditTransaction(t, i)}
                        style={{ padding: "8px 16px" }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTransaction(i)}
                        style={{ padding: "8px 16px", marginLeft: 8 }}
                        disabled={loading}
                      >
                        {loading ? "Deleting..." : "Delete"}
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6}>No transactions yet.</td>
            </tr>
          )}
        </tbody>
      </table>

      <h3 className="no-print">Add Transaction</h3>
      <div
        className="btn-row no-print"
        style={{ alignItems: "center", gap: 8, flexWrap: "wrap" }}
      >
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          style={{ padding: "8px" }}
        >
          <option value="credit">Credit (Bought)</option>
          <option value="payment">Payment</option>
        </select>
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={{ padding: "8px" }}
        />
        <input
          type="text"
          placeholder="Description (e.g., Products)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ padding: "8px" }}
        />
        <button
          onClick={handleAddTransaction}
          disabled={loading || !amount || parseFloat(amount) <= 0}
          style={{ padding: "8px 16px" }}
        >
          {loading ? "Adding..." : "Add"}
        </button>
      </div>
    </div>
  );
}

CustomerDetails.propTypes = {
  customers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      mobile: PropTypes.string.isRequired,
      place: PropTypes.string.isRequired,
      outstanding_balance: PropTypes.number,
      transactions: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
          transaction_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
          date: PropTypes.string.isRequired,
          type: PropTypes.oneOf(["credit", "payment"]).isRequired,
          amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
            .isRequired,
          description: PropTypes.string,
        })
      ),
    })
  ).isRequired,
  addTransaction: PropTypes.func.isRequired,
  updateCustomer: PropTypes.func.isRequired,
  updateTransaction: PropTypes.func.isRequired,
  deleteTransaction: PropTypes.func.isRequired,
};

export default CustomerDetails;
*/




