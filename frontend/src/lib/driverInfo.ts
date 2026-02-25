import { DriverRosterEntry } from '../types/types';

// Fallback map for when race.json predates the drivers field
const FALLBACK: Record<string, DriverRosterEntry> = {
    '1':  { abbr: 'VER', name: 'Max Verstappen',   color: '#3671C6', team: 'Red Bull Racing' },
    '11': { abbr: 'PER', name: 'Sergio Perez',      color: '#3671C6', team: 'Red Bull Racing' },
    '44': { abbr: 'HAM', name: 'Lewis Hamilton',    color: '#27F4D2', team: 'Mercedes' },
    '63': { abbr: 'RUS', name: 'George Russell',    color: '#27F4D2', team: 'Mercedes' },
    '16': { abbr: 'LEC', name: 'Charles Leclerc',   color: '#E8002D', team: 'Ferrari' },
    '55': { abbr: 'SAI', name: 'Carlos Sainz',      color: '#E8002D', team: 'Ferrari' },
    '14': { abbr: 'ALO', name: 'Fernando Alonso',   color: '#358C75', team: 'Aston Martin' },
    '18': { abbr: 'STR', name: 'Lance Stroll',      color: '#358C75', team: 'Aston Martin' },
    '4':  { abbr: 'NOR', name: 'Lando Norris',      color: '#FF8000', team: 'McLaren' },
    '81': { abbr: 'PIA', name: 'Oscar Piastri',     color: '#FF8000', team: 'McLaren' },
    '10': { abbr: 'GAS', name: 'Pierre Gasly',      color: '#FF87BC', team: 'Alpine' },
    '31': { abbr: 'OCO', name: 'Esteban Ocon',      color: '#FF87BC', team: 'Alpine' },
    '23': { abbr: 'ALB', name: 'Alexander Albon',   color: '#64C4FF', team: 'Williams' },
    '2':  { abbr: 'SAR', name: 'Logan Sargeant',    color: '#64C4FF', team: 'Williams' },
    '77': { abbr: 'BOT', name: 'Valtteri Bottas',   color: '#C92D4B', team: 'Alfa Romeo' },
    '24': { abbr: 'ZHO', name: 'Guanyu Zhou',       color: '#C92D4B', team: 'Alfa Romeo' },
    '20': { abbr: 'MAG', name: 'Kevin Magnussen',   color: '#B6BABD', team: 'Haas' },
    '27': { abbr: 'HUL', name: 'Nico Hulkenberg',   color: '#B6BABD', team: 'Haas' },
    '22': { abbr: 'TSU', name: 'Yuki Tsunoda',      color: '#5E8FAA', team: 'AlphaTauri' },
    '21': { abbr: 'DEV', name: 'Nyck de Vries',     color: '#5E8FAA', team: 'AlphaTauri' },
};

// Resolve a single driver, preferring dynamic race data over the fallback
function resolve(
    driverId: string,
    drivers?: Record<string, DriverRosterEntry>
): DriverRosterEntry {
    return drivers?.[driverId] ?? FALLBACK[driverId] ?? {
        abbr:  `#${driverId}`,
        name:  `Car ${driverId}`,
        color: '#ffffff',
        team:  'Unknown',
    };
}

export function getAbbr(driverId: string, drivers?: Record<string, DriverRosterEntry>): string {
    return resolve(driverId, drivers).abbr;
}

export function getName(driverId: string, drivers?: Record<string, DriverRosterEntry>): string {
    return resolve(driverId, drivers).name;
}

export function getColor(driverId: string, drivers?: Record<string, DriverRosterEntry>): string {
    return resolve(driverId, drivers).color;
}
