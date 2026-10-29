
"use strict";

// ASTEROIDS ARCADE V2 — Core Game Engine

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreDisplay = document.getElementById("score");
const roundDisplay = document.getElementById("round");
const livesDisplay = document.getElementById("lives");
const weaponDisplay = document.getElementById("weapon");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayText = document.getElementById("overlayText");
const startButton = document.getElementById("startButton");
const message = document.getElementById("message");

let W = 800;
let H = 500;
let lastTime = 0;
let running = false;
let gameOver = false;
let paused = false;

let score = 0;
let lives = 20;
let round = 1;
let nextUpgrade = 3000;
let upgradeCount = 0;

let ship;
let asteroids = [];
let bullets = [];
let orbs = [];
let particles = [];
let keys = {};
let stars = [];

let weapon = "STANDARD";
let weaponUntil = 0;
let fireCooldown = 0;
let invulnerableUntil = 0;
let lastUpgradeScore = 0;

const TAU = Math.PI * 2;
const rand = (min, max) => Math.random() * (max - min) + min;
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  W = Math.max(320, rect.width);
  H = Math.max(350, rect.height);

  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  createStars();
}

function createStars() {
  stars = Array.from({ length: Math.floor(W * H / 1800) }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: rand(0.5, 1.7),
    alpha: rand(0.25, 0.9)
  }));
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

function createShip() {
  return {
    x: W / 2,
    y: H / 2,
    vx: 0,
    vy: 0,
    angle: -Math.PI / 2,
    radius: 15,
    thrusting: false,
    rotationSpeed: 4,
    thrustPower: 220,
    shield: 0,
    rapidFire: false
  };
}

function createAsteroid(x, y, radius, level = 0) {
  const angle = rand(0, TAU);
  const speed = rand(25, 65) * (1 + round * 0.012);

  const vertices = [];
  const count = Math.floor(rand(8, 13));

  for (let i = 0; i < count; i++) {
    vertices.push(rand(0.72, 1.18));
  }

  return {
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius,
    level,
    vertices,
    angle: rand(0, TAU),
    spin: rand(-0.8, 0.8),
    explosive: Math.random() < Math.min(0.08 + round * 0.001, 0.3),
    dead: false
  };
}

function spawnAsteroids() {
  asteroids = [];

  const count = Math.min(3 + Math.ceil(round * 0.65), 30);

  for (let i = 0; i < count; i++) {
    let x;
    let y;
    let attempts = 0;

    do {
      x = rand(0, W);
      y = rand(0, H);
      attempts++;
    } while (
      ship &&
      Math.hypot(x - ship.x, y - ship.y) < 120 &&
      attempts < 30
    );

    const asteroid = createAsteroid(x, y, rand(22, 37));
    asteroids.push(asteroid);
  }
}

function resetGame() {
  score = 0;
  lives = 20;
  round = 1;
  nextUpgrade = 3000;
  upgradeCount = 0;
  weapon = "STANDARD";
  weaponUntil = 0;
  fireCooldown = 0;
  lastUpgradeScore = 0;

  bullets = [];
  orbs = [];
  particles = [];
  ship = createShip();

  invulnerableUntil = performance.now() + 2500;

  spawnAsteroids();
  updateHUD();
}

function updateHUD() {
  scoreDisplay.textContent = String(score).padStart(6, "0");
  roundDisplay.textContent =
    String(round).padStart(2, "0") + " / 500";
  livesDisplay.textContent = String(lives);
  weaponDisplay.textContent = weapon;
}

function showOverlay(title, text, buttonText) {
  overlayTitle.textContent = title;
  overlayText.textContent = text;
  startButton.textContent = buttonText;
  overlay.style.display = "flex";
}

function hideOverlay() {
  overlay.style.display = "none";
}

function startGame() {
  if (gameOver) {
    resetGame();
  }

  running = true;
  paused = false;
  gameOver = false;

  hideOverlay();
  message.textContent = "MISSION ACTIVE";
}

startButton.addEventListener("click", () => {
  if (startButton.dataset.action === "upgrade") {
    const upgrade = startButton.dataset.upgrade || "SHIELD";
    applyUpgrade(upgrade);
    return;
  }

  if (startButton.dataset.action === "resume") {
    running = true;
    paused = false;
    hideOverlay();
    return;
  }

  startButton.dataset.action = "start";
  startGame();
});

function pauseGame() {
  if (!running || gameOver) return;

  running = false;
  paused = true;

  showOverlay("MISSION PAUSED", "Your progress is saved.", "RESUME");
  startButton.dataset.action = "resume";
}

function endGame(victory = false) {
  running = false;
  paused = false;
  gameOver = true;

  showOverlay(
    victory ? "PLANET SAVED" : "MISSION FAILED",
    victory
      ? `Congratulations! You completed all 500 rounds. Final score: ${score}.`
      : `Your ship has been destroyed. Final score: ${score}.`,
    "PLAY AGAIN"
  );

  startButton.dataset.action = "start";
  message.textContent = victory ? "MISSION COMPLETE" : "SHIP DESTROYED";
}

function wrap(object) {
  if (object.x < -object.radius) object.x = W + object.radius;
  if (object.x > W + object.radius) object.x = -object.radius;
  if (object.y < -object.radius) object.y = H + object.radius;
  if (object.y > H + object.radius) object.y = -object.radius;
}

function fireBullet() {
  const now = performance.now();
  if (now < fireCooldown) return;

  fireCooldown = now + (weapon === "RAPID" ? 90 : 250);

  let angles = [ship.angle];

  if (weapon === "SPREAD") {
    angles = [ship.angle - 0.24, ship.angle, ship.angle + 0.24];
  }

  for (const angle of angles) {
    const speed = weapon === "PIERCING" ? 600 : 480;

    bullets.push({
      x: ship.x + Math.cos(angle) * 18,
      y: ship.y + Math.sin(angle) * 18,
      vx: ship.vx + Math.cos(angle) * speed,
      vy: ship.vy + Math.sin(angle) * speed,
      radius: weapon === "EXPLOSIVE" ? 5 : 3,
      life: 1.3,
      piercing: weapon === "PIERCING",
      explosive: weapon === "EXPLOSIVE",
      hit: new Set()
    });
  }
}

function makeExplosion(x, y, color = "#55eaff", amount = 18) {
  for (let i = 0; i < amount; i++) {
    const angle = rand(0, TAU);
    const speed = rand(35, 180);

    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: rand(0.25, 0.85),
      maxLife: 0.85,
      size: rand(1, 4),
      color
    });
  }
}

function dropOrb(x, y) {
  if (Math.random() > 0.24) return;

  const types = ["RAPID", "SPREAD", "PIERCING", "EXPLOSIVE", "SHIELD"];
  const type = types[Math.floor(Math.random() * types.length)];

  orbs.push({
    x, y,
    vx: rand(-35, 35),
    vy: rand(-35, 35),
    radius: 10,
    type,
    life: 12
  });
}

function applyWeapon(type) {
  weapon = type;
  weaponUntil = performance.now() + 12000;
  message.textContent = type + " WEAPON ACTIVATED";
  updateHUD();
}

function applyUpgrade(type) {
  if (type === "DAMAGE") ship.radius = Math.min(ship.radius + 2, 23);
  if (type === "THRUST") ship.thrustPower += 35;
  if (type === "SHIELD") ship.shield = 1;
  if (type === "FIRE") ship.rapidFire = true;

  upgradeCount++;
  lastUpgradeScore = score;

  startButton.dataset.action = "start";
  message.textContent = type + " UPGRADE INSTALLED";
  hideOverlay();

  running = true;
  paused = false;
}

function showUpgrade() {
  running = false;
  paused = true;

  const options = [
    { name: "DAMAGE", label: "Stronger ship blasters" },
    { name: "THRUST", label: "Faster acceleration" },
    { name: "SHIELD", label: "Block one collision" },
    { name: "FIRE", label: "Permanent faster firing" }
  ];

  showOverlay(
    "UPGRADE AVAILABLE",
    `Milestone reached: ${score} points. Choose an upgrade to continue.`,
    options[0].name
  );

  // Add simple upgrade choices to the existing overlay.
  const panel = overlay.querySelector(".overlay-panel");
  const oldChoices = panel.querySelector(".upgrade-choices");
  if (oldChoices) oldChoices.remove();

  const choices = document.createElement("div");
  choices.className = "upgrade-choices";
  choices.style.display = "grid";
  choices.style.gridTemplateColumns = "repeat(2, minmax(0, 1fr))";
  choices.style.gap = "8px";
  choices.style.marginTop = "12px";

  for (const option of options) {
    const button = document.createElement("button");
    button.textContent = option.name + " — " + option.label;
    button.style.marginTop = "0";
    button.style.padding = "10px";
    button.style.fontSize = "11px";

    button.addEventListener("click", () => {
      applyUpgrade(option.name);
    });

    choices.appendChild(button);
  }

  panel.insertBefore(choices, startButton);
  startButton.style.display = "none";
}

function advanceRound() {
  if (round >= 500) {
    endGame(true);
    return;
  }

  round++;
  ship.x = W / 2;
  ship.y = H / 2;
  ship.vx = 0;
  ship.vy = 0;

  invulnerableUntil = performance.now() + 2000;
  spawnAsteroids();
  message.textContent = "ROUND " + round;
  updateHUD();
}

function update(dt) {
  const now = performance.now();

  if (keys["ArrowLeft"] || keys["a"]) {
    ship.angle -= ship.rotationSpeed * dt;
  }

  if (keys["ArrowRight"] || keys["d"]) {
    ship.angle += ship.rotationSpeed * dt;
  }

  ship.thrusting = !!(keys["ArrowUp"] || keys["w"]);

  if (ship.thrusting) {
    ship.vx += Math.cos(ship.angle) * ship.thrustPower * dt;
    ship.vy += Math.sin(ship.angle) * ship.thrustPower * dt;
  }

  // Space drag creates a little momentum and inertia.
  ship.vx *= Math.pow(0.992, dt * 60);
  ship.vy *= Math.pow(0.992, dt * 60);

  const maxSpeed = 320;
  const speed = Math.hypot(ship.vx, ship.vy);

  if (speed > maxSpeed) {
    ship.vx = ship.vx / speed * maxSpeed;
    ship.vy = ship.vy / speed * maxSpeed;
  }

  ship.x += ship.vx * dt;
  ship.y += ship.vy * dt;
  wrap(ship);

  if (keys[" "] || keys["Space"]) fireBullet();

  if (weaponUntil && now > weaponUntil) {
    weapon = "STANDARD";
    weaponUntil = 0;
    message.textContent = "STANDARD WEAPON";
    updateHUD();
  }

  for (const bullet of bullets) {
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;
    bullet.life -= dt;
    wrap(bullet);
  }

  bullets = bullets.filter(b => b.life > 0);

  for (const a of asteroids) {
    a.x += a.vx * dt;
    a.y += a.vy * dt;
    a.angle += a.spin * dt;
    wrap(a);
  }

  // Resolve asteroid-to-asteroid collisions.
  for (let i = 0; i < asteroids.length; i++) {
    for (let j = i + 1; j < asteroids.length; j++) {
      const a = asteroids[i];
      const b = asteroids[j];

      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const distance = Math.hypot(dx, dy);
      const minimum = a.radius + b.radius;

      if (distance > 0 && distance < minimum) {
        const nx = dx / distance;
        const ny = dy / distance;
        const relative = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;

        if (relative < 0) {
          const impulse = relative * 0.85;
          a.vx += impulse * nx;
          a.vy += impulse * ny;
          b.vx -= impulse * nx;
          b.vy -= impulse * ny;
        }

        const overlap = (minimum - distance) / 2;
        a.x -= nx * overlap;
        a.y -= ny * overlap;
        b.x += nx * overlap;
        b.y += ny * overlap;
      }
    }
  }

  // Projectile and asteroid collisions.
  for (const a of asteroids) {
    for (const b of bullets) {
      if (a.dead || b.life <= 0 || b.hit.has(a)) continue;

      if (Math.hypot(a.x - b.x, a.y - b.y) < a.radius + b.radius) {
        if (!b.piercing) b.life = 0;
        b.hit.add(a);

        if (a.explosive) {
          makeExplosion(a.x, a.y, "#ff884d", 38);

          for (const nearby of asteroids) {
            if (
              nearby !== a &&
              !nearby.dead &&
              Math.hypot(nearby.x - a.x, nearby.y - a.y) < 85
            ) {
              nearby.dead = true;
              score += 100;
              makeExplosion(nearby.x, nearby.y);
            }
          }
        } else {
          makeExplosion(a.x, a.y, "#9da8b7", 10);
        }

        a.dead = true;
        score += Math.round(50 + (40 - a.radius) * 3);
        dropOrb(a.x, a.y);

        if (a.radius > 25 && a.level < 2) {
          for (let k = 0; k < 2; k++) {
            const child = createAsteroid(
              a.x, a.y, a.radius * 0.55, a.level + 1
            );
            child.explosive = Math.random() < 0.08;
            asteroids.push(child);
          }
        }

        if (b.explosive) {
          makeExplosion(b.x, b.y, "#ff884d", 25);
        }
      }
    }
  }

  asteroids = asteroids.filter(a => !a.dead);

  // Collect weapon orbs.
  for (const orb of orbs) {
    orb.x += orb.vx * dt;
    orb.y += orb.vy * dt;
    orb.life -= dt;
    wrap(orb);

    if (Math.hypot(orb.x - ship.x, orb.y - ship.y) <
        orb.radius + ship.radius) {
      if (orb.type === "SHIELD") {
        ship.shield = 1;
        message.textContent = "SHIELD READY";
      } else {
        applyWeapon(orb.type);
      }

      orb.life = 0;
      makeExplosion(orb.x, orb.y, "#b879ff", 12);
    }
  }

  orbs = orbs.filter(o => o.life > 0);

  // Ship collisions.
  if (now > invulnerableUntil) {
    for (const a of asteroids) {
      if (Math.hypot(a.x - ship.x, a.y - ship.y) <
          a.radius + ship.radius) {
        if (ship.shield > 0) {
          ship.shield = 0;
          a.dead = true;
          makeExplosion(a.x, a.y);
        } else {
          lives--;
          makeExplosion(ship.x, ship.y, "#ff5577", 30);

          ship.x = W / 2;
          ship.y = H / 2;
          ship.vx = 0;
          ship.vy = 0;
          invulnerableUntil = now + 2500;
        }

        updateHUD();
        break;
      }
    }
  }

  for (const p of particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
  }

  particles = particles.filter(p => p.life > 0);
  asteroids = asteroids.filter(a => !a.dead);

  if (lives <= 0) {
    endGame(false);
    return;
  }

  // Score milestones create upgrade opportunities.
  if (score >= nextUpgrade && score > lastUpgradeScore) {
    nextUpgrade += 3000;
    showUpgrade();
    updateHUD();
    return;
  }

  if (asteroids.length === 0) {
    advanceRound();
  }

  updateHUD();
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, H);
  gradient.addColorStop(0, "#05091c");
  gradient.addColorStop(1, "#101b35");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);

  for (const star of stars) {
    ctx.globalAlpha = star.alpha;
    ctx.fillStyle = "#d9efff";
    ctx.fillRect(star.x, star.y, star.r, star.r);
  }

  ctx.globalAlpha = 1;

  // Large planet with atmospheric glow.
  const px = W * 0.72;
  const py = H * 0.92;
  const radius = Math.min(W * 0.38, H * 0.68);

  const glow = ctx.createRadialGradient(
    px, py, radius * 0.75,
    px, py, radius * 1.25
  );

  glow.addColorStop(0, "rgba(47, 133, 255, 0.25)");
  glow.addColorStop(1, "rgba(47, 133, 255, 0)");

  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(px, py, radius * 1.25, 0, TAU);
  ctx.fill();

  const planet = ctx.createRadialGradient(
    px - radius * 0.4, py - radius * 0.5, radius * 0.1,
    px, py, radius
  );

  planet.addColorStop(0, "#427eb5");
  planet.addColorStop(0.45, "#183c70");
  planet.addColorStop(0.85, "#101d40");
  planet.addColorStop(1, "#050b20");

  ctx.fillStyle = planet;
  ctx.beginPath();
  ctx.arc(px, py, radius, 0, TAU);
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.arc(px, py, radius, 0, TAU);
  ctx.clip();

  ctx.globalAlpha = 0.22;
  for (let i = 0; i < 15; i++) {
    ctx.fillStyle = i % 2 ? "#8bdcff" : "#142c50";
    ctx.beginPath();
    ctx.ellipse(
      px + rand(-radius, radius),
      py + rand(-radius, radius),
      rand(8, 45), rand(3, 12),
      rand(0, TAU), 0, TAU
    );
    ctx.fill();
  }

  ctx.restore();
  ctx.globalAlpha = 1;

  ctx.strokeStyle = "rgba(98, 203, 255, 0.7)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(px, py, radius, Math.PI * 1.02, Math.PI * 1.85);
  ctx.stroke();
}

function drawShip() {
  if (!ship) return;

  const flashing = performance.now() < invulnerableUntil;

  if (flashing && Math.floor(performance.now() / 100) % 2 === 0) {
    return;
  }

  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.rotate(ship.angle);

  ctx.shadowBlur = 15;
  ctx.shadowColor = "#55eaff";
  ctx.strokeStyle = "#55eaff";
  ctx.fillStyle = "rgba(48, 132, 220, 0.22)";
  ctx.lineWidth = 2;

  // Main triangular hull.
  ctx.beginPath();
  ctx.moveTo(19, 0);
  ctx.lineTo(-12, -12);
  ctx.lineTo(-7, 0);
  ctx.lineTo(-12, 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Three connected triangular design elements.
  ctx.beginPath();
  ctx.moveTo(9, -3);
  ctx.lineTo(-5, -17);
  ctx.lineTo(-8, -5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(9, 3);
  ctx.lineTo(-5, 17);
  ctx.lineTo(-8, 5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Central reactor.
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(0, 0, 3, 0, TAU);
  ctx.fill();

  // Engine flame.
  if (ship.thrusting) {
    ctx.shadowColor = "#ffb14d";
    ctx.strokeStyle = "#ffb14d";
    ctx.beginPath();
    ctx.moveTo(-9, -4);
    ctx.lineTo(rand(-24, -15), 0);
    ctx.lineTo(-9, 4);
    ctx.stroke();
  }

  ctx.restore();

  if (ship.shield > 0) {
    ctx.strokeStyle = "rgba(85, 234, 255, 0.85)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(ship.x, ship.y, 25, 0, TAU);
    ctx.stroke();
  }
}

function drawAsteroids() {
  for (const a of asteroids) {
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(a.angle);

    ctx.strokeStyle = a.explosive ? "#ff995e" : "#a6b5c9";
    ctx.fillStyle = a.explosive
      ? "rgba(155, 65, 37, 0.45)"
      : "rgba(75, 94, 121, 0.45)";
    ctx.lineWidth = 1.8;

    if (a.explosive) {
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#ff6633";
    }

    ctx.beginPath();

    for (let i = 0; i < a.vertices.length; i++) {
      const angle = i / a.vertices.length * TAU;
      const r = a.radius * a.vertices[i];
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

function drawBullets() {
  for (const b of bullets) {
    ctx.fillStyle = b.explosive ? "#ff995e" : "#a5f6ff";
    ctx.shadowBlur = 12;
    ctx.shadowColor = ctx.fillStyle;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, TAU);
    ctx.fill();
  }

  ctx.shadowBlur = 0;
}

function drawOrbs() {
  const colors = {
    RAPID: "#55eaff",
    SPREAD: "#b879ff",
    PIERCING: "#ffdf68",
    EXPLOSIVE: "#ff7955",
    SHIELD: "#62ffb3"
  };

  for (const orb of orbs) {
    ctx.save();
    ctx.translate(orb.x, orb.y);
    ctx.rotate(performance.now() / 500);

    ctx.shadowBlur = 16;
    ctx.shadowColor = colors[orb.type];
    ctx.strokeStyle = colors[orb.type];
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(0, -orb.radius);
    ctx.lineTo(orb.radius, 0);
    ctx.lineTo(0, orb.radius);
    ctx.lineTo(-orb.radius, 0);
    ctx.closePath();
    ctx.stroke();

    ctx.restore();
  }

  ctx.shadowBlur = 0;
}

function drawParticles() {
  for (const p of particles) {
    ctx.globalAlpha = clamp(p.life / p.maxLife, 0, 1);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
  }

  ctx.globalAlpha = 1;
}

function render() {
  drawBackground();
  drawAsteroids();
  drawOrbs();
  drawBullets();
  drawParticles();
  drawShip();
}

function frame(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000 || 0, 0.033);
  lastTime = timestamp;

  if (running && !paused && !gameOver) {
    update(dt);
  }

  render();
  requestAnimationFrame(frame);
}

window.addEventListener("keydown", event => {
  if (["ArrowUp", "ArrowLeft", "ArrowRight", " "].includes(event.key)) {
    event.preventDefault();
  }

  keys[event.key] = true;

  if (event.key.toLowerCase() === "p") {
    if (running) pauseGame();
    else if (paused && !gameOver) {
      running = true;
      paused = false;
      hideOverlay();
    }
  }
});

window.addEventListener("keyup", event => {
  keys[event.key] = false;
});

resetGame();
showOverlay(
  "EARTH SAVIOR",
  "Defend the planet. Survive 500 rounds. Collect weapon orbs and upgrade your ship.",
  "INITIALIZE MISSION"
);

startButton.dataset.action = "start";
startButton.style.display = "";
requestAnimationFrame(frame);
