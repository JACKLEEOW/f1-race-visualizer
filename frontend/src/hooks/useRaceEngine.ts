import { useState, useEffect } from 'react';
import { RaceData } from '../types/types';

export function useRaceEngine() {
    //hold race data or null while loading
    const [raceData, setRaceData] = useState<RaceData | null>(null);
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);

    //load race data from json 
    useEffect(() => {
        const fetchRaceData = async ()=> {
            try {
                const response = await fetch('/data/race.json');
                const data = await response.json();
                setRaceData(data as RaceData);
            }
            catch (error) {
                console.error('Error loading race data:', error);
            }
        }
        fetchRaceData();
    }, []);
    
    useEffect(() => {
        let animationFrameId: number;
        let lastUpdateTime = performance.now();
        const updateTimer = (currentPerformanceTime: number) => {
            const deltaTime = currentPerformanceTime - lastUpdateTime;
            // convert delta time to seconds
            const deltaTimeSec = deltaTime / 1000;

            // update current time
            setCurrentTime(prevTime => prevTime + deltaTimeSec);

            // reset time for next frame
            lastUpdateTime = currentPerformanceTime;

            animationFrameId = requestAnimationFrame(updateTimer);
        };
        if (isPlaying) {
            // when user hits play, initialize clock and start the loop
            lastUpdateTime = performance.now();
            animationFrameId = requestAnimationFrame(updateTimer);
        }
        return () => cancelAnimationFrame(animationFrameId);
    }, [isPlaying]);

    return { raceData, currentTime, isPlaying, setCurrentTime, setIsPlaying };
}
