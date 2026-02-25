// src/components/TrackMap.tsx
import React from 'react';
import DriverDot from './DriverDot';

interface TrackMapProps {
    trackMap: [number, number][];
    timeline: any[]; // Changed to expect the full timeline array
    currentTime: number; 
}

export default function TrackMap({ trackMap, timeline, currentTime }: TrackMapProps) {
    if (!trackMap || trackMap.length < 2 || !timeline || timeline.length === 0) return null;

    const pathString = trackMap.reduce((acc, point, index) => {
        const prefix = index === 0 ? 'M' : 'L';
        return `${acc} ${prefix} ${point[0]} ${point[1]}`;
    }, '') + ' Z';

    const [startX, startY] = trackMap[0];
    const [nextX, nextY] = trackMap[1];

    const dx = nextX - startX;
    const dy = nextY - startY;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    const perpX = -dy / length;
    const perpY = dx / length;

    const lineLength = 100; 
    const finishLineX1 = startX + (perpX * lineLength);
    const finishLineY1 = startY + (perpY * lineLength);
    const finishLineX2 = startX - (perpX * lineLength);
    const finishLineY2 = startY - (perpY * lineLength);

    // --- THE O(1) TIME SEARCH OPTIMIZATION ---
    // Instantly calculate the array index based on the 0.2s intervals
    const sliceIndex = Math.max(0, Math.floor(currentTime / 0.2));
    
    // Prevent errors when the race is over
    const safeIndex = Math.min(sliceIndex, timeline.length - 1);
    const activeSlice = timeline[safeIndex];

    // Grab Max Verstappen's data for this specific 0.2s slice
    const driverData = activeSlice ? activeSlice['1'] : null; 

    return (
        <div className="w-full aspect-square rounded-xl p-4 bg-[#0a0f1e] border border-[#1e3a5f] shadow-[0_0_40px_rgba(56,189,248,0.08)]">
            <svg viewBox="0 0 10000 10000" className="w-full h-full">
                <defs>
                    <filter id="trackGlow">
                        <feGaussianBlur stdDeviation="60" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                <path
                    d={pathString}
                    fill="none"
                    stroke="#0f172a"
                    strokeWidth="140"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                />

                <path
                    d={pathString}
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth="100"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                />

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
                
                {/* Send exact X/Y coords to the DriverDot */}
                {driverData && (
                    <DriverDot
                        x={driverData.x}
                        y={driverData.y}
                        color="#3671C6"
                    />
                )}
            </svg>
        </div>
    );
}