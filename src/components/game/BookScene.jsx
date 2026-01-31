import React, { useState, useEffect, useRef } from 'react';
import useStoryStore from '../../stores/useStoryStore';

const BookScene = () => {
    // Game Logic
    const currentNodeId = useStoryStore((state) => state.currentNodeId);
    const nodes = useStoryStore((state) => state.nodes);
    const setCurrentNode = useStoryStore((state) => state.setCurrentNode);
    const getConnectedNodeId = useStoryStore((state) => state.getConnectedNodeId);
    const setVariable = useStoryStore((state) => state.setVariable);
    const variables = useStoryStore((state) => state.variables);

    const currentNode = nodes.find(n => n.id === currentNodeId);
    const [diceResult, setDiceResult] = useState(null);

    // Pagination State
    const [pages, setPages] = useState([]);
    const [currentPage, setCurrentPage] = useState(0);
    const textMeasureRef = useRef(null);
    const pageContentRef = useRef(null);

    // Reset game/pagination state when node changes
    useEffect(() => {
        setDiceResult(null);
        setCurrentPage(0);

        if (currentNode && currentNode.data.text) {
            handlePagination();
        } else {
            setPages([]);
        }
    }, [currentNodeId, currentNode?.data?.text]);

    // Re-paginate on window resize
    useEffect(() => {
        const handleResize = () => handlePagination();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [currentNode]);

    const handlePagination = () => {
        if (!currentNode || !currentNode.data.text || !textMeasureRef.current || !pageContentRef.current) return;

        const text = currentNode.data.text;
        const words = text.split(' ');
        const newPages = [];
        let currentText = '';

        // Measure available height
        // We subtract space for the title/header and the interaction area
        const containerHeight = pageContentRef.current.offsetHeight;
        const maxHeight = containerHeight - 180; // Increased reserved space to ensure buttons fit

        const measureDiv = textMeasureRef.current;
        measureDiv.style.width = `${pageContentRef.current.offsetWidth - 80}px`; // Match padding
        measureDiv.innerHTML = '';

        for (let i = 0; i < words.length; i++) {
            const testText = currentText + (currentText ? ' ' : '') + words[i];
            measureDiv.innerHTML = testText;

            if (measureDiv.offsetHeight > maxHeight) {
                // If this is the first word and it's already too big, we have to keep it though
                if (!currentText) {
                    newPages.push(words[i]);
                    currentText = '';
                } else {
                    newPages.push(currentText);
                    currentText = words[i];
                }
            } else {
                currentText = testText;
            }
        }

        if (currentText) {
            newPages.push(currentText);
        }

        setPages(newPages.length > 0 ? newPages : [text]);
    };

    const handleContinue = () => {
        if (currentPage < pages.length - 1) {
            setCurrentPage(currentPage + 1);
        } else {
            const nextNodeId = getConnectedNodeId(currentNodeId);
            if (nextNodeId) {
                setCurrentNode(nextNodeId);
            }
        }
    };

    const handleChoice = (index) => {
        const nextNodeId = getConnectedNodeId(currentNodeId, `choice-${index}`);
        if (nextNodeId) {
            setCurrentNode(nextNodeId);
        }
    };

    const handleRoll = () => {
        if (!currentNode) return;

        const { variable, target } = currentNode.data;
        const roll = Math.floor(Math.random() * 20) + 1;
        const bonus = variables[variable] ? parseInt(variables[variable]) : 0;
        const total = roll + bonus;
        const success = total >= parseInt(target);

        setDiceResult({ roll, total, success });

        setTimeout(() => {
            const handleId = success ? 'success' : 'failure';
            const nextNodeId = getConnectedNodeId(currentNodeId, handleId);
            if (nextNodeId) {
                setCurrentNode(nextNodeId);
            }
        }, 1500);
    };

    if (!currentNode) return (
        <div style={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#1a1a1a',
            color: '#f4e7d1',
            fontFamily: "'IM Fell English', serif"
        }}>
            <p>Seleziona un nodo nell'editor per iniziare...</p>
        </div>
    );

    const isLastPage = currentPage === pages.length - 1;
    const currentText = pages[currentPage] || currentNode.data.text;

    return (
        <div style={{
            height: '100%',
            background: '#1a1a1a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            overflow: 'hidden'
        }}>
            {/* HIDDEN MEASUREMENT ELEMENT */}
            <div
                ref={textMeasureRef}
                style={{
                    position: 'absolute',
                    visibility: 'hidden',
                    whiteSpace: 'pre-wrap',
                    fontFamily: "'IM Fell English', serif",
                    fontSize: '1.4rem',
                    lineHeight: '1.6',
                    textAlign: 'justify',
                    pointerEvents: 'none',
                    zIndex: -100
                }}
            />

            {/* 2D BOOK CONTAINER */}
            <div style={{
                position: 'relative',
                width: '100%',
                maxWidth: '1000px',
                height: '80vh',
                display: 'flex',
                boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
                background: '#8e44ad',
                borderRadius: '8px',
                padding: '10px'
            }}>
                {/* LEFT PAGE (Images/Mood) */}
                <div style={{
                    flex: 1,
                    background: '#f4e7d1',
                    marginRight: '1px',
                    borderTopLeftRadius: '4px',
                    borderBottomLeftRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                    boxShadow: 'inset -20px 0 30px rgba(0,0,0,0.1)',
                    overflow: 'hidden',
                    position: 'relative'
                }}>
                    {currentNode.data.image ? (
                        <img
                            src={currentNode.data.image}
                            alt="Scene"
                            style={{
                                width: '100%',
                                height: 'auto',
                                maxHeight: '100%',
                                objectFit: 'contain',
                                filter: 'sepia(0.3) contrast(1.1)',
                                border: '1px solid rgba(0,0,0,0.2)'
                            }}
                        />
                    ) : (
                        <div style={{
                            textAlign: 'center',
                            color: 'rgba(0,0,0,0.2)',
                            fontFamily: "'IM Fell English', serif",
                            fontSize: '1.5rem',
                            fontStyle: 'italic'
                        }}>
                            {currentNode.data.label}
                        </div>
                    )}
                </div>

                {/* SPINE */}
                <div style={{
                    width: '30px',
                    background: 'linear-gradient(to right, #7d3c98, #8e44ad, #7d3c98)',
                    boxShadow: 'inset 5px 0 10px rgba(0,0,0,0.2), inset -5px 0 10px rgba(0,0,0,0.2)'
                }} />

                {/* RIGHT PAGE (Text/Controls) */}
                <div
                    ref={pageContentRef}
                    style={{
                        flex: 1,
                        background: '#f4e7d1',
                        marginLeft: '1px',
                        borderTopRightRadius: '4px',
                        borderBottomRightRadius: '4px',
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '40px 40px 60px 40px',
                        boxShadow: 'inset 20px 0 30px rgba(0,0,0,0.1)',
                        overflow: 'hidden', // REMOVED SCROLLBAR
                        fontFamily: "'IM Fell English', serif",
                        color: '#2a2a2a',
                        position: 'relative'
                    }}
                >
                    <div style={{
                        margin: '0 0 20px 0',
                        borderBottom: '1px double rgba(0,0,0,0.2)',
                        paddingBottom: '10px',
                        display: 'flex',
                        justifyContent: 'flex-end'
                    }}>
                        {pages.length > 1 && (
                            <span style={{ fontSize: '0.8rem', opacity: 0.5, fontStyle: 'italic' }}>
                                Page {currentPage + 1} of {pages.length}
                            </span>
                        )}
                    </div>

                    <div style={{
                        fontSize: '1.4rem',
                        lineHeight: '1.6',
                        textAlign: 'justify',
                        whiteSpace: 'pre-wrap',
                        animation: 'fadeIn 0.3s ease-out'
                    }}>
                        {currentText}
                    </div>

                    {/* INTERACTION AREA */}
                    <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
                        {/* If not last page, always show "Continue" */}
                        {!isLastPage ? (
                            <div style={{ textAlign: 'center' }}>
                                <button
                                    onClick={handleContinue}
                                    style={{
                                        background: 'transparent',
                                        border: '1px solid rgba(0,0,0,0.2)',
                                        padding: '10px 20px',
                                        fontFamily: "'IM Fell English SC', serif",
                                        fontSize: '1.1rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Continue reading...
                                </button>
                            </div>
                        ) : (
                            <React.Fragment>
                                {/* CHOICE NODE */}
                                {currentNode.type === 'choice' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {currentNode.data.choices && currentNode.data.choices.map((choice, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleChoice(idx)}
                                                style={{
                                                    padding: '12px 18px',
                                                    background: 'transparent',
                                                    border: '1px solid rgba(0,0,0,0.3)',
                                                    color: '#2a2a2a',
                                                    fontFamily: "'IM Fell English', serif",
                                                    fontSize: '1.1rem', // Slightly smaller font for choices
                                                    cursor: 'pointer',
                                                    textAlign: 'left',
                                                    transition: 'all 0.2s'
                                                }}
                                                className="book-choice-button"
                                                onMouseOver={(e) => e.target.style.background = 'rgba(0,0,0,0.05)'}
                                                onMouseOut={(e) => e.target.style.background = 'transparent'}
                                            >
                                                ➤ {choice.text}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* DICE NODE */}
                                {currentNode.type === 'dice' && (
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ marginBottom: '15px', fontStyle: 'italic', fontSize: '1.1rem' }}>
                                            The check: {currentNode.data.variable} vs {currentNode.data.target}
                                        </div>

                                        {!diceResult ? (
                                            <button
                                                onClick={handleRoll}
                                                style={{
                                                    padding: '15px 30px',
                                                    background: '#2c3e50',
                                                    color: '#f4e7d1',
                                                    border: 'none',
                                                    fontFamily: "'IM Fell English SC', serif",
                                                    fontSize: '1.3rem',
                                                    cursor: 'pointer',
                                                    boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                                                }}
                                            >
                                                Roll Dice 🎲
                                            </button>
                                        ) : (
                                            <div style={{ animation: 'fadeIn 0.5s' }}>
                                                <div style={{ fontSize: '3rem', fontWeight: 'bold' }}>{diceResult.roll}</div>
                                                <div style={{ fontSize: '1.2rem' }}>Total: {diceResult.total}</div>
                                                <div style={{
                                                    color: diceResult.success ? '#27ae60' : '#c0392b',
                                                    fontFamily: "'IM Fell English SC', serif",
                                                    fontSize: '1.8rem',
                                                    marginTop: '10px'
                                                }}>
                                                    {diceResult.success ? 'SUCCESS' : 'FAILURE'}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* TEXT NODE CONTINUE */}
                                {currentNode.type === 'text' && (
                                    <div style={{ textAlign: 'center' }}>
                                        <button
                                            onClick={handleContinue}
                                            style={{
                                                background: 'transparent',
                                                border: '1px solid rgba(0,0,0,0.2)',
                                                padding: '10px 20px',
                                                fontFamily: "'IM Fell English SC', serif",
                                                fontSize: '1.1rem',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Next Page ✒️
                                        </button>
                                    </div>
                                )}
                            </React.Fragment>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookScene;
