import React from 'react';
import useStoryStore from '../../stores/useStoryStore';

const PropertiesSidebar = () => {
    const { nodes, updateNodeData } = useStoryStore();
    const selectedNode = nodes.find((n) => n.selected);

    if (!selectedNode) {
        return (
            <div style={{
                width: '320px',
                background: 'var(--color-bg)',
                borderLeft: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-text-muted)',
                fontSize: '0.9rem',
                fontStyle: 'italic',
                padding: '2rem',
                textAlign: 'center'
            }}>
                Select a node in the editor to view and edit its properties.
            </div>
        );
    }

    const { id, type, data } = selectedNode;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        updateNodeData(id, { [name]: value });
    };

    const handleChoiceChange = (choiceId, newText) => {
        const choices = data.choices.map((c) =>
            c.id === choiceId ? { ...c, text: newText } : c
        );
        updateNodeData(id, { choices });
    };

    const handleAddChoice = () => {
        const choices = [...(data.choices || []), { id: Date.now(), text: 'Choice' }];
        updateNodeData(id, { choices });
    };

    const handleRemoveChoice = (choiceId) => {
        const choices = data.choices.filter((c) => c.id !== choiceId);
        updateNodeData(id, { choices });
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                updateNodeData(id, { image: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const sidebarStyle = {
        width: '360px',
        background: 'var(--color-surface)',
        borderLeft: '1px solid var(--color-border)',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        overflowY: 'auto',
        boxShadow: '-4px 0 15px rgba(0,0,0,0.1)',
        zIndex: 10
    };

    const sectionStyle = {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
    };

    const labelStyle = {
        fontSize: '0.75rem',
        fontWeight: '800',
        color: 'var(--color-text-secondary)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
    };

    const inputStyle = {
        padding: '12px',
        background: 'rgba(0,0,0,0.2)',
        border: '1px solid var(--color-border)',
        borderRadius: '8px',
        color: 'var(--color-text-primary)',
        fontSize: '0.9rem',
        width: '100%',
        fontFamily: 'inherit',
        outline: 'none',
        transition: 'all 0.2s ease'
    };

    const inputFocusStyle = (e) => {
        e.target.style.borderColor = 'var(--color-primary)';
        e.target.style.background = 'rgba(0,0,0,0.3)';
    };

    const inputBlurStyle = (e) => {
        e.target.style.borderColor = 'var(--color-border)';
        e.target.style.background = 'rgba(0,0,0,0.2)';
    };

    const buttonStyle = {
        padding: '10px 16px',
        borderRadius: '8px',
        fontSize: '0.85rem',
        fontWeight: '700',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px'
    };

    const renderTextProperties = () => (
        <div style={sectionStyle}>
            <div style={sectionStyle}>
                <label style={labelStyle}>Narrative Text</label>
                <textarea
                    name="text"
                    value={data.text || ''}
                    onChange={handleInputChange}
                    onFocus={inputFocusStyle}
                    onBlur={inputBlurStyle}
                    style={{ ...inputStyle, minHeight: '120px', lineHeight: '1.5', resize: 'vertical' }}
                    placeholder="Once upon a time..."
                />
            </div>

            <div style={sectionStyle}>
                <label style={labelStyle}>Visual Asset</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        id="image-upload"
                        style={{ display: 'none' }}
                    />
                    <label
                        htmlFor="image-upload"
                        style={{
                            ...buttonStyle,
                            background: 'var(--color-bg)',
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-text-primary)',
                            cursor: 'pointer'
                        }}
                    >
                        📁 Choose Local File
                    </label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', flex: 1, textAlign: 'center' }}>— OR —</span>
                    </div>
                    <input
                        name="image"
                        value={data.image || ''}
                        onChange={handleInputChange}
                        onFocus={inputFocusStyle}
                        onBlur={inputBlurStyle}
                        style={inputStyle}
                        placeholder="Image URL..."
                    />
                </div>
                {data.image && (
                    <div style={{ marginTop: '8px', position: 'relative' }}>
                        <img
                            src={data.image}
                            alt="Node preview"
                            style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--color-border-bright)' }}
                        />
                        <button
                            onClick={() => updateNodeData(id, { image: '' })}
                            style={{
                                position: 'absolute',
                                top: '8px',
                                right: '8px',
                                background: 'rgba(0,0,0,0.6)',
                                border: 'none',
                                borderRadius: '50%',
                                width: '28px',
                                height: '28px',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyCenter: 'center',
                                cursor: 'pointer'
                            }}
                        >
                            ✕
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    const renderChoiceProperties = () => (
        <div style={sectionStyle}>
            <div style={sectionStyle}>
                <label style={labelStyle}>Player Prompt</label>
                <input
                    name="text"
                    value={data.text || ''}
                    onChange={handleInputChange}
                    onFocus={inputFocusStyle}
                    onBlur={inputBlurStyle}
                    style={inputStyle}
                    placeholder="What will you do?"
                />
            </div>
            <div style={{ ...sectionStyle, gap: '8px' }}>
                <label style={labelStyle}>Branches ({data.choices?.length || 0})</label>
                {(data.choices || []).map((choice, index) => (
                    <div key={choice.id || index} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: 'var(--color-success)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.7rem',
                            fontWeight: 'bold',
                            flexShrink: 0
                        }}>
                            {index + 1}
                        </div>
                        <input
                            value={choice.text}
                            onChange={(e) => handleChoiceChange(choice.id, e.target.value)}
                            onFocus={inputFocusStyle}
                            onBlur={inputBlurStyle}
                            style={{ ...inputStyle, padding: '8px 12px' }}
                        />
                        <button
                            onClick={() => handleRemoveChoice(choice.id)}
                            style={{
                                background: 'rgba(231, 76, 60, 0.15)',
                                color: '#e74c3c',
                                border: 'none',
                                borderRadius: '4px',
                                width: '32px',
                                height: '32px',
                                flexShrink: 0
                            }}
                        >
                            ✕
                        </button>
                    </div>
                ))}
                <button
                    onClick={handleAddChoice}
                    style={{
                        ...buttonStyle,
                        background: 'rgba(46, 204, 113, 0.15)',
                        color: 'var(--color-success)',
                        border: '1px dashed var(--color-success)',
                        marginTop: '8px'
                    }}
                >
                    + Add New Choice
                </button>
            </div>
        </div>
    );

    const renderDiceProperties = () => (
        <div style={sectionStyle}>
            <div style={sectionStyle}>
                <label style={labelStyle}>Fate Description</label>
                <textarea
                    name="text"
                    value={data.text || ''}
                    onChange={handleInputChange}
                    onFocus={inputFocusStyle}
                    onBlur={inputBlurStyle}
                    style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                    placeholder="Describe the challenge..."
                />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={sectionStyle}>
                    <label style={labelStyle}>Attribute</label>
                    <input
                        name="variable"
                        value={data.variable || ''}
                        onChange={handleInputChange}
                        onFocus={inputFocusStyle}
                        onBlur={inputBlurStyle}
                        style={inputStyle}
                        placeholder="strength"
                    />
                </div>
                <div style={sectionStyle}>
                    <label style={labelStyle}>Difficulty</label>
                    <input
                        name="target"
                        type="number"
                        value={data.target || ''}
                        onChange={handleInputChange}
                        onFocus={inputFocusStyle}
                        onBlur={inputBlurStyle}
                        style={inputStyle}
                        placeholder="10"
                    />
                </div>
            </div>
        </div>
    );

    return (
        <div style={sidebarStyle} className="properties-sidebar">
            <header style={{ borderBottom: '1px solid var(--color-border)', pb: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: type === 'text' ? '#3498db' : (type === 'choice' ? '#2ecc71' : '#e67e22'),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1rem'
                }}>
                    {type === 'text' ? '📄' : (type === 'choice' ? '🛤️' : '🎲')}
                </div>
                <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: '800' }}>Properties</h3>
                    <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>{type} Element</p>
                </div>
            </header>

            <div style={sectionStyle}>
                <label style={labelStyle}>Element Label</label>
                <input
                    name="label"
                    value={data.label || ''}
                    onChange={handleInputChange}
                    onFocus={inputFocusStyle}
                    onBlur={inputBlurStyle}
                    style={{ ...inputStyle, fontWeight: '700', fontSize: '1.1rem', background: 'transparent', border: 'none', paddingLeft: 0, borderBottom: '1px solid var(--color-border)' }}
                    placeholder="Name this node..."
                />
            </div>

            {type === 'text' && renderTextProperties()}
            {type === 'choice' && renderChoiceProperties()}
            {type === 'dice' && renderDiceProperties()}
        </div>
    );
};

export default PropertiesSidebar;
