# Graph-Based Financial Crime Detection Engine
## Project Overview for Examiners

### 1. Project Title & One-Line Pitch
**Title:** Graph-Based Money Muling & Financial Crime Detection Engine
**Pitch:** A full-stack forensics tool that uses graph algorithms to detect complex money laundering patterns (Cycles, Smurfing, Shell Networks) in transaction data without relying on external graph databases.

---

### 2. Problem Statement
Financial criminals use complex networks to hide the origin of illicit funds. Traditional rule-based systems often miss these patterns. This project solves three specific money laundering typologies:
1.  **Circular Trading**: Money moving in loops to inflate turnover.
2.  **Smurfing**: Breaking large amounts into small transactions (Fan-in/Fan-out).
3.  **Shell Networks**: Using dormant accounts as pass-through vehicles.

---

### 3. System Architecture
The system is a **MERN-style application** (without Mongo, using in-memory structures for performance on the challenge dataset).

*   **Frontend**: React (Vite) + Cytoscape.js for interactive graph visualization.
*   **Backend**: Node.js + Express.
*   **Data Processing**: Custom in-memory graph builder.

**Data Flow:**
1.  **User Upload**: CSV file uploaded via React UI.
2.  **Parsing**: Server parses CSV using `csv-parser`.
3.  **Graph Build**: Transactions converted into an Adjacency List (Nodes = Accounts, Edges = Transactions).
4.  **Detection**: Algorithms run in parallel to identify suspicious subgraphs.
5.  **Scoring**: Aggregates risks and assigns a Suspicion Score (0-100).
6.  **Response**: JSON result sent to frontend for visualization.

---

### 4. Core Algorithms ( The "Secret Sauce")

#### A. Cycle Detection (Circular Flow)
*   **Goal**: Find loops like A -> B -> C -> A.
*   **Algorithm**: **Depth First Search (DFS)** with backtracking.
*   **Constraints**:
    *   Depth limit: 3 to 5 hops (typical for fraud rings).
    *   **Optimization**: Canonical ordering (smallest node ID first) to avoid duplicate cycles (e.g., A-B-C is same as B-C-A).

#### B. Smurfing Detection (Structure + Time)
*   **Goal**: Detect "Fan-in" (many to one) and "Fan-out" (one to many).
*   **Algorithm**: **Temporal Sliding Window**.
*   **Logic**:
    1.  Sort transactions by timestamp for every node.
    2.  Use a **72-hour sliding window**.
    3.  Count unique senders/receivers within the window.
    4.  **Threshold**: >10 interactions triggers a flag.
    5.  **Velocity Check**: If 10+ transactions happen within **1 hour**, flag as "High Velocity".

#### C. Shell Account Detection
*   **Goal**: Identify "Pass-through" accounts.
*   **Logic**:
    *   Low net balance change (Input $\approx$ Output).
    *   Low total transaction count (2-3 txs).
    *   Acts as a bridge in a longer chain.

---

### 5. Scoring Model
The system assigns a risk score (0-100) based on detected patterns:

| Pattern Detected | Score Impact | Why? |
| :--- | :--- | :--- |
| **Cycle Involvement** | **+40** | Strongest indicator of collusion/wash trading. |
| **Fan-in / Fan-out** | **+30** | Indicative of structuring/smurfing. |
| **Layered Shell** | **+25** | Hiding money trail. |
| **High Velocity** | **+10** | Robotic/Automated behavior. |

*   **Max Score**: Capped at 100.
*   **Fraud Rings**: Groups involved in cycles are grouped into "Rings" with a collective risk score.

---

### 6. Tech Stack & Tools
*   **Language**: JavaScript (Node.js/React).
*   **Graph Lib**: Cytoscape.js (for UI rendering).
*   **Deployment**: Render (Stateless, auto-deploy from GitHub).
*   **Git**: Version control with CI/CD pipeline logic handling `vite` builds.

### 7. Key Challenges Solved
1.  **Dependency Hell in Deployment**: Fixed `vite not found` errors by restructuring `package.json` for production environments.
2.  **Static Serving**: Configured Express to serve a Single Page Application (SPA) correctly by rewriting routes.
3.  **Performance**: Used Adjacency Lists (Map) for O(1) lookups instead of iterating arrays, enabling fast graph traversal.

---

### 8. Examiner Q&A Cheat Sheet
*   **Q: Why not use Neo4j?**
    *   A: For this challenge, an in-memory solution was faster to implement and deploy. It avoids the overhead of managing a separate database instance for the given dataset size.
*   **Q: What is the complexity of your Cycle Detection?**
    *   A: It utilizes DFS. In the worst case, it's exponential, but we limited the depth to 5, keeping it tractable for financial graphs which are typically sparse.
*   **Q: How do you handle large files?**
    *   A: Currently using streams (`csv-parser`) to read line-by-line, but the graph is built in memory. For production, we would switch to a graph DB.
