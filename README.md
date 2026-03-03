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

Then open `http://localhost:8000`.

## Controls

- Select building from the left panel and click map to place
- Press `R` to rotate
- Click **Eraser** to remove buildings (except Core)
- Click Sorter to set filter item id

## Notes

- Core storage now updates live and is used for placement costs.
- Buildings are only placed if Core has enough items for the listed cost.
- Upgrade costs and power/coolant requirements are represented in data planning but not yet enforced as machine-runtime constraints in this part.
