/**
 * Detects Smurfing patterns (Fan-in and Fan-out) within a 72-hour rolling window.
 * 
 * Fan-in: 10+ unique senders -> 1 receiver
 * Fan-out: 1 sender -> 10+ unique receivers
 * 
 * @param {Map} nodes - The graph nodes with transactions
 * @returns {Array} - List of accounts with detected smurfing patterns
 */
function detectSmurfing(nodes) {
    const suspiciousAccounts = [];
    const WINDOW_MS = 72 * 60 * 60 * 1000; // 72 hours in ms

    nodes.forEach((nodeData, accountId) => {
        const inboundTx = [];
        const outboundTx = [];

        // Separate transactions
        nodeData.transactions.forEach(tx => {
            if (tx.receiver_id === accountId) inboundTx.push(tx);
            if (tx.sender_id === accountId) outboundTx.push(tx);
        });

        // specific flag needed for output? "detected_patterns" list.
        const patterns = [];
        let isHighVelocity = false;

        // --- CHECK FAN-IN ---
        if (inboundTx.length >= 10) {
            // Sort by timestamp
            inboundTx.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

            // Sliding window
            let left = 0;
            const uniqueSendersInWindow = new Map(); // sender_id -> count in window

            for (let right = 0; right < inboundTx.length; right++) {
                const currentTx = inboundTx[right];
                const currentTime = new Date(currentTx.timestamp).getTime();

                // Add current to window
                uniqueSendersInWindow.set(currentTx.sender_id, (uniqueSendersInWindow.get(currentTx.sender_id) || 0) + 1);

                // Shrink window from left
                while (left < right && (currentTime - new Date(inboundTx[left].timestamp).getTime() > WINDOW_MS)) {
                    const leftTx = inboundTx[left];
                    const count = uniqueSendersInWindow.get(leftTx.sender_id);
                    if (count === 1) uniqueSendersInWindow.delete(leftTx.sender_id);
                    else uniqueSendersInWindow.set(leftTx.sender_id, count - 1);
                    left++;
                }

                if (uniqueSendersInWindow.size >= 10) {
                    patterns.push('fan_in');
                    // Check for high velocity (arbitrary burst threshold, e.g., 10 in 1 hour?)
                    // Requirement says: "transactions occur within short burst" -> add "high_velocity"
                    // Let's define burst as 10 tx in 1 hour.
                    if (currentTime - new Date(inboundTx[left].timestamp).getTime() < 60 * 60 * 1000) {
                        isHighVelocity = true;
                    }
                    break; // Found pattern, no need to check further for this node
                }
            }
        }

        // --- CHECK FAN-OUT ---
        if (outboundTx.length >= 10) {
            outboundTx.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

            let left = 0;
            const uniqueReceiversInWindow = new Map();

            for (let right = 0; right < outboundTx.length; right++) {
                const currentTx = outboundTx[right];
                const currentTime = new Date(currentTx.timestamp).getTime();

                uniqueReceiversInWindow.set(currentTx.receiver_id, (uniqueReceiversInWindow.get(currentTx.receiver_id) || 0) + 1);

                while (left < right && (currentTime - new Date(outboundTx[left].timestamp).getTime() > WINDOW_MS)) {
                    const leftTx = outboundTx[left];
                    const count = uniqueReceiversInWindow.get(leftTx.receiver_id);
                    if (count === 1) uniqueReceiversInWindow.delete(leftTx.receiver_id);
                    else uniqueReceiversInWindow.set(leftTx.receiver_id, count - 1);
                    left++;
                }

                if (uniqueReceiversInWindow.size >= 10) {
                    if (!patterns.includes('fan_out')) patterns.push('fan_out');
                    if (currentTime - new Date(outboundTx[left].timestamp).getTime() < 60 * 60 * 1000) {
                        isHighVelocity = true;
                    }
                    break;
                }
            }
        }

        if (isHighVelocity && (patterns.includes('fan_in') || patterns.includes('fan_out'))) {
            patterns.push('high_velocity');
        }

        if (patterns.length > 0) {
            suspiciousAccounts.push({
                account_id: accountId,
                detected_patterns: patterns
            });
        }
    });

    return suspiciousAccounts;
}

module.exports = {
    detectSmurfing
};
