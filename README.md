# Factory Thingy

Current prototype now includes:

- **150x150 map** with zoom + pan controls
- Right-click **building inspector side menu**
- Core/factory/logistics systems from previous part
- Expanded systems/data for ammo types, liquid production, turrets, power buildings, enemies, waves, and quota rounds
# Factory Thingy (Part 1)

Updated Part 1 implementation includes:

- Pre-placed permanent Core (cannot be deleted)
- Much larger map (48x30) with lower resource density
- Starting Core storage: `50 wood`, `50 copper`, `50 iron`
- Building placement costs for all basic + factory buildings from your spec
- Working mechanics for miner/chopper extraction, conveyor/router/sorter logistics, and factory recipes

## Run

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000`.

## Controls

- Left click: place selected building
- `R`: rotate direction
- Eraser toggle: delete (core cannot be deleted)
- Right click: open side inspector for building info
- Mouse wheel: zoom in/out
- Middle mouse drag: pan around map
