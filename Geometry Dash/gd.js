(function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const progressBar = document.getElementById('progress-bar');
    const deathScreen = document.getElementById('death-screen');
    const cpsSpan = document.getElementById('cps-value');
    const mainMenu = document.getElementById('main-menu');
    const gameHud = document.getElementById('game-hud');

    let width, height, groundY;
    let diff = 'normal';
    let GRAVITY = 1.0, JUMP_FORCE = -16, SHIP_THRUST = -1.4, WAVE_SPEED = 13, GAME_SPEED = 12;
    const PLAYER_SIZE = 40;

    window.setDiff = function(d) {
        diff = d;
        document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
        document.getElementById(d).classList.add('active');
        if (d === 'easy') { GRAVITY = 0.8; JUMP_FORCE = -14; SHIP_THRUST = -1.2; WAVE_SPEED = 10; GAME_SPEED = 8; }
        else if (d === 'normal') { GRAVITY = 1.1; JUMP_FORCE = -17; SHIP_THRUST = -1.6; WAVE_SPEED = 14; GAME_SPEED = 13; }
        else { GRAVITY = 1.35; JUMP_FORCE = -19; SHIP_THRUST = -2.0; WAVE_SPEED = 17; GAME_SPEED = 16; }
    };

    let focusMode = 'random', clickHistory = [];
    function updateCPS() {
        const now = Date.now();
        clickHistory = clickHistory.filter(t => now - t < 1000);
        cpsSpan.innerText = clickHistory.length;
    }

    let player = { x: 200, y: 0, vy: 0, rot: 0, mode: 'cube', width: PLAYER_SIZE, height: PLAYER_SIZE, isGrounded: false, gravityDir: 1, robotHoldTime: 0 };
    let obstacles = [], particles = [], cameraX = 0, isDead = false, isStarted = false, frameCount = 0, levelLength = 50000;
    let swingHue = 0;
    let droneEnabled = false, drone = { active: false, angle: 0, dist: 150, x: 0, y: 0, shootTimer: 0, state: 'idle', laserTimer: 0, laserY: 0 }, droneProjectiles = [];
    const stars = Array.from({length: 100}, () => ({
        x: Math.random() * 2000,
        y: Math.random() * 1000,
        size: Math.random() * 2 + 1,
        speed: Math.random() * 0.5 + 0.1
    }));

    window.toggleDrone = function() {
        droneEnabled = !droneEnabled;
        const btn = document.getElementById('drone-btn');
        if (btn) {
            btn.innerText = 'DRONE: ' + (droneEnabled ? 'ON' : 'OFF');
            btn.style.background = droneEnabled ? '#ff0000' : 'rgba(255, 0, 0, 0.1)';
        }
        
        const disabledModes = ['cube', 'ball', 'robot', 'spider'];
        disabledModes.forEach(mode => {
            const el = document.getElementById('mode-' + mode);
            if (el) {
                if (droneEnabled) el.classList.add('disabled');
                else el.classList.remove('disabled');
            }
        });
    };

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        groundY = height * 0.75;
        if(!isDead && !isStarted) player.y = groundY - player.height;
    }
    window.addEventListener('resize', resize); resize();

    window.startGame = function(mode) {
        if (droneEnabled && ['cube', 'ball', 'robot', 'spider'].includes(mode)) {
            mode = 'ship';
        }
        focusMode = mode; isStarted = true;
        mainMenu.style.display = 'none'; gameHud.style.display = 'block';
        resetGame();
    };

    let inputActive = false;
    function handleInputStart(e) {
        if (!isStarted || isDead) return;
        if (e && e.type === 'touchstart' && inputActive) return;

        inputActive = true; clickHistory.push(Date.now());

        if (player.mode === 'cube' && player.isGrounded) { player.vy = JUMP_FORCE * player.gravityDir; player.isGrounded = false; }
        else if (player.mode === 'ufo') { player.vy = JUMP_FORCE * 0.72 * player.gravityDir; }
        else if (player.mode === 'ball' && player.isGrounded) { player.gravityDir *= -1; player.isGrounded = false; }
        else if (player.mode === 'robot' && player.isGrounded) { player.vy = JUMP_FORCE * 0.6 * player.gravityDir; player.isGrounded = false; player.robotHoldTime = 0; }
        else if (player.mode === 'spider' && player.isGrounded) {
            player.gravityDir *= -1; 
            player.isGrounded = false;
            let targetY = player.gravityDir === 1 ? groundY - player.height : height * 0.1;
            let closestDist = Math.abs(player.y - targetY);
            for (let obs of obstacles) {
                if (obs.type === 'block') {
                    const ox = obs.x - cameraX;
                    if (player.x + player.width > ox && player.x < ox + obs.w) {
                        if (player.gravityDir === 1 && obs.y > player.y) {
                            let dist = obs.y - player.height - player.y;
                            if (dist > 0 && dist < closestDist) { targetY = obs.y - player.height; closestDist = dist; }
                        } else if (player.gravityDir === -1 && obs.y + obs.h < player.y) {
                            let dist = player.y - (obs.y + obs.h);
                            if (dist > 0 && dist < closestDist) { targetY = obs.y + obs.h; closestDist = dist; }
                        }
                    }
                }
            }
            player.y = targetY; player.vy = 0; player.isGrounded = true;
            for(let i=0; i<15; i++) particles.push({ x: player.x + Math.random()*player.width, y: player.y + Math.random()*player.height, vx: (Math.random()-0.5)*10, vy: (Math.random()-0.5)*10, life: 1, color: '#ff00ff', size: 4 });
        }
        else if (player.mode === 'swing') {
            player.gravityDir *= -1;
            player.vy += JUMP_FORCE * 0.2 * player.gravityDir;
            swingHue = (swingHue + 45) % 360;
        }
    }
    function handleInputEnd() { inputActive = false; }

    window.addEventListener('keydown', (e) => { if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); handleInputStart(); }});
    window.addEventListener('keyup', (e) => { if (e.code === 'Space' || e.code === 'ArrowUp') handleInputEnd(); });
    window.addEventListener('mousedown', handleInputStart); window.addEventListener('mouseup', handleInputEnd);
    window.addEventListener('touchstart', (e) => { if(e.target.tagName !== 'A' && e.target.className !== 'menu-btn' && e.target.className !== 'diff-btn') e.preventDefault(); handleInputStart(e); }, {passive: false});
    window.addEventListener('touchend', handleInputEnd);

    window.resetGame = function() {
        isDead = false; cameraX = 0; frameCount = 0;
        player.mode = focusMode === 'random' ? (droneEnabled ? 'ship' : 'cube') : focusMode; 
        player.gravityDir = 1; player.vy = 0; player.rot = 0;
        player.y = droneEnabled ? height / 2 : groundY - player.height; 
        player.isGrounded = !droneEnabled;
        deathScreen.style.display = 'none'; particles = [];
        droneProjectiles = []; drone.active = droneEnabled; drone.angle = 0; drone.shootTimer = 60; drone.state = 'idle'; drone.laserTimer = 0;
        generateLevel();
    };

    function generateLevel() {
        obstacles = []; let x = 1500;
        const modes = drone.active ? ['ship', 'ufo', 'wave', 'swing'] : ['ship', 'ball', 'ufo', 'wave', 'cube', 'robot', 'spider', 'swing'];
        let currentMode = player.mode;
        const ceilingY = height * 0.1;

        for (let i = 0; i < 30; i++) {
            const sectionLength = (diff === 'hard' ? 12 : (diff === 'easy' ? 4 : 8)) + Math.floor(Math.random() * 4);
            let waveY = height / 2;
            let waveGap = diff === 'hard' ? 140 : (diff === 'easy' ? 450 : 280);
            for (let j = 0; j < sectionLength; j++) {
                const patternType = Math.random();
                switch(currentMode) {
                    case 'cube':
                        if (patternType < 0.4) {
                            obstacles.push({ type: 'block', x: x, y: groundY - 40, w: 40, h: 40 });
                            if (diff === 'hard') obstacles.push({ type: 'spike', x: x, y: groundY - 40, w: 40, h: 40 });
                            obstacles.push({ type: 'block', x: x + 80, y: groundY - 80, w: 40, h: 80 });
                            x += 240;
                        } else if (patternType < 0.7) {
                            let count = diff === 'hard' ? 4 : (diff === 'easy' ? 1 : 3);
                            for(let s=0; s<count; s++) obstacles.push({ type: 'spike', x: x + s*42, y: groundY, w: 40, h: 40 });
                            x += 150 + count * 42;
                        } else {
                            obstacles.push({ type: 'block', x: x, y: groundY - 120, w: 40, h: 120 });
                            obstacles.push({ type: 'spike', x: x, y: groundY - 120, w: 40, h: 40 });
                            x += 350;
                        }
                        break;
                    case 'ship':
                        const ty = ceilingY + 50 + Math.random() * (height*0.3);
                        const gap = (diff === 'hard' ? 120 : (diff === 'easy' ? 300 : 180));
                        obstacles.push({ type: 'block', x: x, y: 0, w: 60, h: ty });
                        obstacles.push({ type: 'block', x: x, y: ty + gap, w: 60, h: height });
                        if (diff === 'hard') obstacles.push({ type: 'spike', x: x+10, y: ty + gap, w: 40, h: 40, inverted: false });
                        x += diff === 'hard' ? 220 : 350;
                        break;
                    case 'ball':
                        const isT = Math.random() > 0.5;
                        const gateH = diff === 'hard' ? 240 : (diff === 'easy' ? 120 : 180);
                        obstacles.push({ type: 'block', x: x, y: isT ? ceilingY : groundY - gateH, w: 40, h: gateH });
                        obstacles.push({ type: 'spike', x: x, y: isT ? ceilingY + gateH + 40 : groundY - gateH, w: 40, h: 40, inverted: isT });
                        if (diff === 'hard') x += 120; else x += 250;
                        break;
                    case 'ufo':
                        const uGap = diff === 'hard' ? 110 : (diff === 'easy' ? 250 : 160);
                        const uY = ceilingY + 50 + Math.random() * (groundY - ceilingY - uGap - 100);
                        obstacles.push({ type: 'block', x: x, y: 0, w: 40, h: uY });
                        obstacles.push({ type: 'block', x: x, y: uY + uGap, w: 40, h: height });
                        x += diff === 'hard' ? 200 : 350;
                        break;
                    case 'wave':
                        const wWidth = diff === 'hard' ? 60 : 100;
                        waveY += (Math.random() - 0.5) * 300;
                        const minY = ceilingY + waveGap/2 + 20; const maxY = groundY - waveGap/2 - 20;
                        waveY = Math.max(minY, Math.min(maxY, waveY));
                        obstacles.push({ type: 'spike', x: x, y: groundY, w: wWidth, h: groundY - (waveY + waveGap/2) });
                        obstacles.push({ type: 'spike', x: x, y: waveY - waveGap/2, w: wWidth, h: (waveY - waveGap/2) - ceilingY, inverted: true });
                        x += wWidth;
                        break;
                    case 'robot':
                        obstacles.push({ type: 'block', x: x, y: groundY - 40, w: 160, h: 40 });
                        if (diff === 'hard') obstacles.push({ type: 'spike', x: x+60, y: groundY - 40, w: 40, h: 40 });
                        x += diff === 'hard' ? 250 : 400;
                        break;
                    case 'spider':
                        const sY = Math.random() > 0.5 ? ceilingY + 160 : groundY - 160;
                        obstacles.push({ type: 'block', x: x, y: sY, w: 80, h: 40 });
                        obstacles.push({ type: 'spike', x: x + 20, y: sY + (sY < height/2 ? 80 : 0), w: 40, h: 40, inverted: sY < height/2 });
                        x += diff === 'hard' ? 200 : 450;
                        break;
                    case 'swing':
                        const swGap = diff === 'hard' ? 130 : 250;
                        const swY = ceilingY + 100 + Math.random() * (groundY - ceilingY - swGap - 200);
                        obstacles.push({ type: 'block', x: x, y: 0, w: 60, h: swY });
                        obstacles.push({ type: 'block', x: x, y: swY + swGap, w: 60, h: height });
                        x += diff === 'hard' ? 240 : 400;
                        break;
                }
                let g = (diff === 'hard' ? 300 : (diff === 'easy' ? 600 : 450)) + Math.random() * 200;
                if (currentMode === 'wave') g = 0;
                x += g;
            }
            let nextMode = modes[Math.floor(Math.random() * modes.length)];
            obstacles.push({ type: 'portal', x: x + 100, y: 0, w: 80, h: height, mode: nextMode });
            currentMode = nextMode; x += 1000;
        }
        levelLength = x + 1000;
    }

    function checkTriangleCollision(px, py, pw, ph, sx, sy, sw, sh, inverted) {
        const points = [{x: px, y: py}, {x: px + pw, y: py}, {x: px, y: py + ph}, {x: px + pw, y: py + ph}];
        const v1 = {x: sx, y: inverted ? sy - sh : sy}, v2 = {x: sx + sw, y: inverted ? sy - sh : sy}, v3 = {x: sx + sw/2, y: inverted ? sy : sy - sh};
        function side(p1, p2, p3) { return (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y); }
        function inT(p, a, b, c) {
            const s1 = side(p, a, b), s2 = side(p, b, c), s3 = side(p, c, a);
            return !(((s1 < 0) || (s2 < 0) || (s3 < 0)) && ((s1 > 0) || (s2 > 0) || (s3 > 0)));
        }
        for(let p of points) if(inT(p, v1, v2, v3)) return true;
        return false;
    }

    function die() {
        if (isDead) return; isDead = true; deathScreen.style.display = 'block';
        for(let i=0; i<50; i++) particles.push({ x: player.x + player.width/2, y: player.y + player.height/2, vx: (Math.random()-0.5)*25, vy: (Math.random()-0.5)*25, life: 1, color: '#ff0000', size: Math.random()*12+2 });
    }

    function update() {
        if (!isStarted || isDead) return;
        frameCount++; cameraX += GAME_SPEED; updateCPS();
        const prevY = player.y;
        switch(player.mode) {
            case 'cube': player.vy += GRAVITY * player.gravityDir; if (!player.isGrounded) player.rot += 0.25 * player.gravityDir; else player.rot = Math.round(player.rot / (Math.PI/2)) * (Math.PI/2); break;
            case 'ship': if (inputActive) player.vy += SHIP_THRUST * player.gravityDir; player.vy += (GRAVITY * 0.4) * player.gravityDir; player.vy *= 0.96; player.rot = player.vy * 0.05; break;
            case 'ball': player.vy += (GRAVITY * 2.8) * player.gravityDir; player.rot += 0.25 * player.gravityDir; break;
            case 'ufo': player.vy += (GRAVITY * 0.9) * player.gravityDir; player.rot = 0; break;
            case 'wave': if (inputActive) player.vy = -WAVE_SPEED * player.gravityDir; else player.vy = WAVE_SPEED * player.gravityDir; player.rot = Math.atan2(player.vy, GAME_SPEED); break;
            case 'robot': if (inputActive && player.robotHoldTime < 12 && !player.isGrounded) { player.vy += (JUMP_FORCE * 0.12) * player.gravityDir; player.robotHoldTime++; } player.vy += GRAVITY * player.gravityDir; player.rot = player.gravityDir === 1 ? 0 : Math.PI; break;
            case 'spider': player.vy += GRAVITY * 4 * player.gravityDir; player.rot = player.gravityDir === 1 ? 0 : Math.PI; break;
            case 'swing': player.vy += (GRAVITY * 0.7) * player.gravityDir; player.vy *= 0.98; player.rot = player.vy * 0.05; break;
        }
        player.y += player.vy; player.isGrounded = false;
        const ceilLimit = height * 0.1;
        if (player.y + player.height >= groundY) { player.y = groundY - player.height; player.vy = 0; if (player.gravityDir === 1) player.isGrounded = true; }
        if (player.y <= ceilLimit) { player.y = ceilLimit; player.vy = 0; if (player.gravityDir === -1) player.isGrounded = true; }
        if (player.y < -100 || player.y > height + 100) die();

        for (let obs of obstacles) {
            const ox = obs.x - cameraX; if (ox + obs.w < -50 || ox > width + 50) continue;
            if (obs.type === 'portal') {
                if (player.x + player.width > ox && player.x < ox + obs.w) {
                    if (player.mode !== obs.mode) { player.mode = obs.mode; player.gravityDir = 1; for(let i=0; i<15; i++) particles.push({ x: player.x, y: player.y + player.height/2, vx: (Math.random()-0.5)*10, vy: (Math.random()-0.5)*10, life: 1, color: '#fff', size: 4 }); }
                }
                continue;
            }
            if (obs.type === 'spike') {
                if(checkTriangleCollision(player.x+5, player.y+5, player.width-10, player.height-10, ox, obs.y, obs.w, obs.h, obs.inverted)) { die(); return; }
            }
            if (obs.type === 'block') {
                if (player.x + player.width > ox + 2 && player.x < ox + obs.w - 2 && player.y + player.height > obs.y && player.y < obs.y + obs.h) {
                    if (player.vy * player.gravityDir >= 0 && (player.gravityDir === 1 ? prevY + player.height <= obs.y + 20 : prevY >= obs.y + obs.h - 20)) { 
                        player.y = player.gravityDir === 1 ? obs.y - player.height : obs.y + obs.h; 
                        player.vy = 0; 
                        player.isGrounded = true; 
                    }
                    else { die(); return; }
                }
            }
        }
        const pColor = player.mode === 'swing' ? `hsl(${swingHue}, 100%, 50%)` : {cube:'#00ff00', ship:'#ff00ff', ball:'#ffaa00', ufo:'#00ffff', wave:'#0000ff', robot:'#ffffff', spider:'#ff0055'}[player.mode] || '#fff';
        if (frameCount % 2 === 0) {
            if (player.mode === 'ship') particles.push({ x: player.x, y: player.y + player.height / 2 + (Math.random() - 0.5) * 10, vx: -5 - Math.random() * 5, vy: (Math.random() - 0.5) * 4, life: 1, color: inputActive ? '#ffaa00' : '#555', size: Math.random() * 6 + 2 });
            else if (player.mode === 'wave') particles.push({ x: player.x + player.width / 2, y: player.y + player.height / 2, vx: 0, vy: 0, life: 1, color: pColor, size: 8 });
            else if (player.isGrounded) particles.push({ x: player.x, y: player.gravityDir === 1 ? player.y + player.height : player.y, vx: -3 - Math.random() * 2, vy: -player.gravityDir * (Math.random() * 2), life: 0.8, color: pColor, size: Math.random() * 4 + 1 });
        }
        particles.forEach((p, i) => { p.x += p.vx; p.y += p.vy; if (!isDead) p.x -= GAME_SPEED * 0.2; p.life -= (isDead ? 0.015 : 0.04); if (p.life <= 0) particles.splice(i, 1); });
        
        if (drone.active) {
            drone.angle += 0.05; drone.x = player.x + 400; let midY = (groundY + (height * 0.1)) / 2, amp = (groundY - (height * 0.1)) / 2 - 30; drone.y = midY + Math.sin(drone.angle) * amp;
            if (drone.state === 'idle') {
                drone.shootTimer--;
                if (drone.shootTimer <= 0) {
                    let r = Math.random();
                    if (r < 0.33) { let dx = (player.x + player.width/2) - drone.x, dy = (player.y + player.height/2) - drone.y, a = Math.atan2(dy, dx); for (let off of [-0.2, 0, 0.2]) droneProjectiles.push({ type: 'normal', x: drone.x, y: drone.y, vx: Math.cos(a+off)*8, vy: Math.sin(a+off)*8, life: 100, size: 4 }); drone.shootTimer = 60; }
                    else if (r < 0.66) { let dx = (player.x + player.width/2) - drone.x, dy = (player.y + player.height/2) - drone.y, m = Math.hypot(dx, dy); droneProjectiles.push({ type: 'homing', x: drone.x, y: drone.y, vx: (dx/m)*4, vy: (dy/m)*4, life: 150, size: 10 }); drone.shootTimer = 70; }
                    else { drone.state = 'telegraph'; drone.laserTimer = 60; }
                }
            } else if (drone.state === 'telegraph') { drone.laserTimer--; if (drone.laserTimer <= 0) { drone.state = 'laser'; drone.laserTimer = 25; } }
            else if (drone.state === 'laser') { drone.laserTimer--; if (player.x + player.width > drone.x - 2000 && player.x < drone.x && player.y + player.height > drone.y - 15 && player.y < drone.y + 15) die(); if (drone.laserTimer <= 0) { drone.state = 'idle'; drone.shootTimer = 60; } }
        }
        for (let i = droneProjectiles.length - 1; i >= 0; i--) {
            let p = droneProjectiles[i]; if (p.type === 'homing') { let dx = (player.x + player.width/2) - p.x, dy = (player.y + player.height/2) - p.y, m = Math.hypot(dx, dy); p.vx += (dx/m) * 0.15; p.vy += (dy/m) * 0.15; let s = Math.hypot(p.vx, p.vy); if (s > 6) { p.vx = (p.vx/s)*6; p.vy = (p.vy/s)*6; } }
            p.x += p.vx; p.y += p.vy; p.life--; if (p.life <= 0) { droneProjectiles.splice(i, 1); continue; }
            if (Math.abs(p.x - (player.x + player.width/2)) < player.width/2 + p.size/2 && Math.abs(p.y - (player.y + player.height/2)) < player.height/2 + p.size/2) die();
        }
        progressBar.style.width = Math.min((cameraX / levelLength) * 100, 100) + '%';
        if (cameraX >= levelLength) location.reload();
    }

    function draw() {
        const mode = player.mode;
        let groundColor, accentColor;
        const modeThemes = { cube: { h: 190 }, ship: { h: 0 }, ball: { h: 30 }, ufo: { h: 120 }, wave: { h: 200 }, robot: { h: 20 }, spider: { h: 280 }, swing: { h: swingHue } };
        const theme = modeThemes[mode] || modeThemes.cube;
        
        // Flashy Red Background
        const pulse = Math.sin(frameCount * 0.05) * 25;
        ctx.fillStyle = `rgb(${30 + pulse}, 0, 0)`; 
        ctx.fillRect(0, 0, width, height);
        
        // Red Grid
        ctx.strokeStyle = `rgba(255, 0, 0, 0.2)`; 
        ctx.lineWidth = 1; 
        const gridS = 100, offX = -cameraX % gridS; 
        for(let x=offX; x<width; x+=gridS) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
        for(let y=0; y<height; y+=gridS) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }

        accentColor = mode === 'swing' ? `hsl(${swingHue}, 100%, 50%)` : (mode === 'ball' ? (player.gravityDir === 1 ? '#ffaa00' : '#00aaff') : `hsl(${theme.h}, 100%, 50%)`);
        groundColor = '#110000';

        if (mode === 'ufo') {
            ctx.fillStyle = '#fff'; stars.forEach(s => { let sx = (s.x - cameraX * s.speed) % width; if (sx < 0) sx += width; ctx.beginPath(); ctx.arc(sx, s.y, s.size, 0, Math.PI*2); ctx.fill(); });
        }
        else if (mode === 'spider') {
            const grad = ctx.createLinearGradient(0, groundY, 0, groundY - 200); grad.addColorStop(0, 'rgba(57, 255, 20, 0.2)'); grad.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = grad; ctx.fillRect(0, groundY-200, width, 200);
        }
        else if (mode === 'wave') {
            // Electric Azure pulses
            ctx.strokeStyle = 'rgba(0, 170, 255, 0.15)'; ctx.lineWidth = 2;
            for(let i=0; i<5; i++) {
                let x = (i * 400 - cameraX * 0.5) % width; if (x < 0) x += width;
                ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 100, height); ctx.stroke();
            }
        }
        else if (mode === 'robot') {
            // Lava/Magma glow
            ctx.fillStyle = 'rgba(255, 68, 0, 0.1)'; ctx.fillRect(0, 0, width, height);
        }
        else if (mode === 'swing') {
            ctx.save(); ctx.translate(width/2, height/2); ctx.rotate(frameCount*0.005); for(let i=0; i<12; i++) { ctx.rotate(Math.PI/6); ctx.strokeStyle = `hsla(${(frameCount + i*30)%360}, 100%, 50%, 0.1)`; ctx.strokeRect(-width, -height, width*2, height*2); } ctx.restore();
        }
        ctx.fillStyle = groundColor; ctx.fillRect(0, groundY, width, height - groundY); ctx.fillRect(0, 0, width, height * 0.1);
        ctx.strokeStyle = accentColor; ctx.lineWidth = 4;
        if (mode === 'robot') { ctx.strokeStyle = '#ff4400'; ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(width, groundY); ctx.stroke(); ctx.strokeStyle = '#331100'; ctx.setLineDash([10, 5]); ctx.stroke(); ctx.setLineDash([]); }
        else if (mode === 'ship') { ctx.strokeStyle = '#ffd700'; ctx.strokeRect(0, groundY, width, 5); ctx.strokeRect(0, height*0.1-5, width, 5); }
        else { ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(width, groundY); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, height * 0.1); ctx.lineTo(width, height * 0.1); ctx.stroke(); }

        obstacles.forEach(obs => {
            const ox = obs.x - cameraX; if (ox + obs.w < -100 || ox > width + 100) return;
            if (obs.type === 'portal') {
                const colors = {cube:'#00ff00', ship:'#ff00ff', ball:'#ffaa00', ufo:'#00ffff', wave:'#0000ff', robot:'#ff4400', spider:'#ff0055', swing:'#ffff00'};
                ctx.fillStyle = colors[obs.mode] || '#fff'; ctx.globalAlpha = 0.3; ctx.fillRect(ox, 0, obs.w, height); ctx.globalAlpha = 1;
                ctx.strokeStyle = colors[obs.mode] || '#fff'; ctx.lineWidth = 4; ctx.strokeRect(ox, 0, obs.w, height);
                ctx.fillStyle = '#fff'; ctx.font = 'bold 20px Poppins'; ctx.save(); ctx.translate(ox + obs.w/2, height/2); ctx.rotate(-Math.PI/2); ctx.textAlign = 'center'; ctx.fillText(obs.mode.toUpperCase(), 0, 0); ctx.restore();
            } else if (obs.type === 'spike') {
                ctx.save(); ctx.fillStyle = '#fff'; ctx.strokeStyle = accentColor; ctx.lineWidth = 3;
                if (mode === 'cube') {
                    ctx.strokeStyle = '#00ffff'; ctx.lineWidth = 2; ctx.shadowBlur = 15; ctx.shadowColor = '#00ffff';
                    ctx.beginPath(); if (obs.inverted) { ctx.moveTo(ox, obs.y-obs.h); ctx.lineTo(ox+obs.w/2, obs.y); ctx.lineTo(ox+obs.w, obs.y-obs.h); } else { ctx.moveTo(ox, obs.y); ctx.lineTo(ox+obs.w/2, obs.y-obs.h); ctx.lineTo(ox+obs.w, obs.y); } ctx.stroke(); ctx.globalAlpha = 0.2; ctx.fill();
                } else if (mode === 'ship') {
                    ctx.fillStyle = '#222'; ctx.beginPath(); if (obs.inverted) { ctx.moveTo(ox, obs.y-obs.h); ctx.lineTo(ox+obs.w/2, obs.y); ctx.lineTo(ox+obs.w, obs.y-obs.h); } else { ctx.moveTo(ox, obs.y); ctx.lineTo(ox+obs.w/2, obs.y-obs.h); ctx.lineTo(ox+obs.w, obs.y); } ctx.fill(); ctx.strokeStyle = '#ff0000'; ctx.stroke();
                } else if (mode === 'ufo') {
                    ctx.fillStyle = 'rgba(57, 255, 20, 0.3)'; ctx.shadowBlur = 20; ctx.shadowColor = '#39ff14';
                    ctx.beginPath(); if (obs.inverted) { ctx.moveTo(ox, obs.y-obs.h); ctx.lineTo(ox+obs.w/4, obs.y-obs.h/2); ctx.lineTo(ox+obs.w/2, obs.y); ctx.lineTo(ox+3*obs.w/4, obs.y-obs.h/2); ctx.lineTo(ox+obs.w, obs.y-obs.h); } else { ctx.moveTo(ox, obs.y); ctx.lineTo(ox+obs.w/4, obs.y-obs.h/2); ctx.lineTo(ox+obs.w/2, obs.y-obs.h); ctx.lineTo(ox+3*obs.w/4, obs.y-obs.h/2); ctx.lineTo(ox+obs.w, obs.y); } ctx.fill(); ctx.strokeStyle = '#39ff14'; ctx.stroke();
                } else if (mode === 'spider') {
                    ctx.fillStyle = '#110011'; ctx.beginPath(); if (obs.inverted) { ctx.moveTo(ox, obs.y-obs.h); ctx.bezierCurveTo(ox+obs.w/4, obs.y-obs.h, ox+obs.w/2, obs.y-obs.h/2, ox+obs.w/2, obs.y); ctx.bezierCurveTo(ox+obs.w/2, obs.y-obs.h/2, ox+3*obs.w/4, obs.y-obs.h, ox+obs.w, obs.y-obs.h); } else { ctx.moveTo(ox, obs.y); ctx.bezierCurveTo(ox+obs.w/4, obs.y, ox+obs.w/2, obs.y-obs.h/2, ox+obs.w/2, obs.y-obs.h); ctx.bezierCurveTo(ox+obs.w/2, obs.y-obs.h/2, ox+3*obs.w/4, obs.y, ox+obs.w, obs.y); } ctx.fill(); ctx.strokeStyle = '#a020f0'; ctx.stroke();
                } else if (mode === 'wave') {
                    ctx.fillStyle = accentColor; ctx.shadowBlur = 15; ctx.shadowColor = accentColor;
                    ctx.beginPath(); if (obs.inverted) { ctx.moveTo(ox, obs.y-obs.h); ctx.lineTo(ox+obs.w/2, obs.y); ctx.lineTo(ox+obs.w, obs.y-obs.h); } else { ctx.moveTo(ox, obs.y); ctx.lineTo(ox+obs.w/2, obs.y-obs.h); ctx.lineTo(ox+obs.w, obs.y); } ctx.fill(); ctx.strokeStyle = '#fff'; ctx.stroke();
                } else if (mode === 'robot') {
                    // Lava Spike
                    ctx.fillStyle = '#111'; ctx.beginPath(); if (obs.inverted) { ctx.moveTo(ox, obs.y-obs.h); ctx.lineTo(ox+obs.w/2, obs.y); ctx.lineTo(ox+obs.w, obs.y-obs.h); } else { ctx.moveTo(ox, obs.y); ctx.lineTo(ox+obs.w/2, obs.y-obs.h); ctx.lineTo(ox+obs.w, obs.y); } ctx.fill(); ctx.strokeStyle = '#ff4400'; ctx.lineWidth = 4; ctx.stroke(); ctx.shadowBlur = 15; ctx.shadowColor = '#ff4400'; ctx.stroke();
                } else if (mode === 'swing') {
                    ctx.fillStyle = '#fff'; ctx.beginPath(); if (obs.inverted) { ctx.moveTo(ox, obs.y-obs.h); ctx.lineTo(ox+obs.w/2, obs.y); ctx.lineTo(ox+obs.w, obs.y-obs.h); } else { ctx.moveTo(ox, obs.y); ctx.lineTo(ox+obs.w/2, obs.y-obs.h); ctx.lineTo(ox+obs.w, obs.y); } ctx.fill(); ctx.strokeStyle = accentColor; ctx.lineWidth = 5; ctx.stroke();
                } else {
                    ctx.beginPath(); if (obs.inverted) { ctx.moveTo(ox, obs.y-obs.h); ctx.lineTo(ox+obs.w/2, obs.y); ctx.lineTo(ox+obs.w, obs.y-obs.h); } else { ctx.moveTo(ox, obs.y); ctx.lineTo(ox+obs.w/2, obs.y-obs.h); ctx.lineTo(ox+obs.w, obs.y); } ctx.fill(); ctx.stroke();
                }
                ctx.restore();
            } else if (obs.type === 'block') { 
                if (mode === 'cube') {
                    // Digital Circuit Block
                    ctx.fillStyle = '#000'; ctx.fillRect(ox, obs.y, obs.w, obs.h);
                    ctx.strokeStyle = '#00ffff'; ctx.lineWidth = 2; ctx.strokeRect(ox, obs.y, obs.w, obs.h);
                    ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)'; ctx.beginPath();
                    ctx.moveTo(ox+10, obs.y+5); ctx.lineTo(ox+10, obs.y+obs.h-5); ctx.moveTo(ox+5, obs.y+10); ctx.lineTo(ox+obs.w-5, obs.y+10);
                    ctx.stroke(); ctx.fillStyle = '#00ffff'; ctx.fillRect(ox+8, obs.y+8, 4, 4);
                } else if (mode === 'ship') {
                    // Reinforced Aerospace Plating
                    ctx.fillStyle = '#444'; ctx.fillRect(ox, obs.y, obs.w, obs.h);
                    ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 3; ctx.strokeRect(ox, obs.y, obs.w, obs.h);
                    ctx.fillStyle = '#222'; ctx.fillRect(ox+5, obs.y+5, 6, 6); ctx.fillRect(ox+obs.w-11, obs.y+5, 6, 6); ctx.fillRect(ox+5, obs.y+obs.h-11, 6, 6); ctx.fillRect(ox+obs.w-11, obs.y+obs.h-11, 6, 6);
                } else if (mode === 'ball') {
                    // Magnetic Plate
                    ctx.fillStyle = '#111'; ctx.fillRect(ox, obs.y, obs.w, obs.h);
                    ctx.strokeStyle = accentColor; ctx.lineWidth = 4; ctx.strokeRect(ox, obs.y, obs.w, obs.h);
                    ctx.beginPath(); ctx.moveTo(ox+obs.w/2, obs.y+5); ctx.lineTo(ox+obs.w/2, obs.y+obs.h-5); ctx.stroke();
                } else if (mode === 'ufo') {
                    // Lunar Rock / Asteroid
                    ctx.fillStyle = '#222'; ctx.fillRect(ox, obs.y, obs.w, obs.h);
                    ctx.strokeStyle = '#444'; ctx.lineWidth = 4; ctx.strokeRect(ox, obs.y, obs.w, obs.h);
                    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(ox+obs.w*0.3, obs.y+obs.h*0.4, 8, 0, Math.PI*2); ctx.fill();
                    ctx.beginPath(); ctx.arc(ox+obs.w*0.7, obs.y+obs.h*0.7, 5, 0, Math.PI*2); ctx.fill();
                } else if (mode === 'wave') {
                    // Neon Azure Pulse Block
                    ctx.fillStyle = '#000'; ctx.fillRect(ox, obs.y, obs.w, obs.h);
                    ctx.strokeStyle = '#00aaff'; ctx.lineWidth = 3; ctx.strokeRect(ox, obs.y, obs.w, obs.h);
                    ctx.shadowBlur = 10; ctx.shadowColor = '#00aaff'; ctx.strokeRect(ox+5, obs.y+5, obs.w-10, obs.h-10); ctx.shadowBlur = 0;
                } else if (mode === 'robot') { 
                    // Molten Lava Rock
                    ctx.fillStyle = '#000'; ctx.fillRect(ox, obs.y, obs.w, obs.h);
                    ctx.strokeStyle = '#ff4400'; ctx.lineWidth = 3; ctx.strokeRect(ox, obs.y, obs.w, obs.h);
                    // Glowing lava fissures
                    ctx.strokeStyle = 'rgba(255, 68, 0, 0.6)'; ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.moveTo(ox+5, obs.y+10); ctx.lineTo(ox+obs.w-10, obs.y+obs.h-5); ctx.moveTo(ox+obs.w-5, obs.y+5); ctx.lineTo(ox+10, obs.y+obs.h-10); ctx.stroke();
                    ctx.fillStyle = '#ff4400'; if (frameCount % 20 < 10) ctx.fillRect(ox+obs.w/2-2, obs.y+obs.h/2-2, 4, 4);
                } else if (mode === 'spider') {
                    // Venomous Cavern Block
                    ctx.fillStyle = '#050005'; ctx.fillRect(ox, obs.y, obs.w, obs.h);
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'; ctx.lineWidth = 1;
                    // Cobwebs
                    ctx.beginPath(); ctx.moveTo(ox, obs.y); ctx.lineTo(ox+obs.w, obs.y+obs.h); ctx.moveTo(ox+obs.w, obs.y); ctx.lineTo(ox, obs.y+obs.h); ctx.moveTo(ox+obs.w/2, obs.y); ctx.lineTo(ox+obs.w/2, obs.y+obs.h); ctx.stroke();
                } else if (mode === 'swing') {
                    // Prism Glass Block
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'; ctx.fillRect(ox, obs.y, obs.w, obs.h);
                    ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.strokeRect(ox, obs.y, obs.w, obs.h);
                    ctx.strokeStyle = accentColor; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(ox+5, obs.y+5); ctx.lineTo(ox+obs.w-5, obs.y+obs.h-5); ctx.stroke();
                } else {
                    ctx.fillStyle = '#000'; ctx.fillRect(ox, obs.y, obs.w, obs.h); 
                    ctx.strokeStyle = accentColor; ctx.lineWidth = 2; ctx.strokeRect(ox, obs.y, obs.w, obs.h); 
                }
            }
        });
        particles.forEach(p => { ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.size, p.size); });
        ctx.globalAlpha = 1;
        if (!isDead && isStarted) {
            ctx.save(); ctx.translate(player.x + player.width/2, player.y + player.height/2); ctx.rotate(player.rot);
            ctx.shadowBlur = 20; ctx.shadowColor = '#ff0000'; ctx.fillStyle = '#fff';
            
            if (player.mode === 'cube') {
                let s = Math.min(Math.abs(player.vy) * 0.02, 0.2); ctx.scale(1 - s, 1 + s);
                ctx.fillRect(-player.width/2, -player.height/2, player.width, player.height); 
                ctx.strokeStyle = '#000'; ctx.lineWidth = 3; 
                ctx.strokeRect(-player.width/2 + 4, -player.height/2 + 4, player.width - 8, player.height - 8);
                ctx.fillStyle = '#000'; ctx.fillRect(4, -10, 8, 8); ctx.fillRect(16, -10, 8, 8); 
                ctx.fillStyle = '#fff'; ctx.fillRect(8, -8, 2, 2); ctx.fillRect(20, -8, 2, 2); 
                ctx.fillStyle = '#000'; ctx.fillRect(8, 6, 16, 4);
            } else if (player.mode === 'ship') {
                ctx.translate(0, Math.sin(frameCount * 0.1) * 2);
                ctx.beginPath(); ctx.moveTo(-player.width/2, 0); ctx.lineTo(-player.width/4, -player.height/3); ctx.lineTo(player.width/2, -player.height/6); ctx.lineTo(player.width/2, player.height/6); ctx.lineTo(-player.width/4, player.height/3); ctx.closePath(); ctx.fill(); 
                ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.stroke();
                ctx.fillStyle = '#00d4ff'; ctx.beginPath(); ctx.arc(player.width/6, -player.height/8, 10, 0, Math.PI*2); ctx.fill(); 
                if (inputActive) {
                    ctx.fillStyle = '#ffaa00'; ctx.beginPath(); ctx.moveTo(-player.width/2, -5); ctx.lineTo(-player.width/1.2 - Math.random()*10, 0); ctx.lineTo(-player.width/2, 5); ctx.fill();
                }
                ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-player.width/2, 0); ctx.lineTo(-player.width/1.5, -player.height/2); ctx.lineTo(-player.width/3, -player.height/4); ctx.closePath(); ctx.fill(); ctx.stroke();
            } else if (player.mode === 'ball') {
                ctx.beginPath(); ctx.arc(0, 0, player.width/2, 0, Math.PI*2); ctx.fill(); 
                ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.stroke();
                ctx.save(); ctx.rotate(frameCount * 0.2); ctx.strokeStyle = '#000'; ctx.lineWidth = 4; for(let i=0; i<4; i++) { ctx.rotate(Math.PI/2); ctx.beginPath(); ctx.moveTo(player.width/4, -player.width/2); ctx.lineTo(player.width/4, player.width/2); ctx.stroke(); } ctx.restore();
                ctx.fillStyle = '#ff0000'; ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI*2); ctx.fill();
            } else if (player.mode === 'ufo') {
                ctx.translate(0, Math.sin(frameCount * 0.15) * 5);
                ctx.beginPath(); ctx.ellipse(0, 0, player.width/1.2, player.height/2.5, 0, 0, Math.PI*2); ctx.fill(); 
                ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.stroke();
                // Control Room Dome
                ctx.fillStyle = '#ff0000'; ctx.beginPath(); ctx.arc(0, -6, 12, Math.PI, 0); ctx.fill();
                ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.stroke();
                for(let i=0; i<6; i++) { const ang = (Math.PI/3) * i + frameCount*0.05; const lx = Math.cos(ang) * (player.width/1.4), ly = Math.sin(ang) * (player.height/4); ctx.fillStyle = `hsl(${(frameCount*5 + i*60)%360}, 100%, 50%)`; ctx.beginPath(); ctx.arc(lx, ly, 3, 0, Math.PI*2); ctx.fill(); }
                ctx.fillStyle = '#ff0000'; ctx.beginPath(); ctx.arc(0, -6, 4, 0, Math.PI*2); ctx.fill();
            } else if (player.mode === 'wave') {
                ctx.beginPath(); ctx.moveTo(-player.width/2, player.height/2); ctx.lineTo(player.width/2, 0); ctx.lineTo(-player.width/2, -player.height/2); ctx.lineTo(-player.width/4, 0); ctx.closePath(); ctx.fill(); 
                ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.stroke();
                ctx.fillStyle = '#ff0000'; ctx.beginPath(); ctx.moveTo(-player.width/4, -2); ctx.lineTo(player.width/4, 0); ctx.lineTo(-player.width/4, 2); ctx.fill();
            } else if (player.mode === 'robot') {
                ctx.fillRect(-player.width/2.5, -player.height/2, player.width/1.25, player.height/1.5);
                ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.strokeRect(-player.width/2.5, -player.height/2, player.width/1.25, player.height/1.5);
                let wc = Math.sin(frameCount * 0.3) * 10, lo = player.isGrounded ? 0 : 5;
                ctx.fillStyle = '#aaa'; ctx.fillRect(-player.width/3, player.height/6 + lo + (wc > 0 ? wc : 0), 8, player.height/3); ctx.fillRect(player.width/4 - 2, player.height/6 + lo + (wc < 0 ? -wc : 0), 8, player.height/3);
                ctx.fillStyle = '#00ff00'; ctx.fillRect(-player.width/6, -player.height/3, player.width/3, 6);
            } else if (player.mode === 'spider') {
                ctx.beginPath(); ctx.ellipse(0, 0, player.width/2.5, player.height/3, 0, 0, Math.PI*2); ctx.fill(); 
                ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.stroke();
                ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
                let sk = player.isGrounded ? Math.sin(frameCount * 0.5) * 10 : 0;
                for (let i = -1; i <= 1; i+=2) {
                    ctx.beginPath(); ctx.moveTo(i*player.width/4, 0); ctx.lineTo(i*player.width/2, -10 + sk); ctx.lineTo(i*player.width/1.5, player.height/2); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(i*player.width/4, 5); ctx.lineTo(i*player.width/2, 10 - sk); ctx.lineTo(i*player.width/1.2, player.height/2); ctx.stroke();
                }
                ctx.fillStyle = '#ff0000'; ctx.beginPath(); ctx.arc(player.width/6, -player.height/8, 3, 0, Math.PI*2); ctx.fill();
            } else if (player.mode === 'swing') {
                ctx.beginPath(); ctx.arc(0, 0, player.width/2, 0, Math.PI*2); ctx.fill(); 
                ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.stroke();
                ctx.save(); ctx.rotate(frameCount * 0.1);
                ctx.fillStyle = '#aaa'; ctx.fillRect(-player.width/6, -player.height/2 - 8, player.width/3, 8);
                ctx.fillStyle = '#fff'; ctx.fillRect(-player.width/2, -player.height/2 - 12, player.width, 4);
                ctx.restore();
                ctx.fillStyle = '#00ffff'; ctx.beginPath(); ctx.arc(0, 0, 10 + Math.sin(frameCount*0.2)*4, 0, Math.PI*2); ctx.fill();
            }
            ctx.restore();
            if (drone.active) {
                if (drone.state === 'telegraph') { ctx.fillStyle = `rgba(255, 0, 0, ${0.3 + Math.sin(frameCount*0.5)*0.2})`; ctx.fillRect(player.x - 1000, drone.y - 2, 2000, 4); }
                else if (drone.state === 'laser') { ctx.fillStyle = '#fff'; ctx.shadowBlur = 20; ctx.shadowColor = '#ff0000'; ctx.fillRect(player.x - 1000, drone.y - 15, 2000, 30); ctx.fillStyle = '#ff0000'; ctx.fillRect(player.x - 1000, drone.y - 20, 2000, 40); ctx.shadowBlur = 0; }
                ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(drone.x, drone.y, 20, 0, Math.PI*2); ctx.fill(); ctx.strokeStyle = '#ff0000'; ctx.lineWidth = 3; ctx.stroke(); ctx.fillStyle = '#ff0000'; ctx.beginPath(); ctx.arc(drone.x, drone.y, 8, 0, Math.PI*2); ctx.fill();
                let dx = (player.x + player.width/2) - drone.x, dy = (player.y + player.height/2) - drone.y, mag = Math.hypot(dx, dy); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(drone.x + (dx/mag)*8, drone.y + (dy/mag)*8, 4, 0, Math.PI*2); ctx.fill();
            }
            droneProjectiles.forEach(p => { ctx.save(); ctx.translate(p.x, p.y); if (p.type === 'normal') { ctx.rotate(Math.atan2(p.vy, p.vx)); ctx.fillStyle = '#ff0000'; ctx.shadowBlur = 10; ctx.shadowColor = '#ff0000'; ctx.fillRect(-10, -2, 20, 4); ctx.fillStyle = '#fff'; ctx.fillRect(-5, -1, 10, 2); } else if (p.type === 'homing') { ctx.rotate(frameCount * 0.1); ctx.fillStyle = '#ff00ff'; ctx.shadowBlur = 15; ctx.shadowColor = '#ff00ff'; ctx.beginPath(); ctx.arc(0, 0, p.size, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, p.size/2, 0, Math.PI*2); ctx.fill(); } ctx.restore(); });
        }
        requestAnimationFrame(() => { update(); draw(); });
    }
    draw();
})();
