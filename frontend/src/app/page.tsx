'use client';

import { useState } from 'react';
import { useRaceEngine } from '../hooks/useRaceEngine';
import TrackMap from '../components/TrackMap';
import Leaderboard from '../components/Leaderboard';
import TelemetryCharts from '@/components/TelemetryCharts';
import Scrubber from '../components/Scrubber';

export default function RaceVisualizer() {
    const { raceData, currentTime, setCurrentTime, isPlaying, setIsPlaying } = useRaceEngine();

    const totalDuration = raceData?.timeline.length
        ? raceData.timeline[raceData.timeline.length - 1].t
        : 0;

    function handleSeek(time: number) {
        setCurrentTime(Math.min(time, totalDuration));
    }
    
    // State to track the "Focus Driver"
    const [selectedDriver, setSelectedDriver] = useState<string | null>('1'); // Default to Car 1

    // Safely grab the current slice of time for the leaderboard
    const activeSlice = raceData?.timeline 
        ? raceData.timeline[Math.min(Math.max(0, Math.floor(currentTime / 0.2)), raceData.timeline.length - 1)] 
        : null;

    return (
        <div className="min-h-screen bg-[#020617] p-8 font-sans text-white">
            <div className="max-w-7xl mx-auto">
                
                {/* Header & Controls */}
                <div className="flex justify-between items-end mb-6">
                    <div>
                        <p className="text-[#38bdf8] text-sm font-mono uppercase tracking-widest mb-1">
                            {raceData ? `${raceData.metadata.year} Season` : 'Loading...'}
                        </p>
                        <h1 className="text-3xl font-bold mb-1">
                            {raceData ? raceData.metadata.circuit : 'F1 Telemetry Engine'}
                        </h1>
                        <p className="text-gray-400 text-sm">Master Clock: {currentTime.toFixed(3)}s</p>
                    </div>
                    
                    <button 
                        onClick={() => setIsPlaying(!isPlaying)}
                        className={`px-8 py-3 rounded-lg font-bold transition-colors ${
                            isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                    >
                        {isPlaying ? 'Pause' : 'Play'}
                    </button>
                </div>

                {/* Main 2-Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Left Column: Track Map (takes up 2/3 width) */}
                    <div className="lg:col-span-2">
                        {raceData && (
                            <TrackMap 
                                trackMap={raceData.track_map} 
                                timeline={raceData.timeline}
                                drivers={raceData.drivers}
                                selectedDriver={selectedDriver}
                                currentTime={currentTime}
                            />
                        )}
                        {raceData && (
                            <div className="mt-4">
                                <Scrubber
                                    currentTime={currentTime}
                                    totalDuration={totalDuration}
                                    onSeek={handleSeek}
                                />
                            </div>
                        )}
                        {raceData && (
                            <TelemetryCharts
                                timeline={raceData.timeline}
                                drivers={raceData.drivers}
                                selectedDriver={selectedDriver}
                                currentTime={currentTime}
                            />
                        )}
                    </div>

                    {/* Right Column: Dynamic Leaderboard (Takes up 1/3 width) */}
                    <div className="h-[calc(100vh-200px)] lg:h-auto"> 
                        <Leaderboard 
                            activeSlice={activeSlice}
                            drivers={raceData?.drivers}
                            trackMap={raceData?.track_map ?? []}
                            trackLength={raceData?.metadata.track_length ?? 5000}
                            selectedDriver={selectedDriver}
                            onSelectDriver={setSelectedDriver}
                        />
                    </div>

                </div>
            </div>
        </div>
    );
}