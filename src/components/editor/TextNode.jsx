import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import useStoryStore from '../../stores/useStoryStore';

const TextNode = ({ id, data, selected }) => {
    const toggleNodePin = useStoryStore((state) => state.toggleNodePin);
    const deleteNode = useStoryStore((state) => state.deleteNode);
    const playNode = useStoryStore((state) => state.playNode);

    const isPinned = data.isPinned;

    const headerStyle = {
        padding: '12px',
        borderTopLeftRadius: '11px',
        borderTopRightRadius: '11px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'linear-gradient(90deg, #3498db, #2980b9)',
        color: 'white',
        fontWeight: '800',
        fontSize: '0.8rem',
        textTransform: 'uppercase',
        letterSpacing: '0.04em'
    };

    const actionButtonStyle = {
        background: 'rgba(255,255,255,0.2)',
        border: 'none',
        borderRadius: '5px',
        width: '24px',
        height: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        cursor: 'pointer',
        fontSize: '0.7rem'
    };

    const playButtonStyle = {
        background: 'white',
        color: '#2980b9',
        border: 'none',
        borderRadius: '5px',
        padding: '0 12px',
        height: '24px',
        fontWeight: '900',
        fontSize: '0.7rem',
        cursor: 'pointer',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
    };

    return (
        <div className="text-node" style={{
            position: 'relative',
            width: '270px',
            minHeight: '120px',
            border: selected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
            paddingBottom: '16px'
        }}>
            <Handle type="target" position={Position.Top} style={{ top: '-6px' }} />

            <div style={headerStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{isPinned ? '🔒' : '📄'}</span>
                    <span>{data.label || 'Narrative'}</span>
                    {data.sound && (
                        <div title="This node has audio" style={{ marginLeft: '6px' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
                                <path d="M5 9v6h4l5 4V5L9 9H5z" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M16.5 8.5c1 1 1.5 2.5 1.5 3.5s-.5 2.5-1.5 3.5" stroke="#aee1ff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '5px' }} className="nodrag">
                    <button onClick={() => toggleNodePin(id)} style={actionButtonStyle}>
                        {isPinned ? '📌' : '📍'}
                    </button>
                    <button onClick={() => deleteNode(id)} style={actionButtonStyle}>
                        🗑️
                    </button>
                    <button onClick={() => playNode(id)} style={playButtonStyle}>
                        PLAY
                    </button>
                </div>
            </div>

            <div style={{ padding: '16px' }}>
                {data.image && (
                    <div style={{
                        borderRadius: '8px',
                        overflow: 'hidden',
                        marginBottom: '14px',
                        border: '1px solid var(--color-border)',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                    }}>
                        <img src={data.image} alt="preview" style={{ width: '100%', height: 'auto', display: 'block' }} />
                    </div>
                )}
                <div style={{
                    fontSize: '0.95rem',
                    color: 'var(--color-text-secondary)',
                    fontFamily: 'var(--font-family-classic)',
                    lineHeight: '1.6',
                    overflowWrap: 'break-word',
                    wordBreak: 'break-word'
                }}>
                    {data.text ? (data.text.length > 140 ? data.text.substring(0, 140) + '...' : data.text) : 'Once upon a time...'}
                </div>
            </div>

            <Handle type="source" position={Position.Bottom} style={{ bottom: '-6px', borderColor: 'var(--color-primary)' }} />
        </div>
    );
};

export default memo(TextNode);
