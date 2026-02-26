
import json    
import os     
import fastf1  
import pandas as pd  
import numpy as np
from race_types import DriverTelemetry, RaceFrame, RaceData, DriverRosterEntry, LapMarker
from typing import List, Dict, Union, TypedDict, Any

cache_dir = './cache'

# Check if it exists, if not, create it
if not os.path.exists(cache_dir):
    os.makedirs(cache_dir)

fastf1.Cache.enable_cache(cache_dir) 


def load_session(year: int, location: str):
    session = fastf1.get_session(year, location, 'R')
    print(f"Loading session {year} {location} ...")
    session.load(laps = True,telemetry = True, weather = True, messages = False)
    return session

def create_coordinate_transformer(session: fastf1.Session):
    fastest_lap = session.laps.pick_fastest()
    ref_tel= fastest_lap.get_telemetry()
    x_min = ref_tel['X'].min()
    x_max = ref_tel['X'].max()
    y_min = ref_tel['Y'].min()
    y_max = ref_tel['Y'].max()
    max_range = max(x_max-x_min, y_max-y_min)

    scale = (10000 - 1000)/max_range

    

    def transform_coords(x,y):
        nx = ((x-x_min)* scale) +500
        ny = 10000 - (((y-y_min)*scale)+ 500)
        return nx,ny  

    #generate track
    track_x,track_y = transform_coords(ref_tel['X'], ref_tel['Y'])

    track_map = list(zip(
        track_x.iloc[::5].round(1).tolist(),
        track_y.iloc[::5].round(1).tolist()
    ))

    track_length = float(ref_tel['Distance'].max())

    return transform_coords, track_map, track_length

def build_lap_markers(session, driver_numbers: list) -> list:
    """Return lap start times using the driver with the most laps as reference."""
    best_driver = max(driver_numbers, key=lambda d: len(session.laps.pick_drivers(d)), default=None)
    if not best_driver:
        return []
    laps = session.laps.pick_drivers(best_driver)
    markers = []
    for _, lap in laps.iterrows():
        if pd.notna(lap['LapStartTime']):
            markers.append({
                'lap':  int(lap['LapNumber']),
                'time': round(lap['LapStartTime'].total_seconds(), 2),
            })
    return sorted(markers, key=lambda m: m['time'])

def build_driver_roster(session, driver_numbers: list) -> dict:
    roster = {}
    for number in driver_numbers:
        try:
            info = session.get_driver(number)
            color = info.get('TeamColor', 'ffffff')
            roster[str(number)] = {
                "abbr":  info.get('Abbreviation', str(number)),
                "name":  info.get('FullName', f'Driver {number}'),
                "color": f"#{color}" if not str(color).startswith('#') else str(color),
                "team":  info.get('TeamName', 'Unknown'),
            }
        except Exception as e:
            print(f"Could not get info for driver {number}: {e}")
    return roster

def process_drivers(session, transformer):
    print("processing drivers now")
    drivers = [d for d in session.drivers if str(d).isdigit()]
    aligned_data = {}

    for driver in drivers:
        #get laps, change this from 5 laps after mvp is done
        try:
            laps = session.laps.pick_drivers(driver)
            # if driver crashes lap 1, skip
            #if len(laps) > 5: #comment out for full race
            #    laps = laps[laps['LapNumber']<= 5] 
            if laps.empty:
                continue
            #get telemetry
            tel = laps.get_telemetry()
            needed_cols = ['Time', 'Speed', 'RPM', 'nGear', 'Throttle', 'Brake', 'X', 'Y', 'Z', 'Distance']
            tel = tel[needed_cols].copy()

            # Add lap number by merging laps' LapStartTime ranges onto telemetry
            lap_nums = []
            for _, lap in laps.iterrows():
                if pd.notna(lap['LapStartTime']) and pd.notna(lap['LapNumber']):
                    lap_nums.append((lap['LapStartTime'], int(lap['LapNumber'])))
            lap_nums.sort()
            def get_lap_num(t):
                lap = 1
                for start, num in lap_nums:
                    if t >= start:
                        lap = num
                    else:
                        break
                return lap
            tel['LapNum'] = tel['Time'].apply(get_lap_num)

            tel['Brake'] = tel['Brake'].astype(float)

            tel_resampled = tel.resample('200ms', on='Time').mean().ffill()
            # Lap number should be the most common (mode) in each bin, not mean
            tel_lap = tel.resample('200ms', on='Time')['LapNum'].median().ffill()
            tel_resampled['LapNum'] = tel_lap

            # Compute per-lap distance so positions are comparable between
            # drivers on the same lap (cumulative distance is skewed by pit
            # stop routing and different racing lines).
            lap_start_dist = {}
            for lap_num in sorted(tel_resampled['LapNum'].dropna().unique()):
                mask = tel_resampled['LapNum'] == lap_num
                lap_start_dist[lap_num] = tel_resampled.loc[mask, 'Distance'].iloc[0]

            tel_resampled['LapDistance'] = tel_resampled.apply(
                lambda row: row['Distance'] - lap_start_dist.get(row['LapNum'], 0)
                if pd.notna(row.get('LapNum')) else 0,
                axis=1,
            )

            tx,ty = transformer(tel_resampled['X'], tel_resampled['Y'])

            tel_resampled['X_norm']= tx
            tel_resampled['Y_norm']= ty

            aligned_data[driver] = tel_resampled
        except Exception as e:
            print(f"skipping driver{driver} : {e}")
            continue
    return aligned_data
    

 

def generate_race_data(year: int, location: str):

    print("Constructing timeline...")
    session = load_session(year, location)
    #call build track map here
    transformer, track_map, track_length = create_coordinate_transformer(session)

    aligned_data = process_drivers(session, transformer)
    driver_numbers = list(aligned_data.keys())
    drivers = build_driver_roster(session, driver_numbers)
    laps_raw = build_lap_markers(session, driver_numbers)

    #create master timeline
    all_indices = pd.Index([])
    for df in aligned_data.values():
        all_indices = all_indices.union(df.index)
    all_indices = all_indices.sort_values()

    # Normalize all times relative to the first telemetry timestamp so that
    # t=0 corresponds to the very first data point, and LapStartTimes are on
    # the same reference as the timeline entries.
    t0 = all_indices[0].total_seconds() if len(all_indices) > 0 else 0.0
    laps = [
        {'lap': m['lap'], 'time': round(m['time'] - t0, 2)}
        for m in laps_raw
        if m['time'] >= t0  # drop laps that start before telemetry (e.g. formation lap)
    ]

    race_data: RaceData = {
        "metadata": {
            "circuit": session.event.EventName,
            "year": year,
            "track_length": round(track_length, 1),
        },
        "drivers": drivers,
        "laps": laps,
        "track_map": track_map,
        "timeline": []
    }

    for timestamp in all_indices:
        time_sec = round(timestamp.total_seconds() - t0, 2)
        frame: RaceFrame = {"t": time_sec}
        for driver, df in aligned_data.items():
            if timestamp in df.index:
                row = df.loc[timestamp]
                if row['Brake'] > 0.5:
                    brake_val = 100
                else:
                    brake_val = 0
                frame[driver] = {
                    "x": round(row['X_norm'], 1),
                    "y": round(row['Y_norm'], 1),
                    "s": int(row['Speed']),
                    "g": int(row['nGear']),
                    "t": int(row['Throttle']),
                    "b": brake_val,
                    "r": int(row['RPM']),
                    "d": round(row['LapDistance'], 1),
                    "l": int(row['LapNum']) if pd.notna(row.get('LapNum')) else 0,
                }
        race_data['timeline'].append(frame)
    
    # Get the folder where script is located (backend/src)
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    
    project_root = os.path.abspath(os.path.join(script_dir, '../../'))
    
    # Build the safe absolute path to frontend
    output_path = os.path.join(project_root, 'frontend', 'public', 'data', 'race.json')

    print(f"Saving to absolute path: {output_path}") # Debug print to confirm location
    
    # Ensure directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    with open(output_path, 'w') as f:
        json.dump(race_data, f)
        
    print(f" Success! Data saved.")
        




if __name__ == "__main__":
    generate_race_data(2021, 'Abu Dhabi')




