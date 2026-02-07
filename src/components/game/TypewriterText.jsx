import React, { useState, useEffect, useRef } from 'react';

const TypewriterText = ({ content, speed = 20, onComplete }) => {
    const [displayedContent, setDisplayedContent] = useState('');
    const [isComplete, setIsComplete] = useState(false);
    const indexRef = useRef(0);
    const timeoutRef = useRef(null);

    useEffect(() => {
        // Reset state when content changes
        setDisplayedContent('');
        setIsComplete(false);
        indexRef.current = 0;

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        const typeNextChar = () => {
            if (indexRef.current < content.length) {
                const char = content.charAt(indexRef.current);
                setDisplayedContent((prev) => prev + char);
                indexRef.current++;

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

    // Render with dangerousHTML or just text? 
    // The original code used just text/paragraphs. Keeping it simple for now.
    // However, to make it look like ink, we might want to wrap in spans eventually.
    // For now, let's just output the string.

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
            {content.split('').map((char, index) => (
                <span
                    key={index}
                    style={{
                        opacity: index < displayedContent.length ? 1 : 0,
                        filter: index < displayedContent.length ? 'blur(0px)' : 'blur(4px)',
                        transition: 'opacity 0.5s ease-out, filter 0.6s ease-out',
                        display: 'inline',
                        color: 'inherit'
                    }}
                >
                    {char}
                </span>
            ))}
        </div>
    );
};

export default TypewriterText;
