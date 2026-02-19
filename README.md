# Graph-Based Financial Crime Detection Engine (Money Muling Detection)

A full-stack financial forensics engine designed to detect complex money laundering patterns (Cycles, Smurfing, Shell Networks) in transaction data using graph algorithms.

![Architecture](https://via.placeholder.com/800x400?text=System+Architecture+Diagram)

## 🚀 Live Demo
<!-- Placeholder for deployment URL -->
[Deployment Link Here]

## 🛠 Tech Stack
- **Backend**: Node.js, Express.js
- **Graph Processing**: Custom in-memory graph algorithms (DFS, Windowing) - *No external graph DBs*
- **Frontend**: React (Vite), Cytoscape.js for visualization
- **Deployment**: Ready for Render/Railway (Stateless)

## 🏗 System Architecture
```ascii
[Client Browser] <--- HTTP (JSON) ---> [Node.js Server]
       |                                     |
   FileUpload                          (Parse CSV)
       |                                     |
   [GraphViz] <--- (Suspicion Scores) --- [Graph Builder]
                                             |
                                  [Detection Engines]
                                  /       |        \
                             (Cycles) (Smurfing) (Shells)
                                  \       |        /
                                   [Scoring Engine]
```

## 🔍 Detection Logic

### 1. Circular Fund Routing (Cycles)
- **Algorithm**: Depth First Search (DFS) with backtracking.
- **Criteria**: Directed cycles of length 3-5.
- **Complexity**: Optimized O(V+E) for sparse financial graphs with depth limit.

### 2. Smurfing (Fan-in / Fan-out)
- **Algorithm**: Temporal sliding window (72 hours).
- **Fan-in**: >10 senders to 1 receiver.
- **Fan-out**: 1 sender to >10 receivers.
- **Time Complexity**: O(T log T) per node due to sorting transactions by time.

### 3. Layered Shell Networks
- **Criteria**: Chain length ≥ 3 where intermediate nodes have low total activity (2-3 transactions).
- **Logic**: Identifies "pass-through" accounts acting as mules.

## 📊 Suspicion Score System (0-100)
| Pattern | Score Impact |
|---------|--------------|
| Cycle Involvement | +40 |
| Fan-in / Fan-out | +30 each |
| Layered Shell | +25 |
| High Velocity | +10 |

## 📦 Installation & Usage

### Prerequisites
- Node.js v14+
- npm

### Setup
1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd financial-crime-engine
   ```

2. **Install Dependencies (Root)**
   ```bash
   npm run install-all
   ```

3. **Start Development Server**
   ```bash
   npm run start-server  # Terminal 1 (Port 5000)
   npm run start-client  # Terminal 2 (Port 5173)
   ```

### Deployment (Render/Heroku)
The project includes a root `package.json` and `Procfile` configured for deployment.
- **Build Command**: `npm run build-client`
- **Start Command**: `npm run start-server`
*(Note: Server parses `build` folder in production)*

## ⚠️ Known Limitations
- **In-Memory Processing**: Large datasets (>100k nodes) may hit Node.js heap limits.
- **Strict Cycle Detection**: Overlapping cycles share the same fraud ring ID logic based on detection order.

## 🔮 Future Improvements
- Integrate Neo4j for persistent graph storage.
- Add machine learning for anomaly detection.
- Real-time stream processing (Kafka).

---
**Developed for the Money Muling Detection Challenge**
