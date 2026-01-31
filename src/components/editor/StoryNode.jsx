import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import useStoryStore from '../../stores/useStoryStore';

const StoryNode = ({ id, data, selected }) => {
    const updateNodeData = useStoryStore((state) => state.updateNodeData);

    const handleChange = (evt) => {
        updateNodeData(id, { [evt.target.name]: evt.target.value });
    };

    return (
        <div className="story-node" style={{
            padding: '10px',
            minWidth: '250px',
            background: 'var(--color-surface)',
            border: selected ? '2px solid var(--color-accent)' : '1px solid transparent',
            borderRadius: 'var(--border-radius-md)',
            color: 'var(--color-text-primary)'
        }}>
            <Handle type="target" position={Position.Top} />

            <div style={{ marginBottom: '8px', fontWeight: 'bold', borderBottom: '1px solid #333', paddingBottom: '4px' }}>
                Story Node
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input
                    name="label"
                    className="nodrag"
                    value={data.label}
                    onChange={handleChange}
                    placeholder="Node Name"
                    style={{
                        background: 'var(--color-bg)',
                        border: '1px solid #333',
                        color: 'inherit',
                        padding: '4px',
                        borderRadius: '4px',
                        width: '100%'
                    }}
                />

                <textarea
                    name="text"
                    className="nodrag"
                    value={data.text}
                    onChange={handleChange}
                    placeholder="Story text..."
                    rows={3}
                    style={{
                        background: 'var(--color-bg)',
                        border: '1px solid #333',
                        color: 'inherit',
                        padding: '4px',
                        borderRadius: '4px',
                        width: '100%',
                        resize: 'vertical'
                    }}
                />

                <input
                    name="image"
                    className="nodrag"
                    value={data.image}
                    onChange={handleChange}
                    placeholder="Image URL"
                    style={{
                        background: 'var(--color-bg)',
                        border: '1px solid #333',
                        color: 'inherit',
                        padding: '4px',
                        borderRadius: '4px',
                        width: '100%',
                        fontSize: '0.8rem'
                    }}
                />
            </div>

            {/* Dynamic Handles for Choices could be added here later */}

            <Handle type="source" position={Position.Bottom} />
        </div>
    );
};

export default memo(StoryNode);
