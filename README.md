# Factory Thingy (Part 1)

This is a browser-based prototype implementing all requested **Part 1** content:

- Basic buildings (Core, Miner, Conveyor, Router, Sorter, Chopper)
- Factory machines and recipes listed in the prompt
- Ore generation for Copper, Coal, Iron, Titanium, Thirite, and rare Orium
- Tick-based mechanics for extraction, routing, sorting, and factory crafting

## Run

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Controls

- Select building in the left panel, then click on the map to place.
- Press `R` to rotate building direction.
- Click **Eraser** to remove buildings.
- Click a **Sorter** after placing to set the filter item id.

## Mechanics

- **Miner** extracts ore from the deposit on the same tile at `1/sec` (base level).
- **Chopper** extracts wood from tree tiles at `1/sec` (base level).
- **Conveyor** moves one item per second from back to front.
- **Router** splits incoming items between front, left, and right.
- **Sorter** routes selected item forward; other items go left/right.
- **Core** stores incoming items in the inventory panel.
- **Factories** consume recipe inputs and produce outputs once per tick when inputs exist.

Some recipes reference intermediate resources not yet produced in Part 1 (like `steel` or `refined_carbon`), but the machines and their mechanics are fully wired in and will work when those inputs become available in future parts.
