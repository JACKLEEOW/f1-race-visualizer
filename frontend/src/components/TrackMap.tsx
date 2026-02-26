// src/components/TrackMap.tsx
import React from 'react';
import DriverDot from './DriverDot';
import { getColor, getAbbr } from '../lib/driverInfo';
import { DriverRosterEntry } from '../types/types';

interface TrackMapProps {
    trackMap: [number, number][];
    timeline: any[];
    drivers?: Record<string, DriverRosterEntry>;
    selectedDriver?: string | null;
    currentTime: number;
}

export default function TrackMap({ trackMap, timeline, drivers, selectedDriver, currentTime }: TrackMapProps) {
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

    // Extract all driver keys from the active slice (everything except 't')
    const driverIds = activeSlice
        ? Object.keys(activeSlice).filter(k => k !== 't')
        : [];

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
                
                {/* Callout line for the selected driver only */}
                {selectedDriver && activeSlice?.[selectedDriver] && (() => {
                    const d = activeSlice[selectedDriver];
                    if (!d?.x || !d?.y) return null;

                    const cx = d.x;
                    const cy = d.y;

                    // Go right if car is in left half, left if in right half
                    const goRight = cx < 5000;
                    const dir = goRight ? 1 : -1;

                    // Diagonal segment: 45° upward away from the car
                    const diagLen = 500;
                    const midX = cx + dir * diagLen;
                    const midY = cy - diagLen;

                    // Horizontal segment extending outward
                    const horizLen = 700;
                    const endX = midX + dir * horizLen;
                    const endY = midY;

                    const abbr = getAbbr(selectedDriver, drivers);

                    return (
                        <g key="callout">
                            {/* Diagonal then horizontal line */}
                            <polyline
                                points={`${cx},${cy} ${midX},${midY} ${endX},${endY}`}
                                fill="none"
                                stroke="white"
                                strokeWidth="20"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                opacity="0.8"
                            />
                            {/* Driver abbreviation label at the end */}
                            <text
                                x={endX + dir * 60}
                                y={endY}
                                dominantBaseline="central"
                                textAnchor={goRight ? 'start' : 'end'}
                                fontSize="220"
                                fontWeight="bold"
                                fill="white"
                                opacity="0.9"
                                style={{ fontFamily: 'monospace' }}
                            >
                                {abbr}
                            </text>
                        </g>
                    );
                })()}

                {/* Render a dot for every driver in the current slice */}
                {driverIds.map(id => {
                    const d = activeSlice[id];
                    if (!d?.x || !d?.y) return null;
                    return (
                        <DriverDot
                            key={id}
                            x={d.x}
                            y={d.y}
                            color={getColor(id, drivers)}
                            driverNumber={getAbbr(id, drivers)}
                        />
                    );
                })}
            </svg>
        </div>
    );
}