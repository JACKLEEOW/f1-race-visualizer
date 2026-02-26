// src/components/Leaderboard.tsx
import React, { useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getAbbr, getName, getColor } from '../lib/driverInfo';
import { DriverRosterEntry } from '../types/types';

interface LeaderboardProps {
    activeSlice: any;
    drivers?: Record<string, DriverRosterEntry>;
    trackMap: [number, number][];
    trackLength: number; // real track length in meters
    selectedDriver: string | null; 
    onSelectDriver: (driverId: string | null) => void;
}

/**
 * Find the index of the nearest track-map point to (x, y).
 * The index represents how far around the track the position is:
 * 0 = start/finish, trackMap.length-1 = just before start/finish.
 */
function nearestTrackIndex(trackMap: [number, number][], x: number, y: number): number {
    let best = 0;
    let bestD2 = Infinity;
    for (let i = 0; i < trackMap.length; i++) {
        const dx = trackMap[i][0] - x;
        const dy = trackMap[i][1] - y;
        const d2 = dx * dx + dy * dy;
        if (d2 < bestD2) {
            bestD2 = d2;
            best = i;
        }
    }
    return best;
}

export default function Leaderboard({ activeSlice, drivers, trackMap, trackLength, selectedDriver, onSelectDriver }: LeaderboardProps) {
    // All hooks must be called unconditionally before any early returns.
    const arcData = useMemo(() => {
        if (!trackMap?.length) return { cumLen: [0], totalArc: 1, metersPerUnit: 1 };
        const cumLen = [0];
        for (let i = 1; i < trackMap.length; i++) {
            const dx = trackMap[i][0] - trackMap[i - 1][0];
            const dy = trackMap[i][1] - trackMap[i - 1][1];
            cumLen.push(cumLen[i - 1] + Math.sqrt(dx * dx + dy * dy));
        }
        const totalArc = cumLen[cumLen.length - 1];
        const metersPerUnit = trackLength / totalArc;
        return { cumLen, totalArc, metersPerUnit };
    }, [trackMap, trackLength]);

    const prevIdxRef = useRef<Record<string, number>>({});

    const N = trackMap?.length ?? 0;
    const driverKeys = activeSlice ? Object.keys(activeSlice).filter(k => k !== 't') : [];

    const rawIdx: Record<string, number> = {};
    if (activeSlice && N > 0) {
        for (const id of driverKeys) {
            const d = activeSlice[id];
            rawIdx[id] = nearestTrackIndex(trackMap, d.x, d.y);
        }
    }

    const prevIdx = prevIdxRef.current;
    const CROSS_HI = N * 0.85;
    const CROSS_LO = N * 0.15;

    const sortScore: Record<string, number> = {};
    const arcMeters: Record<string, number> = {};

    for (const id of driverKeys) {
        const lap = activeSlice[id].l || 0;
        const idx = rawIdx[id] ?? 0;

        // A crossing happened when the driver was near the track end last
        // frame and is now near the track start — definitive proof they
        // just crossed the finish line (not merely a lapped car at the
        // start of a new lap).
        const crossed =
            prevIdx[id] !== undefined &&
            prevIdx[id] > CROSS_HI &&
            idx < CROSS_LO;

        sortScore[id] = lap * N * 2 + (crossed ? N + idx : idx);
        arcMeters[id] = crossed
            ? (arcData.totalArc + arcData.cumLen[idx]) * arcData.metersPerUnit
            : arcData.cumLen[idx] * arcData.metersPerUnit;
    }

    // Save current positions for comparison on the next frame.
    useEffect(() => {
        prevIdxRef.current = { ...rawIdx };
    });

    if (!activeSlice || !N) return null;

    const sortedDrivers = [...driverKeys].sort((a, b) => sortScore[b] - sortScore[a]);

    const leaderId = sortedDrivers[0];
    const leaderLap = activeSlice[leaderId]?.l || 0;
    const leaderArc = arcMeters[leaderId] || 0;

    return (
        <div className="w-full h-full bg-[#0a0f1e] rounded-xl border border-[#1e3a5f] p-4 flex flex-col shadow-[0_0_40px_rgba(56,189,248,0.05)]">
            <h2 className="text-xl font-bold text-white mb-4 border-b border-[#1e3a5f] pb-2">
                Live Standings
            </h2>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                {sortedDrivers.map((driverId, index) => {
                    const isSelected = selectedDriver === driverId;
                    const driverData = activeSlice[driverId];
                    
                    const lapDiff = leaderLap - (driverData.l || 0);
                    const arcGap = leaderArc - arcMeters[driverId];

                    let gapLabel: string;
                    if (index === 0) {
                        gapLabel = '';
                    } else if (lapDiff > 0) {
                        gapLabel = `+${lapDiff} lap${lapDiff > 1 ? 's' : ''}`;
                    } else {
                        gapLabel = `-${Math.abs(Math.round(arcGap))}m`;
                    }

                    return (
                        <motion.button
                            key={driverId}
                            layout
                            transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 30
                            }}
                            onClick={() => onSelectDriver(selectedDriver === driverId ? null : driverId)}
                            className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors border ${
                                isSelected 
                                    ? 'bg-[#1e3a5f] border-blue-400 shadow-[0_0_15px_rgba(56,189,248,0.3)]' 
                                    : 'bg-[#0f172a] border-transparent hover:bg-[#1e293b]'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-gray-400 font-mono w-4">{index + 1}</span>
                                <span
                                    className="font-bold text-sm w-10 text-center py-0.5 rounded"
                                    style={{ backgroundColor: getColor(driverId, drivers), color: '#fff' }}
                                >
                                    {getAbbr(driverId, drivers)}
                                </span>
                                <span className="text-white text-sm">{getName(driverId, drivers)}</span>
                            </div>

                            <div className="text-right flex flex-col">
                                {index === 0 ? (
                                    <span className="text-purple-400 font-mono text-sm">Leader</span>
                                ) : (
                                    <span className="text-gray-400 font-mono text-sm">
                                        {gapLabel}
                                    </span>
                                )}
                                <span className="text-blue-300 font-mono text-xs">
                                    {driverData.s} km/h
                                </span>
                            </div>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}
