import React, { useState } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";

function CustomerList({ customers, deleteCustomer, startEditing }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [deleting, setDeleting] = useState(null);

  const getTotalBalance = (customers) => {
    return customers.reduce(
      (acc, customer) =>
        acc + (parseFloat(customer.outstanding_balance) || 0),
      0
    );
  };

  const totalBalance = getTotalBalance(customers).toFixed(2);

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (customerId) => {
    if (window.confirm("Delete this customer?")) {
      setDeleting(customerId);
      try {
        await deleteCustomer(customerId);
      } catch (err) {
        console.error("Failed to delete customer:", err);
      } finally {
        setDeleting(null);
      }
    }
  };

  return (
    <div>
      <h3 className="total-balance">
        Total Outstanding: Rs {parseFloat(totalBalance).toFixed(2)}
      </h3>

      <input
        type="text"
        placeholder="Search customers..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="search-bar"
        style={{ marginBottom: "16px", width: "100%", padding: "8px" }}
      />

      {filteredCustomers.length > 0 ? (
        <div className="list-container">
          {filteredCustomers.map((c) => {
            const bal = (parseFloat(c.outstanding_balance) || 0).toFixed(2);
            const isDeleting = deleting === c.id;

            return (
              <div key={c.id} className="customer-row">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                    width: "100%",
                  }}
                >
                  <div>
                    <Link className="link-btn" to={`/customer/${c.id}`}>
                      {c.name}
                    </Link>
                    <span className="balance">Rs {bal}</span>
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={() => handleDelete(c.id)}
                      style={{ marginRight: 8 }}
                      disabled={isDeleting}
                    >
                      {isDeleting ? "Deleting..." : "Delete"}
                    </button>

                    <button
                      type="button"
                      onClick={() => startEditing(c)}
                      disabled={isDeleting}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p>No customers found.</p>
      )}
    </div>
  );
}

CustomerList.propTypes = {
  customers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      mobile: PropTypes.string.isRequired,
      place: PropTypes.string,
      outstanding_balance: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),
    })
  ).isRequired,
  deleteCustomer: PropTypes.func.isRequired,
  startEditing: PropTypes.func.isRequired,
};

export default CustomerList;








/*import React, { useState } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";

function CustomerList({ customers, deleteCustomer, startEditing }) {
  const [searchTerm, setSearchTerm] = useState("");

  const getBalance = (transactions) =>
    transactions.reduce(
      (acc, t) => (t.type === "credit" ? acc + t.amount : acc - t.amount),
      0
    );

  const totalBalance = customers.reduce(
    (acc, customer) => acc + getBalance(customer.transactions),
    0
  );

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <h3 className="total-balance">Total Outstanding: ₹{totalBalance}</h3>

      <input
        type="text"
        placeholder="Search customers..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="search-bar"
        style={{ marginBottom: "16px", width: "100%", padding: "8px" }}
      />

      {filteredCustomers.length > 0 ? (
        <div className="list-container">
          {filteredCustomers.map((c) => {
            const bal = getBalance(c.transactions);
            return (
              <div key={c.id} className="customer-row">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                    width: "100%",
                  }}
                >
                  <div>
                    <Link className="link-btn" to={`/customer/${c.id}`}>
                      {c.name}
                    </Link>
                    <span className="balance">₹{bal}</span>
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={() =>
                        window.confirm("Delete this customer?") &&
                        deleteCustomer(c.id)
                      }
                      style={{ marginRight: 8 }}
                    >
                      Delete
                    </button>

                    <button type="button" onClick={() => startEditing(c.id)}>
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p>No customers found.</p>
      )}
    </div>
  );
}

CustomerList.propTypes = {
  customers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
      name: PropTypes.string.isRequired,
      transactions: PropTypes.arrayOf(
        PropTypes.shape({
          type: PropTypes.oneOf(["credit", "payment"]).isRequired,
          amount: PropTypes.number.isRequired,
          description: PropTypes.string,
        })
      ).isRequired,
    })
  ).isRequired,
  deleteCustomer: PropTypes.func.isRequired,
  startEditing: PropTypes.func.isRequired, // ✅ Make sure this is passed from App.js
};

export default CustomerList;
*/










