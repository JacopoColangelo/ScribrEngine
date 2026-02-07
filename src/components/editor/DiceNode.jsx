import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import useStoryStore from '../../stores/useStoryStore';

const DiceNode = ({ id, data, selected }) => {
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
        background: 'linear-gradient(90deg, #e67e22, #d35400)',
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
        color: '#e67e22',
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
        <div className="dice-node" style={{
            position: 'relative',
            width: '270px',
            minHeight: '120px',
            border: selected ? '2px solid var(--color-dice)' : '1px solid var(--color-border)',
            paddingBottom: '20px'
        }}>
            <Handle type="target" position={Position.Top} style={{ top: '-6px' }} />

            <div style={headerStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{isPinned ? '🔒' : '🎲'}</span>
                    <span>{data.label || 'Dice Check'}</span>
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
                <div style={{
                    fontSize: '0.9rem',
                    marginBottom: '15px',
                    color: 'var(--color-text-secondary)',
                    fontStyle: 'italic',
                    fontFamily: 'var(--font-family-classic)',
                    lineHeight: '1.4'
                }}>
                    {data.text || 'Describe the challenge...'}
                </div>

                <div style={{
                    background: 'rgba(0,0,0,0.3)',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: '4px', fontWeight: '800' }}>REQUIREMENT</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '900' }}>
                        <span style={{ color: 'var(--color-dice)' }}>{data.variable?.toUpperCase() || 'STAT'}</span>
                        <span style={{ margin: '0 10px', opacity: 0.5 }}>{'>='}</span>
                        <span>{data.target || 10}</span>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 28px 12px' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: '900', color: 'var(--color-success)' }}>SUCCESS</div>
                <div style={{ fontSize: '0.65rem', fontWeight: '900', color: 'var(--color-error)' }}>FAILURE</div>
            </div>

            <Handle
                type="source"
                position={Position.Bottom}
                id="success"
                style={{ left: '25%', bottom: '-6px', borderColor: 'var(--color-success)' }}
            />
            <Handle
                type="source"
                position={Position.Bottom}
                id="failure"
                style={{ left: '75%', bottom: '-6px', borderColor: 'var(--color-error)' }}
            />
        </div>
    );
};

export default memo(DiceNode);
