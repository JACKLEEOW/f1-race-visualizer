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
}




export default function DriverDot({x,y,color}: DriverDotProps) {
    if (x === undefined || y === undefined) return null;

    return (
        <motion.circle
            r="50"
            fill={color}
            stroke="#0a0f1e"
            strokeWidth="10"
            initial = {{cx: x, cy: y}}
            animate = {{cx: x, cy: y}}
            transition= {{
                duration: 0.4,
                ease: "linear"

            }}

        />
    );
}
