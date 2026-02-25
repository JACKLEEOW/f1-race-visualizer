// src/components/TelemetryCharts.tsx
import React, { useMemo } from 'react';
import { getAbbr, getName } from '../lib/driverInfo';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ComposedChart
} from 'recharts';

import { DriverRosterEntry } from '../types/types';

interface TelemetryChartsProps {
    timeline: any[];
    drivers?: Record<string, DriverRosterEntry>;
    selectedDriver: string | null;
    currentTime: number;
}

export default function TelemetryCharts({ timeline, drivers, selectedDriver, currentTime }: TelemetryChartsProps) {
    // Transform the full timeline once — only re-runs when driver or data changes, not every frame
    const chartData = useMemo(() => {
        if (!timeline || !selectedDriver) return [];

        return timeline.map((slice) => {
            const driverData = slice[selectedDriver];
            return {
                time: slice.t,
                speed: driverData?.s || 0,
                throttle: driverData?.t || 0,
                brake: driverData?.b || 0,
                gear: driverData?.g || 0,
                rpm: driverData?.r || 0,
            };
        });
    }, [timeline, selectedDriver]);

    // Slice to only show data up to the current race time — chart "draws itself" as race progresses
    const visibleIndex = Math.min(Math.floor(currentTime / 0.2), chartData.length - 1);
    const visibleData = chartData.slice(0, visibleIndex + 1);

    if (!selectedDriver || chartData.length === 0) return null;

    return (
        <div className="w-full bg-[#0a0f1e] rounded-xl border border-[#1e3a5f] p-4 flex flex-col gap-4 shadow-[0_0_40px_rgba(56,189,248,0.05)]">
            <div className="flex justify-between items-end border-b border-[#1e3a5f] pb-2">
                <h2 className="text-xl font-bold text-white">
                    {getAbbr(selectedDriver, drivers)} — {getName(selectedDriver, drivers)}
                </h2>
                <span className="text-gray-400 font-mono text-sm">
                    Time: {currentTime.toFixed(1)}s
                </span>
            </div>

            {/* 1. SPEED TRACE */}
            <div className="h-40 w-full">
                <p className="text-xs text-[#38bdf8] mb-1 font-mono uppercase tracking-wider">Speed (km/h)</p>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={visibleData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="time" hide />
                        <YAxis domain={[0, 350]} stroke="#475569" fontSize={12} width={40} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e3a5f', borderRadius: '8px' }}
                            itemStyle={{ color: '#38bdf8', fontFamily: 'monospace' }}
                            labelStyle={{ display: 'none' }}
                        />
                        <Line type="monotone" dataKey="speed" stroke="#38bdf8" strokeWidth={2} dot={false} isAnimationActive={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* 2. THROTTLE AND BRAKE INPUTS */}
            <div className="h-28 w-full">
                <p className="text-xs text-[#4ade80] mb-1 font-mono uppercase tracking-wider">Inputs: Throttle & Brake (%)</p>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={visibleData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="time" hide />
                        <YAxis domain={[0, 100]} stroke="#475569" fontSize={12} width={40} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e3a5f', borderRadius: '8px' }}
                            itemStyle={{ fontFamily: 'monospace' }}
                            labelStyle={{ display: 'none' }}
                        />
                        <Area type="step" dataKey="throttle" stroke="#4ade80" fill="#4ade80" fillOpacity={0.3} isAnimationActive={false} />
                        <Area type="step" dataKey="brake" stroke="#f87171" fill="#f87171" fillOpacity={0.5} isAnimationActive={false} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* 3. ENGINE: RPM AND GEAR */}
            <div className="h-32 w-full">
                <div className="flex gap-4 mb-1">
                    <p className="text-xs text-[#c084fc] font-mono uppercase tracking-wider">RPM</p>
                    <p className="text-xs text-[#fcd34d] font-mono uppercase tracking-wider">Gear</p>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                    {/* We use a ComposedChart to combine a Line and a Step chart on two different axes */}
                    <ComposedChart data={visibleData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="time" hide />
                        
                        {/* Left Y-Axis for Engine RPM (0 - 15000) */}
                        <YAxis 
                            yAxisId="left" 
                            domain={[0, 15000]} 
                            stroke="#475569" 
                            fontSize={12} 
                            width={40} 
                            tickFormatter={(val) => `${val/1000}k`} // Formats 12000 to "12k"
                        />
                        
                        {/* Right Y-Axis for Gear (1 - 8) */}
                        <YAxis 
                            yAxisId="right" 
                            orientation="right" 
                            domain={[0, 9]} 
                            stroke="#475569" 
                            fontSize={12} 
                            width={20} 
                        />
                        
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e3a5f', borderRadius: '8px' }}
                            itemStyle={{ fontFamily: 'monospace' }}
                            labelStyle={{ display: 'none' }}
                        />
                        
                        {/* RPM Line */}
                        <Line yAxisId="left" type="monotone" dataKey="rpm" stroke="#c084fc" strokeWidth={2} dot={false} isAnimationActive={false} name="RPM" />
                        
                        {/* Gear Step Line */}
                        <Line yAxisId="right" type="stepAfter" dataKey="gear" stroke="#fcd34d" strokeWidth={2} dot={false} isAnimationActive={false} name="Gear" />
                        
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}