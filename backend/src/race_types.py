from typing import TypedDict, List, Dict, Union
# 1. One Driver at One Moment
# We use single letters to keep the file size small (Optimization)
class DriverTelemetry(TypedDict):
    x: float  # X Coordinate (Normalized 0-10000)
    y: float  # Y Coordinate (Normalized 0-10000)
    s: int    # Speed (km/h)
    g: int    # Gear
    t: int    # Throttle (0-100)
    b: int    # Brake (0-100)
    r: int    # RPM

# Snapshot schema
# has a timestamp 't', and then any number of driver keys (e.g., "VER", "HAM")
# Since driver keys are dynamic, can't type them explicitly in TypedDict easily,
# just treat the rest as dynamic, or use a specific structure like below.
class RaceFrame(TypedDict, total=False): 
    t: float # Time in seconds 
    # The rest are dynamic keys: 'VER': DriverTelemetry, 'HAM': DriverTelemetry
    # thus can make them "optional" using total = False

# 3. The Root Object: The entire file
class RaceData(TypedDict):
    metadata: Dict[str, Union[str, int]] 
    track_map: List[List[float]] # List of [x, y] points to plot map once
    timeline: List[RaceFrame]