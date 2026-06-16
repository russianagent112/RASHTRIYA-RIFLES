const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Elements
const startScreen = document.getElementById('start-screen');
const gameoverScreen = document.getElementById('gameover-screen');
const scoreDisplay = document.getElementById('score-display');
const finalScore = document.getElementById('final-score');
const playBtn = document.getElementById('play-btn');
const restartBtn = document.getElementById('restart-btn');

// Load Images
const heroImg = new Image();
heroImg.src = 'hero.png';
let heroLoaded = false;
heroImg.onload = () => heroLoaded = true;

const enemyImg = new Image();
enemyImg.src = 'enemy.png';
let enemyLoaded = false;
enemyImg.onload = () => enemyLoaded = true;

// Game Settings & State
let gameState = 'START'; // START, PLAYING, GAMEOVER
let score = 0;
let animationFrameId;

// Board setup (3 lanes)
let laneWidth;
let currentLane = 1; // 0: Left, 1: Middle, 2: Right

// Entities
let player = {
    x: 0,
    y: 0,
    targetX: 0,
    width: 0,
    height: 0,
    speed: 0.25 // Smooth sliding interpolation factor
};

let enemies = [];
let enemySpeed = 5;
let spawnTimer = 0;
let spawnInterval = 90; // Frame interval between spawns

// Adjust canvas to match mobile screens perfectly
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    laneWidth = canvas.width / 3;
    
    // Scale player relative to screen width
    player.width = laneWidth * 0.7;
    player.height = player.width * 1.4; 
    player.y = canvas.height - player.height - 40;
    updatePlayerTargetX();
    player.x = player.targetX; // Instant snap on resize
}

function updatePlayerTargetX() {
    player.targetX = (currentLane * laneWidth) + (laneWidth - player.width) / 2;
}

// Mobile Input: Tap left side of screen to go left, right side to go right
window.addEventListener('touchstart', (e) => {
    if (gameState !== 'PLAYING') return;
    
    const touchX = e.touches[0].clientX;
    const screenWidth = window.innerWidth;
    
    if (touchX < screenWidth / 2) {
        // Move Left
        if (currentLane > 0) {
            currentLane--;
            updatePlayerTargetX();
        }
    } else {
        // Move Right
        if (currentLane < 2) {
            currentLane++;
            updatePlayerTargetX();
        }
    }
}, { passive: true });

// Prevent default scrolling behaviors on mobile
window.addEventListener('touchmove', (e) => {
    if (gameState === 'PLAYING') e.preventDefault();
}, { passive: false });

// Game loop control functions
function initGame() {
    score = 0;
    enemies = [];
    enemySpeed = window.innerHeight * 0.008; // Velocity relative to display height
    spawnInterval = 90;
    currentLane = 1;
    resizeCanvas();
    gameState = 'PLAYING';
    
    startScreen.classList.add('hidden');
    gameoverScreen.classList.add('hidden');
    
    loop();
}

function gameOver() {
    gameState = 'GAMEOVER';
    cancelAnimationFrame(animationFrameId);
    finalScore.innerText = `SCORE: ${Math.floor(score)}`;
    gameoverScreen.classList.remove('hidden');
    
    // Optional Backend High-Score Post Submission
    fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: "Soldier", score: Math.floor(score) })
    }).catch(err => console.log("Backend offline, running standalone."));
}

function spawnEnemy() {
    const lane = Math.floor(Math.random() * 3);
    const eWidth = laneWidth * 0.65;
    const eHeight = eWidth * 1.4;
    const eX = (lane * laneWidth) + (laneWidth - eWidth) / 2;
    
    enemies.push({
        x: eX,
        y: -eHeight,
        width: eWidth,
        height: eHeight,
        lane: lane
    });
}

// Core Loop
function loop() {
    if (gameState !== 'PLAYING') return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw Tracks (Army Green Camo-styled lanes)
    ctx.fillStyle = '#222b22';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 4;
    for(let i = 1; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(i * laneWidth, 0);
        ctx.lineTo(i * laneWidth, canvas.height);
        ctx.stroke();
    }
    
    // Update Score & Progression Speed
    score += 0.25;
    scoreDisplay.innerText = `SCORE: ${Math.floor(score)}`;
    enemySpeed += 0.002; // Gradually scaling difficulty
    
    // Smooth Player Lane Movement (Lerp Engine)
    player.x += (player.targetX - player.x) * player.speed;
    
    // Render Player
    if (heroLoaded) {
        ctx.drawImage(heroImg, player.x, player.y, player.width, player.height);
    } else {
        ctx.fillStyle = '#ffd700'; // Fallback Golden Commando color
        ctx.fillRect(player.x, player.y, player.width, player.height);
    }
    
    // Spawn Management
    spawnTimer++;
    if (spawnTimer >= spawnInterval) {
        spawnEnemy();
        spawnTimer = 0;
        if (spawnInterval > 40) spawnInterval -= 0.5; // Scale rate over time
    }
    
    // Update & Render Enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        let e = enemies[i];
        e.y += enemySpeed;
        
        if (enemyLoaded) {
            ctx.drawImage(enemyImg, e.x, e.y, e.width, e.height);
        } else {
            ctx.fillStyle = '#ff3333'; // Fallback Red Hostile color
            ctx.fillRect(e.x, e.y, e.width, e.height);
        }
        
        // Accurate Bounding Box Collision Engine
        if (
            player.x < e.x + e.width &&
            player.x + player.width > e.x &&
            player.y < e.y + e.height &&
            player.y + player.height > e.y
        ) {
            gameOver();
            return;
        }
        
        // Safe out of bounds removal routine
        if (e.y > canvas.height) {
            enemies.splice(i, 1);
        }
    }
    
    animationFrameId = requestAnimationFrame(loop);
}

// Event Listeners
playBtn.addEventListener('click', initGame);
restartBtn.addEventListener('click', initGame);
window.addEventListener('resize', resizeCanvas);

// Initial Canvas Layout Calculation
resizeCanvas();
