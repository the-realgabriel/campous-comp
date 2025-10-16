// api.js
import axios from "axios";

// Standard configuration for all API calls
const config = {
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
};

/**
 * Fetches all transaction records from the server.
 * @returns {Promise<Array>} List of transactions.
 */
export async function fetchTransactions() {
    const res = await axios.get("/api/transactions", config);
    return res.data;
}

/**
 * Saves a new transaction record to the server.
 * @param {object} payload - The transaction data (category, amount, date, notes).
 * @returns {Promise<object>} The newly created transaction object.
 */
export async function saveTransaction(payload) {
    // Note: Axios automatically stringifies payload and sets content-type if headers are omitted, 
    // but we keep the headers for clarity/consistency.
    const res = await axios.post("/api/transactions", payload, config);
    return res.data;
}

/**
 * Deletes a transaction record by its ID.
 * @param {number} id - The ID of the transaction to delete.
 */
export async function deleteTransaction(id) {
    await axios.delete(`/api/transactions/${id}`, config);
}