const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const answerInput = document.getElementById('answer-input');
const gameOverEl = document.getElementById('game-over');
const finalScoreEl = document.getElementById('final-score');
const rankEl = document.getElementById('rank');
const restartBtn = document.getElementById('restart-btn');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Load images
const playerImg = new Image();
playerImg.src = "player.png";   //  put your player ship image in same folder

const enemyImg = new Image();
enemyImg.src = "enemy.png";     //  put your enemy ship image in same folder

// Load sounds
const shootSound = new Audio("shoot.mp3");
const explosionSound = new Audio("explosion.mp3");


class Player {
    constructor() {
        this.width = 60;
        this.height = 60;
        this.x = canvas.width / 2 - this.width / 2;
        this.y = canvas.height - this.height - 40;
        this.angle = -Math.PI / 2;
    }

    draw() {
  ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
}

}

class Enemy {
    constructor(x, y, question, answer) {
        this.width = 50;
        this.height = 50;
        this.x = x;
        this.y = y;
        this.question = question;
        this.answer = answer;
        this.speed = 1;
    }

    draw() {
        ctx.drawImage(enemyImg, this.x, this.y, this.width, this.height);
        ctx.fillStyle = "white";
        ctx.font = "16px Arial";
        ctx.fillText(this.question, this.x + 10, this.y + this.height + 20);
    }

    update() {
        this.y += this.speed;
    }
}


class Projectile {
  constructor(x, y, angle, target = null) {
    this.x = x;
    this.y = y;
    this.speed = 12;
    this.vx = Math.cos(angle) * this.speed;
    this.vy = Math.sin(angle) * this.speed;
    this.radius = 5;
    this.target = target;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = "yellow";
    ctx.fill();
  }
}




let               player;
let enemies;
let projectiles;
let score;
let lives;
let enemySpawnRate;
let enemySpawnTimer;
let gameInterval;

function init() {
    player = new Player();
    enemies = [];
    projectiles = [];
    score = 0;
    lives = 5;
    enemySpawnRate = 2000;
    enemySpawnTimer = enemySpawnRate;

    scoreEl.textContent = score;
    livesEl.textContent = lives;
    gameOverEl.classList.add('hidden');
    answerInput.value = '';
    answerInput.focus();

    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, 1000 / 60);
}

function generateQuestion() {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const operator = ['+', '-', '*'][Math.floor(Math.random() * 3)];
    let question, answer;

    switch (operator) {
        case '+':
            question = `${num1} + ${num2}`;
            answer = num1 + num2;
            break;
        case '-':
            question = `${num1 > num2 ? num1 : num2} - ${num1 > num2 ? num2 : num1}`;
            answer = Math.abs(num1 - num2);
            break;
        case '*':
            question = `${num1} * ${num2}`;
            answer = num1 * num2;
            break;
    }
    return { question, answer };
}

function spawnEnemy() {
    const { question, answer } = generateQuestion();
    const x = Math.random() * (canvas.width - 50);
    const y = -50;
    enemies.push(new Enemy(x, y, question, answer));
}

function getRank(score) {
    if (score < 100) return 'Beginner';
    if (score < 500) return 'Novice';
    if (score < 1000) return 'Adept';
    if (score < 2000) return 'Expert';
    return 'Master';
}

function gameOver() {
    clearInterval(gameInterval);
    gameOverEl.classList.remove('hidden');
    finalScoreEl.textContent = score;
    rankEl.textContent = getRank(score);
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    player.draw();

    enemySpawnTimer -= 1000 / 60;
    if (enemySpawnTimer <= 0) {
        spawnEnemy();
        enemySpawnTimer = enemySpawnRate;
        if (enemySpawnRate > 500) {
            enemySpawnRate *= 0.99;
        }
    }

    enemies.forEach((enemy, enemyIndex) => {
        enemy.update();
        enemy.draw();

        if (enemy.y > canvas.height) {
            enemies.splice(enemyIndex, 1);
            lives--;
            livesEl.textContent = lives;
            if (lives <= 0) gameOver();
        }
    });

    projectiles.forEach((projectile, projIndex) => {
    projectile.update();
    projectile.draw();

    if (projectile.x < 0 || projectile.x > canvas.width || projectile.y < 0 || projectile.y > canvas.height) {
        projectiles.splice(projIndex, 1);
        return;
    }

    // update and draw projectiles
for (let p = projectiles.length - 1; p >= 0; p--) {
    const proj = projectiles[p];
    proj.update();
    proj.draw();

    let hit = false;

    // check collision against all enemies
    for (let e = enemies.length - 1; e >= 0; e--) {
        const enemy = enemies[e];

        // rectangle hitbox with margin
        const margin = 10;
        if (
            proj.x > enemy.x - margin &&
            proj.x < enemy.x + enemy.width + margin &&
            proj.y > enemy.y - margin &&
            proj.y < enemy.y + enemy.height + margin
        ) {
            // ✅ hit confirmed
            enemies.splice(e, 1);
            projectiles.splice(p, 1);

            // 🔊 play explosion sound here
            explosionSound.currentTime = 0;
            explosionSound.play();

            // update score
            score += 10;
            scoreEl.textContent = score;

            hit = true;
            break; // stop checking this projectile
        }
    }

    if (hit) continue;

    // cleanup offscreen
    if (
        proj.y < 0 || proj.x < 0 ||
        proj.x > canvas.width || proj.y > canvas.height
    ) {
        projectiles.splice(p, 1);
    }
}


});

}

answerInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const userAnswer = parseInt(answerInput.value);
        for (let i = 0; i < enemies.length; i++) {
            if (enemies[i].answer === userAnswer) {
                const target = enemies[i];

                // rotate player
                player.angle = Math.atan2(target.y - player.y, target.x - player.x);

                // create projectile
                projectiles.push(new Projectile(
                  player.x + player.width / 2,
                  player.y,   // top of the player ship
                  player.angle,
                  target
                ));

                shootSound.currentTime = 0; // rewind so rapid fire works
                  shootSound.play();
                
                console.log("Firing at", target.question, "Answer:", target.answer);


                answerInput.value = '';
                break;
            }
        }
    }
});

restartBtn.addEventListener('click', init);

init();
