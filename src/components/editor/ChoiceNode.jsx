import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import useStoryStore from '../../stores/useStoryStore';

const ChoiceNode = ({ id, data, selected }) => {
    const toggleNodePin = useStoryStore((state) => state.toggleNodePin);
    const deleteNode = useStoryStore((state) => state.deleteNode);
    const playNode = useStoryStore((state) => state.playNode);

    const isPinned = data.isPinned;
    const choices = data.choices || [];

    const headerStyle = {
        padding: '12px',
        borderTopLeftRadius: '11px',
        borderTopRightRadius: '11px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'linear-gradient(90deg, #2ecc71, #27ae60)',
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
        color: '#27ae60',
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
        <div className="choice-node" style={{
            position: 'relative',
            width: '270px',
            minHeight: '120px',
            border: selected ? '2px solid var(--color-success)' : '1px solid var(--color-border)',
            paddingBottom: '24px'
        }}>
            <Handle type="target" position={Position.Top} style={{ top: '-6px' }} />

            <div style={headerStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{isPinned ? '🔒' : '🛤️'}</span>
                    <span>{data.label || 'Choice'}</span>
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
                    marginBottom: '16px',
                    color: 'var(--color-text-secondary)',
                    fontStyle: 'italic',
                    fontFamily: 'var(--font-family-classic)',
                    lineHeight: '1.4'
                }}>
                    {data.text || 'Selection prompt needed...'}
                </div>

                <div style={{
                    borderTop: '1px solid var(--color-border)',
                    paddingTop: '12px',
                    display: 'flex',
                    justifyContent: 'space-around',
                    gap: '4px'
                }}>
                    {choices.map((choice, index) => (
                        <div key={choice.id || index} style={{
                            fontSize: '0.65rem',
                            textAlign: 'center',
                            flex: 1,
                            fontWeight: '700',
                            color: 'var(--color-text-primary)',
                            padding: '4px 6px',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '5px',
                            border: '1px solid var(--color-border)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}>
                            {choice.text}
                        </div>
                    ))}
                </div>
            </div>

            {choices.map((choice, index) => {
                const total = choices.length;
                const leftPos = `${((index + 1) / (total + 1)) * 100}%`;
                return (
                    <Handle
                        key={`handle-${choice.id || index}`}
                        type="source"
                        position={Position.Bottom}
                        id={`choice-${index}`}
                        style={{
                            left: leftPos,
                            bottom: '-6px',
                            borderColor: 'var(--color-success)' // Themed border
                        }}
                    />
                );
            })}
        </div>
    );
};

export default memo(ChoiceNode);
