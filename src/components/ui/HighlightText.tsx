import React from 'react';

interface HighlightTextProps {
    text?: string | null;
    highlight: string;
}

const HighlightText: React.FC<HighlightTextProps> = ({ text, highlight }) => {
    if (!text) return null;
    if (!highlight.trim()) return <>{text}</>;

    const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapeRegExp(highlight)})`, 'gi');
    const parts = text.split(regex);

    return (
        <>
            {parts.map((part, i) =>
                regex.test(part) ? (
                    <mark key={i} className="bg-yellow-200 text-yellow-900 rounded-sm px-0.5">
                        {part}
                    </mark>
                ) : (
                    <span key={i}>{part}</span>
                )
            )}
        </>
    );
};

export default HighlightText;
