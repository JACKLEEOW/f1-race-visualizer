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
}

export default function DriverDot({ x, y, color, driverNumber }: DriverDotProps) {
    if (x === undefined || y === undefined) return null;

    return (
        <motion.g
            initial={{ x, y }}
            animate={{ x, y }}
            transition={{ duration: 0.2, ease: "linear" }}
        >
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
