import { useRef } from 'react';
import {motion} from 'framer-motion'

export interface TelemetryPoint {
    time: number;
    x: number;
    y: number;
}

interface DriverDotProps {
    x: number;
    y: number;
    color: string;
    driverNumber: string;
    isSelected?: boolean;
    abbr?: string;
}

export default function DriverDot({ x, y, color, driverNumber, isSelected, abbr }: DriverDotProps) {
    if (x === undefined || y === undefined) return null;

    const goRight = x < 5000;
    const dir = goRight ? 1 : -1;
    const diagLen = 500;
    const horizLen = 700;
    const midX = dir * diagLen;
    const midY = -diagLen;
    const endX = midX + dir * horizLen;
    const endY = midY;

    return (
        <motion.g
            initial={{ x, y }}
            animate={{ x, y }}
            transition={{ duration: 0.4, ease: "linear" }} // change to 0.2 if data is too mismatched. 0.4 allows a better viewing
        > 
            {isSelected && abbr && (
                <>
                    <polyline
                        points={`0,0 ${midX},${midY} ${endX},${endY}`}
                        fill="none"
                        stroke="white"
                        strokeWidth="20"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.8"
                    />
                    <text
                        x={endX + dir * 60}
                        y={endY}
                        dominantBaseline="central"
                        textAnchor={goRight ? 'start' : 'end'}
                        fontSize="220"
                        fontWeight="bold"
                        fill="white"
                        opacity="0.9"
                        style={{ fontFamily: 'monospace', pointerEvents: 'none', userSelect: 'none' }}
                    >
                        {abbr}
                    </text>
                </>
            )}
            <circle r="60" fill={color} stroke="#0a0f1e" strokeWidth="15" />
            <text
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="70"
                fontWeight="bold"
                fill="white"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
                {driverNumber}
            </text>
        </motion.g>
    );
}
