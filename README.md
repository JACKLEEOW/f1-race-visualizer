# F1 Race Visualizer

An interactive, real-time Formula 1 race telemetry visualizer powered by the [FastF1](https://github.com/theOehrly/Fast-F1) Python library and a Next.js frontend. Watch any historical F1 race play out on a live track map, explore a dynamic leaderboard, and drill into per-driver telemetry charts — all synchronized to a master playback clock.

Here is a demo: https://drive.google.com/file/d/1dA5ZyXkiUnweEFkbRTfk_srt7o7GlR6f/view?usp=sharing

---

## Features

- **Live Track Map** — Animated SVG track rendered from actual GPS telemetry data, with glowing driver dots that move in real time at 200 ms resolution.
- **Dynamic Leaderboard** — Drivers ranked by true arc-distance driven (lap count × track length + current lap position), with accurate gap-to-leader labels in meters or laps.
- **Telemetry Charts** — Click any driver to view a 30-second sliding window of their speed trace, throttle/brake inputs, RPM, and gear selections.
- **Playback Controls** — Play/pause and a scrubber for seeking to any point in the race.
- **Real F1 Data** — Backend uses FastF1 to fetch official timing and telemetry from the F1 data API and resamples it into a compact 200 ms timeline.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| Animations | Framer Motion |
| Backend | Python 3, FastF1, Pandas, NumPy |

---

## Project Structure

```
f1-race-visualizer/
├── backend/
│   ├── src/
│   │   ├── generate_race_data.py   # Data pipeline: fetches, processes & exports race.json
│   │   └── race_types.py           # TypedDict schemas for the race data format
│   └── requirements.txt
└── frontend/
    ├── public/
    │   └── data/
    │       └── race.json           # Generated race data (output of the backend)
    └── src/
        ├── app/
        │   └── page.tsx            # Main app page & layout
        ├── components/
        │   ├── TrackMap.tsx        # SVG track + animated driver dots
        │   ├── Leaderboard.tsx     # Live standings panel
        │   ├── TelemetryCharts.tsx # Speed, inputs, RPM & gear charts
        │   ├── DriverDot.tsx       # Individual driver marker
        │   └── Scrubber.tsx        # Timeline seek bar
        ├── hooks/
        │   └── useRaceEngine.ts    # Master clock + race data loader
        ├── lib/
        │   ├── driverInfo.ts       # Driver color/abbreviation helpers
        │   └── findSliceIndex.ts   # Binary search for timeline lookup
        └── types/
            └── types.ts            # Shared TypeScript types
```

---

## Getting Started

### 1. Generate Race Data (Backend)

The backend fetches telemetry from the F1 API and writes `race.json` directly into the frontend's `public/data/` folder.

```bash
cd backend
pip install -r requirements.txt
python src/generate_race_data.py
```

By default this generates data for the **2021 Abu Dhabi Grand Prix**. To change the race, edit the last line of `generate_race_data.py`:

```python
# generate_race_data.py
if __name__ == "__main__":
    generate_race_data(2021, 'Abu Dhabi')  # <-- change year and location here
```

> **Note:** The first run will download and cache telemetry data from the F1 API inside `backend/cache/`. Subsequent runs for the same session are fast.

### 2. Run the Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. Soon will be hosted!!

---

## Data Format

The backend produces a single `race.json` file with the following structure:

```json
{
  "metadata": {
    "circuit": "Abu Dhabi Grand Prix",
    "year": 2021,
    "track_length": 5281.0
  },
  "drivers": {
    "1": { "abbr": "VER", "name": "Max Verstappen", "color": "#3671C6", "team": "Red Bull Racing" }
  },
  "laps": [
    { "lap": 1, "time": 0.0 }
  ],
  "track_map": [[500.0, 9500.0], ...],
  "timeline": [
    {
      "t": 0.0,
      "1": { "x": 500.0, "y": 9500.0, "s": 120, "g": 3, "t": 80, "b": 0, "r": 9500, "d": 0.0, "l": 1 }
    }
  ]
}
```

Each frame in `timeline` is sampled at **200 ms intervals**. Driver telemetry fields:

| Key | Description |
|-----|-------------|
| `x`, `y` | Normalized position (0–10000 SVG units) |
| `s` | Speed (km/h) |
| `g` | Gear (1–8) |
| `t` | Throttle (0–100%) |
| `b` | Brake (0 or 100) |
| `r` | Engine RPM |
| `d` | Distance into current lap (meters) |
| `l` | Current lap number |

---

## License

MIT
