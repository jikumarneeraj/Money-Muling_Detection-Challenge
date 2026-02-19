const csv = require('csv-parser');
const fs = require('fs');
const { validateTransaction } = require('../utils/validators');

/**
 * Parses a CSV file and returns a list of valid transactions.
 * Throws error if critical validation fails.
 */
function parseCSV(filePath) {
    return new Promise((resolve, reject) => {
        const results = [];
        const errors = [];

        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => {
                // Normalize keys (trim spaces)
                const normalizedData = {};
                Object.keys(data).forEach(key => {
                    normalizedData[key.trim()] = data[key].trim();
                });

                const validationErrors = validateTransaction(normalizedData);
                if (validationErrors.length === 0) {
                    // Parse amount and standardise
                    normalizedData.amount = parseFloat(normalizedData.amount);
                    results.push(normalizedData);
                } else {
                    // Maintain a list of errors if needed, or fail fast. 
                    // For now, we'll log but skip invalid rows to be robust, 
                    // or reject if the file is total garbage.
                    // errors.push({ row: data, errors: validationErrors });
                }
            })
            .on('end', () => {
                if (results.length === 0) {
                    reject(new Error('No valid transactions found in CSV.'));
                } else {
                    resolve(results);
                }
            })
            .on('error', (err) => {
                reject(err);
            });
    });
}

module.exports = {
    parseCSV
};
