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

        function setDiff(d) {
            diff = d;
            document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
            document.getElementById(d).classList.add('active');
            if (d === 'easy') { GRAVITY = 0.9; JUMP_FORCE = -15; SHIP_THRUST = -1.3; WAVE_SPEED = 11; GAME_SPEED = 10; }
            else if (d === 'normal') { GRAVITY = 1.0; JUMP_FORCE = -16; SHIP_THRUST = -1.4; WAVE_SPEED = 13; GAME_SPEED = 12; }
            else { GRAVITY = 1.1; JUMP_FORCE = -17; SHIP_THRUST = -1.6; WAVE_SPEED = 15; GAME_SPEED = 14; }
        }

        let focusMode = 'random', clickHistory = [];
        function updateCPS() {
            const now = Date.now();
            clickHistory = clickHistory.filter(t => now - t < 1000);
            cpsSpan.innerText = clickHistory.length;
        }

        let player = { x: 200, y: 0, vy: 0, rot: 0, mode: 'cube', width: PLAYER_SIZE, height: PLAYER_SIZE, isGrounded: false, gravityDir: 1, robotHoldTime: 0 };
        let obstacles = [], particles = [], cameraX = 0, isDead = false, isStarted = false, frameCount = 0, levelLength = 50000;
        let droneEnabled = false, drone = { active: false, angle: 0, dist: 150, x: 0, y: 0, shootTimer: 0, state: 'idle', laserTimer: 0, laserY: 0 }, droneProjectiles = [];

        function toggleDrone() {
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
                    if (droneEnabled) {
                        el.classList.add('disabled');
                    } else {
                        el.classList.remove('disabled');
                    }
                }
            });
        }

        function resize() {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
            groundY = height * 0.75;
            if(!isDead && !isStarted) player.y = groundY - player.height;
        }
        window.addEventListener('resize', resize); resize();

        function startGame(mode) {
            if (droneEnabled && ['cube', 'ball', 'robot', 'spider'].includes(mode)) {
                mode = 'ship';
            }
            focusMode = mode; isStarted = true;
            mainMenu.style.display = 'none'; gameHud.style.display = 'block';
            resetGame();
        }

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
                player.y = targetY;
                player.vy = 0;
                player.isGrounded = true;
                
                for(let i=0; i<15; i++) particles.push({ x: player.x + Math.random()*player.width, y: player.y + Math.random()*player.height, vx: (Math.random()-0.5)*10, vy: (Math.random()-0.5)*10, life: 1, color: '#ff00ff', size: 4 });
            }
            else if (player.mode === 'swing') { 
                player.gravityDir *= -1; 
                player.vy += JUMP_FORCE * 0.2 * player.gravityDir; 
            }
        }
        function handleInputEnd() { inputActive = false; }

        window.addEventListener('keydown', (e) => { if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); handleInputStart(); }});
        window.addEventListener('keyup', (e) => { if (e.code === 'Space' || e.code === 'ArrowUp') handleInputEnd(); });
        window.addEventListener('mousedown', handleInputStart); window.addEventListener('mouseup', handleInputEnd);
        window.addEventListener('touchstart', (e) => { if(e.target.tagName !== 'A' && e.target.className !== 'menu-btn' && e.target.className !== 'diff-btn') e.preventDefault(); handleInputStart(e); }, {passive: false});
        window.addEventListener('touchend', handleInputEnd);

        function resetGame() {
            isDead = false; cameraX = 0; frameCount = 0;
            player.mode = focusMode === 'random' ? (droneEnabled ? 'ship' : 'cube') : focusMode; 
            player.gravityDir = 1; player.vy = 0; player.rot = 0;
            player.y = droneEnabled ? height / 2 : groundY - player.height; 
            player.isGrounded = !droneEnabled;
            deathScreen.style.display = 'none'; particles = [];
            droneProjectiles = []; drone.active = droneEnabled; drone.angle = 0; drone.shootTimer = 60; drone.state = 'idle'; drone.laserTimer = 0;
            generateLevel();
        }

        function generateLevel() {
            obstacles = []; let x = 1500;
            const modes = drone.active ? ['ship', 'ufo', 'wave', 'swing'] : ['ship', 'ball', 'ufo', 'wave', 'cube', 'robot', 'spider', 'swing'];
            let currentMode = player.mode;
            const ceilingY = height * 0.1;

            for (let i = 0; i < 20; i++) {
                const sectionLength = (diff === 'hard' ? 10 : (diff === 'easy' ? 4 : 6)) + Math.floor(Math.random() * (diff === 'hard' ? 4 : (diff === 'easy' ? 3 : 4)));
                let waveY = height / 2;
                let waveGap = diff === 'hard' ? 240 : (diff === 'easy' ? 400 : 320);
                for (let j = 0; j < sectionLength; j++) {
                    const patternType = Math.random();
                    switch(currentMode) {
                        case 'cube':
                            if (patternType < 0.3) {
                                obstacles.push({ type: 'block', x: x, y: groundY - 40, w: 40, h: 40 });
                                obstacles.push({ type: 'block', x: x + 40, y: groundY - 80, w: 40, h: 80 });
                                obstacles.push({ type: 'spike', x: x + 40, y: groundY - 80, w: 40, h: 40 });
                                x += 220;
                            } else if (patternType < 0.6) {
                                for(let s=0; s<3; s++) obstacles.push({ type: 'spike', x: x + s*42, y: groundY, w: 40, h: 40 });
                                x += 300;
                            } else {
                                obstacles.push({ type: 'block', x: x, y: groundY - 80, w: 40, h: 80 });
                                obstacles.push({ type: 'spike', x: x, y: groundY - 80, w: 40, h: 40 });
                                x += 350;
                            }
                            break;
                        case 'ship':
                            if (patternType < 0.5) {
                                const ty = ceilingY + 50 + Math.random() * 100;
                                const gap = (diff === 'hard' ? 150 : (diff === 'easy' ? 250 : 200)) + Math.random() * 40;
                                obstacles.push({ type: 'block', x: x, y: 0, w: 40, h: ty });
                                obstacles.push({ type: 'block', x: x, y: ty + gap, w: 40, h: height });
                                x += 200;
                            } else {
                                const cy = height / 2 + (Math.random() - 0.5) * 100;
                                obstacles.push({ type: 'block', x: x, y: cy - 40, w: 40, h: 80 });
                                obstacles.push({ type: 'spike', x: x, y: cy - 80, w: 40, h: 40, inverted: true });
                                obstacles.push({ type: 'spike', x: x, y: cy + 40, w: 40, h: 40, inverted: false });
                                x += 250;
                            }
                            break;
                        case 'ball':
                            const isT = Math.random() > 0.5;
                            const gateH = diff === 'hard' ? 150 : (diff === 'easy' ? 220 : 180);
                            obstacles.push({ type: 'block', x: x, y: isT ? ceilingY : groundY - gateH, w: 40, h: gateH });
                            obstacles.push({ type: 'spike', x: x, y: isT ? ceilingY + gateH + 40 : groundY - gateH, w: 40, h: 40, inverted: isT });
                            if (diff === 'hard') obstacles.push({ type: 'spike', x: x, y: isT ? groundY : ceilingY + 40, w: 40, h: 40, inverted: !isT });
                            x += 180;
                            break;
                        case 'ufo':
                            if (patternType < 0.4) {
                                const uY = groundY - 350 + Math.random() * 150;
                                const uGap = diff === 'hard' ? 130 : (diff === 'easy' ? 220 : 180);
                                obstacles.push({ type: 'block', x: x, y: 0, w: 60, h: uY });
                                obstacles.push({ type: 'block', x: x, y: uY + uGap, w: 60, h: height });
                                x += 250;
                            } else if (patternType < 0.7) {
                                const cy1 = ceilingY + 100 + Math.random() * 50;
                                const cy2 = groundY - 150 - Math.random() * 50;
                                obstacles.push({ type: 'block', x: x, y: cy1, w: 40, h: 40 });
                                obstacles.push({ type: 'block', x: x + 150, y: cy2, w: 40, h: 40 });
                                x += 300;
                            } else {
                                const h = 250;
                                obstacles.push({ type: 'block', x: x, y: groundY - h, w: 80, h: h });
                                obstacles.push({ type: 'spike', x: x + 20, y: groundY - h - 40, w: 40, h: 40, inverted: true });
                                x += 300;
                            }
                            break;
                        case 'wave':
                            const wWidth = 80;
                            const segmentCount = 6;
                            for(let k=0; k<segmentCount; k++) {
                                waveY += (Math.random() - 0.5) * 200;
                                const minWaveY = ceilingY + waveGap/2 + 20;
                                const maxWaveY = groundY - waveGap/2 - 20;
                                waveY = Math.max(minWaveY, Math.min(maxWaveY, waveY));
                                
                                const ox = x + k * wWidth;
                                const bH = groundY - (waveY + waveGap/2);
                                obstacles.push({ type: 'spike', x: ox, y: groundY, w: wWidth, h: bH });
                                const tH = (waveY - waveGap/2) - ceilingY;
                                obstacles.push({ type: 'spike', x: ox, y: waveY - waveGap/2, w: wWidth, h: tH, inverted: true });
                            }
                            x += wWidth * segmentCount;
                            break;
                        case 'robot':
                            if (patternType < 0.33) {
                                obstacles.push({ type: 'block', x: x, y: groundY - 40, w: 120, h: 40 });
                                obstacles.push({ type: 'spike', x: x + 120, y: groundY, w: 40, h: 40 });
                                obstacles.push({ type: 'spike', x: x + 160, y: groundY, w: 40, h: 40 });
                                x += 250;
                            } else if (patternType < 0.66) {
                                obstacles.push({ type: 'block', x: x, y: groundY - 40, w: 40, h: 40 });
                                obstacles.push({ type: 'block', x: x + 40, y: groundY - 80, w: 40, h: 80 });
                                obstacles.push({ type: 'block', x: x + 80, y: groundY - 120, w: 40, h: 120 });
                                obstacles.push({ type: 'spike', x: x + 120, y: groundY, w: 40, h: 40 });
                                x += 300;
                            } else {
                                const ph = diff === 'hard' ? 160 : 120;
                                obstacles.push({ type: 'block', x: x, y: groundY - ph, w: 60, h: ph });
                                obstacles.push({ type: 'spike', x: x - 40, y: groundY, w: 40, h: 40 });
                                x += 350;
                            }
                            break;
                        case 'spider':
                            if (patternType < 0.33) {
                                obstacles.push({ type: 'block', x: x, y: groundY - 120, w: 80, h: 120 });
                                obstacles.push({ type: 'spike', x: x, y: groundY - 120, w: 40, h: 40, inverted: false });
                                obstacles.push({ type: 'spike', x: x + 40, y: groundY - 120, w: 40, h: 40, inverted: false });
                                if (diff !== 'easy') obstacles.push({ type: 'spike', x: x + (diff === 'hard' ? 120 : 160), y: ceilingY + 40, w: 40, h: 40, inverted: true });
                                x += 300;
                            } else if (patternType < 0.66) {
                                obstacles.push({ type: 'block', x: x, y: ceilingY, w: 80, h: 120 });
                                obstacles.push({ type: 'spike', x: x, y: ceilingY + 160, w: 40, h: 40, inverted: true });
                                obstacles.push({ type: 'spike', x: x + 40, y: ceilingY + 160, w: 40, h: 40, inverted: true });
                                if (diff !== 'easy') obstacles.push({ type: 'spike', x: x + (diff === 'hard' ? 120 : 160), y: groundY, w: 40, h: 40, inverted: false });
                                x += 300;
                            } else {
                                obstacles.push({ type: 'spike', x: x, y: groundY, w: 40, h: 40, inverted: false });
                                obstacles.push({ type: 'spike', x: x + (diff === 'hard' ? 120 : 160), y: ceilingY + 40, w: 40, h: 40, inverted: true });
                                obstacles.push({ type: 'spike', x: x + (diff === 'hard' ? 240 : 320), y: groundY, w: 40, h: 40, inverted: false });
                                obstacles.push({ type: 'spike', x: x + (diff === 'hard' ? 360 : 480), y: ceilingY + 40, w: 40, h: 40, inverted: true });
                                x += diff === 'hard' ? 450 : 600;
                            }
                            break;
                        case 'swing':
                            if (patternType < 0.5) {
                                const isTop = j % 2 === 0;
                                const h = 180 + Math.random() * 60;
                                obstacles.push({ type: 'block', x: x, y: isTop ? 0 : groundY - h, w: 80, h: h });
                                obstacles.push({ type: 'spike', x: x + 20, y: isTop ? h : groundY - h - 40, w: 40, h: 40, inverted: !isTop });
                                x += 280;
                            } else {
                                const steps = 3;
                                const startY = ceilingY + 50 + Math.random() * 100;
                                const slope = (Math.random() > 0.5 ? 1 : -1) * 40;
                                const sGap = diff === 'hard' ? 160 : (diff === 'easy' ? 260 : 210);
                                for (let s = 0; s < steps; s++) {
                                    const yPos = startY + s * slope;
                                    obstacles.push({ type: 'block', x: x + s*100, y: 0, w: 40, h: yPos });
                                    obstacles.push({ type: 'block', x: x + s*100, y: yPos + sGap, w: 40, h: height });
                                }
                                x += steps * 100 + 100;
                            }
                            break;
                    }
                    let gap = (diff === 'hard' ? 400 : (diff === 'easy' ? 800 : 550)) + Math.random() * (diff === 'hard' ? 200 : (diff === 'easy' ? 400 : 300));
                    if (currentMode === 'wave') gap = 0;
                    x += gap;
                }
                let nextMode = (focusMode !== 'random' && Math.random() < 0.7) ? focusMode : modes[Math.floor(Math.random() * modes.length)];
                while(nextMode === currentMode) nextMode = modes[Math.floor(Math.random() * modes.length)];
                obstacles.push({ type: 'portal', x: x + 250, y: 0, w: 80, h: height, mode: nextMode });
                currentMode = nextMode; x += 1200;
            }
            levelLength = x + 1000;
        }

        function checkTriangleCollision(px, py, pw, ph, sx, sy, sw, sh, inverted) {
            const points = [
                {x: px, y: py}, {x: px + pw, y: py},
                {x: px, y: py + ph}, {x: px + pw, y: py + ph}
            ];
            const v1 = {x: sx, y: inverted ? sy - sh : sy};
            const v2 = {x: sx + sw, y: inverted ? sy - sh : sy};
            const v3 = {x: sx + sw/2, y: inverted ? sy : sy - sh};

            function side(p1, p2, p3) { return (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y); }
            function pointInTriangle(p, a, b, c) {
                const s1 = side(p, a, b); const s2 = side(p, b, c); const s3 = side(p, c, a);
                const has_neg = (s1 < 0) || (s2 < 0) || (s3 < 0);
                const has_pos = (s1 > 0) || (s2 > 0) || (s3 > 0);
                return !(has_neg && has_pos);
            }
            for(let p of points) if(pointInTriangle(p, v1, v2, v3)) return true;
            return false;
        }

        function die() {
            if (isDead) return; isDead = true;
            deathScreen.style.display = 'block';
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
                case 'robot': 
                    if (inputActive && player.robotHoldTime < 12 && !player.isGrounded) { player.vy += (JUMP_FORCE * 0.12) * player.gravityDir; player.robotHoldTime++; }
                    player.vy += GRAVITY * player.gravityDir; player.rot = player.gravityDir === 1 ? 0 : Math.PI; break;
                case 'spider':
                    player.vy += GRAVITY * 4 * player.gravityDir; 
                    player.rot = player.gravityDir === 1 ? 0 : Math.PI; break;
                case 'swing':
                    player.vy += (GRAVITY * 0.7) * player.gravityDir; player.vy *= 0.98; player.rot = player.vy * 0.05; break;
            }
            player.y += player.vy; player.isGrounded = false;
            const ceilLimit = height * 0.1;
            if (player.gravityDir === 1) { if (player.y + player.height >= groundY) { player.y = groundY - player.height; player.vy = 0; player.isGrounded = true; } }
            else { if (player.y <= ceilLimit) { player.y = ceilLimit; player.vy = 0; player.isGrounded = true; } }
            if (player.y < -50 || player.y > height + 50) die();

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
                    if (player.x + player.width > ox + 4 && player.x < ox + obs.w - 4 && player.y + player.height > obs.y && player.y < obs.y + obs.h) {
                        if (player.vy * player.gravityDir >= 0 && (player.gravityDir === 1 ? prevY + player.height <= obs.y + 15 : prevY >= obs.y + obs.h - 15)) { player.y = player.gravityDir === 1 ? obs.y - player.height : obs.y + obs.h; player.vy = 0; player.isGrounded = true; }
                        else { die(); return; }
                    }
                }
            }
            if (frameCount % 2 === 0) particles.push({ x: player.x, y: player.y + player.height/2, vx: -4, vy: (Math.random()-0.5)*3, life: 1, color: '#ff0000', size: 5 });
            particles.forEach((p, i) => { p.x += p.vx; p.y += p.vy; p.life -= (isDead ? 0.015 : 0.04); if (p.life <= 0) particles.splice(i, 1); });
            
            if (drone.active) {
                drone.angle += 0.05;
                drone.x = player.x + 400;
                let midY = (groundY + (height * 0.1)) / 2;
                let amp = (groundY - (height * 0.1)) / 2 - 30;
                drone.y = midY + Math.sin(drone.angle) * amp;

                if (drone.state === 'idle') {
                    drone.shootTimer--;
                    if (drone.shootTimer <= 0) {
                        let rand = Math.random();
                        if (rand < 0.33) {
                            // Spread (3 bullets)
                            let dx = (player.x + player.width/2) - drone.x;
                            let dy = (player.y + player.height/2) - drone.y;
                            let angle = Math.atan2(dy, dx);
                            for (let a of [-0.2, 0, 0.2]) {
                                droneProjectiles.push({ type: 'normal', x: drone.x, y: drone.y, vx: Math.cos(angle+a)*8, vy: Math.sin(angle+a)*8, life: 100, size: 4 });
                            }
                            drone.shootTimer = diff === 'hard' ? 45 : (diff === 'easy' ? 90 : 60);
                        } else if (rand < 0.66) {
                            // Big Homing
                            let dx = (player.x + player.width/2) - drone.x;
                            let dy = (player.y + player.height/2) - drone.y;
                            let mag = Math.hypot(dx, dy);
                            droneProjectiles.push({ type: 'homing', x: drone.x, y: drone.y, vx: (dx/mag)*4, vy: (dy/mag)*4, life: 150, size: 10 });
                            drone.shootTimer = diff === 'hard' ? 50 : (diff === 'easy' ? 100 : 70);
                        } else {
                            // Giant Laser
                            drone.state = 'telegraph';
                            drone.laserTimer = 60; // 1 second warning
                        }
                    }
                } else if (drone.state === 'telegraph') {
                    drone.laserTimer--;
                    if (drone.laserTimer <= 0) {
                        drone.state = 'laser';
                        drone.laserTimer = 25; // actual laser blast duration
                    }
                } else if (drone.state === 'laser') {
                    drone.laserTimer--;
                    // Collision check for giant laser - slightly smaller hitbox (30px total) than visual (40px) for fairness
                    let laserHalfSize = 15;
                    let laserTop = drone.y - laserHalfSize;
                    let laserBottom = drone.y + laserHalfSize;
                    let pLeft = player.x;
                    let pRight = player.x + player.width;
                    let pTop = player.y;
                    let pBottom = player.y + player.height;
                    
                    // Drone is at player.x + 400, laser shoots backward
                    if (pRight > drone.x - 2000 && pLeft < drone.x && pBottom > laserTop && pTop < laserBottom) {
                        die();
                    }

                    if (drone.laserTimer <= 0) {
                        drone.state = 'idle';
                        drone.shootTimer = diff === 'hard' ? 40 : (diff === 'easy' ? 90 : 60);
                    }
                }
            }

            for (let i = droneProjectiles.length - 1; i >= 0; i--) {
                let p = droneProjectiles[i];
                if (p.type === 'homing') {
                    let dx = (player.x + player.width/2) - p.x;
                    let dy = (player.y + player.height/2) - p.y;
                    let mag = Math.hypot(dx, dy);
                    p.vx += (dx/mag) * 0.15;
                    p.vy += (dy/mag) * 0.15;
                    // Cap speed
                    let speed = Math.hypot(p.vx, p.vy);
                    if (speed > 6) {
                        p.vx = (p.vx/speed)*6;
                        p.vy = (p.vy/speed)*6;
                    }
                }
                
                p.x += p.vx; p.y += p.vy; p.life--;
                if (p.life <= 0) { droneProjectiles.splice(i, 1); continue; }
                if (Math.abs(p.x - (player.x + player.width/2)) < player.width/2 + p.size/2 && Math.abs(p.y - (player.y + player.height/2)) < player.height/2 + p.size/2) {
                    die();
                }
            }

            progressBar.style.width = Math.min((cameraX / levelLength) * 100, 100) + '%';
            if (cameraX >= levelLength) location.reload();
        }

        function draw() {
            const pulse = Math.sin(frameCount * 0.05) * 25;
            ctx.fillStyle = `rgb(${30 + pulse}, 0, 0)`; ctx.fillRect(0, 0, width, height);
            ctx.strokeStyle = `rgba(255, 0, 0, 0.2)`; ctx.lineWidth = 1; const gridS = 100; const offX = -cameraX % gridS;
            for(let x=offX; x<width; x+=gridS) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
            for(let y=0; y<height; y+=gridS) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }
            ctx.fillStyle = '#110000'; ctx.fillRect(0, groundY, width, height - groundY); ctx.fillRect(0, 0, width, height * 0.1);
            ctx.strokeStyle = '#ff0000'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(width, groundY); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, height * 0.1); ctx.lineTo(width, height * 0.1); ctx.stroke();
            
            obstacles.forEach(obs => {
                const ox = obs.x - cameraX; if (ox + obs.w < -100 || ox > width + 100) return;
                if (obs.type === 'portal') {
                    const colors = {cube:'#00ff00', ship:'#ff00ff', ball:'#ffaa00', ufo:'#00ffff', wave:'#0000ff', robot:'#ffffff', spider:'#ff0055', swing:'#ffff00'};
                    ctx.fillStyle = colors[obs.mode] || '#fff'; ctx.globalAlpha = 0.3; ctx.fillRect(ox, 0, obs.w, height); ctx.globalAlpha = 1;
                    ctx.strokeStyle = colors[obs.mode] || '#fff'; ctx.lineWidth = 4; ctx.strokeRect(ox, 0, obs.w, height);
                    ctx.fillStyle = '#fff'; ctx.font = 'bold 20px Poppins'; ctx.save(); ctx.translate(ox + obs.w/2, height/2); ctx.rotate(-Math.PI/2); ctx.textAlign = 'center'; ctx.fillText(obs.mode.toUpperCase(), 0, 0); ctx.restore();
                } else if (obs.type === 'spike') {
                    ctx.fillStyle = '#fff'; ctx.beginPath(); if (obs.inverted) { ctx.moveTo(ox, obs.y - obs.h); ctx.lineTo(ox + obs.w / 2, obs.y); ctx.lineTo(ox + obs.w, obs.y - obs.h); } else { ctx.moveTo(ox, obs.y); ctx.lineTo(ox + obs.w / 2, obs.y - obs.h); ctx.lineTo(ox + obs.w, obs.y); } ctx.fill(); ctx.strokeStyle = '#ff0000'; ctx.stroke();
                } else if (obs.type === 'block') { ctx.fillStyle = '#000'; ctx.fillRect(ox, obs.y, obs.w, obs.h); ctx.strokeStyle = '#ff0000'; ctx.lineWidth = 2; ctx.strokeRect(ox, obs.y, obs.w, obs.h); }
            });
            particles.forEach(p => { ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.size, p.size); });
            ctx.globalAlpha = 1;
            if (!isDead && isStarted) {
                ctx.save(); ctx.translate(player.x + player.width/2, player.y + player.height/2); ctx.rotate(player.rot);
                ctx.shadowBlur = 20; ctx.shadowColor = '#ff0000'; ctx.fillStyle = '#fff';
                if (player.mode === 'cube') {
                    ctx.fillRect(-player.width/2, -player.height/2, player.width, player.height); ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.strokeRect(-player.width/2 + 4, -player.height/2 + 4, player.width - 8, player.height - 8);
                    ctx.fillStyle = '#000'; ctx.fillRect(4, -10, 8, 8); ctx.fillRect(16, -10, 8, 8); ctx.fillStyle = '#fff'; ctx.fillRect(8, -8, 2, 2); ctx.fillRect(20, -8, 2, 2); ctx.fillStyle = '#000'; ctx.fillRect(8, 6, 16, 4);
                } else if (player.mode === 'ship') {
                    ctx.beginPath(); ctx.moveTo(-player.width/2, 0); ctx.lineTo(-player.width/4, -player.height/3); ctx.lineTo(player.width/2, -player.height/6); ctx.lineTo(player.width/2, player.height/6); ctx.lineTo(-player.width/4, player.height/3); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.stroke();
                    ctx.fillStyle = '#00d4ff'; ctx.beginPath(); ctx.arc(player.width/6, -player.height/8, 10, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.arc(player.width/6 + 2, -player.height/8 - 2, 3, 0, Math.PI*2); ctx.fill(); ctx.globalAlpha = 1;
                    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-player.width/2, 0); ctx.lineTo(-player.width/1.5, -player.height/2); ctx.lineTo(-player.width/3, -player.height/4); ctx.closePath(); ctx.fill(); ctx.stroke();
                    ctx.fillStyle = '#ff0000'; ctx.beginPath(); ctx.moveTo(-player.width/2, -5); ctx.lineTo(-player.width/1.2, 0); ctx.lineTo(-player.width/2, 5); ctx.fill();
                } else if (player.mode === 'ball') {
                    ctx.beginPath(); ctx.arc(0, 0, player.width/2, 0, Math.PI*2); ctx.fill(); ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.stroke();
                    ctx.save(); ctx.rotate(frameCount * 0.2); ctx.strokeStyle = '#000'; ctx.lineWidth = 4; for(let i=0; i<4; i++) { ctx.rotate(Math.PI/2); ctx.beginPath(); ctx.moveTo(player.width/4, -player.width/2); ctx.lineTo(player.width/4, player.width/2); ctx.stroke(); } ctx.restore();
                    ctx.fillStyle = '#ff0000'; ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI*2); ctx.fill();
                } else if (player.mode === 'ufo') {
                    ctx.beginPath(); ctx.ellipse(0, 0, player.width/1.2, player.height/2.5, 0, 0, Math.PI*2); ctx.fill(); ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.stroke();
                    ctx.fillStyle = '#ff0000'; for(let i=0; i<4; i++) { const ang = (Math.PI/2) * i; const lx = Math.cos(ang) * (player.width/1.4); const ly = Math.sin(ang) * (player.height/3); ctx.beginPath(); ctx.arc(lx, ly, 3, 0, Math.PI*2); ctx.fill(); }
                    ctx.fillStyle = '#ff0000'; ctx.beginPath(); ctx.arc(0, -6, 12, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.arc(4, -9, 4, 0, Math.PI*2); ctx.fill(); ctx.globalAlpha = 1;
                } else if (player.mode === 'wave') {
                    ctx.beginPath(); ctx.moveTo(-player.width/2, player.height/2); ctx.lineTo(player.width/2, 0); ctx.lineTo(-player.width/2, -player.height/2); ctx.lineTo(-player.width/4, 0); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.stroke();
                    ctx.fillStyle = '#ff0000'; ctx.beginPath(); ctx.moveTo(-player.width/4, -2); ctx.lineTo(player.width/4, 0); ctx.lineTo(-player.width/4, 2); ctx.fill();
                } else if (player.mode === 'robot') {
                    ctx.fillRect(-player.width/2.5, -player.height/2, player.width/1.25, player.height/1.5);
                    ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.strokeRect(-player.width/2.5, -player.height/2, player.width/1.25, player.height/1.5);
                    let legOffsetY = player.isGrounded ? 0 : 5;
                    ctx.fillStyle = '#aaa'; ctx.fillRect(-player.width/3, player.height/6 + legOffsetY, 8, player.height/3); ctx.fillRect(player.width/4 - 2, player.height/6 + legOffsetY, 8, player.height/3);
                    ctx.fillStyle = '#00ff00'; ctx.fillRect(-player.width/6, -player.height/3, player.width/3, 6);
                } else if (player.mode === 'spider') {
                    ctx.beginPath(); ctx.ellipse(0, 0, player.width/2.5, player.height/3, 0, 0, Math.PI*2); ctx.fill(); ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.stroke();
                    ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
                    let legBend = player.isGrounded ? 0 : 5;
                    for (let i = -1; i <= 1; i+=2) {
                        ctx.beginPath(); ctx.moveTo(i*player.width/4, 0); ctx.lineTo(i*player.width/2, -10 + legBend); ctx.lineTo(i*player.width/1.5, player.height/2); ctx.stroke();
                        ctx.beginPath(); ctx.moveTo(i*player.width/4, 5); ctx.lineTo(i*player.width/2, 10 + legBend); ctx.lineTo(i*player.width/1.2, player.height/2); ctx.stroke();
                    }
                    ctx.fillStyle = '#ff0000'; ctx.beginPath(); ctx.arc(player.width/6, -player.height/8, 3, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(player.width/3, -player.height/8, 2, 0, Math.PI*2); ctx.fill();
                } else if (player.mode === 'swing') {
                    ctx.beginPath(); ctx.arc(0, 0, player.width/2, 0, Math.PI*2); ctx.fill(); ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.stroke();
                    ctx.fillStyle = '#aaa'; ctx.fillRect(-player.width/6, -player.height/2 - 8, player.width/3, 8);
                    ctx.fillStyle = '#fff'; ctx.fillRect(-player.width/2, -player.height/2 - 12, player.width, 4);
                    ctx.fillStyle = '#00ffff'; ctx.beginPath(); ctx.arc(player.width/6, -player.height/8, 6, 0, Math.PI*2); ctx.fill();
                }
                ctx.restore();

                if (drone.active) {
                    // Draw telegraph or laser
                    if (drone.state === 'telegraph') {
                        ctx.fillStyle = `rgba(255, 0, 0, ${0.3 + Math.sin(frameCount*0.5)*0.2})`;
                        ctx.fillRect(player.x - 1000, drone.y - 2, 2000, 4);
                    } else if (drone.state === 'laser') {
                        ctx.fillStyle = '#fff';
                        ctx.shadowBlur = 20; ctx.shadowColor = '#ff0000';
                        ctx.fillRect(player.x - 1000, drone.y - 15, 2000, 30);
                        ctx.fillStyle = '#ff0000';
                        ctx.fillRect(player.x - 1000, drone.y - 20, 2000, 40);
                        ctx.shadowBlur = 0;
                    }

                    ctx.fillStyle = '#111';
                    ctx.beginPath(); ctx.arc(drone.x, drone.y, 20, 0, Math.PI*2); ctx.fill();
                    ctx.strokeStyle = '#ff0000'; ctx.lineWidth = 3; ctx.stroke();
                    ctx.fillStyle = '#ff0000';
                    ctx.beginPath(); ctx.arc(drone.x, drone.y, 8, 0, Math.PI*2); ctx.fill();
                    
                    let dx = (player.x + player.width/2) - drone.x;
                    let dy = (player.y + player.height/2) - drone.y;
                    let mag = Math.hypot(dx, dy);
                    ctx.fillStyle = '#fff';
                    ctx.beginPath(); ctx.arc(drone.x + (dx/mag)*8, drone.y + (dy/mag)*8, 4, 0, Math.PI*2); ctx.fill();
                }

                droneProjectiles.forEach(p => {
                    ctx.save();
                    ctx.translate(p.x, p.y);
                    if (p.type === 'normal') {
                        ctx.rotate(Math.atan2(p.vy, p.vx));
                        ctx.fillStyle = '#ff0000';
                        ctx.shadowBlur = 10; ctx.shadowColor = '#ff0000';
                        ctx.fillRect(-10, -2, 20, 4);
                        ctx.fillStyle = '#fff';
                        ctx.fillRect(-5, -1, 10, 2);
                    } else if (p.type === 'homing') {
                        ctx.rotate(frameCount * 0.1);
                        ctx.fillStyle = '#ff00ff';
                        ctx.shadowBlur = 15; ctx.shadowColor = '#ff00ff';
                        ctx.beginPath(); ctx.arc(0, 0, p.size, 0, Math.PI*2); ctx.fill();
                        ctx.fillStyle = '#fff';
                        ctx.beginPath(); ctx.arc(0, 0, p.size/2, 0, Math.PI*2); ctx.fill();
                    }
                    ctx.restore();
                });
            }
            requestAnimationFrame(() => { update(); draw(); });
        }
        draw();
