import React, { useState, useEffect, useRef } from 'react';

const TypewriterText = ({ content, speed = 20, onComplete }) => {
    const [displayedCount, setDisplayedCount] = useState(0);
    const [isComplete, setIsComplete] = useState(false);
    const indexRef = useRef(0);
    const timeoutRef = useRef(null);
    const contentIdRef = useRef(0);

    useEffect(() => {
        // Reset state when content changes
        setDisplayedCount(0);
        setIsComplete(false);
        indexRef.current = 0;
        contentIdRef.current++;

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        const typeNextChar = () => {
            if (indexRef.current < content.length) {
                indexRef.current++;
                setDisplayedCount(indexRef.current);

                // Randomize speed slightly for human feel
                const variance = Math.random() * 10 - 5;
                timeoutRef.current = setTimeout(typeNextChar, speed + variance);
            } else {
                setIsComplete(true);
                if (onComplete) onComplete();
            }
        };

        // Start typing
        timeoutRef.current = setTimeout(typeNextChar, speed);

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [content, speed, onComplete]);

    // Only render the characters that have been displayed
    const displayedText = content.slice(0, displayedCount);

    return (
        <div style={{
            whiteSpace: 'pre-wrap',
            overflowWrap: 'break-word',
            wordBreak: 'normal',
            width: '100%',
            color: 'inherit',
            fontFamily: 'inherit',
            fontSize: 'inherit',
            lineHeight: 'inherit'
        }}>
            {displayedText.split('').map((char, index) => (
                <span
                    key={`${contentIdRef.current}-${index}`}
                    className="ink-char"
                    style={{
                        display: 'inline',
                        color: 'inherit',
                        animationDelay: index === displayedCount - 1 ? '0ms' : 'none'
                    }}
                >
                    {char}
                </span>
            ))}
        </div>
    );
};

export default TypewriterText;
