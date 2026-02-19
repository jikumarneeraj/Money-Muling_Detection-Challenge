/**
 * Builds a directed graph from a list of transactions.
 * Graph Structure:
 * nodes: Map<account_id, { inDegree, outDegree, totalAmountSent, totalAmountReceived, transactions: [] }>
 * adjList: Map<sender_id, Set<receiver_id>> (or List for multi-edges)
 * 
 * We need an efficient adjacency list for traversal.
 * Cycle detection needs directed edges.
 * Smurfing needs quick lookup of in/out edges with timestamps.
 */
function buildGraph(transactions) {
    const nodes = new Map();
    const adjList = new Map(); // sender -> [ { receiver, amount, timestamp, id } ]
    const reverseAdjList = new Map(); // receiver -> [ { sender, amount, timestamp, id } ]

    transactions.forEach(tx => {
        const { sender_id, receiver_id, amount, timestamp, transaction_id } = tx;

        // Initialize Nodes
        if (!nodes.has(sender_id)) nodes.set(sender_id, createNode(sender_id));
        if (!nodes.has(receiver_id)) nodes.set(receiver_id, createNode(receiver_id));

        // Update Sender Node
        const sender = nodes.get(sender_id);
        sender.outDegree++;
        sender.totalAmountSent += amount;
        sender.transactions.push(tx);

        // Update Receiver Node
        const receiver = nodes.get(receiver_id);
        receiver.inDegree++;
        receiver.totalAmountReceived += amount;
        receiver.transactions.push(tx);

        // Update Adjacency List (Forward)
        if (!adjList.has(sender_id)) adjList.set(sender_id, []);
        adjList.get(sender_id).push({ receiver: receiver_id, amount, timestamp, id: transaction_id });

        // Update Reverse Adjacency List (Backward) - useful for Fan-in detection
        if (!reverseAdjList.has(receiver_id)) reverseAdjList.set(receiver_id, []);
        reverseAdjList.get(receiver_id).push({ sender: sender_id, amount, timestamp, id: transaction_id });
    });

    return { nodes, adjList, reverseAdjList };
}

function createNode(id) {
    return {
        id,
        inDegree: 0,
        outDegree: 0,
        totalAmountSent: 0,
        totalAmountReceived: 0,
        transactions: []
    };
}

module.exports = {
    buildGraph
};
