export interface DriverTelemetry {
    x: number; // x coordinate (0-10000)
    y: number; // y coordinate (0-10000)
    s: number; // speed (km/h)
    g: number; // gear
    t: number; // throttle (0-100)
    b: number; // brake (0-100)
    r: number; // rpm
}

export interface RaceFrame {
    t: number; // time (seconds)
    [driverId: string]: DriverTelemetry | number; // dynamic driver keys
}

export interface DriverRosterEntry {
    abbr:  string;  // e.g. "VER"
    name:  string;  // e.g. "Max Verstappen"
    color: string;  // e.g. "#3671C6"
    team:  string;  // e.g. "Red Bull Racing"
}

export interface RaceMetadata{
    circuit: string;
    year: number;
}

export interface RaceData {
    metadata:  RaceMetadata;
    drivers:   Record<string, DriverRosterEntry>;
    track_map: [number, number][];
    timeline:  RaceFrame[];
}