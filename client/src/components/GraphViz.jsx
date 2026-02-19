import React, { useEffect, useRef, useMemo } from 'react';
import cytoscape from 'cytoscape';

const GraphViz = ({ data, onNodeClick }) => {
    const containerRef = useRef(null);
    const cyRef = useRef(null);

    // Transform data for Cytoscape
    const elements = useMemo(() => {
        const nodes = [];
        const edges = [];
        const addedNodes = new Set();

        // We need to rebuild the graph structure from the analysis result 
        // OR we ideally should have received the graph data.
        // Since strict output JSON doesn't include full graph, we have a challenge.
        // OPTION: We visualize ONLY the suspicious accounts and their relationships (fraud rings)?
        // The requirement says: "Interactive graph visualization... Suspicious nodes highlighted... Normal nodes blue".
        // This implies we need normal nodes too.
        // BUT we don't have the full graph in the JSON response.
        //
        // CRITICAL DECISION:
        // To strictly follow the "Exact JSON output" for the API but also "Visualize the graph", 
        // we should have parsed the CSV on the client side as well to get the full graph, 
        // OR the backend should have sent it in a separate property not part of the "downloadable JSON".
        // For now, let's assume the Dashboard passes the `uploadedFile` to this component 
        // so we can re-parse it fast on client to build the full graph elements, 
        // and then overlay the `data` (suspicion scores) onto it.
        //
        // However, for this specific component code, let's assume `data` contains the `elements` 
        // prepopulated by the Dashboard parent which handles the data merging.
        // 
        // Wait, let's make this component smart enough to take `analysisResult` and `validTransactions` (parsed from CSV).
        return [];
    }, [data]);

    // Actual implementation with data passed in
    useEffect(() => {
        if (!containerRef.current || !data.elements) return;

        cyRef.current = cytoscape({
            container: containerRef.current,
            elements: data.elements,
            style: [
                {
                    selector: 'node',
                    style: {
                        'background-color': '#3b82f6', // Normal blue
                        'label': 'data(id)',
                        'color': '#cbd5e1',
                        'font-size': '10px',
                        'text-valign': 'center',
                        'text-halign': 'center',
                        'width': 20,
                        'height': 20
                    }
                },
                {
                    selector: 'node[score > 0]',
                    style: {
                        'background-color': 'mapData(score, 0, 100, #3b82f6, #ef4444)',
                        'width': 'mapData(score, 0, 100, 20, 50)',
                        'height': 'mapData(score, 0, 100, 20, 50)',
                        'text-outline-width': 2,
                        'text-outline-color': '#1e293b'
                    }
                },
                {
                    selector: 'node.highlighted', // For ring selection
                    style: {
                        'border-width': 4,
                        'border-color': '#fbbf24'
                    }
                },
                {
                    selector: 'edge',
                    style: {
                        'width': 1,
                        'line-color': '#475569',
                        'target-arrow-color': '#475569',
                        'target-arrow-shape': 'triangle',
                        'curve-style': 'bezier'
                    }
                },
                {
                    selector: 'edge.highlighted',
                    style: {
                        'width': 3,
                        'line-color': '#fbbf24',
                        'target-arrow-color': '#fbbf24'
                    }
                }
            ],
            layout: {
                name: 'cose',
                animate: false,
                randomize: false,
                componentSpacing: 100,
                nodeRepulsion: 400000,
                edgeElasticity: 100,
                nestingFactor: 5,
            }
        });

        cyRef.current.on('mouseover', 'node', (e) => {
            const node = e.target;
            // Show tooltip or update hover state in parent
        });

        cyRef.current.on('tap', 'node', (e) => {
            const node = e.target;
            onNodeClick && onNodeClick(node.data());
        });

        return () => {
            if (cyRef.current) cyRef.current.destroy();
        };
    }, [data]);

    // Effect to handle external highlights (e.g. from table row click)
    useEffect(() => {
        if (!cyRef.current) return;
        cyRef.current.elements().removeClass('highlighted');

        if (data.highlightedRingMembers) {
            const selector = data.highlightedRingMembers.map(id => `#${id}`).join(',');
            cyRef.current.$(selector).addClass('highlighted');
            // Also highlight edges between them?
            cyRef.current.edges().forEach(edge => {
                if (data.highlightedRingMembers.includes(edge.source().id()) &&
                    data.highlightedRingMembers.includes(edge.target().id())) {
                    edge.addClass('highlighted');
                }
            });

            if (data.highlightedRingMembers.length > 0) {
                cyRef.current.fit(cyRef.current.$(selector), 50);
            }
        }
    }, [data.highlightedRingMembers]);

    return (
        <div
            ref={containerRef}
            style={{
                width: '100%',
                height: '600px',
                background: 'var(--secondary)',
                borderRadius: '12px',
                border: '1px solid var(--border)'
            }}
        />
    );
};

export default GraphViz;
