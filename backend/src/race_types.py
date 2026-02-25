from typing import TypedDict, List, Dict, Union

class DriverTelemetry(TypedDict):
    x: float  # X Coordinate (Normalized 0-10000)
    y: float  # Y Coordinate (Normalized 0-10000)
    s: int    # Speed (km/h)
    g: int    # Gear
    t: int    # Throttle (0-100)
    b: int    # Brake (0-100)
    r: int    # RPM
    d: float  # Distance travelled (meters)

class DriverRosterEntry(TypedDict):
    abbr:  str   # e.g. "VER"
    name:  str   # e.g. "Max Verstappen"
    color: str   # e.g. "#3671C6"
    team:  str   # e.g. "Red Bull Racing"

class RaceFrame(TypedDict, total=False):
    t: float  # Time in seconds
    # dynamic driver keys: '1': DriverTelemetry, '44': DriverTelemetry, ...

class RaceData(TypedDict):
    metadata:  Dict[str, Union[str, int]]
    drivers:   Dict[str, DriverRosterEntry]   # driver_number -> info
    track_map: List[List[float]]
    timeline:  List[RaceFrame]