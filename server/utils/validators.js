/**
 * Validates a transaction record.
 * Required fields: transaction_id, sender_id, receiver_id, amount, timestamp
 */
function validateTransaction(row) {
    const errors = [];
    if (!row.transaction_id || typeof row.transaction_id !== 'string') errors.push('Invalid transaction_id');
    if (!row.sender_id || typeof row.sender_id !== 'string') errors.push('Invalid sender_id');
    if (!row.receiver_id || typeof row.receiver_id !== 'string') errors.push('Invalid receiver_id');

    const amount = parseFloat(row.amount);
    if (isNaN(amount) || amount <= 0) errors.push('Invalid amount');

    // Simple timestamp check (YYYY-MM-DD HH:MM:SS format preferred, but loose check for Date parseability)
    if (!row.timestamp || isNaN(Date.parse(row.timestamp))) errors.push('Invalid timestamp');

    return errors;
}

module.exports = {
    validateTransaction
};
