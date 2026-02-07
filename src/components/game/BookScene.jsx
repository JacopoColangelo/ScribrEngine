import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import useStoryStore from '../../stores/useStoryStore';

// Simple Typewriter Component defined inline for now to avoid import issues if file creation lags, 
// but ideally should be imported. Given I just created it, I will try to import it.
import TypewriterText from './TypewriterText';

const BookScene = () => {
    // Game Logic
    const currentNodeId = useStoryStore((state) => state.currentNodeId);
    const nodes = useStoryStore((state) => state.nodes);
    const setCurrentNode = useStoryStore((state) => state.setCurrentNode);
    const getConnectedNodeId = useStoryStore((state) => state.getConnectedNodeId);
    const setVariable = useStoryStore((state) => state.setVariable);
    const variables = useStoryStore((state) => state.variables);
    const history = useStoryStore((state) => state.history);
    const goBack = useStoryStore((state) => state.goBack);

    const currentNode = nodes.find(n => n.id === currentNodeId);
    const [diceResult, setDiceResult] = useState(null);

    // Pagination State
    const [pages, setPages] = useState([]);
    const [currentPage, setCurrentPage] = useState(0);
    const textMeasureRef = useRef(null);
    const pageContentRef = useRef(null);
    const [isFontLoaded, setIsFontLoaded] = useState(false);

    // Animation State (Removed global flip for pure ink reveal)
    const [isFlipping, setIsFlipping] = useState(false); // Kept for minimal state logic if needed, but not used for animation

    // Wait for fonts to ensure measurement is correct
    useEffect(() => {
        document.fonts.ready.then(() => {
            setIsFontLoaded(true);
        });
    }, []);

    // Reset game/pagination state when node changes
    useEffect(() => {
        setDiceResult(null);
        setCurrentPage(0);
    }, [currentNodeId]);

    // ... cleanup audio (lines 47-77) ...

    const handlePagination = useCallback(() => {
        if (!currentNode || !currentNode.data.text || !textMeasureRef.current || !pageContentRef.current) return;

        const container = pageContentRef.current;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        if (containerWidth <= 0 || containerHeight <= 0) return;

        const text = currentNode.data.text;
        const tokens = text.split(/(\s+)/);
        const newPages = [];
        let currentText = '';

        // Match the 50px padding on each side (total 100px)
        const contentWidth = containerWidth - 100;
        // Match the padding (50px top + 60px bottom) + footer space
        const maxHeight = containerHeight - 240;

        const measureDiv = textMeasureRef.current;
        measureDiv.style.width = `${contentWidth}px`;
        measureDiv.style.display = 'block';
        measureDiv.style.fontFamily = "'IM Fell English', serif";
        measureDiv.style.fontSize = '1.45rem'; // Adjusted for IM Fell metrics
        measureDiv.style.lineHeight = '1.4';
        measureDiv.style.boxSizing = 'border-box';
        measureDiv.style.whiteSpace = 'pre-wrap';
        measureDiv.style.wordBreak = 'normal';
        measureDiv.style.textAlign = 'justify';

        measureDiv.innerHTML = '';

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            const testText = currentText + token;
            measureDiv.innerText = testText;

            if (measureDiv.offsetHeight <= maxHeight) {
                currentText = testText;
            } else {
                if (currentText.length > 0) {
                    newPages.push(currentText);
                    currentText = '';
                }

                measureDiv.innerText = token;
                if (measureDiv.offsetHeight <= maxHeight) {
                    currentText = token;
                } else {
                    let remainingToken = token;
                    while (remainingToken.length > 0) {
                        let low = 0;
                        let high = remainingToken.length;
                        let bestFitIndex = 0;

                        while (low <= high) {
                            const mid = Math.floor((low + high) / 2);
                            if (mid === 0) { low = 1; continue; }
                            measureDiv.innerText = remainingToken.substring(0, mid);
                            if (measureDiv.offsetHeight <= maxHeight) {
                                bestFitIndex = mid;
                                low = mid + 1;
                            } else {
                                high = mid - 1;
                            }
                        }

                        if (bestFitIndex > 0) {
                            newPages.push(remainingToken.substring(0, bestFitIndex));
                            remainingToken = remainingToken.substring(bestFitIndex);
                        } else {
                            newPages.push(remainingToken.substring(0, 1));
                            remainingToken = remainingToken.substring(1);
                        }

                        measureDiv.innerText = remainingToken;
                        if (measureDiv.offsetHeight <= maxHeight) {
                            currentText = remainingToken;
                            remainingToken = '';
                        }
                    }
                }
            }
        }

        if (currentText) {
            newPages.push(currentText);
        }

        const cleanedPages = newPages.filter(p => p.length > 0);
        const finalPages = cleanedPages.length > 0 ? cleanedPages : [text];
        setPages(finalPages);

        if (currentPage >= finalPages.length) {
            setCurrentPage(Math.max(0, finalPages.length - 1));
        }
    }, [currentNode, isFontLoaded]);

    // Trigger pagination on resize, node change, or font load
    useLayoutEffect(() => {
        handlePagination();
    }, [handlePagination]);

    useEffect(() => {
        const onResize = () => handlePagination();
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [handlePagination]);

    const isLastPage = pages.length === 0 || currentPage === pages.length - 1;

    const handleContinue = () => {
        const nextNodeId = getConnectedNodeId(currentNodeId);
        if (nextNodeId) {
            setCurrentNode(nextNodeId);
        }
    };

    const handleUnifiedNext = () => {
        if (!isLastPage) {
            setCurrentPage(currentPage + 1);
        } else {
            // If Text Node, go to next node
            if (currentNode.type === 'text') {
                handleContinue();
            }
        }
    };

    const handleUnifiedPrev = () => {
        if (currentPage > 0) {
            setCurrentPage(currentPage - 1);
        } else {
            goBack();
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
            if (nextNodeId) setCurrentNode(nextNodeId);
        }, 1500);
    };

    if (!currentNode) return (
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d0d0d', color: '#f4e7d1', fontFamily: "'IM Fell English', serif" }}>
            <p>Seleziona un nodo nell'editor per iniziare...</p>
        </div>
    );

    const currentText = pages.length > 0 ? pages[currentPage] : '';
    const showNextButton = !isLastPage || (isLastPage && currentNode.type === 'text');
    const showPrevButton = currentPage > 0 || history.length > 1;

    // 1. Theme-synced background (Dark HSL)
    const tableBackground = `
        radial-gradient(circle at center, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.9) 100%),
        hsl(222, 18%, 8%)
    `;

    // 2. Parchment Texture (CSS Generated)
    const parchmentBackground = `
        linear-gradient(to right, rgba(235, 213, 179, 0.5), rgba(235, 213, 179, 0.2)),
        url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.15'/%3E%3C/svg%3E"),
        #fdf6e3
    `;

    return (
        <div style={{
            height: '100%',
            background: tableBackground,
            backgroundBlendMode: 'multiply',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            overflow: 'hidden',
            perspective: '1500px' // Essential for 3D flip
        }}>
            <style>
                {`
                    /* Custom Scrollbar for the book pages if needed (though we paginate) */
                    ::-webkit-scrollbar { width: 6px; }
                    ::-webkit-scrollbar-track { background: transparent; }
                    ::-webkit-scrollbar-thumb { background: rgba(62, 39, 35, 0.3); border-radius: 3px; }
                `}
            </style>

            {/* HIDDEN MEASUREMENT ELEMENT */}
            <div
                ref={textMeasureRef}
                style={{
                    position: 'absolute',
                    visibility: 'hidden',
                    top: -9999,
                    left: -9999,
                    pointerEvents: 'none',
                    whiteSpace: 'pre-wrap',
                    overflowWrap: 'anywhere',
                    wordBreak: 'normal'
                }}
            />

            {/* 3D BOOK CONTAINER */}
            <div style={{
                position: 'relative',
                width: '100%',
                maxWidth: '1200px', // Wider spread
                height: '85vh',
                display: 'flex',
                boxShadow: '0 50px 70px -20px rgba(0,0,0,0.8), inset 0 0 60px rgba(0,0,0,0.6)', // Deep ambient occlusion
                borderRadius: '8px',
                padding: '12px', // Balanced leather border
                transformStyle: 'preserve-3d',
                transition: 'transform 0.6s ease',

                // Premium Leather Texture
                // Premium Leather Texture
                backgroundColor: '#121212',
                backgroundImage: `
                    radial-gradient(circle at 50% 50%, rgba(255,255,255,0.03) 0%, transparent 70%),
                    url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.6' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.12'/%3E%3C/svg%3E")
                `,
                border: '1px solid rgba(255,255,255,0.05)', // Subtle rim light
            }}>
                {/* LEFT PAGE (Images/Mood) */}
                <div style={{
                    flex: 1,
                    background: parchmentBackground,
                    backgroundBlendMode: 'multiply',

                    borderTopLeftRadius: '2px',
                    borderBottomLeftRadius: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '30px',
                    boxShadow: 'inset -20px 0 40px rgba(0,0,0,0.15)', // Refined, subtler fold
                    overflow: 'hidden',
                    position: 'relative',
                    transformOrigin: 'right center',
                }}>
                    <div style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        {currentNode.data.image ? (
                            <div style={{
                                padding: '12px',
                                background: '#fffcf5',
                                boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
                                transform: 'rotate(-1deg)',
                                maxWidth: '90%',
                                maxHeight: '80%'
                            }}>
                                <img
                                    src={currentNode.data.image}
                                    alt="Scene"
                                    style={{
                                        width: '100%',
                                        height: 'auto',
                                        maxHeight: '100%',
                                        objectFit: 'contain',
                                        filter: 'sepia(0.4) contrast(1.1) brightness(0.95) grayscale(0.2)', // Aged photo look
                                        border: '1px solid rgba(0,0,0,0.1)',
                                        display: 'block'
                                    }}
                                />
                            </div>
                        ) : (
                            // Decorative Element for empty left pages
                            <div style={{
                                textAlign: 'center',
                                color: 'rgba(62, 39, 35, 0.4)',
                                fontFamily: "'Cinzel Decorative', serif",
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '20px'
                            }}>
                                <div style={{ fontSize: '4rem', lineHeight: 1 }}>❦</div>
                                <div style={{ fontSize: '2rem', letterSpacing: '2px' }}>
                                    {currentNode.data.label}
                                </div>
                                <div style={{ fontSize: '4rem', lineHeight: 1, transform: 'rotate(180deg)' }}>❦</div>
                            </div>
                        )}
                    </div>

                    {/* PREV Button - PERSISTENT UI */}
                    {showPrevButton && (
                        <div style={{ position: 'absolute', bottom: '25px', left: '25px' }}>
                            <button
                                onClick={handleUnifiedPrev}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '2.5rem',
                                    color: '#3e2723',
                                    transition: 'transform 0.2s',
                                    opacity: 0.7
                                }}
                                title="Previous Page"
                                onMouseOver={(e) => { e.target.style.transform = 'scale(1.2)'; e.target.style.opacity = '1'; }}
                                onMouseOut={(e) => { e.target.style.transform = 'scale(1)'; e.target.style.opacity = '0.7'; }}
                            >
                                ☜
                            </button>
                        </div>
                    )}
                </div>

                {/* RIGHT PAGE (Text/Controls) */}
                <div
                    ref={pageContentRef}
                    style={{
                        flex: 1,
                        background: parchmentBackground,
                        backgroundBlendMode: 'multiply',

                        borderTopRightRadius: '2px',
                        borderBottomRightRadius: '2px',
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '50px 50px 60px 50px', // Wider margins
                        boxShadow: 'inset 20px 0 40px rgba(0,0,0,0.15)', // Symmetrical seamless fold shadow
                        overflow: 'hidden',
                        fontFamily: "'EB Garamond', serif",
                        color: '#1a0f0a', // Deep ink color
                        position: 'relative',
                        fontSize: '1.4rem', // Crisp size for EB Garamond
                        lineHeight: '1.5',
                        transformOrigin: 'left center',
                    }}
                >
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                    }}>
                        {/* Header: Sir Brante Style */}
                        <div style={{
                            margin: '0 0 30px 0',
                            borderBottom: '1px solid rgba(62, 39, 35, 0.3)', // Thin ink line
                            paddingBottom: '15px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexShrink: 0
                        }}>
                            <span style={{
                                fontSize: '1.2rem',
                                fontWeight: 'bold',
                                textTransform: 'uppercase',
                                letterSpacing: '3px',
                                color: '#3e2723',
                                fontFamily: "'Cinzel Decorative', serif"
                            }}>
                                {currentNode.data.label || 'Chapter'}
                            </span>
                            {pages.length > 1 && (
                                <span style={{ fontSize: '1.1rem', color: '#5d4037', fontStyle: 'italic', fontFamily: "'Great Vibes', cursive" }}>
                                    {currentPage + 1} <span style={{ opacity: 0.5 }}>/</span> {pages.length}
                                </span>
                            )}
                        </div>

                        {/* Content Text: Ink Reveal Animation */}
                        <div
                            key={`${currentNodeId}-${currentPage}`} // Trigger animation on new page
                            style={{
                                flex: 1,
                                width: '100%',
                                boxSizing: 'border-box',
                                overflow: 'hidden',
                                whiteSpace: 'pre-wrap',
                                overflowWrap: 'break-word',
                                wordBreak: 'normal',
                                textAlign: 'justify', // Book-like alignment
                                minWidth: 0,
                                minHeight: 0,
                                marginBottom: '40px',
                                textShadow: '0 0 1px rgba(62, 39, 35, 0.05)', // Calmer shadow
                                fontFamily: "'IM Fell English', serif",
                                fontSize: '1.45rem',
                                lineHeight: '1.4',
                                letterSpacing: '0.01em'
                            }}
                        >
                            {/* Use the updated TypewriterText component with ink reveal */}
                            <TypewriterText content={currentText} speed={15} />
                        </div>

                        {/* Footer Divider (Always visible) */}
                        <div style={{
                            marginTop: 'auto',
                            paddingTop: '20px',
                            borderTop: '1px solid rgba(62, 39, 35, 0.2)',
                            flexShrink: 0,
                            position: 'relative',
                            marginBottom: '40px',
                            minHeight: '20px' // Ensure it shows up even when empty
                        }}>
                            {/* Last Page Controls */}
                            {isLastPage && (
                                <React.Fragment>
                                    {currentNode.type === 'choice' && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            {currentNode.data.choices?.map((choice, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleChoice(idx)}
                                                    style={{
                                                        padding: '8px 20px',
                                                        background: 'transparent',
                                                        border: '1px solid rgba(62, 39, 35, 0.25)',
                                                        color: '#2a1810',
                                                        fontFamily: "'EB Garamond', serif",
                                                        fontSize: '1.3rem',
                                                        cursor: 'pointer',
                                                        textAlign: 'center', // Center choices like Sir Brante
                                                        borderRadius: '2px',
                                                        transition: 'all 0.3s ease',
                                                        position: 'relative',
                                                        overflow: 'hidden'
                                                    }}
                                                    onMouseOver={(e) => {
                                                        e.target.style.background = 'rgba(62, 39, 35, 0.08)';
                                                        e.target.style.borderColor = '#3e2723';
                                                        e.target.style.transform = 'scale(1.02)';
                                                    }}
                                                    onMouseOut={(e) => {
                                                        e.target.style.background = 'transparent';
                                                        e.target.style.borderColor = 'rgba(62, 39, 35, 0.25)';
                                                        e.target.style.transform = 'scale(1)';
                                                    }}
                                                >
                                                    <span style={{ marginRight: '10px', fontSize: '1.1rem', opacity: 0.7 }}>❖</span>
                                                    {choice.text}
                                                    <span style={{ marginLeft: '10px', fontSize: '1.1rem', opacity: 0.7 }}>❖</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {currentNode.type === 'dice' && (
                                        <div style={{ textAlign: 'center', padding: '10px 0' }}>
                                            <div style={{ marginBottom: '10px', fontStyle: 'italic', fontSize: '1.3rem', color: '#5d4037', fontFamily: "'EB Garamond', serif" }}>
                                                Attempting: <strong>{currentNode.data.variable || 'Stat'}</strong> (Difficulty: {currentNode.data.target})
                                            </div>
                                            {!diceResult ? (
                                                <button
                                                    onClick={handleRoll}
                                                    style={{
                                                        padding: '8px 25px',
                                                        background: '#3e2723',
                                                        color: '#fdf6e3',
                                                        border: '1px solid #2d1b0e', // refined border
                                                        fontFamily: "'Cinzel Decorative', serif",
                                                        fontSize: '1.1rem',
                                                        cursor: 'pointer',
                                                        borderRadius: '2px',
                                                        boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                                                    onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                                                >
                                                    Cast Die 🎲
                                                </button>
                                            ) : (
                                                <div style={{
                                                    animation: 'fadeIn 0.8s ease',
                                                    padding: '15px',
                                                    background: 'rgba(62, 39, 35, 0.05)',
                                                    borderRadius: '2px',
                                                    border: '1px solid rgba(62, 39, 35, 0.1)'
                                                }}>
                                                    <div style={{
                                                        fontSize: '3rem',
                                                        fontWeight: 'bold',
                                                        color: diceResult.success ? '#2e7d32' : '#c62828',
                                                        fontFamily: "'Cinzel Decorative', serif"
                                                    }}>
                                                        {diceResult.roll}
                                                    </div>
                                                    <div style={{ fontSize: '1.3rem', marginTop: '5px', fontFamily: "'EB Garamond', serif" }}>
                                                        Result: {diceResult.total} — {diceResult.success ? 'SUCCESS' : 'FAILURE'}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </React.Fragment>
                            )}
                        </div>
                    </div>

                    {/* NEXT Button - PERSISTENT UI */}
                    {showNextButton && (
                        <div style={{ position: 'absolute', bottom: '25px', right: '25px' }}>
                            <button
                                onClick={handleUnifiedNext}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#3e2723',
                                    fontSize: '2.5rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    opacity: 0.7
                                }}
                                onMouseOver={(e) => {
                                    e.target.style.transform = 'scale(1.2)';
                                    e.target.style.opacity = '1';
                                }}
                                onMouseOut={(e) => {
                                    e.target.style.transform = 'scale(1)';
                                    e.target.style.opacity = '0.7';
                                }}
                                title="Next Page"
                            >
                                ☞
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BookScene;
