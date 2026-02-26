import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { getAbbr, getName, getColor } from '../lib/driverInfo';
import { DriverRosterEntry } from '../types/types';

interface LeaderboardProps {
    activeSlice: any;
    drivers?: Record<string, DriverRosterEntry>;
    trackMap: [number, number][];
    trackLength: number; 
    selectedDriver: string | null; 
    onSelectDriver: (driverId: string | null) => void;
}
/* TODO LEADERBOARD STILL OCCASIONALLY BUGS BUT WORKS FOR CURRENT USECASE*/
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

    const N = trackMap?.length ?? 0;
    const driverKeys = activeSlice ? Object.keys(activeSlice).filter(k => k !== 't') : [];

    if (!activeSlice || !N) return null;

    const sortScore: Record<string, number> = {};
    const arcMeters: Record<string, number> = {};

    for (const id of driverKeys) {
        const d = activeSlice[id];
        const idx = nearestTrackIndex(trackMap, d.x, d.y);
        
        // 1. python Lap Number
        const lap = d.l || 0; 
        
        // 2. geometric progress: 0.00 to 0.99
        const frac = idx / N;
        
        // 3. sorting score 
        sortScore[id] = lap + frac;
        
        // 4. calculate total meters driven for perfect physical gaps
        arcMeters[id] = (lap * trackLength) + (arcData.cumLen[idx] * arcData.metersPerUnit);
    }

    // Sort descending by score
    const sortedDrivers = [...driverKeys].sort((a, b) => sortScore[b] - sortScore[a]);
    
    const leaderId = sortedDrivers[0];
    const leaderScore = sortScore[leaderId];
    const leaderArc = arcMeters[leaderId];

    return (
        <div className="w-full h-full bg-[#0a0f1e] rounded-xl border border-[#1e3a5f] p-4 flex flex-col shadow-[0_0_40px_rgba(56,189,248,0.05)]">
            <h2 className="text-xl font-bold text-white mb-4 border-b border-[#1e3a5f] pb-2">
                Live Standings
            </h2>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                {sortedDrivers.map((driverId, index) => {
                    const isSelected = selectedDriver === driverId;
                    const driverData = activeSlice[driverId];
                    
                    const scoreDiff = leaderScore - sortScore[driverId];
                    const arcGap = leaderArc - arcMeters[driverId];

                    let gapLabel: string;
                    if (index === 0) {
                        gapLabel = '';
                    } else if (scoreDiff >= 1.0) {
                        // If the score difference is > 1, they are officially lapped
                        const lapsDown = Math.floor(scoreDiff);
                        gapLabel = `+${lapsDown} lap${lapsDown > 1 ? 's' : ''}`;
                    } else {
                        // otherwise, display the exact geometric meter gap
                        gapLabel = `-${Math.abs(Math.round(arcGap))}m`;
                    }

                    return (
                        <motion.button
                            key={driverId}
                            layout
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
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