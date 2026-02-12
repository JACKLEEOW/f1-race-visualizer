
import json    
import os     
import fastf1  
import pandas as pd  
import numpy as np
from race_types import DriverTelemetry, RaceFrame, RaceData
from typing import List, Dict, Union, TypedDict, Any

fastf1.Cache.enable_cache('../cache') 

def load_session(year: int, location: str):
    session = fastf1.get_session(year, location, 'R')
    print(f"Loading session {year} {location} ...")
    session.load(laps = True,telemetry = True, weather = True, messages = False)
    return session

def create_coordinate_transformer(session: fastf1.Session):
    fastest_lap = session.laps.pick_fastest()
    ref_tel= fastest_lap.get_telemetry()
    x_min = ref_tel['X'].min()
    x_max = ref_tel('X').max()
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

    return transform_coords, track_map

def process_drivers(session, transformer):
    print("processing drivers now")
    drivers = [d for d in session.drivers if str(d).isdigit()]
    aligned_data = {}

    for driver in drivers:
        #get laps, change this from 5 laps after mvp is done
        try:
            laps = session.laps.pick_driver(driver)
            # if driver crashes lap 1, skip
            if len(laps) > 5:
                laps = laps[laps['LapNumber']<= 5]
            if laps.empty:
                continue
            #get telemetry
            tel = laps.get_telemetry()
            #resample to 200ms to match
            #resample('200ms') creates the bins, mean() averages data, ffill() fills gaps

            tel_resampled = tel.resample('200ms', on = 'Time').mean().ffill()
            tx,ty = transformer(tel_resampled['X'], tel_resampled['Y'])
            #save to df

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
    transformer, track_map = create_coordinate_transformer(session)

    aligned_data = process_drivers(session, transformer)

    #create master timeline
    all_indices = pd.Index([])
    for df in  aligned_data.values():
        all_indices = all_indices.union(df.index)
    all_indices = all_indices.sort_values()
    race_data: RaceData = {
    "metadata": { 
        "circuit": session.event.EventName, 
        "year": year 
    },
    "track_map": track_map,
    "timeline": []
    }

    for timestamp in all_indices:
        time_sec = round(timestamp.total_seconds(),2)
        frame: RaceFrame = {"t": time_sec}
        for driver, df in aligned_data.items():
            if timestamp in df.index:
                row = df.loc[timestamp]
                if row['Brake'] == True:
                    brake_val = 100
                else:
                    brake_val = 0
                frame[driver] = {
                    "x": round(row['X_norm'], 1), # Round for smaller JSON
                    "y": round(row['Y_norm'], 1),
                    "s": int(row['Speed']),
                    "g": int(row['nGear']),
                    "t": int(row['Throttle']),
                    "b": brake_val, 
                    "r": int(row['RPM'])
                }
        race_data['timeline'].append(frame)
            # 6. Save to File
    output_path = '../../../frontend/public/data/race.json'
    # Ensure directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    with open(output_path, 'w') as f:
        json.dump(race_data, f)
        
    print(f"Success! Data saved to {output_path}")



if __name__ == "__main__":
    generate_race_data(2023, 'Monaco')




