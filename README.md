# Factory Thingy

Current prototype now includes:

- **150x150 map** with zoom + pan controls
- Right-click **building inspector side menu**
- 3x3 Core hub with shared storage across all core tiles
- Core/factory/logistics systems from previous part
- Expanded systems/data for ammo types, liquid production, turrets, power buildings, enemies, waves, and quota rounds

## Run

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000`.

## Controls

- Left click: place selected building
- `R`: rotate **conveyors only**
- Eraser toggle: delete (core cannot be deleted)
- Right click: open side inspector for building info
- Mouse wheel: zoom in/out
- Middle mouse drag: pan around map
