
import json    
import os     
import fastf1  
import pandas as pd  
import numpy as np
from race_types import DriverTelemetry, RaceFrame, RaceData
from typing import List, Dict, Union, TypedDict, Any


def generate_race_data(year: int, location: str):

    print("Constructing timeline...")
    all_indices = pd.Index([])



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








