// src/components/Leaderboard.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { getAbbr, getName, getColor } from '../lib/driverInfo';
import { DriverRosterEntry } from '../types/types';

interface LeaderboardProps {
    activeSlice: any;
    drivers?: Record<string, DriverRosterEntry>;
    selectedDriver: string | null; 
    onSelectDriver: (driverId: string | null) => void;
}

export default function Leaderboard({ activeSlice, drivers, selectedDriver, onSelectDriver }: LeaderboardProps) {
    if (!activeSlice) return null;

    // 1. get drivers and sort them by distance 
    const sortedDrivers = Object.keys(activeSlice)
        .filter(key => key !== 't') 
        .sort((a, b) => {
            const distA = activeSlice[a].d || 0;
            const distB = activeSlice[b].d || 0;
            return distB - distA; 
        });

    // 2. Identify the leader to calculate intervals
    const leaderId = sortedDrivers[0];
    const leaderDistance = activeSlice[leaderId]?.d || 0;

    return (
        <div className="w-full h-full bg-[#0a0f1e] rounded-xl border border-[#1e3a5f] p-4 flex flex-col shadow-[0_0_40px_rgba(56,189,248,0.05)]">
            <h2 className="text-xl font-bold text-white mb-4 border-b border-[#1e3a5f] pb-2">
                Live Standings
            </h2>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                {sortedDrivers.map((driverId, index) => {
                    const isSelected = selectedDriver === driverId;
                    const driverData = activeSlice[driverId];
                    
                    const gapToLeader = leaderDistance - (driverData.d || 0);

                    return (
                        <motion.button
                            key={driverId}
                            // 'layout' tells Framer Motion to animate any changes in position
                            layout
                            // Adding a spring transition 
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
                                        -{gapToLeader.toFixed(0)}m
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