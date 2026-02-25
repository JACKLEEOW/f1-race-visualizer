// src/components/TrackMap.tsx
import React from 'react';

interface TrackMapProps {
    trackMap: [number, number][];
}

export default function TrackMap({ trackMap }: TrackMapProps) {
    if (!trackMap || trackMap.length < 2) return null;

    const pathString = trackMap.reduce((acc, point, index) => {
        const prefix = index === 0 ? 'M' : 'L';
        return `${acc} ${prefix} ${point[0]} ${point[1]}`;
    }, '') + ' Z';

    // 1. Get the first two points to determine track direction
    const [startX, startY] = trackMap[0];
    const [nextX, nextY] = trackMap[1];

    // 2. Calculate the perpendicular vector
    const dx = nextX - startX;
    const dy = nextY - startY;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    // Normalize and rotate 90 degrees
    const perpX = -dy / length;
    const perpY = dx / length;

    // 3. Stretch the line 100 units in both directions (Track width is 80)
    const lineLength = 100; 
    const finishLineX1 = startX + (perpX * lineLength);
    const finishLineY1 = startY + (perpY * lineLength);
    const finishLineX2 = startX - (perpX * lineLength);
    const finishLineY2 = startY - (perpY * lineLength);

    return (
        <div className="w-full aspect-square rounded-xl p-4 bg-[#0a0f1e] border border-[#1e3a5f] shadow-[0_0_40px_rgba(56,189,248,0.08)]">
            <svg viewBox="0 0 10000 10000" className="w-full h-full">
                <defs>
                    {/* Glow filter for the track */}
                    <filter id="trackGlow">
                        <feGaussianBlur stdDeviation="60" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Dark border/outline of the track */}
                <path
                    d={pathString}
                    fill="none"
                    stroke="#0f172a"
                    strokeWidth="140"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                />

                {/* Main track surface */}
                <path
                    d={pathString}
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth="100"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                />

                {/* Glowing center line */}
                <path
                    d={pathString}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="18"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    strokeDasharray="120 80"
                    filter="url(#trackGlow)"
                    opacity="0.9"
                />

                {/* Finish line */}
                <line
                    x1={finishLineX1}
                    y1={finishLineY1}
                    x2={finishLineX2}
                    y2={finishLineY2}
                    stroke="white"
                    strokeWidth="90"
                    strokeLinecap="round"
                    filter="url(#trackGlow)"
                />
            </svg>
        </div>
    );
}