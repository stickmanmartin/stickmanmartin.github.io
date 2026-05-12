/**
 * UNIVERSAL SANDBOX ENGINE v3.1 - Fixed
 * Cellular Automata with Reaction Matrix, Chunks, and Zoom/Pan
 */

const canvas = document.getElementById('sandCanvas');
const ctx = canvas.getContext('2d', { alpha: false });

const width = 250;
const height = 200;
canvas.width = width;
canvas.height = height;

// --- Element Table ---
const ELEMENTS = {
    EMPTY: 0, WALL: 1, SAND: 2, DIRT: 3, ROCK: 4, MUD: 5,
    WATER: 6, ACID: 7, OIL: 8, LAVA: 9, STEAM: 10,
    PLANT: 11, ALGAE: 12, VIRUS: 13, FIRE: 14, FLASH: 15,
    VOID: 16, SPOUT: 17, NUCLEAR: 18, ASH: 19
};

const DENSITY = { 
    [ELEMENTS.EMPTY]: 0, [ELEMENTS.STEAM]: 1, [ELEMENTS.OIL]: 5, 
    [ELEMENTS.WATER]: 10, [ELEMENTS.ACID]: 12, [ELEMENTS.MUD]: 15, 
    [ELEMENTS.LAVA]: 18, [ELEMENTS.SAND]: 20, [ELEMENTS.DIRT]: 25, 
    [ELEMENTS.ROCK]: 100, [ELEMENTS.WALL]: 1000 
};

const palette = {
    [ELEMENTS.EMPTY]: ['#0a0e14'], [ELEMENTS.WALL]: ['#1f2937', '#111827'], [ELEMENTS.SAND]: ['#fde047', '#facc15', '#eab308'],
    [ELEMENTS.DIRT]: ['#78350f', '#451a03'], [ELEMENTS.ROCK]: ['#4b5563', '#374151'], [ELEMENTS.MUD]: ['#3f2305', '#2a1502'],
    [ELEMENTS.WATER]: ['#38bdf8', '#0ea5e9'], [ELEMENTS.ACID]: ['#a3e635', '#84cc16'], [ELEMENTS.OIL]: ['#6366f1', '#4338ca'],
    [ELEMENTS.LAVA]: ['#ef4444', '#f97316'], [ELEMENTS.STEAM]: ['#e2e8f0', '#94a3b8'], [ELEMENTS.PLANT]: ['#22c55e', '#15803d'],
    [ELEMENTS.ALGAE]: ['#065f46', '#064e3b'], [ELEMENTS.VIRUS]: ['#ec4899', '#be185d'], [ELEMENTS.FIRE]: ['#fb923c', '#f59e0b'],
    [ELEMENTS.FLASH]: ['#fff', '#fef08a'], [ELEMENTS.VOID]: ['#000'], [ELEMENTS.SPOUT]: ['#6366f1'], [ELEMENTS.NUCLEAR]: ['#22d3ee', '#fff'],
    [ELEMENTS.ASH]: ['#334155', '#1e293b']
};

let grid = new Uint8ClampedArray(width * height);
let nextGrid = new Uint8ClampedArray(width * height);
let colorGrid = new Array(width * height);
let awakeGrid = new Uint8ClampedArray(width * height);

let currentElement = 'SAND';
let lastElement = 'SAND';
let isMouseDown = false;
let brushSize = 4;
let zoom = 4;
let isPaused = false;

const CHUNK_SIZE = 10;
const chunksWidth = Math.ceil(width / CHUNK_SIZE);
const chunksHeight = Math.ceil(height / CHUNK_SIZE);
let activeChunks = new Uint8Array(chunksWidth * chunksHeight);

function init() {
    grid.fill(ELEMENTS.EMPTY); nextGrid.fill(ELEMENTS.EMPTY); awakeGrid.fill(0);
    for (let i = 0; i < grid.length; i++) colorGrid[i] = palette[ELEMENTS.EMPTY][0];
}

function setCell(x, y, typeName) {
    const type = ELEMENTS[typeName];
    if (x >= 0 && x < width && y >= 0 && y < height) {
        const idx = y * width + x;
        grid[idx] = type;
        colorGrid[idx] = palette[type][Math.floor(Math.random() * palette[type].length)];
        wake(x, y);
    }
}

function wake(x, y) {
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx, ny = y + dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                const idx = ny * width + nx;
                awakeGrid[idx] = 1;
                activeChunks[Math.floor(ny/CHUNK_SIZE) * chunksWidth + Math.floor(nx/CHUNK_SIZE)] = 1;
            }
        }
    }
}

canvas.addEventListener('mousedown', () => isMouseDown = true);
window.addEventListener('mouseup', () => isMouseDown = false);
canvas.addEventListener('mousemove', (e) => {
    if (!isMouseDown) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) * (width / rect.width));
    const y = Math.floor((e.clientY - rect.top) * (height / rect.height));
    for (let dx = -brushSize; dx <= brushSize; dx++) {
        for (let dy = -brushSize; dy <= brushSize; dy++) {
            if (dx*dx + dy*dy <= brushSize*brushSize) setCell(x + dx, y + dy, currentElement);
        }
    }
});

function update() {
    if (isPaused) return;
    nextGrid.set(grid);
    let nextAwake = new Uint8ClampedArray(width * height);
    let nextChunks = new Uint8Array(chunksWidth * chunksHeight);

    for (let cy = 0; cy < chunksHeight; cy++) {
        for (let cx = 0; cx < chunksWidth; cx++) {
            if (!activeChunks[cy * chunksWidth + cx]) continue;
            
            let chunkHasActive = false;
            for (let y = cy * CHUNK_SIZE; y < (cy + 1) * CHUNK_SIZE && y < height; y++) {
                for (let x = cx * CHUNK_SIZE; x < (cx + 1) * CHUNK_SIZE && x < width; x++) {
                    const idx = y * width + x;
                    if (!awakeGrid[idx]) continue;
                    
                    const type = grid[idx];
                    if (type === ELEMENTS.EMPTY || type === ELEMENTS.WALL || type === ELEMENTS.ROCK) { awakeGrid[idx] = 0; continue; }

                    const below = (y+1)*width + x, bl = (y+1)*width + (x-1), br = (y+1)*width + (x+1);
                    const l = y*width + (x-1), r = y*width + (x+1), above = (y-1)*width + x;

                    let moved = false;

                    // --- REACTION MATRIX ---
                    if (type === ELEMENTS.FIRE && grid[above] === ELEMENTS.WATER) { nextGrid[above] = ELEMENTS.STEAM; nextGrid[idx] = ELEMENTS.EMPTY; moved = true; }
                    if (type === ELEMENTS.WATER && grid[below] === ELEMENTS.LAVA) { nextGrid[idx] = ELEMENTS.STEAM; nextGrid[below] = ELEMENTS.ROCK; moved = true; }
                    if (type === ELEMENTS.WATER && grid[below] === ELEMENTS.DIRT) { nextGrid[below] = ELEMENTS.MUD; moved = true; }
                    
                    if (type === ELEMENTS.PLANT && grid[below] === ELEMENTS.WATER) {
                        const grow = [l, r, above][Math.floor(Math.random()*3)];
                        if (grid[grow] === ELEMENTS.EMPTY && Math.random() < 0.05) { nextGrid[grow] = ELEMENTS.PLANT; moved = true; }
                    }
                    if (type === ELEMENTS.VIRUS) {
                        [l, r, above, below].forEach(n => { 
                            if(n >= 0 && n < grid.length && grid[n] !== ELEMENTS.EMPTY && grid[n] !== ELEMENTS.VIRUS && grid[n] !== ELEMENTS.WALL) {
                                nextGrid[n] = ELEMENTS.VIRUS; moved = true;
                            }
                        });
                    }
                    if (type === ELEMENTS.SPOUT) { setCell(x, y+1, lastElement); moved = true; }
                    if (type === ELEMENTS.VOID) { [l, r, above, below].forEach(n => { if(n >= 0 && n < grid.length) nextGrid[n] = ELEMENTS.EMPTY; }); }

                    // --- PHYSICS ---
                    if (DENSITY[type] > 0) { 
                        if (canSink(type, below)) { swap(idx, below, nextAwake, nextChunks); moved = true; }
                        else if (canSink(type, bl)) { swap(idx, bl, nextAwake, nextChunks); moved = true; }
                        else if (canSink(type, br, true)) { swap(idx, br, nextAwake, nextChunks); moved = true; }
                        else if ((type === ELEMENTS.WATER || type === ELEMENTS.OIL || type === ELEMENTS.ACID || type === ELEMENTS.MUD || type === ELEMENTS.LAVA)) {
                            if (canSink(type, l)) { swap(idx, l, nextAwake, nextChunks); moved = true; }
                            else if (canSink(type, r)) { swap(idx, r, nextAwake, nextChunks); moved = true; }
                        }
                    }

                    if (moved) chunkHasActive = true;
                }
            }
            if (chunkHasActive) nextChunks[cy * chunksWidth + cx] = 1;
        }
    }
    grid.set(nextGrid);
    awakeGrid.set(nextAwake);
    activeChunks.set(nextChunks);
}

function canSink(type, target, isDiag = false) {
    if (target < 0 || target >= grid.length) return false;
    const targetType = grid[target];
    if (targetType === ELEMENTS.EMPTY) return true;
    if (isDiag && targetType === ELEMENTS.WATER) return false;
    return DENSITY[type] > DENSITY[targetType];
}

function swap(a, b, nextAwake, nextChunks) {
    const temp = nextGrid[a];
    nextGrid[a] = nextGrid[b];
    nextGrid[b] = temp;
    const tCol = colorGrid[a];
    colorGrid[a] = colorGrid[b];
    colorGrid[b] = tCol;
    
    [a, b].forEach(i => {
        const x = i % width, y = Math.floor(i / width);
        nextAwake[i] = 1;
        nextChunks[Math.floor(y/CHUNK_SIZE)*chunksWidth + Math.floor(x/CHUNK_SIZE)] = 1;
    });
}

function draw() {
    canvas.style.transform = `scale(${zoom})`;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = y * width + x;
            ctx.fillStyle = colorGrid[idx];
            ctx.fillRect(x, y, 1, 1);
        }
    }
}

function loop() {
    update(); draw();
    requestAnimationFrame(loop);
}

window.selectElement = (name, btn) => {
    currentElement = name;
    if (name !== 'EMPTY' && name !== 'VOID' && name !== 'SPOUT') lastElement = name;
    document.querySelectorAll('.element-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
};
window.clearGrid = () => init();
window.changeZoom = (dir) => zoom = Math.max(1, Math.min(10, zoom + dir));

init();
loop();
