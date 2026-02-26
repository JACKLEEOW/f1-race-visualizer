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

// Returns the index of the track map point closest to the given x,y coordinate.
// We compare squared distances (dx²+dy²) instead of real distances to avoid
// a sqrt call on every point since the comparison result is the same either way.
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
    // Pre-compute the cumulative arc length at each track map point.
    // The track map is in SVG coordinate units, but we want to express
    // gaps in real-world meters. We build a lookup table (cumLen[i] = total SVG
    // units from point 0 to point i), then derive a scale factor (metersPerUnit)
    // from the known real track length so we can convert any index to meters.
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

    // arcMeters[id] = total real-world meters driven by each driver since
    // the race start, used as a single score for sorting and gaps.
    // calculated as (completed laps × track length) + (meters into the current lap)
    const arcMeters: Record<string, number> = {};

    for (const id of driverKeys) {
        const d = activeSlice[id];

        // Find the closest point on the track centerline to the car's x,y.
        // This gives us a position that is independent of racing lines,
        // unlike d.d (the car's own odometer) which diverges between drivers
        // because of corner-cutting, different lines, pit entry routing, etc.
        const idx = nearestTrackIndex(trackMap, d.x, d.y);
        const lap = d.l ?? 0;
        const lapDist = d.d ?? 0;

        // geoFrac: where the car is on the track as a 0–1 fraction, based on
        // its x,y position projected onto the track map.
        const geoFrac = idx / N;
        // lapFrac: where the car's OWN odometer thinks it is within the lap,
        // also expressed as a 0–1 fraction.
        const lapFrac = trackLength > 0 ? lapDist / trackLength : 0;

        // Lap counter desync
        // The backend resamples telemetry into 200ms buckets. The lap number
        // (d.l) and the car's x,y position are both sourced from that same
        // resampled stream, but can disagree by one sample right at the
        // start/finish line crossing:
        //   - geoFrac low + lapFrac high → car's x,y already crossed the line
        //     but the lap counter hasn't incremented yet → bump lap up by 1.
        //   - geoFrac high + lapFrac low → lap counter incremented early before
        //     the car's position caught up → drop lap back by 1.
        let effectiveLap = lap;
        if (geoFrac < 0.15 && lapFrac > 0.85) {
            effectiveLap = lap + 1;
        } else if (geoFrac > 0.85 && lapFrac < 0.15) {
            effectiveLap = lap - 1;
        }

        // Convert the corrected lap + track position into a single meter score.
        // arcData.cumLen[idx] is the SVG-unit arc length to this track point;
        // multiplying by metersPerUnit converts it to real meters.
        arcMeters[id] = (effectiveLap * trackLength) + (arcData.cumLen[idx] * arcData.metersPerUnit);
    }

    // Sort descending highest total meters driven = furthest ahead in the race.
    const sortedDrivers = [...driverKeys].sort((a, b) => arcMeters[b] - arcMeters[a]);

    const leaderId = sortedDrivers[0];
    const leaderArc = arcMeters[leaderId] ?? 0;

    return (
        <div className="w-full h-full bg-[#0a0f1e] rounded-xl border border-[#1e3a5f] p-4 flex flex-col shadow-[0_0_40px_rgba(56,189,248,0.05)]">
            <h2 className="text-xl font-bold text-white mb-4 border-b border-[#1e3a5f] pb-2">
                Live Standings
            </h2>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                {sortedDrivers.map((driverId, index) => {
                    const isSelected = selectedDriver === driverId;
                    const driverData = activeSlice[driverId];
                    
                    // Gap to the leader in meters. If this exceeds one full
                    // track length, the driver is at least one lap behind.
                    const arcGap = leaderArc - (arcMeters[driverId] ?? 0);
                    const lapsDown = Math.floor(arcGap / trackLength);

                    let gapLabel: string;
                    if (index === 0) {
                        gapLabel = '';
                    } else if (lapsDown >= 1) {
                        gapLabel = `+${lapsDown} lap${lapsDown > 1 ? 's' : ''}`;
                    } else {
                        gapLabel = `-${Math.round(arcGap)}m`;
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