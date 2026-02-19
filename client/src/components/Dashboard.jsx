import React, { useState, useEffect, useMemo } from 'react';
import GraphViz from './GraphViz';
import Papa from 'papaparse';

const Dashboard = ({ data, uploadedFile, reset }) => {
    const [graphElements, setGraphElements] = useState([]);
    const [parsing, setParsing] = useState(true);
    const [selectedRing, setSelectedRing] = useState(null);
    const [selectedNode, setSelectedNode] = useState(null);

    // Parse CSV client-side to get full graph data
    useEffect(() => {
        if (!uploadedFile) return;

        Papa.parse(uploadedFile, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const nodes = new Set();
                const edges = [];

                // Build basic elements
                results.data.forEach(row => {
                    if (!row.sender_id || !row.receiver_id) return;

                    nodes.add(row.sender_id);
                    nodes.add(row.receiver_id);

                    edges.push({
                        data: {
                            source: row.sender_id,
                            target: row.receiver_id,
                            amount: parseFloat(row.amount),
                            timestamp: row.timestamp
                        }
                    });
                });

                // Merge suspicion data
                const elements = [];
                nodes.forEach(id => {
                    const suspicionData = data.suspicious_accounts.find(acc => acc.account_id === id);
                    elements.push({
                        data: {
                            id: id,
                            score: suspicionData ? suspicionData.suspicion_score : 0,
                            patterns: suspicionData ? suspicionData.detected_patterns : [],
                            ringId: suspicionData ? suspicionData.ring_id : null
                        }
                    });
                });

                edges.forEach(edge => {
                    elements.push(edge);
                });

                setGraphElements(elements);
                setParsing(false);
            }
        });
    }, [uploadedFile, data]);

    const handleDownload = () => {
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const href = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = href;
        link.download = 'fraud_detection_report.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleRingCurrent = (ring) => {
        if (selectedRing === ring.ring_id) {
            setSelectedRing(null);
        } else {
            setSelectedRing(ring.ring_id);
        }
    };

    const currentRingMembers = useMemo(() => {
        if (!selectedRing) return [];
        const ring = data.fraud_rings.find(r => r.ring_id === selectedRing);
        return ring ? ring.member_accounts : [];
    }, [selectedRing, data]);

    if (parsing) return <div className="spinner"></div>;

    return (
        <div className="dashboard">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <button onClick={reset} className="btn-primary" style={{ background: 'var(--secondary)' }}>
                    ← Upload New File
                </button>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div className="card" style={{ padding: '0.5rem 1rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Accounts:</span> <strong>{data.summary.total_accounts_analyzed}</strong>
                    </div>
                    <div className="card" style={{ padding: '0.5rem 1rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Suspicious:</span> <strong style={{ color: 'var(--danger)' }}>{data.summary.suspicious_accounts_flagged}</strong>
                    </div>
                    <div className="card" style={{ padding: '0.5rem 1rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Rings:</span> <strong style={{ color: 'var(--danger)' }}>{data.summary.fraud_rings_detected}</strong>
                    </div>
                </div>
                <button onClick={handleDownload} className="btn-primary" style={{ background: 'var(--success)' }}>
                    Download JSON Report
                </button>
            </div>

            <div className="grid-cols-2" style={{ gridTemplateColumns: '2fr 1fr', marginBottom: '2rem' }}>
                <div className="card" style={{ position: 'relative' }}>
                    <h3 style={{ marginBottom: '1rem' }}>Network Visualization</h3>
                    <GraphViz
                        data={{ elements: graphElements, highlightedRingMembers: currentRingMembers }}
                        onNodeClick={setSelectedNode}
                    />
                    {selectedNode && (
                        <div style={{
                            position: 'absolute',
                            top: '80px',
                            right: '20px',
                            background: 'rgba(15, 23, 42, 0.95)',
                            padding: '1rem',
                            borderRadius: '8px',
                            border: '1px solid var(--border)',
                            maxWidth: '250px'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <h4>{selectedNode.id}</h4>
                                <button onClick={() => setSelectedNode(null)} style={{ background: 'none', border: 'none', color: 'white' }}>×</button>
                            </div>
                            <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                                <p>Score: <span style={{ color: selectedNode.score > 50 ? 'var(--danger)' : 'var(--success)' }}>{selectedNode.score}</span></p>
                                <p>Patterns: {selectedNode.patterns?.join(', ') || 'None'}</p>
                                {selectedNode.ringId && <p>Ring: {selectedNode.ringId}</p>}
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: 'calc(600px + 3rem)' }}>
                    <div className="card" style={{ flex: 1, overflow: 'auto' }}>
                        <h3 style={{ marginBottom: '1rem' }}>Fraud Rings Detected</h3>
                        {data.fraud_rings.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)' }}>No fraud rings detected.</p>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                                        <th style={{ padding: '0.5rem' }}>Ring ID</th>
                                        <th style={{ padding: '0.5rem' }}>Type</th>
                                        <th style={{ padding: '0.5rem' }}>Risk</th>
                                        <th style={{ padding: '0.5rem' }}>Size</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.fraud_rings.map(ring => (
                                        <tr
                                            key={ring.ring_id}
                                            onClick={() => handleRingCurrent(ring)}
                                            style={{
                                                cursor: 'pointer',
                                                background: selectedRing === ring.ring_id ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                                borderBottom: '1px solid var(--border)'
                                            }}
                                        >
                                            <td style={{ padding: '0.5rem' }}>{ring.ring_id}</td>
                                            <td style={{ padding: '0.5rem' }}>{ring.pattern_type}</td>
                                            <td style={{ padding: '0.5rem', color: ring.risk_score > 80 ? 'var(--danger)' : 'var(--warning)' }}>{ring.risk_score}</td>
                                            <td style={{ padding: '0.5rem' }}>{ring.member_accounts.length}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    <div className="card" style={{ flex: 1, overflow: 'auto' }}>
                        <h3 style={{ marginBottom: '1rem' }}>Suspicious Accounts</h3>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                                    <th style={{ padding: '0.5rem' }}>ID</th>
                                    <th style={{ padding: '0.5rem' }}>Score</th>
                                    <th style={{ padding: '0.5rem' }}>Patterns</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.suspicious_accounts.slice(0, 50).map(acc => (
                                    <tr key={acc.account_id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '0.5rem' }}>{acc.account_id}</td>
                                        <td style={{ padding: '0.5rem', color: acc.suspicion_score > 80 ? 'var(--danger)' : 'var(--warning)' }}>{acc.suspicion_score}</td>
                                        <td style={{ padding: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{acc.detected_patterns.join(', ')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
