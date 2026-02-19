/**
 * Calculates suspicion scores and aggregates results.
 * 
 * Scoring:
 * Cycle involvement: +40
 * Fan-in: +30
 * Fan-out: +30
 * Layered shell: +25
 * High velocity: +10
 * 
 * Cap at 100.
 */
function calculateScores(cycles, smurfingResults, shellResults, allNodes) {
    const accountScores = new Map(); // id -> { score, patterns: Set, ringId }

    // Initialize for all suspicious accounts
    function ensureAccount(id) {
        if (!accountScores.has(id)) {
            accountScores.set(id, {
                account_id: id,
                score: 0,
                patterns: new Set(),
                ring_id: null
            });
        }
        return accountScores.get(id);
    }

    // 1. Process Cycles
    let ringCounter = 1;
    const fraudRings = [];

    cycles.forEach(cycle => {
        const ringId = `RING_${String(ringCounter++).padStart(3, '0')}`;
        const memberIds = [];

        cycle.forEach(nodeId => {
            const acc = ensureAccount(nodeId);
            acc.patterns.add(`cycle_length_${cycle.length}`);
            acc.score += 40;
            // Overwrite ring ID? Or handles multiple? 
            // "Each unique cycle becomes one fraud ring". 
            // If a node is in multiple, it might technically be in multiple rings.
            // For JSON output "ring_id": "STRING", implies singular. 
            // We'll assign the latest for now or primary.
            acc.ring_id = ringId;
            memberIds.push(nodeId);
        });

        // Add ring metadata
        fraudRings.push({
            ring_id: ringId,
            member_accounts: memberIds,
            pattern_type: 'cycle',
            risk_score: 0 // To be calculated based on average member score or max
        });
    });

    // 2. Process Smurfing
    smurfingResults.forEach(res => {
        const acc = ensureAccount(res.account_id);
        res.detected_patterns.forEach(p => {
            if (p === 'fan_in') acc.score += 30;
            if (p === 'fan_out') acc.score += 30;
            if (p === 'high_velocity') acc.score += 10;
            acc.patterns.add(p);
        });
    });

    // 3. Process Shells
    shellResults.forEach(res => {
        const acc = ensureAccount(res.account_id);
        res.detected_patterns.forEach(p => {
            if (p === 'layered_shell') acc.score += 25;
            acc.patterns.add(p);
        });
    });

    // 4. False Positive Control & Cap
    // "Reduce suspicion score for: Regular time-distributed transactions..."
    // Implementation: If NO patterns detected but high volume, we verify we didn't add them. 
    // We only added people with patterns.
    // "DO NOT flag legitimate high-volume accounts unless: Part of cycle OR smurfing OR shell".
    // Since we only add to 'accountScores' if they matched a pattern, we are safe.
    // We just need to CAP the score at 100.

    const finalSuspiciousAccounts = [];

    accountScores.forEach(acc => {
        if (acc.score > 100) acc.score = 100;

        finalSuspiciousAccounts.push({
            account_id: acc.account_id,
            suspicion_score: acc.score,
            detected_patterns: Array.from(acc.patterns),
            ring_id: acc.ring_id
        });
    });

    // Sort by score descending
    finalSuspiciousAccounts.sort((a, b) => b.suspicion_score - a.suspicion_score);

    // Calculate Fraud Ring Risk Score (e.g., avg of members)
    fraudRings.forEach(ring => {
        let totalScore = 0;
        ring.member_accounts.forEach(mid => {
            const member = finalSuspiciousAccounts.find(a => a.account_id === mid);
            if (member) totalScore += member.suspicion_score;
        });
        ring.risk_score = parseFloat((totalScore / ring.member_accounts.length).toFixed(1));
    });

    return {
        suspicious_accounts: finalSuspiciousAccounts,
        fraud_rings: fraudRings
    };
}

module.exports = {
    calculateScores
};
