import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    useReactFlow,
    ReactFlowProvider
} from 'reactflow';
import 'reactflow/dist/style.css';
import useStoryStore from '../../stores/useStoryStore';
import TextNode from './TextNode';
import ChoiceNode from './ChoiceNode';
import DiceNode from './DiceNode';
import PropertiesSidebar from './PropertiesSidebar';

// Define custom node types
const nodeTypes = {
    text: TextNode,
    choice: ChoiceNode,
    dice: DiceNode
};

const EditorInner = () => {
    const {
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        onConnect,
        addNode,
        gridVisible,
        snapToGrid,
        toggleGrid,
        toggleSnap
    } = useStoryStore();

    const { screenToFlowPosition, getViewport } = useReactFlow();
    const [menu, setMenu] = useState(null);
    const connectionMadeRef = useRef(false);
    const mousePositionRef = useRef({ x: 0, y: 0 });
    const pendingConnectionRef = useRef(null); // Store { source, sourceHandle } when dragging starts

    const onEdgesDelete = (edgesToDelete) => {
        edgesToDelete.forEach(edge => useStoryStore.getState().deleteEdge(edge.id));
    };

    const onPaneContextMenu = useCallback(
        (event) => {
            event.preventDefault();
            setMenu({
                id: 'context-menu',
                top: event.clientY,
                left: event.clientX,
            });
        },
        [setMenu]
    );

    const onPaneClick = useCallback((event) => {
        // Don't clear menu if clicking on the menu itself
        if (event?.target?.closest('[data-context-menu]')) {
            return;
        }
        setMenu(null);
        // Clear pending connection if menu is closed without selecting
        // But only if we're not in the process of adding a node
        if (!pendingConnectionRef.current) {
            // Already cleared or never set
        }
    }, [setMenu]);

    const handleConnect = useCallback(
        (connection) => {
            connectionMadeRef.current = true;
            // Clear pending connection since we successfully connected
            pendingConnectionRef.current = null;
            onConnect(connection);
        },
        [onConnect]
    );

    const onConnectStart = useCallback((event, params) => {
        connectionMadeRef.current = false;
        // ReactFlow v11+ uses params object: { nodeId, handleType, handleId }
        const { nodeId, handleType, handleId } = params || {};
        
        // Store connection info for potential auto-connection
        // Handle both source (output) and target (input) handles
        if (handleType === 'source') {
            // Dragging FROM a source handle - new node will be target
            pendingConnectionRef.current = {
                type: 'source',
                source: nodeId,
                sourceHandle: handleId, // Can be undefined, null, or a string like "choice-0", "success", etc.
            };
        } else if (handleType === 'target') {
            // Dragging FROM a target handle - new node will be source
            pendingConnectionRef.current = {
                type: 'target',
                target: nodeId,
                targetHandle: handleId, // Can be undefined, null
            };
        } else {
            pendingConnectionRef.current = null;
        }
    }, []);

    const onConnectEnd = useCallback(
        (event) => {
            // Use setTimeout to ensure onConnect has been called if connection was successful
            setTimeout(() => {
                // If connection was not completed (no target handle), show context menu
                if (!connectionMadeRef.current) {
                    // Get the last known mouse position
                    const pos = mousePositionRef.current;
                    // If we have valid coordinates, use them; otherwise use center of screen
                    const clientX = pos.x || window.innerWidth / 2;
                    const clientY = pos.y || window.innerHeight / 2;
                    
                    setMenu({
                        id: 'context-menu',
                        top: clientY,
                        left: clientX,
                    });
                }
                connectionMadeRef.current = false;
                // If connection wasn't made, keep pendingConnectionRef for menu
                // It will be cleared when menu item is selected or menu is closed
            }, 10);
        },
        []
    );

    // Track mouse position globally
    useEffect(() => {
        const handleMouseMove = (e) => {
            mousePositionRef.current = { x: e.clientX, y: e.clientY };
        };
        document.addEventListener('mousemove', handleMouseMove);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    const handleAddNodeFromMenu = (type) => {
        if (menu) {
            let position = screenToFlowPosition({
                x: menu.left,
                y: menu.top,
            });

            if (snapToGrid) {
                position = {
                    x: Math.round(position.x / 15) * 15,
                    y: Math.round(position.y / 15) * 15,
                };
            }

            const newNodeId = addNode(type, position);
            
            // If we have a pending connection from dragging, auto-connect
            if (pendingConnectionRef.current) {
                const pending = pendingConnectionRef.current;
                
                // Use requestAnimationFrame to ensure node is rendered before connecting
                requestAnimationFrame(() => {
                    let connection;
                    
                    if (pending.type === 'source') {
                        // Dragging FROM source handle - connect source -> new node (target)
                        connection = {
                            source: pending.source,
                            target: newNodeId
                        };
                        
                        // Only add sourceHandle if it's not null/undefined
                        if (pending.sourceHandle !== null && pending.sourceHandle !== undefined) {
                            connection.sourceHandle = pending.sourceHandle;
                        }
                        
                        // Don't specify targetHandle - let ReactFlow use the default (top handle)
                    } else if (pending.type === 'target') {
                        // Dragging FROM target handle - connect new node (source) -> target
                        connection = {
                            source: newNodeId,
                            target: pending.target
                        };
                        
                        // Only add targetHandle if it's not null/undefined
                        if (pending.targetHandle !== null && pending.targetHandle !== undefined) {
                            connection.targetHandle = pending.targetHandle;
                        }
                        
                        // Don't specify sourceHandle - let ReactFlow use the default (bottom handle)
                    }
                    
                    if (connection) {
                        onConnect(connection);
                    }
                });
                
                pendingConnectionRef.current = null;
            }
        }
        setMenu(null);
    };

    const toolbarButtonStyle = {
        background: 'var(--glass-bg)',
        backdropFilter: 'var(--glass-blur)',
        border: '1px solid var(--glass-border)',
        color: 'var(--color-text-primary)',
        padding: '10px 20px',
        fontWeight: 'bold',
        fontSize: '0.85rem',
        boxShadow: 'var(--shadow-md)',
        borderRadius: '8px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        transition: 'all 0.2s ease'
    };

    const toolbarButtonHover = (e) => {
        e.target.style.background = 'var(--color-surface-hover)';
        e.target.style.transform = 'translateY(-1px)';
        e.target.style.borderColor = 'var(--color-primary)';
    };

    const toolbarButtonLeave = (e) => {
        e.target.style.background = 'var(--glass-bg)';
        e.target.style.transform = 'translateY(0)';
        e.target.style.borderColor = 'var(--glass-border)';
    };

    const handleAddNodeAtViewportCenter = useCallback((type) => {
        // Get the ReactFlow viewport container
        const reactFlowWrapper = document.querySelector('.react-flow');
        if (!reactFlowWrapper) {
            // Fallback: add node at default position
            addNode(type);
            return;
        }

        // Get the center of the viewport
        const rect = reactFlowWrapper.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Convert screen coordinates to flow coordinates
        const position = screenToFlowPosition({
            x: centerX,
            y: centerY,
        });

        addNode(type, position);
    }, [addNode, screenToFlowPosition]);

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', background: 'var(--color-bg)' }}>
            <div style={{ flex: 1, position: 'relative', height: '100%' }}>
                <div style={{
                    position: 'absolute',
                    top: '1.5rem',
                    left: '1.5rem',
                    zIndex: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                }}>
                    <div style={{ display: 'flex', gap: '0.8rem' }}>
                        <button
                            onClick={() => handleAddNodeAtViewportCenter('text')}
                            onMouseEnter={toolbarButtonHover}
                            onMouseLeave={toolbarButtonLeave}
                            style={toolbarButtonStyle}
                        >
                            <span style={{ color: '#3498db' }}>📄</span> + Narrative
                        </button>
                        <button
                            onClick={() => handleAddNodeAtViewportCenter('choice')}
                            onMouseEnter={toolbarButtonHover}
                            onMouseLeave={toolbarButtonLeave}
                            style={toolbarButtonStyle}
                        >
                            <span style={{ color: '#2ecc71' }}>🛤️</span> + Choice
                        </button>
                        <button
                            onClick={() => handleAddNodeAtViewportCenter('dice')}
                            onMouseEnter={toolbarButtonHover}
                            onMouseLeave={toolbarButtonLeave}
                            style={toolbarButtonStyle}
                        >
                            <span style={{ color: '#e67e22' }}>🎲</span> + Dice
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: '0.8rem' }}>
                        <button
                            onClick={toggleGrid}
                            style={{
                                ...toolbarButtonStyle,
                                padding: '8px 14px',
                                fontSize: '0.75rem',
                                opacity: gridVisible ? 1 : 0.6
                            }}
                        >
                            {gridVisible ? '🌐 Grid On' : '🌐 Grid Off'}
                        </button>
                        <button
                            onClick={toggleSnap}
                            style={{
                                ...toolbarButtonStyle,
                                padding: '8px 14px',
                                fontSize: '0.75rem',
                                opacity: snapToGrid ? 1 : 0.6
                            }}
                        >
                            {snapToGrid ? '🧲 Snap On' : '🧲 Snap Off'}
                        </button>
                    </div>
                </div>

                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={handleConnect}
                    onConnectStart={onConnectStart}
                    onConnectEnd={onConnectEnd}
                    onEdgesDelete={onEdgesDelete}
                    onPaneContextMenu={onPaneContextMenu}
                    onPaneClick={onPaneClick}
                    nodeTypes={nodeTypes}
                    fitView
                    fitViewOptions={{ padding: 0.1, minZoom: 1.0, maxZoom: 1.0 }}
                    snapToGrid={snapToGrid}
                    snapGrid={[15, 15]}
                    defaultEdgeOptions={{
                        animated: true,
                        style: { stroke: 'var(--color-primary)', strokeWidth: 3, opacity: 0.6 },
                        type: 'smoothstep'
                    }}
                    deleteKeyCode={['Backspace', 'Delete']}
                    style={{ background: 'transparent' }}
                >
                    {gridVisible && <Background color="rgba(255,255,255,0.2)" gap={15} variant="dots" />}
                    <Controls />
                    <MiniMap
                        nodeColor={(n) => {
                            if (n.type === 'text') return '#3498db';
                            if (n.type === 'choice') return '#2ecc71';
                            if (n.type === 'dice') return '#e67e22';
                            return '#eee';
                        }}
                        maskColor="rgba(0, 0, 0, 0.4)"
                        style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}
                    />
                </ReactFlow>
            </div>

            <PropertiesSidebar />

            {menu && (
                <div
                    data-context-menu
                    style={{
                        position: 'fixed',
                        top: menu.top,
                        left: menu.left,
                        zIndex: 1000,
                        background: 'var(--glass-bg)',
                        backdropFilter: 'var(--glass-blur)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '12px',
                        padding: '8px 0',
                        boxShadow: 'var(--shadow-lg)',
                        minWidth: '180px'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div style={{ padding: '8px 16px', fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.08em' }}>Add Element</div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleAddNodeFromMenu('text');
                        }}
                        style={{ width: '100%', padding: '10px 16px', textAlign: 'left', background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}
                    >
                        <span style={{ color: '#3498db' }}>📄</span> Narrative Node
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleAddNodeFromMenu('choice');
                        }}
                        style={{ width: '100%', padding: '10px 16px', textAlign: 'left', background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}
                    >
                        <span style={{ color: '#2ecc71' }}>🛤️</span> Choice Node
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleAddNodeFromMenu('dice');
                        }}
                        style={{ width: '100%', padding: '10px 16px', textAlign: 'left', background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}
                    >
                        <span style={{ color: '#e67e22' }}>🎲</span> Dice Node
                    </button>
                </div>
            )}
        </div>
    );
};

const Editor = () => (
    <ReactFlowProvider>
        <EditorInner />
    </ReactFlowProvider>
);

export default Editor;
