import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import useStoryStore from '../../stores/useStoryStore';

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

    // Animation State
    const [isFlipping, setIsFlipping] = useState(false);
    const [flipDirection, setFlipDirection] = useState('next'); // 'next' or 'prev'

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
        setIsFlipping(false); // Reset flip state on node change
    }, [currentNodeId]);

    // Cleanup audio
    const audioRef = useRef(null);
    useEffect(() => {
        if (audioRef.current) {
            try {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            } catch (err) { }
            audioRef.current = null;
        }

        if (currentNode?.data?.sound) {
            try {
                const audio = new Audio(currentNode.data.sound);
                audio.loop = !!currentNode.data.loop;
                audioRef.current = audio;
                audio.play().catch(console.warn);
            } catch (err) {
                console.error(err);
            }
        }

        return () => {
            if (audioRef.current) {
                try {
                    audioRef.current.pause();
                } catch (e) { }
                audioRef.current = null;
            }
        };
    }, [currentNodeId, currentNode?.data?.sound, currentNode?.data?.loop]);

    const handlePagination = useCallback(() => {
        if (!currentNode || !currentNode.data.text || !textMeasureRef.current || !pageContentRef.current) return;

        const text = currentNode.data.text;
        const tokens = text.split(/(\s+)/);
        const newPages = [];
        let currentText = '';

        const containerHeight = pageContentRef.current.offsetHeight;
        // Reserve significant space at bottom for buttons (approx 150px-200px)
        // Increased buffer to 240px to prevent overlap with the footer divider
        const maxHeight = containerHeight - 240;

        const measureDiv = textMeasureRef.current;
        measureDiv.style.width = `${pageContentRef.current.clientWidth - 80}px`; // Match padding
        measureDiv.style.fontFamily = window.getComputedStyle(pageContentRef.current).fontFamily;
        measureDiv.style.fontSize = '1.4rem';
        measureDiv.style.lineHeight = '1.6';
        measureDiv.style.whiteSpace = 'pre-wrap';
        measureDiv.style.overflowWrap = 'anywhere';
        measureDiv.style.wordBreak = 'normal';
        measureDiv.style.textAlign = 'justify';

        measureDiv.innerHTML = '';

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];

            // 1. Try adding the full token to current page
            const testText = currentText + token;
            measureDiv.innerText = testText;

            if (measureDiv.offsetHeight <= maxHeight) {
                // Fits fine
                currentText = testText;
            } else {
                // Overflow!

                // If we have content, push it to a new page first
                if (currentText.length > 0) {
                    newPages.push(currentText);
                    currentText = '';
                }

                // Now check if the token fits on a FRESH page
                measureDiv.innerText = token;
                if (measureDiv.offsetHeight <= maxHeight) {
                    currentText = token;
                    continue;
                }

                // If not, the SINGLE token is too big for a page.
                // We must character-split this token.
                let remainingToken = token;

                while (remainingToken.length > 0) {
                    let low = 0;
                    let high = remainingToken.length;
                    let bestFitIndex = 0;

                    // Optimization: Check if remaining fits (unlikely for first iter)
                    measureDiv.innerText = remainingToken;
                    if (measureDiv.offsetHeight <= maxHeight) {
                        newPages.push(remainingToken);
                        remainingToken = '';
                        break;
                    }

                    // Binary search for max fit
                    while (low <= high) {
                        const mid = Math.floor((low + high) / 2);
                        if (mid === 0) { low = 1; continue; }

                        const sub = remainingToken.substring(0, mid);
                        measureDiv.innerText = sub;

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
                        // Fallback: Force 1 char if binary search fails (shouldn't happen)
                        newPages.push(remainingToken.substring(0, 1));
                        remainingToken = remainingToken.substring(1);
                    }
                }
            }
        }

        if (currentText) {
            newPages.push(currentText);
        }

        // Clean up pages
        const cleanedPages = newPages.filter(p => p.length > 0);
        setPages(cleanedPages.length > 0 ? cleanedPages : [text]);

        if (currentPage >= cleanedPages.length) {
            setCurrentPage(Math.max(0, cleanedPages.length - 1));
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
            setFlipDirection('next');
            setIsFlipping(true);
            setTimeout(() => {
                setCurrentPage(currentPage + 1);
                setIsFlipping(false);
            }, 600); // Wait for half the flip animation
        } else {
            // If Text Node, go to next node
            if (currentNode.type === 'text') {
                handleContinue();
            }
        }
    };

    const handleUnifiedPrev = () => {
        if (currentPage > 0) {
            setFlipDirection('prev');
            setIsFlipping(true);
            setTimeout(() => {
                setCurrentPage(currentPage - 1);
                setIsFlipping(false);
            }, 600);
        } else {
            // Go back to previous node
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

    return (
        <div style={{
            height: '100%',
            // Realistic Table Background
            background: `
                radial-gradient(circle at center, rgba(0,0,0,0.1), rgba(0,0,0,0.8)),
                repeating-linear-gradient(45deg, #2d1b0e 0, #2d1b0e 10px, #3e2723 10px, #3e2723 20px)
            `,
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
                    @keyframes inkReveal {
                        0% { opacity: 0; filter: blur(4px); transform: scale(0.995); }
                        100% { opacity: 1; filter: blur(0); transform: scale(1); }
                    }
                    @keyframes pageFlipNext {
                        0% { transform: rotateY(0deg); }
                        50% { transform: rotateY(-90deg); }
                        100% { transform: rotateY(0deg); }
                    }
                    @keyframes pageFlipPrev {
                        0% { transform: rotateY(0deg); }
                        50% { transform: rotateY(90deg); }
                        100% { transform: rotateY(0deg); }
                    }
                    .ink-text {
                        animation: inkReveal 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards;
                    }
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
                maxWidth: '1000px',
                height: '80vh',
                display: 'flex',
                boxShadow: '0 50px 70px -20px rgba(0,0,0,0.9), inset 0 0 100px rgba(0,0,0,0.5)', // Deep ambient occlusion
                borderRadius: '5px',
                padding: '10px 10px 10px 0', // Account for spine
                transformStyle: 'preserve-3d',
                transition: 'transform 0.6s ease',

                // Book Cover Texture (Edges)
                backgroundColor: '#3e2723',
                backgroundImage: 'linear-gradient(to right, #2d1b0e, #4e342e 5%, #2d1b0e 95%)',

                // Flip Animation
                animation: isFlipping ? (flipDirection === 'next' ? 'pageFlipNext 0.6s ease-in-out' : 'pageFlipPrev 0.6s ease-in-out') : 'none'
            }}>
                {/* SPINE */}
                <div style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '40px',
                    background: 'linear-gradient(to right, #1a0f0a, #3e2723 40%, #5d4037 50%, #3e2723 60%, #1a0f0a)',
                    boxShadow: 'inset 5px 0 15px rgba(0,0,0,0.8)',
                    zIndex: 2,
                    borderTopLeftRadius: '5px',
                    borderBottomLeftRadius: '5px'
                }} />

                {/* LEFT PAGE (Images/Mood) */}
                <div style={{
                    flex: 1,
                    // Aged Paper Texture
                    backgroundColor: '#fdf6e3',
                    backgroundImage: `
                        linear-gradient(to right, rgba(0,0,0,0.15), rgba(0,0,0,0) 20%),
                        url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.1'/%3E%3C/svg%3E")
                    `,
                    backgroundBlendMode: 'multiply',

                    marginLeft: '35px', // Sit next to spine
                    borderTopLeftRadius: '2px',
                    borderBottomLeftRadius: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                    boxShadow: 'inset -5px 0 10px rgba(0,0,0,0.05), 5px 0 15px rgba(0,0,0,0.1)', // Page curve shadow
                    overflow: 'hidden',
                    position: 'relative',
                    transformOrigin: 'right center'
                }}>
                    {currentNode.data.image ? (
                        <div style={{
                            padding: '10px',
                            background: '#fff',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                            transform: 'rotate(-2deg)' // Polaroid style tilt
                        }}>
                            <img
                                src={currentNode.data.image}
                                alt="Scene"
                                style={{
                                    width: '100%',
                                    height: 'auto',
                                    maxHeight: '100%',
                                    objectFit: 'contain',
                                    filter: 'sepia(0.3) contrast(1.1) brightness(0.9)',
                                    border: '1px solid rgba(0,0,0,0.1)'
                                }}
                            />
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', color: 'rgba(0,0,0,0.3)', fontFamily: "'IM Fell English', serif", fontSize: '2rem', fontStyle: 'italic', transform: 'rotate(-5deg)' }}>
                            ❧ {currentNode.data.label} ~
                        </div>
                    )}
                </div>

                {/* RIGHT PAGE (Text/Controls) */}
                <div
                    ref={pageContentRef}
                    style={{
                        flex: 1,
                        // Aged Paper Texture
                        backgroundColor: '#fdf6e3',
                        backgroundImage: `
                            linear-gradient(to left, rgba(0,0,0,0.15), rgba(0,0,0,0) 15%),
                            url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.1'/%3E%3C/svg%3E")
                        `,
                        backgroundBlendMode: 'multiply',

                        borderTopRightRadius: '2px',
                        borderBottomRightRadius: '2px',
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '40px 40px 60px 40px',
                        boxShadow: 'inset 5px 0 10px rgba(0,0,0,0.05), -5px 0 15px rgba(0,0,0,0.1)', // gutter shadow
                        overflow: 'hidden',
                        fontFamily: "'IM Fell English', serif",
                        color: '#2a2a2a', // Ink color
                        position: 'relative',
                        fontSize: '1.4rem',
                        lineHeight: '1.6',
                        transformOrigin: 'left center'
                    }}
                >
                    {/* Header: Handwritten style */}
                    <div style={{
                        margin: '0 0 20px 0',
                        borderBottom: '2px solid rgba(0,0,0,0.1)', // Ink line
                        paddingBottom: '10px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexShrink: 0
                    }}>
                        <span style={{ fontSize: '1rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px', color: '#5d4037', fontFamily: "'IM Fell English SC', serif" }}>
                            {currentNode.data.label || 'Chapter'}
                        </span>
                        {pages.length > 1 && (
                            <span style={{ fontSize: '0.9rem', opacity: 0.6, fontStyle: 'italic', fontFamily: "'IM Fell English', serif" }}>
                                {currentPage + 1} / {pages.length}
                            </span>
                        )}
                    </div>

                    {/* Content Text: Ink Reveal Animation */}
                    <div
                        key={`${currentNodeId}-${currentPage}`} // Trigger animation on new page
                        className="ink-text"
                        style={{
                            flex: 1,
                            overflow: 'hidden',
                            whiteSpace: 'pre-wrap',
                            overflowWrap: 'anywhere',
                            wordBreak: 'normal',
                            textAlign: 'justify',
                            minWidth: 0,
                            minHeight: 0,
                            marginBottom: '20px',
                            textShadow: '0 0 1px rgba(0,0,0,0.1)' // Slight ink bleed
                        }}
                    >
                        {currentText}
                    </div>

                    {/* Footer: Divider & Controls */}
                    <div style={{ marginTop: 'auto', paddingTop: '15px', borderTop: '2px solid rgba(0,0,0,0.15)', flexShrink: 0 }}>

                        {/* NEXT Button */}
                        {showNextButton && (
                            <div style={{ textAlign: 'center' }}>
                                <button
                                    onClick={handleUnifiedNext}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#3e2723',
                                        fontFamily: "'IM Fell English SC', serif",
                                        fontSize: '1.3rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        margin: '0 auto',
                                        padding: '10px',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseOver={(e) => { e.target.style.transform = 'scale(1.05)'; e.target.style.color = '#5d4037'; }}
                                    onMouseOut={(e) => { e.target.style.transform = 'scale(1)'; e.target.style.color = '#3e2723'; }}
                                >
                                    Next ➜
                                </button>
                            </div>
                        )}

                        {/* Last Page Controls */}
                        {isLastPage && (
                            <React.Fragment>
                                {currentNode.type === 'choice' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {currentNode.data.choices?.map((choice, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleChoice(idx)}
                                                style={{
                                                    padding: '12px 15px',
                                                    background: 'rgba(62, 39, 35, 0.05)',
                                                    border: '1px solid rgba(62, 39, 35, 0.2)',
                                                    color: '#2a2a2a',
                                                    fontFamily: "'IM Fell English', serif",
                                                    fontSize: '1.1rem',
                                                    cursor: 'pointer',
                                                    textAlign: 'left',
                                                    borderRadius: '2px', // Rough paper cut
                                                    transition: 'all 0.2s',
                                                    boxShadow: '2px 2px 5px rgba(0,0,0,0.05)'
                                                }}
                                                onMouseOver={(e) => { e.target.style.background = 'rgba(62, 39, 35, 0.1)'; e.target.style.transform = 'translateX(5px)'; }}
                                                onMouseOut={(e) => { e.target.style.background = 'rgba(62, 39, 35, 0.05)'; e.target.style.transform = 'translateX(0)'; }}
                                            >
                                                ➤ {choice.text}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {currentNode.type === 'dice' && (
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ marginBottom: '10px', fontStyle: 'italic', fontSize: '1.1rem', color: '#5d4037' }}>
                                            Checking <strong>{currentNode.data.variable || 'Stat'}</strong> (Target: {currentNode.data.target})
                                        </div>
                                        {!diceResult ? (
                                            <button
                                                onClick={handleRoll}
                                                style={{
                                                    padding: '10px 25px',
                                                    background: '#3e2723',
                                                    color: '#fdf6e3',
                                                    border: '2px solid #2d1b0e',
                                                    fontFamily: "'IM Fell English SC', serif",
                                                    fontSize: '1.2rem',
                                                    cursor: 'pointer',
                                                    borderRadius: '4px',
                                                    boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                                                }}
                                            >
                                                Roll the Dice 🎲
                                            </button>
                                        ) : (
                                            <div style={{ animation: 'fadeIn 0.5s', padding: '10px', background: 'rgba(0,0,0,0.05)', borderRadius: '4px' }}>
                                                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: diceResult.success ? '#2e7d32' : '#c62828' }}>
                                                    {diceResult.roll}
                                                </div>
                                                <div style={{ fontSize: '1rem' }}>Total: {diceResult.total} ({diceResult.success ? 'SUCCESS' : 'FAILURE'})</div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </React.Fragment>
                        )}
                    </div>

                    {/* PREV Button - Fixed Position */}
                    {showPrevButton && (
                        <div style={{ position: 'absolute', bottom: '15px', left: '20px', opacity: 0.6 }}>
                            <button
                                onClick={handleUnifiedPrev}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '1.2rem',
                                    color: '#3e2723',
                                    transition: 'transform 0.2s'
                                }}
                                title="Previous"
                                onMouseOver={(e) => e.target.style.transform = 'translateX(-2px)'}
                                onMouseOut={(e) => e.target.style.transform = 'translateX(0)'}
                            >
                                ⬅
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BookScene;
