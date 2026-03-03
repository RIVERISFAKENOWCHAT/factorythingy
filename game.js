const TILE = 48;
const W = 20;
const H = 14;
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const dirs = ['up', 'right', 'down', 'left'];
const vec = { up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0] };
const opposite = (d) => dirs[(dirs.indexOf(d) + 2) % 4];
const turnLeft = (d) => dirs[(dirs.indexOf(d) + 3) % 4];
const turnRight = (d) => dirs[(dirs.indexOf(d) + 1) % 4];

const oreTypes = {
  copper_ore: { color: '#c27648', label: 'Copper' },
  coal: { color: '#111', label: 'Coal' },
  iron_ore: { color: '#8e98a7', label: 'Iron' },
  titanium_ore: { color: '#4f74ff', label: 'Titanium' },
  thirite: { color: '#ff58c8', label: 'Thirite' },
  orium: { color: '#60ff8f', label: 'Orium (Rare)' },
};

const recipes = {
  plank_builder: { in: { wood: 2 }, out: { plank: 1 } },
  graphite_compressor: { in: { coal: 1, iron_ore: 1 }, out: { graphite: 2 } },
  wire_creator: { in: { copper_ore: 1, iron_ore: 1 }, out: { wire: 4 } },
  cog_maker: { in: { iron_ore: 3, copper_ore: 2 }, out: { cog: 3 } },
  plate_press: { in: { iron_ore: 2 }, out: { iron_plate: 2 } },
  rod_extruder: { in: { iron_ore: 1 }, out: { rod: 2 } },
  pipe_assembler: { in: { rod: 2 }, out: { pipe: 1 } },
  frame_constructor: { in: { iron_plate: 4, rod: 2 }, out: { frame: 1 } },
  circuit_printer: { in: { wire: 2, graphite: 1 }, out: { circuit: 1 } },
  reinforced_plank_builder: { in: { plank: 2, iron_plate: 1 }, out: { reinforced_plank: 1 } },
  industrial_cog_press: { in: { steel: 3, cog: 2 }, out: { heavy_cog: 2 } },
  battery_maker: { in: { graphite: 1, copper_ore: 1 }, out: { battery: 1 } },
  motor_assembler: { in: { cog: 2, wire: 2 }, out: { motor: 1 } },
  fuel_processor: { in: { coal: 2, refined_carbon: 1 }, out: { fuel_block: 1 } },
  titanium_frame_builder: { in: { titanium_ore: 2, steel: 2 }, out: { light_frame: 1 } },
  microchip_fabricator: { in: { circuit: 2, graphite: 1 }, out: { microchip: 1 } },
  servo_builder: { in: { motor: 1, circuit: 1 }, out: { servo: 1 } },
  cooling_unit_assembler: { in: { pipe: 2, titanium_ore: 1 }, out: { cooling_unit: 1 } },
  reactor_core_press: { in: { fuel_block: 2, light_frame: 1 }, out: { reactor_core: 1 } },
  power_cell_factory: { in: { battery: 2, microchip: 1 }, out: { power_cell: 1 } },
  composite_forge: { in: { titanium_ore: 1, steel: 1 }, out: { composite_alloy: 1 } },
  thirite_stabilizer: { in: { thirite: 2, titanium_ore: 1 }, out: { stabilized_crystal: 1 } },
  orium_infuser: { in: { orium: 1, power_cell: 1 }, out: { orium_core: 1 } },
  quantum_assembler: { in: { orium_core: 1, microchip: 1, composite_alloy: 1 }, out: { quantum_core: 1 } },
};

const buildings = [
  { key: 'core', name: 'Core', color: '#2d73ff', shape: 'square', category: 'basic' },
  { key: 'miner', name: 'Miner', color: '#777', shape: 'triangle', category: 'basic' },
  { key: 'conveyor', name: 'Conveyor', color: '#666', shape: 'rect', category: 'basic' },
  { key: 'router', name: 'Router', color: '#000', shape: 'square', category: 'basic' },
  { key: 'sorter', name: 'Sorter', color: '#000', shape: 'sorter', category: 'basic' },
  { key: 'chopper', name: 'Chopper', color: '#7e7e7e', shape: 'chopper', category: 'basic' },
  ...Object.keys(recipes).map((k) => ({ key: k, name: k.replaceAll('_', ' ').replace(/\b\w/g, c => c.toUpperCase()), color: '#555', shape: 'factory', category: 'factory' })),
];

const byKey = Object.fromEntries(buildings.map(b => [b.key, b]));
const factorySet = new Set(Object.keys(recipes));
const transportSet = new Set(['conveyor', 'router', 'sorter']);

const state = {
  selected: 'core',
  rotation: 'right',
  erase: false,
  grid: Array.from({ length: H }, () => Array.from({ length: W }, () => null)),
  deposits: new Map(),
  trees: new Set(),
  coreInventory: {},
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
    selectedItem: 'iron_ore',
    progress: 0,
    carry: null,
  };
}

function generateMap() {
  const addDeposits = (type, count) => {
    for (let i = 0; i < count; i += 1) {
      const x = Math.floor(Math.random() * W);
      const y = Math.floor(Math.random() * H);
      if (!state.deposits.has(key(x, y))) state.deposits.set(key(x, y), type);
    }
  };

  addDeposits('copper_ore', 34);
  addDeposits('coal', 34);
  addDeposits('iron_ore', 40);
  addDeposits('titanium_ore', 24);
  addDeposits('thirite', 15);
  addDeposits('orium', 6);

  for (let i = 0; i < 70; i += 1) {
    const x = Math.floor(Math.random() * W);
    const y = Math.floor(Math.random() * H);
    if (!state.deposits.has(key(x, y))) state.trees.add(key(x, y));
  }
}

generateMap();

function addItem(store, item, qty = 1) { store[item] = (store[item] || 0) + qty; }
function hasInputs(store, needs) { return Object.entries(needs).every(([k, v]) => (store[k] || 0) >= v); }
function consumeInputs(store, needs) { Object.entries(needs).forEach(([k, v]) => { store[k] -= v; }); }

function getB(x, y) { return inside(x, y) ? state.grid[y][x] : null; }

function pushTo(b, item) {
  if (!b) return false;
  if (b.type === 'core') {
    addItem(state.coreInventory, item, 1);
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

function place(x, y) {
  if (!inside(x, y)) return;
  if (state.erase) {
    state.grid[y][x] = null;
    return;
  }
  state.grid[y][x] = makeBuilding(state.selected, state.rotation);
}

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left) / TILE);
  const y = Math.floor((e.clientY - rect.top) / TILE);
  if (!inside(x, y)) return;

  const existing = getB(x, y);
  if (existing?.type === 'sorter') {
    const value = prompt('Sorter filter item id (e.g. iron_ore, copper_ore, wire, plank):', existing.selectedItem);
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
        if (hasInputs(b.storage, recipe.in)) {
          consumeInputs(b.storage, recipe.in);
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
      } else if (b.type === 'core') {
        Object.entries(b.storage).forEach(([item, qty]) => {
          if (qty > 0) addItem(state.coreInventory, item, qty);
        });
        b.storage = {};
      } else if (b.storage) {
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
  ctx.moveTo(-10, -8);
  ctx.lineTo(12, 0);
  ctx.lineTo(-10, 8);
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
        ctx.arc(px + 12, py + 12, 5, 0, Math.PI * 2);
        ctx.arc(px + 30, py + 22, 5, 0, Math.PI * 2);
        ctx.arc(px + 20, py + 35, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (state.trees.has(key(x, y))) {
        ctx.fillStyle = '#2f8f46';
        ctx.beginPath();
        ctx.arc(px + 24, py + 20, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#7a4d2c';
        ctx.fillRect(px + 22, py + 28, 4, 12);
      }

      const b = state.grid[y][x];
      if (!b) continue;
      if (b.type === 'core') {
        ctx.fillStyle = '#2d73ff';
        ctx.fillRect(px + 4, py + 4, TILE - 8, TILE - 8);
      } else if (b.type === 'miner') {
        ctx.fillStyle = '#888';
        ctx.beginPath();
        ctx.moveTo(px + TILE / 2, py + 6);
        ctx.lineTo(px + TILE - 8, py + TILE - 8);
        ctx.lineTo(px + 8, py + TILE - 8);
        ctx.closePath();
        ctx.fill();
      } else if (b.type === 'conveyor') {
        ctx.fillStyle = '#6f6f6f';
        ctx.fillRect(px + 6, py + 16, TILE - 12, TILE - 32);
        drawArrow(px, py, b.dir);
      } else if (b.type === 'router') {
        ctx.fillStyle = '#000';
        ctx.fillRect(px + 8, py + 8, TILE - 16, TILE - 16);
      } else if (b.type === 'sorter') {
        ctx.fillStyle = '#000';
        ctx.fillRect(px + 8, py + 8, TILE - 16, TILE - 16);
        ctx.fillStyle = '#fff';
        ctx.fillRect(px + 16, py + 16, TILE - 32, TILE - 32);
      } else if (b.type === 'chopper') {
        ctx.fillStyle = '#8a8a8a';
        ctx.beginPath();
        ctx.arc(px + TILE / 2, py + TILE / 2, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(px + 24, py + 15);
        ctx.lineTo(px + 35, py + 33);
        ctx.lineTo(px + 14, py + 31);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillStyle = '#5a5a5a';
        ctx.fillRect(px + 7, py + 7, TILE - 14, TILE - 14);
        ctx.fillStyle = '#111';
        ctx.fillRect(px + 15, py + 15, TILE - 30, TILE - 30);
      }
    }
  }

  requestAnimationFrame(render);
}

function initUI() {
  const wrap = document.getElementById('building-buttons');
  const oreLegend = document.getElementById('ore-legend');

  buildings.forEach((b) => {
    const btn = document.createElement('button');
    btn.textContent = b.name;
    btn.addEventListener('click', () => {
      state.erase = false;
      state.selected = b.key;
      [...wrap.children].forEach(x => x.classList.remove('active'));
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
    inv.innerHTML = '';
    Object.entries(state.coreInventory)
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
