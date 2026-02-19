/**
 * Detects circular circular money flow (Cycles of length 3-5).
 * 
 * @param {Map} adjList - Adjacency list of the graph
 * @returns {Array} - List of detected cycles, where each cycle is an array of node IDs.
 */
function detectCycles(adjList) {
    const cycles = new Set();
    const result = [];
    const visited = new Set();
    const path = [];
    const pathSet = new Set();

    // Limit depth to avoid infinite recursion and respect the requirement (len 3-5)
    const MAX_DEPTH = 5;

    function dfs(curr, startNode) {
        visited.add(curr);
        path.push(curr);
        pathSet.add(curr);

        const neighbors = adjList.get(curr) || [];

        for (const edge of neighbors) {
            const neighbor = edge.receiver;

            if (neighbor === startNode) {
                // Cycle found
                if (path.length >= 3 && path.length <= MAX_DEPTH) {
                    const cycle = [...path];
                    // Normalize cycle to avoid duplicates (e.g., A-B-C is same as B-C-A)
                    const normalized = normalizeCycle(cycle);
                    const key = normalized.join('->');

                    if (!cycles.has(key)) {
                        cycles.add(key);
                        result.push(cycle);
                    }
                }
            } else if (!pathSet.has(neighbor) && path.length < MAX_DEPTH) {
                // Continue DFS if not visited in current path and depth limit not reached
                // Note: We intentionally don't check global 'visited' here to allow finding all cycles
                // even if they share nodes. However, for strict O(N) we might, but for finding all cycles 
                // we usually need to revisit. Given constraints (10k tx), strict unique path visit is safer for perf.
                // BUT, to find ALL cycles, we relax global visited check or reset it. 
                // For this specific pattern "Each unique cycle becomes one fraud ring", overlapping cycles are common.
                // We will use a local pathSet for cycle detection.
                // To optimize, we can use an iterative DFS or carefully managed recursive state.

                // Optimization: If neighbor < startNode, we might have already visited this cycle starting from neighbor.
                // This assumes we iterate nodes in order.
                if (neighbor > startNode) {
                    dfs(neighbor, startNode);
                }
            }
        }

        path.pop();
        pathSet.delete(curr);
    }

    // Iterate through all nodes as start points
    const nodes = Array.from(adjList.keys()).sort(); // Sort to ensure canonical ordering optimization

    // To handle disconnected components and ensure we try every node as a start 
    // (modulo the optimization that we only look forward to avoid duplicates)
    for (const node of nodes) {
        dfs(node, node);
        // After finishing with 'node' as start, we don't strictly mark it as globally "done" 
        // in a way that prevents it from being part of OTHER cycles, 
        // but our duplicate check (neighbor > startNode + normalized key) handles uniqueness.

        // Clearing visited is not strictly necessary if we rely on the `neighbor > startNode` check
        // to prevent detecting the same cycle multiple times from different start points.
        visited.clear();
    }

    return result;
}

function normalizeCycle(cycle) {
    // Rotate array so the smallest element is first
    let minIdx = 0;
    for (let i = 1; i < cycle.length; i++) {
        if (cycle[i] < cycle[minIdx]) {
            minIdx = i;
        }
    }
    return [...cycle.slice(minIdx), ...cycle.slice(0, minIdx)];
}

module.exports = {
    detectCycles
};
