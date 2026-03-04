const W = 150;
const H = 150;
const BASE_TILE = 18;
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const dirs = ['up', 'right', 'down', 'left'];
const vec = { up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0] };
const opposite = (d) => dirs[(dirs.indexOf(d) + 2) % 4];
const turnLeft = (d) => dirs[(dirs.indexOf(d) + 3) % 4];
const turnRight = (d) => dirs[(dirs.indexOf(d) + 1) % 4];
const key = (x, y) => `${x},${y}`;
const inside = (x, y) => x >= 0 && y >= 0 && x < W && y < H;

const oreTypes = {
  copper: { color: '#c27648', label: 'Copper' }, coal: { color: '#111', label: 'Coal' },
  iron: { color: '#8e98a7', label: 'Iron' }, titanium: { color: '#4f74ff', label: 'Titanium' },
  thirite: { color: '#ff58c8', label: 'Thirite' }, orium: { color: '#60ff8f', label: 'Orium (Rare)' },
};

const recipes = {
  plank_builder: { in: { wood: 2 }, out: { plank: 1 } }, graphite_compressor: { in: { coal: 1, iron: 1 }, out: { graphite: 2 } },
  wire_creator: { in: { copper: 1, iron: 1 }, out: { wire: 4 } }, cog_maker: { in: { iron: 3, copper: 2 }, out: { cog: 3 } },
  plate_press: { in: { iron: 2 }, out: { iron_plate: 2 } }, rod_extruder: { in: { iron: 1 }, out: { rod: 2 } },
  pipe_assembler: { in: { rod: 2 }, out: { pipe: 1 } }, frame_constructor: { in: { iron_plate: 4, rod: 2 }, out: { frame: 1 }, power: 80 },
  circuit_printer: { in: { wire: 2, graphite: 1 }, out: { circuit: 1 }, power: 90 },
  reinforced_plank_builder: { in: { plank: 2, iron_plate: 1 }, out: { reinforced_plank: 1 } },
  industrial_cog_press: { in: { steel: 3, cog: 2 }, out: { heavy_cog: 2 }, power: 150 },
  battery_maker: { in: { graphite: 1, copper: 1 }, out: { battery: 1 }, power: 110 },
  motor_assembler: { in: { cog: 2, wire: 2 }, out: { motor: 1 }, power: 120 },
  fuel_processor: { in: { coal: 2, refined_carbon: 1 }, out: { fuel_block: 1 }, power: 130 },
  titanium_frame_builder: { in: { titanium: 2, steel: 2 }, out: { light_frame: 1 }, power: 180 },
  microchip_fabricator: { in: { circuit: 2, graphite: 1 }, out: { microchip: 1 }, power: 180 },
  servo_builder: { in: { motor: 1, circuit: 1 }, out: { servo: 1 }, power: 160 },
  cooling_unit_assembler: { in: { pipe: 2, titanium: 1 }, out: { cooling_unit: 1 }, power: 120 },
  reactor_core_press: { in: { fuel_block: 2, light_frame: 1 }, out: { reactor_core: 1 }, power: 220 },
  power_cell_factory: { in: { battery: 2, microchip: 1 }, out: { power_cell: 1 }, power: 180 },
  composite_forge: { in: { titanium: 1, steel: 1 }, out: { composite_alloy: 1 }, power: 180 },
  thirite_stabilizer: { in: { thirite: 2, titanium: 1 }, out: { stabilized_crystal: 1 }, power: 220 },
  orium_infuser: { in: { orium: 1, power_cell: 1 }, out: { orium_core: 1 }, power: 260 },
  quantum_assembler: { in: { orium_core: 1, microchip: 1, composite_alloy: 1 }, out: { quantum_core: 1 }, power: 360 },

  water_pump: { in: {}, out: { water: 1 }, liquidOnly: 'water_tile' },
  cryofluid_mixer: { in: { water: 2, graphite: 1 }, out: { cryofluid: 1 }, power: 80 },
  oil_extractor: { in: {}, out: { oil: 1 }, liquidOnly: 'oil_tile' },
  lava_pump: { in: {}, out: { lava: 1 }, power: 160 },
  copper_ammo_factory: { in: { copper: 1 }, out: { copper_ammo: 5 } },
  cog_ammo_factory: { in: { cog: 1 }, out: { cog_ammo: 3 } },
  graphite_ammo_factory: { in: { graphite: 1 }, out: { graphite_ammo: 3 } },
  coal_ammo_factory: { in: { coal: 1 }, out: { coal_ammo: 3 } },
};

const turrets = {
  solo: { hp: 40, range: 10, attack: 0.5, dmg: 4, bullets: 1, ammo: true, cost: { iron_plate: 3, plank: 2 } },
  duo: { hp: 60, range: 10, attack: 0.5, dmg: 4, bullets: 2, ammo: true, cost: { iron_plate: 5, cog: 3, plank: 2 } },
  trio: { hp: 80, range: 11, attack: 0.3, dmg: 5, bullets: 3, ammo: true, cost: { iron_plate: 8, cog: 5, motor: 2 } },
  burst_rifle: { hp: 80, range: 12, attack: 2, dmg: 8, burst: [5, 0.1], ammo: true, cost: { iron_plate: 10, motor: 3, circuit: 2 } },
  shotgun: { hp: 90, range: 7, attack: 1.8, dmg: 5, pellets: 15, ammo: true, cost: { iron_plate: 6, reinforced_plank: 3, cog: 2 } },
  sniper: { hp: 70, range: 22, attack: 3, dmg: 15, ammo: true, cost: { steel: 6, circuit: 2, motor: 1 } },
  burner: { hp: 85, range: 8, attack: 0.1, dmg: 2, ammoOnly: 'coal_ammo', cost: { steel: 5, pipe: 4, fuel_block: 2 } },
  zapper: { hp: 80, range: 12, attack: 1.5, dmg: 4, chain: 3, energy: 120, cost: { circuit: 6, motor: 3, wire: 4 } },
  missile_pod: { hp: 120, range: 16, attack: 2, dmg: 7, missiles: 4, coolant: true, cost: { heavy_cog: 5, motor: 3, power_cell: 2, cooling_unit: 2 } },
  chiller: { hp: 90, range: 10, attack: 0.2, dmg: 0, liquid: true, cost: { pipe: 5, cooling_unit: 3, steel: 4 } },
};

const powerBuildings = {
  power_node: { cost: { cog: 1, iron_plate: 1, iron: 3 }, range: 6, links: 5 },
  large_power_node: { cost: { cog: 4, circuit: 2, iron: 8 }, range: 10, links: 15 },
  combustion_generator: { cost: { iron_plate: 4, pipe: 2 }, gen: 15, fuel: { coal: 1 } },
  steam_generator: { cost: { pipe: 4, carbon: 5, titanium: 8 }, gen: 50, fuel: { coal: 1, water: 1 } },
  differential_generator: { cost: { circuit: 8, pipe: 6, motor: 3, reinforced_cog: 5 }, gen: 250, fuel: { fuel_block: 1, cryofluid: 1 } },
  large_battery: { cost: { circuit: 3, battery: 2, iron_plate: 4 }, capacity: 5000 },
  xl_battery: { cost: { circuit: 8, battery: 10, iron_plate: 12 }, capacity: 50000 },
};

const enemyTypes = {
  basic_drone: { hp: 25, speed: 1, shot: 0.5, dmg: 3 },
  bruiser: { hp: 45, speed: 0.6, shot: 1, dmg: 6 },
  swarmer: { hp: 10, speed: 1.7, shot: 0.2, dmg: 2 },
  igniter: { hp: 30, speed: 1.1, shot: 0.8, dmg: 4, burn: true },
};

const buildings = [
  'miner','conveyor','router','sorter','chopper',
  ...Object.keys(recipes), ...Object.keys(turrets), ...Object.keys(powerBuildings),
];

const buildingCosts = {
  miner: { iron: 10, copper: 5 }, conveyor: { iron: 1 }, router: { iron: 2, copper: 1 }, sorter: { iron_plate: 2, wire: 2 }, chopper: { iron: 8, wood: 4 },
  plank_builder: { iron: 4, wood: 4 }, graphite_compressor: { iron: 8, iron_plate: 2 }, wire_creator: { iron: 6, copper: 4 }, cog_maker: { iron: 8, copper: 4, plank: 2 },
  plate_press: { iron: 12, cog: 2 }, rod_extruder: { iron: 8, cog: 1 }, pipe_assembler: { iron_plate: 6, rod: 2 }, frame_constructor: { iron_plate: 10, rod: 4, cog: 2 },
  circuit_printer: { wire: 6, graphite: 2, iron_plate: 2 }, reinforced_plank_builder: { iron_plate: 4, plank: 4 }, industrial_cog_press: { steel: 6, cog: 4, frame: 1 },
  battery_maker: { graphite: 4, copper: 4, iron_plate: 2 }, motor_assembler: { cog: 4, wire: 4, frame: 1 }, fuel_processor: { steel: 4, graphite: 2 },
  titanium_frame_builder: { titanium: 6, steel: 4, frame: 2 }, microchip_fabricator: { circuit: 6, graphite: 4, frame: 1 }, servo_builder: { motor: 4, circuit: 4, frame: 1 },
  cooling_unit_assembler: { pipe: 4, titanium: 4, steel: 2 }, reactor_core_press: { steel: 6, light_frame: 2, power_cell: 2 }, power_cell_factory: { battery: 4, microchip: 2, frame: 1 },
  composite_forge: { titanium: 4, steel: 4, frame: 1 }, thirite_stabilizer: { steel: 6, titanium: 2, microchip: 1 }, orium_infuser: { light_frame: 4, power_cell: 2, servo: 1 },
  quantum_assembler: { composite_alloy: 6, orium_core: 2, microchip: 2, reactor_core: 1 },
  water_pump: { pipe: 3, iron: 5 }, cryofluid_mixer: { pipe: 3, iron_plate: 2 }, oil_extractor: { pipe: 5, steel: 3, motor: 2 }, lava_pump: { light_frame: 3, steel: 5, cooling_unit: 2 },
  copper_ammo_factory: { iron: 4, wire: 2 }, cog_ammo_factory: { iron: 4, cog: 1 }, graphite_ammo_factory: { iron: 4, graphite: 1 }, coal_ammo_factory: { iron: 4, coal: 2 },
  ...Object.fromEntries(Object.entries(turrets).map(([k, v]) => [k, v.cost])),
  ...Object.fromEntries(Object.entries(powerBuildings).map(([k, v]) => [k, v.cost])),
};

const state = {
  selected: 'miner', rotation: 'right', erase: false,
  grid: Array.from({ length: H }, () => Array.from({ length: W }, () => null)),
  deposits: new Map(), trees: new Set(), liquids: new Map(),
  viewport: { zoom: 1, offX: W / 2 - 20, offY: H / 2 - 15 },
  power: { generation: 0, demand: 0, balance: 0, stored: 0, capacity: 0 },
  enemies: [], wave: 0, waveTimer: 600, quotaRound: 1,
  quota: { copper: 1000, iron: 300, cog: 200 },
  inspector: null,
};

function makeBuilding(type, dir) {
  return { type, dir, level: 1, queue: [], storage: {}, roundRobin: 0, selectedItem: 'iron', hp: turrets[type]?.hp || 100, cooldown: 0, burstLeft: 0, powerLevel: 0 };
}

const corePos = { x: Math.floor(W / 2), y: Math.floor(H / 2) };
const CORE_RADIUS = 1; // 3x3 core area

function isCoreTile(x, y) {
  return Math.abs(x - corePos.x) <= CORE_RADIUS && Math.abs(y - corePos.y) <= CORE_RADIUS;
}

for (let y = corePos.y - CORE_RADIUS; y <= corePos.y + CORE_RADIUS; y += 1) {
  for (let x = corePos.x - CORE_RADIUS; x <= corePos.x + CORE_RADIUS; x += 1) {
    state.grid[y][x] = makeBuilding('core', 'right');
  }
}
state.coreStorage = { wood: 50, copper: 50, iron: 50, coal: 50 };

function getB(x, y) { return inside(x, y) ? state.grid[y][x] : null; }
const coreStorage = () => state.coreStorage;
function addItem(store, item, qty = 1) { store[item] = (store[item] || 0) + qty; }
function hasResources(store, needs) { return Object.entries(needs || {}).every(([k, v]) => (store[k] || 0) >= v); }
function spendResources(store, needs) { Object.entries(needs || {}).forEach(([k, v]) => { store[k] -= v; }); }

function generateMap() {
  const addDep = (type, count) => { let p = 0; while (p < count) { const x = Math.floor(Math.random() * W); const y = Math.floor(Math.random() * H); const k = key(x, y); if (isCoreTile(x, y) || state.deposits.has(k)) continue; state.deposits.set(k, type); p += 1; } };
  addDep('copper', 500); addDep('coal', 450); addDep('iron', 550); addDep('titanium', 300); addDep('thirite', 180); addDep('orium', 80);
  let t = 0; while (t < 900) { const x = Math.floor(Math.random() * W); const y = Math.floor(Math.random() * H); const k = key(x, y); if (isCoreTile(x, y) || state.deposits.has(k) || state.trees.has(k)) continue; state.trees.add(k); t += 1; }
  let water = 0; while (water < 400) { const x = Math.floor(Math.random() * W); const y = Math.floor(Math.random() * H); const k = key(x, y); if (state.liquids.has(k)) continue; state.liquids.set(k, 'water_tile'); water += 1; }
  let oil = 0; while (oil < 220) { const x = Math.floor(Math.random() * W); const y = Math.floor(Math.random() * H); const k = key(x, y); if (state.liquids.has(k)) continue; state.liquids.set(k, 'oil_tile'); oil += 1; }
  let lava = 0; while (lava < 120) { const x = Math.floor(Math.random() * W); const y = Math.floor(Math.random() * H); const k = key(x, y); if (state.liquids.has(k)) continue; state.liquids.set(k, 'lava_tile'); lava += 1; }
}
generateMap();

function canDirectExportFromStorage(b) {
  return b && (b.type === 'miner' || b.type === 'chopper');
}

function pullFromOutput(x, y) {
  const b = getB(x, y); if (!b) return null;
  if (b.queue.length) return b.queue.shift();

  // Prevent factories from leaking their input buffers.
  if (!canDirectExportFromStorage(b)) return null;

  for (const [item, qty] of Object.entries(b.storage || {})) {
    if (qty > 0) { b.storage[item] -= 1; return item; }
  }
  return null;
}
function pushTo(b, item) { if (!b) return false; if (b.type === 'core') { addItem(state.coreStorage, item, 1); return true; } b.queue.push(item); return true; }
function outputsTo(source, sx, sy, tx, ty) {
  if (!source || source.type === 'core') return false;
  if (source.type === 'conveyor') { const [dx, dy] = vec[source.dir]; return sx + dx === tx && sy + dy === ty; }
  if (source.type === 'router' || source.type === 'sorter') return [source.dir, turnLeft(source.dir), turnRight(source.dir)].some((d) => { const [dx, dy] = vec[d]; return sx + dx === tx && sy + dy === ty; });
  return Math.abs(sx - tx) + Math.abs(sy - ty) === 1;
}
function getConveyorInputCandidates(x, y, dir) {
  const [bx, by] = vec[opposite(dir)];
  const primary = [x + bx, y + by];
  const list = [primary, [x, y - 1], [x + 1, y], [x, y + 1], [x - 1, y]];
  const uniq = []; const seen = new Set();
  for (const p of list) { const k = `${p[0]},${p[1]}`; if (!seen.has(k)) { seen.add(k); uniq.push(p); } }
  return uniq;
}

function setMessage(m) { document.getElementById('message').textContent = m; }
function costLabel(type) { const c = buildingCosts[type]; return c ? Object.entries(c).map(([k, v]) => `${v} ${k}`).join(', ') : 'Free'; }

function canPlaceOnTile(type, x, y) {
  const liq = state.liquids.get(key(x, y));
  if (isCoreTile(x, y)) return false;
  if (type === 'water_pump') return liq === 'water_tile';
  if (type === 'oil_extractor') return liq === 'oil_tile';
  if (type === 'lava_pump') return liq === 'lava_tile';
  return true;
}

function place(x, y) {
  if (!inside(x, y)) return;
  if (isCoreTile(x, y)) return setMessage('Core is permanent and cannot be edited.');
  if (state.erase) { state.grid[y][x] = null; return; }
  if (!canPlaceOnTile(state.selected, x, y)) return setMessage('This building must be placed on its required liquid tile.');
  const c = { storage: coreStorage() }; const cost = buildingCosts[state.selected];
  if (!hasResources(c.storage, cost)) return setMessage(`Not enough resources: ${costLabel(state.selected)}`);
  spendResources(c.storage, cost);
  state.grid[y][x] = makeBuilding(state.selected, state.rotation);
}

function openInspector(x, y) {
  const b = getB(x, y);
  const panel = document.getElementById('inspector');
  if (!b) { panel.classList.add('hidden'); state.inspector = null; return; }
  state.inspector = { x, y };
  panel.classList.remove('hidden');
  document.getElementById('inspector-title').textContent = `${b.type} @ ${x},${y}`;
  let text = `HP: ${Math.round(b.hp)}\n`;
  if (recipes[b.type]) {
    const r = recipes[b.type];
    text += `Produces: ${Object.entries(r.out).map(([k,v])=>`${v} ${k}`).join(', ')}\nRate: 1 cycle/sec\n`;
    const missing = Object.entries(r.in).filter(([k,v]) => (b.storage[k]||0) < v).map(([k,v])=>`${k} (${b.storage[k]||0}/${v})`);
    text += `Needs materials: ${missing.length ? missing.join(', ') : 'No'}\n`;
    if (r.power) text += `Power: ${b.powerLevel}/${r.power}W\nLow power: ${b.powerLevel < r.power ? 'YES' : 'No'}\n`;
  }
  if (b.type === 'miner') text += 'Produces: ore from deposit\nRate: 1/sec\n';
  if (b.type === 'chopper') text += 'Produces: wood\nRate: 1/sec\n';
  if (turrets[b.type]) {
    const t = turrets[b.type];
    text += `Turret DMG: ${t.dmg || 0}  Attack every: ${t.attack}s  Range: ${t.range}\n`;
    text += `Ammo needed: ${t.ammo ? 'Yes' : (t.ammoOnly || 'No')}\n`;
    if (t.energy) text += `Power: ${b.powerLevel}/${t.energy}W\n`;
    if (t.coolant) text += `Needs coolant in storage\n`;
  }
  if (powerBuildings[b.type]) {
    const p = powerBuildings[b.type];
    text += `Power output: ${p.gen || 0}W/sec\nBattery cap: ${p.capacity || 0}\n`;
  }
  if (b.type === 'core') {
    text += `Stored items: ${Object.entries(state.coreStorage).map(([k,v])=>`${k}:${Math.floor(v)}`).join(', ') || 'none'}\n`;
  } else {
    text += `Stored items: ${Object.entries(b.storage).map(([k,v])=>`${k}:${v}`).join(', ') || 'none'}\n`;
  }
  document.getElementById('inspector-body').textContent = text;
}

function worldFromScreen(cx, cy) {
  const t = BASE_TILE * state.viewport.zoom;
  const x = Math.floor(state.viewport.offX + cx / t);
  const y = Math.floor(state.viewport.offY + cy / t);
  return [x, y];
}

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const [x, y] = worldFromScreen(e.clientX - rect.left, e.clientY - rect.top);
  const ex = getB(x, y);
  if (ex?.type === 'sorter') {
    const value = prompt('Sorter filter item id:', ex.selectedItem);
    if (value) ex.selectedItem = value.trim();
    return;
  }
  place(x, y);
});
canvas.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const [x, y] = worldFromScreen(e.clientX - rect.left, e.clientY - rect.top);
  openInspector(x, y);
});
window.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'r') {
    state.rotation = dirs[(dirs.indexOf(state.rotation) + 1) % 4];
    document.getElementById('rotation').textContent = `Direction: ${state.rotation}`;
  }
});

let dragging = false; let last = null;
canvas.addEventListener('mousedown', (e) => { if (e.button === 1) { dragging = true; last = [e.clientX, e.clientY]; e.preventDefault(); } });
window.addEventListener('mouseup', () => { dragging = false; });
window.addEventListener('mousemove', (e) => {
  if (!dragging) return;
  const t = BASE_TILE * state.viewport.zoom;
  state.viewport.offX -= (e.clientX - last[0]) / t;
  state.viewport.offY -= (e.clientY - last[1]) / t;
  last = [e.clientX, e.clientY];
});
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const old = state.viewport.zoom;
  state.viewport.zoom = Math.max(0.4, Math.min(2.8, old * (e.deltaY > 0 ? 0.9 : 1.1)));
});

document.getElementById('erase').addEventListener('click', (e) => {
  state.erase = !state.erase; e.currentTarget.classList.toggle('active', state.erase);
});
document.getElementById('find-core').addEventListener('click', () => {
  state.viewport.offX = corePos.x - (canvas.width / (BASE_TILE * state.viewport.zoom)) / 2;
  state.viewport.offY = corePos.y - (canvas.height / (BASE_TILE * state.viewport.zoom)) / 2;
  setMessage('Centered camera on Core.');
});


function nearestEnemy(x, y, range) {
  let best = null; let dBest = Infinity;
  for (const en of state.enemies) {
    const d = Math.hypot(en.x - x, en.y - y);
    if (d <= range && d < dBest) { dBest = d; best = en; }
  }
  return best;
}

function consumeAnyAmmo(storage) {
  for (const k of ['copper_ammo', 'cog_ammo', 'graphite_ammo', 'coal_ammo']) {
    if ((storage[k] || 0) > 0) { storage[k] -= 1; return k; }
  }
  return null;
}
function ammoBonus(ammo, target) {
  if (ammo === 'copper_ammo') return 2;
  if (ammo === 'cog_ammo') { target._bounce = true; return 4; }
  if (ammo === 'graphite_ammo') return 3;
  if (ammo === 'coal_ammo') { target.burn = Math.max(target.burn || 0, 2); return 4; }
  return 0;
}

function powerStep() {
  const p = state.power;
  p.generation = 0; p.demand = 0; p.capacity = 0;
  for (let y = 0; y < H; y += 1) for (let x = 0; x < W; x += 1) {
    const b = getB(x, y); if (!b) continue;
    if (powerBuildings[b.type]?.gen && hasResources(b.storage, powerBuildings[b.type].fuel || {})) {
      spendResources(b.storage, powerBuildings[b.type].fuel || {});
      p.generation += powerBuildings[b.type].gen;
    }
    if (powerBuildings[b.type]?.capacity) p.capacity += powerBuildings[b.type].capacity;
    const need = recipes[b.type]?.power || turrets[b.type]?.energy || 0;
    p.demand += need;
  }
  p.stored = Math.max(0, Math.min(p.capacity, p.stored + p.generation - p.demand));
  p.balance = p.generation - p.demand;
  let available = p.generation + p.stored;
  for (let y = 0; y < H; y += 1) for (let x = 0; x < W; x += 1) {
    const b = getB(x, y); if (!b) continue;
    const need = recipes[b.type]?.power || turrets[b.type]?.energy || 0;
    if (!need) { b.powerLevel = 0; continue; }
    const grant = Math.min(need, Math.max(0, available));
    b.powerLevel = grant; available -= grant;
  }
}

let prodAcc = 0; let enemyAcc = 0;
function simulate(dt = 0.2) {
  prodAcc += dt; enemyAcc += dt; state.waveTimer -= dt;
  if (state.waveTimer <= 0) {
    state.wave += 1; state.waveTimer = 120;
    const count = 4 + state.wave * 2;
    const pool = ['basic_drone', 'swarmer', ...(state.wave > 2 ? ['bruiser'] : []), ...(state.wave > 4 ? ['igniter'] : [])];
    for (let i = 0; i < count; i += 1) {
      const type = pool[Math.floor(Math.random() * pool.length)];
      const side = Math.floor(Math.random() * 4);
      const x = side === 0 ? 0 : side === 1 ? W - 1 : Math.floor(Math.random() * W);
      const y = side === 2 ? 0 : side === 3 ? H - 1 : Math.floor(Math.random() * H);
      state.enemies.push({ type, x, y, hp: enemyTypes[type].hp, cooldown: 0, burn: 0, slow: 0, freeze: 0 });
    }
    if (state.wave % 5 === 0) {
      state.quotaRound += 1;
      state.quota = { copper: 1000 * state.quotaRound, iron: 300 * state.quotaRound, cog: 200 * state.quotaRound };
    }
  }

  for (let y = 0; y < H; y += 1) for (let x = 0; x < W; x += 1) {
    const b = getB(x, y); if (!b) continue;
    while (b.queue.length) addItem(b.storage, b.queue.shift(), 1);
  }

  powerStep();

  if (prodAcc >= 1) {
    prodAcc = 0;
    for (let y = 0; y < H; y += 1) for (let x = 0; x < W; x += 1) {
      const b = getB(x, y); if (!b) continue;
      if (b.type === 'miner') { const dep = state.deposits.get(key(x, y)); if (dep) b.queue.push(dep); }
      else if (b.type === 'chopper') { if (state.trees.has(key(x, y))) b.queue.push('wood'); }
      else if (recipes[b.type]) {
        const r = recipes[b.type];
        const liquidReqOk = !r.liquidOnly || state.liquids.get(key(x, y)) === r.liquidOnly;
        const powerOk = !r.power || b.powerLevel >= r.power;
        if (liquidReqOk && powerOk && hasResources(b.storage, r.in)) {
          spendResources(b.storage, r.in);
          Object.entries(r.out).forEach(([i, q]) => { for (let n = 0; n < q; n += 1) b.queue.push(i); });
        }
      }
    }
  }

  for (let y = 0; y < H; y += 1) for (let x = 0; x < W; x += 1) {
    const b = getB(x, y); if (!b) continue;
    if (b.type === 'conveyor') {
      const [fx, fy] = vec[b.dir];
      let item = null;
      for (const [sx, sy] of getConveyorInputCandidates(x, y, b.dir)) {
        const src = getB(sx, sy); if (!outputsTo(src, sx, sy, x, y)) continue;
        item = pullFromOutput(sx, sy); if (item) break;
      }
      if (item) { const t = getB(x + fx, y + fy); if (!pushTo(t, item)) addItem(b.storage, item); }
    } else if (b.type === 'router') {
      const [bx, by] = vec[opposite(b.dir)]; const item = pullFromOutput(x + bx, y + by); if (!item) continue;
      const outs = [b.dir, turnLeft(b.dir), turnRight(b.dir)];
      for (let i = 0; i < outs.length; i += 1) { const d = outs[(b.roundRobin + i) % outs.length]; const [dx, dy] = vec[d]; if (pushTo(getB(x + dx, y + dy), item)) { b.roundRobin = (b.roundRobin + 1) % outs.length; break; } }
    } else if (b.type === 'sorter') {
      const [bx, by] = vec[opposite(b.dir)]; const item = pullFromOutput(x + bx, y + by); if (!item) continue;
      const pref = item === b.selectedItem ? [b.dir] : [turnLeft(b.dir), turnRight(b.dir)];
      for (const d of pref) { const [dx, dy] = vec[d]; if (pushTo(getB(x + dx, y + dy), item)) break; }
    }
  }

  for (let y = 0; y < H; y += 1) for (let x = 0; x < W; x += 1) {
    const b = getB(x, y); if (!b || !turrets[b.type]) continue;
    b.cooldown -= dt;
    const t = turrets[b.type];
    if (b.cooldown > 0) continue;
    if (t.energy && b.powerLevel < t.energy) continue;
    if (t.coolant && (b.storage.cryofluid || 0) <= 0) continue;
    const target = nearestEnemy(x, y, t.range); if (!target) continue;

    let shots = t.bullets || 1;
    let damage = t.dmg || 0;
    if (t.pellets) { shots = t.pellets; damage = t.dmg; }

    for (let i = 0; i < shots; i += 1) {
      if (t.ammoOnly) { if ((b.storage[t.ammoOnly] || 0) <= 0) break; b.storage[t.ammoOnly] -= 1; }
      if (t.ammo) {
        const ammo = consumeAnyAmmo(b.storage);
        if (!ammo) break;
        target.hp -= damage + ammoBonus(ammo, target);
      } else {
        target.hp -= damage;
      }
      if (b.type === 'chiller') {
        const liquid = ['water', 'cryofluid', 'oil', 'lava'].find((k) => (b.storage[k] || 0) > 0);
        if (liquid) {
          b.storage[liquid] -= 1;
          if (liquid === 'water') target.slow = 2;
          if (liquid === 'cryofluid') target.freeze = 0.8;
          if (liquid === 'oil') target.oily = 4;
          if (liquid === 'lava') target.burn = Math.max(target.burn || 0, 6);
        }
      }
    }

    if (target._bounce) {
      target._bounce = false;
      const second = nearestEnemy(target.x, target.y, 4);
      if (second && second !== target) second.hp -= 4;
    }
    if (t.chain) {
      let source = target;
      for (let j = 0; j < t.chain; j += 1) {
        const next = state.enemies.find((e) => e !== source && Math.hypot(e.x - source.x, e.y - source.y) < 4);
        if (!next) break;
        next.hp -= Math.max(2, (t.dmg || 0) - 1);
        source = next;
      }
    }

    b.cooldown = t.attack;
  }

  if (enemyAcc >= 0.2) {
    enemyAcc = 0;
    for (const e of state.enemies) {
      const et = enemyTypes[e.type];
      if (e.burn > 0) { e.hp -= 0.4; e.burn -= 0.2; }
      if (e.freeze > 0) { e.freeze -= 0.2; continue; }
      const speed = et.speed * (e.slow > 0 ? 0.6 : 1);
      if (e.slow > 0) e.slow -= 0.2;
      const dx = Math.sign(corePos.x - e.x); const dy = Math.sign(corePos.y - e.y);
      if (Math.abs(corePos.x - e.x) > Math.abs(corePos.y - e.y)) e.x += dx * speed * 0.2;
      else e.y += dy * speed * 0.2;

      e.cooldown -= 0.2;
      if (e.cooldown <= 0) {
        let nearest = null; let best = Infinity;
        for (let y = Math.max(0, Math.floor(e.y) - 2); y <= Math.min(H - 1, Math.floor(e.y) + 2); y += 1) for (let x = Math.max(0, Math.floor(e.x) - 2); x <= Math.min(W - 1, Math.floor(e.x) + 2); x += 1) {
          const b = getB(x, y); if (!b) continue; const d = Math.hypot(x - e.x, y - e.y); if (d < best) { best = d; nearest = b; }
        }
        if (nearest && best < 2.5) { nearest.hp -= et.dmg; if (et.burn) nearest.burning = 2; }
        e.cooldown = et.shot;
      }
    }
    state.enemies = state.enemies.filter((e) => e.hp > 0);
  }

  if (state.inspector) openInspector(state.inspector.x, state.inspector.y);
  document.getElementById('world-stats').textContent = `Map: 150x150 | Zoom: ${state.viewport.zoom.toFixed(2)}x | Wave ${state.wave} in ${Math.ceil(state.waveTimer)}s (first wave at 600s) | Enemies: ${state.enemies.length} | Power ${state.power.generation.toFixed(0)}W gen / ${state.power.demand.toFixed(0)}W use / Stored ${state.power.stored.toFixed(0)}`;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const t = BASE_TILE * state.viewport.zoom;
  const sx = Math.max(0, Math.floor(state.viewport.offX));
  const sy = Math.max(0, Math.floor(state.viewport.offY));
  const ex = Math.min(W - 1, Math.ceil(state.viewport.offX + canvas.width / t) + 1);
  const ey = Math.min(H - 1, Math.ceil(state.viewport.offY + canvas.height / t) + 1);

  for (let y = sy; y <= ey; y += 1) for (let x = sx; x <= ex; x += 1) {
    const px = (x - state.viewport.offX) * t;
    const py = (y - state.viewport.offY) * t;
    ctx.fillStyle = (x + y) % 2 ? '#1a202b' : '#151a24'; ctx.fillRect(px, py, t, t);
    const liq = state.liquids.get(key(x, y));
    if (liq === 'water_tile') { ctx.fillStyle = '#1f4f88'; ctx.fillRect(px + 1, py + 1, t - 2, t - 2); }
    if (liq === 'oil_tile') { ctx.fillStyle = '#503f1f'; ctx.fillRect(px + 1, py + 1, t - 2, t - 2); }
    if (liq === 'lava_tile') { ctx.fillStyle = '#aa3c1f'; ctx.fillRect(px + 1, py + 1, t - 2, t - 2); }
    const dep = state.deposits.get(key(x, y));
    if (dep) { ctx.fillStyle = oreTypes[dep].color; ctx.beginPath(); ctx.arc(px + t * 0.35, py + t * 0.35, t * 0.12, 0, Math.PI * 2); ctx.arc(px + t * 0.68, py + t * 0.5, t * 0.11, 0, Math.PI * 2); ctx.fill(); }
    else if (state.trees.has(key(x, y))) { ctx.fillStyle = '#2f8f46'; ctx.beginPath(); ctx.arc(px + t * 0.5, py + t * 0.4, t * 0.23, 0, Math.PI * 2); ctx.fill(); }

    const b = getB(x, y); if (!b) continue;
    if (b.hp <= 0 && b.type !== 'core') { state.grid[y][x] = null; continue; }
    if (b.burning) { b.burning -= 0.03; b.hp -= 0.2; }
    ctx.fillStyle = b.type === 'core' ? '#2d73ff' : b.type === 'router' || b.type === 'sorter' ? '#000' : turrets[b.type] ? '#8a2d2d' : powerBuildings[b.type] ? '#a58522' : '#666';
    ctx.fillRect(px + t * 0.1, py + t * 0.1, t * 0.8, t * 0.8);
    if (b.type === 'conveyor') {
      ctx.fillStyle = '#fff';
      ctx.font = `${Math.max(8, t * 0.5)}px sans-serif`;
      ctx.fillText({ up: '↑', down: '↓', left: '←', right: '→' }[b.dir], px + t * 0.3, py + t * 0.7);
    }
    if (b.type === 'core' && x === corePos.x && y === corePos.y) {
      const pulse = (Math.sin(Date.now() / 350) + 1) * 0.5;
      const r = t * (1.6 + pulse * 0.3);
      ctx.strokeStyle = '#8cd3ff';
      ctx.lineWidth = Math.max(1, t * 0.08);
      ctx.beginPath();
      ctx.arc(px + t * 0.5, py + t * 0.5, r, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  for (const e of state.enemies) {
    const px = (e.x - state.viewport.offX + 0.5) * t;
    const py = (e.y - state.viewport.offY + 0.5) * t;
    if (px < -10 || py < -10 || px > canvas.width + 10 || py > canvas.height + 10) continue;
    ctx.fillStyle = '#f44';
    ctx.beginPath(); ctx.arc(px, py, Math.max(2, t * 0.25), 0, Math.PI * 2); ctx.fill();
  }

  requestAnimationFrame(draw);
}

function initUI() {
  const wrap = document.getElementById('building-buttons');
  for (const name of buildings) {
    const b = document.createElement('button');
    b.textContent = `${name} (${costLabel(name)})`;
    b.onclick = () => { state.selected = name; state.erase = false; [...wrap.children].forEach((n) => n.classList.remove('active')); b.classList.add('active'); document.getElementById('erase').classList.remove('active'); };
    if (name === state.selected) b.classList.add('active');
    wrap.appendChild(b);
  }
  const legend = document.getElementById('ore-legend');
  for (const o of Object.values(oreTypes)) { const li = document.createElement('li'); li.textContent = o.label; li.style.color = o.color; legend.appendChild(li); }
  setInterval(() => {
    const inv = document.getElementById('inventory'); inv.innerHTML = '';
    Object.entries(coreStorage()).sort((a, b) => a[0].localeCompare(b[0])).forEach(([k, v]) => { const row = document.createElement('div'); row.textContent = `${k}: ${Math.floor(v)}`; inv.appendChild(row); });
  }, 250);
}

initUI();
setInterval(() => simulate(0.2), 200);
draw();
