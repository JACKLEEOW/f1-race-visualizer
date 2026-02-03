
import json    
import os     
import fastf1  
import pandas as pd  
import numpy as np
from race_types import DriverTelemetry, RaceFrame, RaceData
from typing import List, Dict, Union, TypedDict, Any

fastf1.Cache.enable_cache('../cache') 

def load_session(year: int, location: str, session_type: str):
    session = fastf1.get_session(year, location, session_type)
    session.load()
    return session

def build_track_map(session: fastf1.Session):
    map_lap = session.laps.pick_fastest()
    #TO DO WE ARE SEPERATING GENERATE RACE DATA INTO SMALLER FUNCTIONS
    #must build map here


def generate_race_data(year: int, location: str):

    print("Constructing timeline...")
    session = load_session(year, location, 'R')
    #call build track map here




    race_data: RaceData = {
    "metadata": { 
        "circuit": session.event.EventName, 
        "year": year 
    },
    "track_map": [],
    "timeline": []
    }
    
    for timestamp in all_indices:
        time_sec = round(timestamp.total_seconds(), 2) # 
        frame = {"t" : time_sec}








