const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { parseCSV } = require('../services/parseService');
const { buildGraph } = require('../services/graphBuilder');
const { detectCycles } = require('../services/cycleDetection');
const { detectSmurfing } = require('../services/smurfingDetection');
const { detectShells } = require('../services/shellDetection');
const { calculateScores } = require('../services/scoringEngine');

const upload = multer({ dest: 'uploads/' });

router.post('/upload', upload.single('file'), async (req, res) => {
    const startTime = process.hrtime();

    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;

    try {
        // 1. Parse CSV
        const transactions = await parseCSV(filePath);

        // 2. Build Graph
        const { nodes, adjList } = buildGraph(transactions);

        // 3. Detect Patterns
        // Parallelize? JS is single threaded but we can fire them sequentially.
        const cycles = detectCycles(adjList);
        const smurfingResults = detectSmurfing(nodes);
        const shellResults = detectShells(nodes, adjList);

        // 4. Calculate Scores
        const { suspicious_accounts, fraud_rings } = calculateScores(
            cycles,
            smurfingResults,
            shellResults,
            nodes
        );

        // 5. Compute Summary
        const endTime = process.hrtime(startTime);
        const timeInSeconds = (endTime[0] + endTime[1] / 1e9).toFixed(2);

        const responsePayload = {
            suspicious_accounts: suspicious_accounts.map(acc => ({
                account_id: acc.account_id,
                suspicion_score: acc.suspicion_score,
                detected_patterns: acc.detected_patterns,
                ring_id: acc.ring_id
            })),
            fraud_rings: fraud_rings.map(ring => ({
                ring_id: ring.ring_id,
                member_accounts: ring.member_accounts,
                pattern_type: ring.pattern_type,
                risk_score: ring.risk_score
            })),
            summary: {
                total_accounts_analyzed: nodes.size,
                suspicious_accounts_flagged: suspicious_accounts.length,
                fraud_rings_detected: fraud_rings.length,
                processing_time_seconds: parseFloat(timeInSeconds)
            }
        };

        // Format response to strictly match requirements
        // (The scoring engine already shapes the specific arrays)

        // Cleanup file
        fs.unlinkSync(filePath);

        return res.json(responsePayload);

    } catch (error) {
        console.error(error);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        return res.status(500).json({ error: error.message });
    }
});

// Endpoint to get just graph data (if needed separate from analysis)
// Or we can assume the frontend will use the uploaded file data or the analysis result 
// to render. Typically, for visualization, we need the edges. 
// The requirements say "Interactive graph visualization... Suspicious nodes highlighted".
// The frontend might need the full node list + edges to draw. 
// Adding a supplementary field `graph_data` might violate "Field names must match EXACTLY" for the JSON output requirement.
// BUT, usually that requirement refers to the downloadable report. 
// We can wrap the strict output in a `report` key, or expose a separate endpoint.
// Prudent approach: Return EXACT structure as requested for the main response.
// Frontend can construct the graph from the CSV itself (client-side parsing) OR we provide a separate endpoint.
// Let's rely on client-side parsing for the full graph viz to keep backend pure to the "Strict JSON" output.
// OR, we assume the user meant the "Downloadable JSON" must match strict format, but the API response can have more?
// "Generates downloadable JSON output in EXACT required format".
// "Display interactive graph visualization".
// Be safe: API returns exact format. Frontend uses the *same* CSV it uploaded (or we echo it back?) to build the visual graph, 
// and maps the "suspicious_accounts" to it to highlight them.

module.exports = router;
