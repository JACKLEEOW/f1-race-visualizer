import { useRef } from 'react';

interface ScrubberProps {
    currentTime: number;
    totalDuration: number;
    onSeek: (time: number) => void;
}

function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function Scrubber({ currentTime, totalDuration, onSeek }: ScrubberProps) {
    const trackRef = useRef<HTMLDivElement>(null);

    const progress = totalDuration > 0 ? Math.min(currentTime / totalDuration, 1) : 0;

    function seekFromPointer(e: React.MouseEvent | React.TouchEvent) {
        if (!trackRef.current) return;
        const rect = trackRef.current.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        onSeek(ratio * totalDuration);
    }

    return (
        <div className="w-full bg-[#0a0f1e] rounded-xl border border-[#1e3a5f] px-6 py-4 shadow-[0_0_40px_rgba(56,189,248,0.05)]">

            {/* Time display */}
            <div className="flex justify-between text-xs font-mono text-gray-400 mb-3">
                <span className="text-[#38bdf8]">{formatTime(currentTime)}</span>
                <span>{formatTime(totalDuration)}</span>
            </div>

            {/* Scrubber track */}
            <div
                ref={trackRef}
                className="relative h-2 bg-[#1e293b] rounded-full cursor-pointer"
                onClick={seekFromPointer}
            >
                {/* Filled progress bar */}
                <div
                    className="absolute top-0 left-0 h-full bg-[#38bdf8] rounded-full pointer-events-none"
                    style={{ width: `${progress * 100}%` }}
                />

                {/* Draggable thumb */}
                <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full shadow pointer-events-none"
                    style={{ left: `${progress * 100}%` }}
                />
            </div>
        </div>
    );
}
