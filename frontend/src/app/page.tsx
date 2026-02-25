'use client';

import { useRaceEngine } from '../hooks/useRaceEngine';
import TrackMap from '../components/TrackMap';

export default function RaceVisualizer() {
    const { 
        raceData, 
        currentTime, 
        isPlaying, 
        setIsPlaying 
    } = useRaceEngine();

    return (
        
        <div className="p-8 font-sans">            
            {/* track map test */}
            {raceData && (
            <TrackMap
                trackMap={raceData.track_map}
                timeline={raceData.timeline}
                currentTime={currentTime}
            />
            )}
            
            <h1 className="text-3xl font-bold mb-4">F1 Race Engine Test</h1>
            
            {/* Status Panel */}
            <div className="p-4 bg-gray-100 rounded-lg mb-4">
                <p><strong>Data Status:</strong> {raceData ? `Loaded (${raceData.metadata.circuit})` : 'Loading...'}</p>
                <p><strong>Master Clock:</strong> {currentTime.toFixed(3)} seconds</p>
            </div>

            {/* Transport Controls */}
            <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className={`px-6 py-2 rounded font-bold text-white ${isPlaying ? 'bg-red-500' : 'bg-green-500'}`}
            >
                {isPlaying ? 'Pause' : 'Play'}
            </button>

        </div>
    );
}