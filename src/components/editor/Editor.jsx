import React, { useMemo, useState, useCallback } from 'react';
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

    const { screenToFlowPosition } = useReactFlow();
    const [menu, setMenu] = useState(null);

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

    const onPaneClick = useCallback(() => setMenu(null), [setMenu]);

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

            addNode(type, position);
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
                            onClick={() => addNode('text')}
                            onMouseEnter={toolbarButtonHover}
                            onMouseLeave={toolbarButtonLeave}
                            style={toolbarButtonStyle}
                        >
                            <span style={{ color: '#3498db' }}>📄</span> + Narrative
                        </button>
                        <button
                            onClick={() => addNode('choice')}
                            onMouseEnter={toolbarButtonHover}
                            onMouseLeave={toolbarButtonLeave}
                            style={toolbarButtonStyle}
                        >
                            <span style={{ color: '#2ecc71' }}>🛤️</span> + Choice
                        </button>
                        <button
                            onClick={() => addNode('dice')}
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
                    onConnect={onConnect}
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
                >
                    <div style={{ padding: '8px 16px', fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.08em' }}>Add Element</div>
                    <button
                        onClick={() => handleAddNodeFromMenu('text')}
                        style={{ width: '100%', padding: '10px 16px', textAlign: 'left', background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}
                    >
                        <span style={{ color: '#3498db' }}>📄</span> Narrative Node
                    </button>
                    <button
                        onClick={() => handleAddNodeFromMenu('choice')}
                        style={{ width: '100%', padding: '10px 16px', textAlign: 'left', background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}
                    >
                        <span style={{ color: '#2ecc71' }}>🛤️</span> Choice Node
                    </button>
                    <button
                        onClick={() => handleAddNodeFromMenu('dice')}
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
