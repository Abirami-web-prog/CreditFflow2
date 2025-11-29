
import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";

function CustomerForm({ addCustomer, updateCustomer, customerToEdit, clearEditing }) {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [place, setPlace] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const lastLoadedIdRef = useRef(null);

  // Load data when editing
  useEffect(() => {
    if (!customerToEdit) {
      setName("");
      setMobile("");
      setPlace("");
      lastLoadedIdRef.current = null;
      setError(null);
      setSuccessMsg(null);
      return;
    }

    if (lastLoadedIdRef.current !== customerToEdit.id) {
      setName(customerToEdit.name || "");
      setMobile(customerToEdit.mobile || "");
      setPlace(customerToEdit.place || "");
      lastLoadedIdRef.current = customerToEdit.id;
      setError(null);
      setSuccessMsg(null);
    }
  }, [customerToEdit]);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  const isEditMode = !!customerToEdit;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!name.trim() || !mobile.trim()) {
      setError("Name and Mobile are required.");
      return;
    }

    setLoading(true);

    const customerData = {
      name: name.trim(),
      mobile: mobile.trim(),
      place: place.trim() || "",
    };

    try {
      let response;
      if (isEditMode) {
        response = await updateCustomer(customerToEdit.id, customerData);
      } else {
        response = await addCustomer(customerData);
      }

      if (response && response.success) {
        setSuccessMsg(
          isEditMode
            ? "Customer updated successfully!"
            : "Customer added successfully!"
        );
        setName("");
        setMobile("");
        setPlace("");
        if (isEditMode) {
          clearEditing();
        }
      } else {
        const errorMsg =
          response?.error?.error ||
          response?.error?.message ||
          response?.error ||
          "Failed to save customer.";
        setError(`Failed to save customer: ${errorMsg}`);
      }
    } catch (err) {
      setError(`Error: ${err.message || "Failed to save customer."}`);
      console.error("Submit error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setName("");
    setMobile("");
    setPlace("");
    setError(null);
    setSuccessMsg(null);
    clearEditing();
  };

  return (
    <form onSubmit={handleSubmit} className="customer-form">
      {error && (
        <div
          style={{
            color: "red",
            padding: "10px",
            backgroundColor: "#ffe6e6",
            borderRadius: "5px",
            marginBottom: "10px",
          }}
        >
          {error}
        </div>
      )}
      {successMsg && (
        <div
          style={{
            color: "green",
            padding: "10px",
            backgroundColor: "#e6ffe6",
            borderRadius: "5px",
            marginBottom: "10px",
          }}
        >
          {successMsg}
        </div>
      )}

      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        disabled={loading}
      />
      <input
        type="text"
        placeholder="Mobile Number"
        value={mobile}
        onChange={(e) => setMobile(e.target.value)}
        required
        disabled={loading}
      />
      <input
        type="text"
        placeholder="Place (Optional)"
        value={place}
        onChange={(e) => setPlace(e.target.value)}
        disabled={loading}
      />
      <button type="submit" disabled={loading}>
        {loading
          ? isEditMode
            ? "Saving..."
            : "Adding..."
          : isEditMode
          ? "Save"
          : "Add Customer"}
      </button>
      {isEditMode && (
        <button
          type="button"
          onClick={handleCancel}
          style={{ marginLeft: 8 }}
          disabled={loading}
        >
          Cancel
        </button>
      )}
    </form>
  );
}

CustomerForm.propTypes = {
  addCustomer: PropTypes.func.isRequired,
  updateCustomer: PropTypes.func.isRequired,
  customerToEdit: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string,
    mobile: PropTypes.string,
    place: PropTypes.string,
  }),
  clearEditing: PropTypes.func.isRequired,
};

export default CustomerForm;




/*import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";


function CustomerForm({ addCustomer, updateCustomer, customerToEdit, clearEditing }) {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [place, setPlace] = useState("");

  // Track which customer id was used to populate the form so we don't
  // overwrite local state when the same customer prop reference is passed
  // again (or the parent re-renders).
  const lastLoadedIdRef = useRef(null);

  // Load data when editing
  useEffect(() => {
    // Only populate the form when a different customer is loaded for editing.
    // This prevents overwriting user edits if the parent re-renders while
    // the user is typing.
    if (!customerToEdit) {
      setName("");
      setMobile("");
      setPlace("");
      lastLoadedIdRef.current = null;
      return;
    }

    if (lastLoadedIdRef.current !== customerToEdit.id) {
      setName(customerToEdit.name || "");
      setMobile(customerToEdit.mobile || "");
      setPlace(customerToEdit.place || "");
      lastLoadedIdRef.current = customerToEdit.id;
    }
  }, [customerToEdit]);

  const isEditMode = !!customerToEdit;

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic client-side validation: name and mobile required, place optional
    if (!name.trim() || !mobile.trim()) {
        alert('Name and Mobile are required.');
        return;
      }

      // Send null for place when empty so backend can store null
      const customerData = { name: name.trim(), mobile: mobile.trim(), place: place.trim() || null };

    let response;
    if (isEditMode) {
      response = await updateCustomer(customerToEdit.id, customerData);
    } else {
      response = await addCustomer(customerData);
    }

    if (response && response.success) {
        alert(isEditMode ? "Customer updated successfully!" : "Customer added successfully!");
      setName("");
      setMobile("");
      setPlace("");
      if (isEditMode) {
        clearEditing();
      }
    } else {
        // Try to show backend error details when available
        const err = response?.error;
        const message = err?.error || err?.message || JSON.stringify(err) || "Failed to save customer.";
        alert(`Failed to save customer: ${message}`);
    }
  };

  // Optional: Cancel editing button
  const handleCancel = () => {
    clearEditing();
  };

  return (
    <form onSubmit={handleSubmit} className="customer-form">
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <input
        type="text"
        placeholder="Mobile Number"
        value={mobile}
        onChange={(e) => setMobile(e.target.value)}
        required
      />
      <input
        type="text"
        placeholder="Place"
        value={place}
        onChange={(e) => setPlace(e.target.value)}
      />
      <button type="submit">{isEditMode ? "Save" : "Add Customer"}</button>
      {isEditMode && <button type="button" onClick={handleCancel} style={{ marginLeft: 8 }}>Cancel</button>}
    </form>
  );
}




CustomerForm.propTypes = {
  addCustomer: PropTypes.func.isRequired,
  updateCustomer: PropTypes.func.isRequired,
  customerToEdit: PropTypes.object,
  clearEditing: PropTypes.func.isRequired,
};


export default CustomerForm;*/










