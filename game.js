const TILE = 32;
const W = 48;
const H = 30;

const canvas = document.getElementById('game');
canvas.width = W * TILE;
canvas.height = H * TILE;
const ctx = canvas.getContext('2d');

const dirs = ['up', 'right', 'down', 'left'];
const vec = { up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0] };
const opposite = (d) => dirs[(dirs.indexOf(d) + 2) % 4];
const turnLeft = (d) => dirs[(dirs.indexOf(d) + 3) % 4];
const turnRight = (d) => dirs[(dirs.indexOf(d) + 1) % 4];

const oreTypes = {
  copper: { color: '#c27648', label: 'Copper' },
  coal: { color: '#111', label: 'Coal' },
  iron: { color: '#8e98a7', label: 'Iron' },
  titanium: { color: '#4f74ff', label: 'Titanium' },
  thirite: { color: '#ff58c8', label: 'Thirite' },
  orium: { color: '#60ff8f', label: 'Orium (Rare)' },
};

const recipes = {
  plank_builder: { in: { wood: 2 }, out: { plank: 1 } },
  graphite_compressor: { in: { coal: 1, iron: 1 }, out: { graphite: 2 } },
  wire_creator: { in: { copper: 1, iron: 1 }, out: { wire: 4 } },
  cog_maker: { in: { iron: 3, copper: 2 }, out: { cog: 3 } },
  plate_press: { in: { iron: 2 }, out: { iron_plate: 2 } },
  rod_extruder: { in: { iron: 1 }, out: { rod: 2 } },
  pipe_assembler: { in: { rod: 2 }, out: { pipe: 1 } },
  frame_constructor: { in: { iron_plate: 4, rod: 2 }, out: { frame: 1 } },
  circuit_printer: { in: { wire: 2, graphite: 1 }, out: { circuit: 1 } },
  reinforced_plank_builder: { in: { plank: 2, iron_plate: 1 }, out: { reinforced_plank: 1 } },
  industrial_cog_press: { in: { steel: 3, cog: 2 }, out: { heavy_cog: 2 } },
  battery_maker: { in: { graphite: 1, copper: 1 }, out: { battery: 1 } },
  motor_assembler: { in: { cog: 2, wire: 2 }, out: { motor: 1 } },
  fuel_processor: { in: { coal: 2, refined_carbon: 1 }, out: { fuel_block: 1 } },
  titanium_frame_builder: { in: { titanium: 2, steel: 2 }, out: { light_frame: 1 } },
  microchip_fabricator: { in: { circuit: 2, graphite: 1 }, out: { microchip: 1 } },
  servo_builder: { in: { motor: 1, circuit: 1 }, out: { servo: 1 } },
  cooling_unit_assembler: { in: { pipe: 2, titanium: 1 }, out: { cooling_unit: 1 } },
  reactor_core_press: { in: { fuel_block: 2, light_frame: 1 }, out: { reactor_core: 1 } },
  power_cell_factory: { in: { battery: 2, microchip: 1 }, out: { power_cell: 1 } },
  composite_forge: { in: { titanium: 1, steel: 1 }, out: { composite_alloy: 1 } },
  thirite_stabilizer: { in: { thirite: 2, titanium: 1 }, out: { stabilized_crystal: 1 } },
  orium_infuser: { in: { orium: 1, power_cell: 1 }, out: { orium_core: 1 } },
  quantum_assembler: { in: { orium_core: 1, microchip: 1, composite_alloy: 1 }, out: { quantum_core: 1 } },
};

const buildingCosts = {
  miner: { iron: 10, copper: 5 },
  conveyor: { iron: 1 },
  router: { iron: 2, copper: 1 },
  sorter: { iron_plate: 2, wire: 2 },
  chopper: { iron: 8, plank: 4 },
  plank_builder: { iron: 10, plank: 5 },
  graphite_compressor: { iron: 8, iron_plate: 2 },
  wire_creator: { iron: 6, copper: 4 },
  cog_maker: { iron: 8, copper: 4, plank: 2 },
  plate_press: { iron: 12, cog: 2 },
  rod_extruder: { iron: 8, cog: 1 },
  pipe_assembler: { iron_plate: 6, rod: 2 },
  frame_constructor: { iron_plate: 10, rod: 4, cog: 2 },
  circuit_printer: { wire: 6, graphite: 2, iron_plate: 2 },
  reinforced_plank_builder: { iron_plate: 4, plank: 4 },
  industrial_cog_press: { steel: 6, cog: 4, frame: 1 },
  battery_maker: { graphite: 4, copper: 4, iron_plate: 2 },
  motor_assembler: { cog: 4, wire: 4, frame: 1 },
  fuel_processor: { steel: 4, graphite: 2 },
  titanium_frame_builder: { titanium: 6, steel: 4, frame: 2 },
  microchip_fabricator: { circuit: 6, graphite: 4, frame: 1 },
  servo_builder: { motor: 4, circuit: 4, frame: 1 },
  cooling_unit_assembler: { pipe: 4, titanium: 4, steel: 2 },
  reactor_core_press: { steel: 6, light_frame: 2, power_cell: 2 },
  power_cell_factory: { battery: 4, microchip: 2, frame: 1 },
  composite_forge: { titanium: 4, steel: 4, frame: 1 },
  thirite_stabilizer: { steel: 6, titanium: 2, microchip: 1 },
  orium_infuser: { light_frame: 4, power_cell: 2, servo: 1 },
  quantum_assembler: { composite_alloy: 6, orium_core: 2, microchip: 2, reactor_core: 1 },
};


const upgradeAndRequirementData = {
  miner: { level2: { iron_plate: 5, cog: 2 }, level3: { steel: 10, circuit: 5 } },
  conveyor: { fast_conveyor: { iron_plate: 1, wire: 1 } },
  chopper: { level2: { iron_plate: 4, cog: 2 } },
  requirements: {
    frame_constructor: ['power'],
    circuit_printer: ['power'],
    industrial_cog_press: ['power'],
    battery_maker: ['power'],
    motor_assembler: ['power'],
    fuel_processor: ['power'],
    titanium_frame_builder: ['power', 'coolant'],
    microchip_fabricator: ['power', 'coolant'],
    servo_builder: ['power', 'coolant'],
    cooling_unit_assembler: ['power'],
    reactor_core_press: ['power', 'heavy_coolant'],
    power_cell_factory: ['power', 'coolant'],
    composite_forge: ['power'],
    thirite_stabilizer: ['power', 'coolant'],
    orium_infuser: ['power', 'advanced_coolant'],
    quantum_assembler: ['power', 'high_coolant', 'needs_2_cooling_units_nearby'],
  },
};

const buildings = [
  { key: 'core', name: 'Core' },
  { key: 'miner', name: 'Miner' },
  { key: 'conveyor', name: 'Conveyor' },
  { key: 'router', name: 'Router' },
  { key: 'sorter', name: 'Sorter' },
  { key: 'chopper', name: 'Chopper' },
  ...Object.keys(recipes).map((k) => ({ key: k, name: k.replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()) })),
];

const factorySet = new Set(Object.keys(recipes));
const coreStart = { x: Math.floor(W / 2), y: Math.floor(H / 2) };

const state = {
  selected: 'miner',
  rotation: 'right',
  erase: false,
  message: '',
  grid: Array.from({ length: H }, () => Array.from({ length: W }, () => null)),
  deposits: new Map(),
  trees: new Set(),
};

function key(x, y) { return `${x},${y}`; }
function inside(x, y) { return x >= 0 && y >= 0 && x < W && y < H; }

function makeBuilding(type, dir) {
  return {
    type,
    dir,
    level: 1,
    queue: [],
    storage: {},
    roundRobin: 0,
    selectedItem: 'iron',
  };
}

state.grid[coreStart.y][coreStart.x] = makeBuilding('core', 'right');
Object.assign(state.grid[coreStart.y][coreStart.x].storage, { wood: 50, copper: 50, iron: 50 });

function generateMap() {
  const addDeposits = (type, count) => {
    let placed = 0;
    while (placed < count) {
      const x = Math.floor(Math.random() * W);
      const y = Math.floor(Math.random() * H);
      const k = key(x, y);
      if ((x === coreStart.x && y === coreStart.y) || state.deposits.has(k)) continue;
      state.deposits.set(k, type);
      placed += 1;
    }
  };

  addDeposits('copper', 45);
  addDeposits('coal', 40);
  addDeposits('iron', 50);
  addDeposits('titanium', 20);
  addDeposits('thirite', 10);
  addDeposits('orium', 4);

  let treeCount = 0;
  while (treeCount < 90) {
    const x = Math.floor(Math.random() * W);
    const y = Math.floor(Math.random() * H);
    const k = key(x, y);
    if ((x === coreStart.x && y === coreStart.y) || state.deposits.has(k) || state.trees.has(k)) continue;
    state.trees.add(k);
    treeCount += 1;
  }
}

generateMap();

function addItem(store, item, qty = 1) { store[item] = (store[item] || 0) + qty; }
function hasResources(store, needs) { return Object.entries(needs || {}).every(([k, v]) => (store[k] || 0) >= v); }
function spendResources(store, needs) { Object.entries(needs || {}).forEach(([k, v]) => { store[k] -= v; }); }
function getB(x, y) { return inside(x, y) ? state.grid[y][x] : null; }
function getCore() { return state.grid[coreStart.y][coreStart.x]; }

function pushTo(b, item) {
  if (!b) return false;
  if (b.type === 'core') {
    addItem(b.storage, item, 1);
    return true;
  }
  b.queue.push(item);
  return true;
}

function pullFromOutput(x, y) {
  const b = getB(x, y);
  if (!b || !b.queue.length) return null;
  return b.queue.shift();
}

function setMessage(msg) {
  state.message = msg;
  const el = document.getElementById('message');
  if (el) el.textContent = msg;
}

function costLabel(type) {
  const cost = buildingCosts[type];
  if (!cost) return 'Free';
  return Object.entries(cost).map(([item, qty]) => `${qty} ${item}`).join(', ');
}

function place(x, y) {
  if (!inside(x, y)) return;
  if (x === coreStart.x && y === coreStart.y) {
    setMessage('Core is permanent and cannot be replaced.');
    return;
  }

  if (state.erase) {
    state.grid[y][x] = null;
    return;
  }

  const core = getCore();
  const cost = buildingCosts[state.selected];
  if (!hasResources(core.storage, cost)) {
    setMessage(`Not enough resources for ${state.selected}. Need: ${costLabel(state.selected)}`);
    return;
  }

  spendResources(core.storage, cost);
  state.grid[y][x] = makeBuilding(state.selected, state.rotation);
  setMessage(`Placed ${state.selected}. Cost paid: ${costLabel(state.selected)}`);
}

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left) / TILE);
  const y = Math.floor((e.clientY - rect.top) / TILE);
  if (!inside(x, y)) return;

  const existing = getB(x, y);
  if (existing?.type === 'sorter') {
    const value = prompt('Sorter filter item id (e.g. iron, copper, wire, plank):', existing.selectedItem);
    if (value) existing.selectedItem = value.trim();
    return;
  }

  place(x, y);
});

window.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'r') {
    state.rotation = dirs[(dirs.indexOf(state.rotation) + 1) % 4];
    document.getElementById('rotation').textContent = `Direction: ${state.rotation}`;
  }
});

function simulateTick() {
  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      const b = getB(x, y);
      if (!b) continue;
      b.storage = b.storage || {};
      while (b.queue.length) addItem(b.storage, b.queue.shift(), 1);
    }
  }

  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      const b = getB(x, y);
      if (!b) continue;

      if (b.type === 'miner') {
        const dep = state.deposits.get(key(x, y));
        if (dep) addItem(b.storage, dep, b.level);
      } else if (b.type === 'chopper') {
        if (state.trees.has(key(x, y))) addItem(b.storage, 'wood', b.level);
      } else if (factorySet.has(b.type)) {
        const recipe = recipes[b.type];
        if (hasResources(b.storage, recipe.in)) {
          spendResources(b.storage, recipe.in);
          Object.entries(recipe.out).forEach(([item, qty]) => addItem(b.storage, item, qty));
        }
      }
    }
  }

  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      const b = getB(x, y);
      if (!b) continue;

      if (b.type === 'conveyor') {
        const [bx, by] = vec[opposite(b.dir)];
        const [fx, fy] = vec[b.dir];
        const item = pullFromOutput(x + bx, y + by);
        if (!item) continue;
        const target = getB(x + fx, y + fy);
        if (!pushTo(target, item)) addItem(b.storage, item, 1);
      } else if (b.type === 'router') {
        const [bx, by] = vec[opposite(b.dir)];
        const item = pullFromOutput(x + bx, y + by);
        if (!item) continue;
        const outs = [b.dir, turnLeft(b.dir), turnRight(b.dir)];
        for (let i = 0; i < outs.length; i += 1) {
          const d = outs[(b.roundRobin + i) % outs.length];
          const [dx, dy] = vec[d];
          if (pushTo(getB(x + dx, y + dy), item)) {
            b.roundRobin = (b.roundRobin + 1) % outs.length;
            break;
          }
        }
      } else if (b.type === 'sorter') {
        const [bx, by] = vec[opposite(b.dir)];
        const item = pullFromOutput(x + bx, y + by);
        if (!item) continue;
        const preferred = item === b.selectedItem ? [b.dir] : [turnLeft(b.dir), turnRight(b.dir)];
        for (const d of preferred) {
          const [dx, dy] = vec[d];
          if (pushTo(getB(x + dx, y + dy), item)) break;
        }
      } else if (b.type !== 'core') {
        Object.entries(b.storage).forEach(([item, qty]) => {
          for (let i = 0; i < qty; i += 1) b.queue.push(item);
        });
        b.storage = {};
      }
    }
  }
}

setInterval(simulateTick, 1000);

function drawArrow(x, y, dir, color = '#fff') {
  ctx.save();
  ctx.translate(x + TILE / 2, y + TILE / 2);
  const rot = { up: -Math.PI / 2, right: 0, down: Math.PI / 2, left: Math.PI }[dir];
  ctx.rotate(rot);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-7, -5);
  ctx.lineTo(8, 0);
  ctx.lineTo(-7, 5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      const px = x * TILE;
      const py = y * TILE;
      ctx.fillStyle = (x + y) % 2 ? '#20242e' : '#1b1f28';
      ctx.fillRect(px, py, TILE, TILE);
      ctx.strokeStyle = '#2d3444';
      ctx.strokeRect(px, py, TILE, TILE);

      const dep = state.deposits.get(key(x, y));
      if (dep) {
        ctx.fillStyle = oreTypes[dep].color;
        ctx.beginPath();
        ctx.arc(px + 8, py + 8, 3, 0, Math.PI * 2);
        ctx.arc(px + 20, py + 14, 3, 0, Math.PI * 2);
        ctx.arc(px + 14, py + 24, 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (state.trees.has(key(x, y))) {
        ctx.fillStyle = '#2f8f46';
        ctx.beginPath();
        ctx.arc(px + 16, py + 12, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#7a4d2c';
        ctx.fillRect(px + 15, py + 18, 2, 8);
      }

      const b = state.grid[y][x];
      if (!b) continue;
      if (b.type === 'core') {
        ctx.fillStyle = '#2d73ff';
        ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
      } else if (b.type === 'miner') {
        ctx.fillStyle = '#888';
        ctx.beginPath();
        ctx.moveTo(px + TILE / 2, py + 4);
        ctx.lineTo(px + TILE - 4, py + TILE - 4);
        ctx.lineTo(px + 4, py + TILE - 4);
        ctx.closePath();
        ctx.fill();
      } else if (b.type === 'conveyor') {
        ctx.fillStyle = '#6f6f6f';
        ctx.fillRect(px + 4, py + 11, TILE - 8, TILE - 22);
        drawArrow(px, py, b.dir);
      } else if (b.type === 'router') {
        ctx.fillStyle = '#000';
        ctx.fillRect(px + 6, py + 6, TILE - 12, TILE - 12);
      } else if (b.type === 'sorter') {
        ctx.fillStyle = '#000';
        ctx.fillRect(px + 6, py + 6, TILE - 12, TILE - 12);
        ctx.fillStyle = '#fff';
        ctx.fillRect(px + 11, py + 11, TILE - 22, TILE - 22);
      } else if (b.type === 'chopper') {
        ctx.fillStyle = '#8a8a8a';
        ctx.beginPath();
        ctx.arc(px + TILE / 2, py + TILE / 2, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(px + 16, py + 8);
        ctx.lineTo(px + 22, py + 22);
        ctx.lineTo(px + 10, py + 21);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillStyle = '#5a5a5a';
        ctx.fillRect(px + 4, py + 4, TILE - 8, TILE - 8);
        ctx.fillStyle = '#111';
        ctx.fillRect(px + 10, py + 10, TILE - 20, TILE - 20);
      }
    }
  }

  requestAnimationFrame(render);
}

function initUI() {
  const wrap = document.getElementById('building-buttons');
  const oreLegend = document.getElementById('ore-legend');

  buildings.forEach((b) => {
    if (b.key === 'core') return;
    const btn = document.createElement('button');
    btn.textContent = `${b.name} (${costLabel(b.key)})`;
    btn.addEventListener('click', () => {
      state.erase = false;
      state.selected = b.key;
      [...wrap.children].forEach((x) => x.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('erase').classList.remove('active');
    });
    if (b.key === state.selected) btn.classList.add('active');
    wrap.appendChild(btn);
  });

  document.getElementById('erase').addEventListener('click', (e) => {
    state.erase = !state.erase;
    e.currentTarget.classList.toggle('active', state.erase);
  });

  Object.values(oreTypes).forEach((o) => {
    const li = document.createElement('li');
    li.textContent = o.label;
    li.style.color = o.color;
    oreLegend.appendChild(li);
  });

  setInterval(() => {
    const inv = document.getElementById('inventory');
    const core = getCore();
    inv.innerHTML = '';
    Object.entries(core.storage)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .forEach(([item, qty]) => {
        const row = document.createElement('div');
        row.textContent = `${item}: ${qty}`;
        inv.appendChild(row);
      });
  }, 250);
}

initUI();
render();
