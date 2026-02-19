/**
 * Detects Layered Shell Networks.
 * 
 * Criteria:
 * - Chains of length >= 3 (A -> B -> C ...)
 * - Intermediate nodes (B in A->B->C) have total transaction count between 2 and 3.
 * 
 * @param {Map} nodes - Graph nodes
 * @param {Map} adjList - Adjacency list
 * @returns {Array} - List of nodes identified as part of a shell network
 */
function detectShells(nodes, adjList) {
    const shellNodes = new Set();

    // Iterate over all nodes to find potential intermediates
    for (const [nodeId, nodeData] of nodes) {
        // Condition: Intermediate nodes have only 2-3 total transactions
        const totalTx = nodeData.inDegree + nodeData.outDegree;

        if (totalTx >= 2 && totalTx <= 3) {
            // Check if it acts as a bridge (Receives from X, Sends to Y)
            if (nodeData.inDegree >= 1 && nodeData.outDegree >= 1) {
                // Potential intermediate node.
                // Now check if it forms a chain of length >= 3
                // This means there is a Predecessor -> Current -> Successor
                // Since we know In >=1 and Out >=1, the chain length locally is already 3 (Pred, Curr, Succ).
                // So this node IS a shell node.
                shellNodes.add(nodeId);
            }
        }
    }

    // Now, we might want to also flag the START and END of these chains if they are connected to these shells?
    // The requirement says: "Intermediate nodes have ... Mark pattern 'layered_shell'".
    // It implies we mark the INTERMEDIATE nodes. 
    // And potentially the full chain?
    // "Legitimate high-volume accounts... unless ... part of shell chain"
    // Let's return the intermediate nodes identified. 
    // For the fraud ring grouping, these might be grouped if they are connected.

    return Array.from(shellNodes).map(id => ({
        account_id: id,
        detected_patterns: ['layered_shell']
    }));
}

module.exports = {
    detectShells
};
