// 游戏核心逻辑模块
const game = {
    // 游戏状态
    snake: null,
    food: null,
    score: 0,
    gameLoop: null,
    isRunning: false,
    isPaused: false,
    direction: 'right',
    nextDirection: 'right',
    difficulty: 'medium',
    speed: 150,
    startTime: null,
    gameTime: 0,
    particles: [],

    // 难度设置(速度值越大越慢,单位:毫秒)
    difficulties: {
        easy: 280,    // 原200增加40%
        medium: 210,  // 原150增加40%
        hard: 140     // 原100增加40%
    },

    // 初始化游戏
    init() {
        this.setupControls();
        this.difficulty = storage.getSettings().difficulty;
        this.speed = this.difficulties[this.difficulty];
    },

    // 设置控制
    setupControls() {
        // 键盘控制
        document.addEventListener('keydown', (e) => {
            if (!this.isRunning) return;

            switch (e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    if (this.direction !== 'down') this.nextDirection = 'up';
                    e.preventDefault();
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    if (this.direction !== 'up') this.nextDirection = 'down';
                    e.preventDefault();
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    if (this.direction !== 'right') this.nextDirection = 'left';
                    e.preventDefault();
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    if (this.direction !== 'left') this.nextDirection = 'right';
                    e.preventDefault();
                    break;
                case ' ':
                    this.togglePause();
                    e.preventDefault();
                    break;
            }
        });

        // 触摸控制
        let touchStartX = 0;
        let touchStartY = 0;

        document.getElementById('gameCanvas').addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            e.preventDefault();
        });

        document.getElementById('gameCanvas').addEventListener('touchmove', (e) => {
            e.preventDefault();
        });

        document.getElementById('gameCanvas').addEventListener('touchend', (e) => {
            if (!this.isRunning) return;

            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;

            const dx = touchEndX - touchStartX;
            const dy = touchEndY - touchStartY;

            if (Math.abs(dx) > Math.abs(dy)) {
                // 水平滑动
                if (dx > 30 && this.direction !== 'left') {
                    this.nextDirection = 'right';
                } else if (dx < -30 && this.direction !== 'right') {
                    this.nextDirection = 'left';
                }
            } else {
                // 垂直滑动
                if (dy > 30 && this.direction !== 'up') {
                    this.nextDirection = 'down';
                } else if (dy < -30 && this.direction !== 'down') {
                    this.nextDirection = 'up';
                }
            }
        });

        // 虚拟方向键控制
        document.querySelectorAll('.dpad-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const dir = btn.dataset.direction;
                if (!this.isRunning) return;

                const opposites = { up: 'down', down: 'up', left: 'right', right: 'left' };
                if (this.direction !== opposites[dir]) {
                    this.nextDirection = dir;
                }
            });
        });
    },

    // 开始新游戏
    start() {
        // 初始化蛇
        this.snake = {
            body: [
                { x: 10, y: 10 },
                { x: 9, y: 10 },
                { x: 8, y: 10 }
            ],
            direction: 'right'
        };

        this.direction = 'right';
        this.nextDirection = 'right';
        this.score = 0;
        this.gameTime = 0;
        this.startTime = Date.now();
        this.particles = [];

        // 生成食物
        this.generateFood();

        // 更新UI
        document.getElementById('currentScore').textContent = '0';
        document.getElementById('highScore').textContent = storage.getHighScore();

        // 立即渲染初始画面
        this.render();

        // 显示倒计时
        this.showCountdown(() => {
            this.isRunning = true;
            this.isPaused = false;
            this.updatePauseButton();
            this.startGameLoop();
            this.startTimer();
        });
    },

    // 显示倒计时
    showCountdown(callback) {
        const countdownEl = document.getElementById('countdown');
        let count = 3;

        const countInterval = setInterval(() => {
            if (count > 0) {
                countdownEl.textContent = count;
                countdownEl.style.display = 'block';
                audio.play('click');
                count--;
            } else {
                countdownEl.style.display = 'none';
                clearInterval(countInterval);
                callback();
            }
        }, 1000);
    },

    // 开始游戏循环
    startGameLoop() {
        this.gameLoop = setInterval(() => {
            if (!this.isPaused) {
                this.update();
                this.render();
            }
        }, this.speed);
    },

    // 开始计时器
    startTimer() {
        this.timerInterval = setInterval(() => {
            if (!this.isPaused && this.isRunning) {
                this.gameTime = Math.floor((Date.now() - this.startTime) / 1000);
                this.updateTimer();
            }
        }, 1000);
    },

    // 更新计时器显示
    updateTimer() {
        const mins = Math.floor(this.gameTime / 60);
        const secs = this.gameTime % 60;
        document.getElementById('gameTime').textContent =
            `${mins}:${secs.toString().padStart(2, '0')}`;
    },

    // 更新游戏状态
    update() {
        // 更新方向
        this.direction = this.nextDirection;
        this.snake.direction = this.direction;

        // 计算新头部位置
        const head = { ...this.snake.body[0] };

        switch (this.direction) {
            case 'up':
                head.y--;
                break;
            case 'down':
                head.y++;
                break;
            case 'left':
                head.x--;
                break;
            case 'right':
                head.x++;
                break;
        }

        // 检测碰撞
        if (this.checkCollision(head)) {
            this.gameOver();
            return;
        }

        // 添加新头部
        this.snake.body.unshift(head);

        // 检测是否吃到食物
        if (head.x === this.food.x && head.y === this.food.y) {
            this.eatFood();
        } else {
            // 移除尾部
            this.snake.body.pop();
        }

        // 更新粒子
        this.updateParticles();
    },

    // 检测碰撞
    checkCollision(head) {
        // 检测墙壁碰撞
        if (head.x < 0 || head.x >= render.gridSize || head.y < 0 || head.y >= render.gridSize) {
            return true;
        }

        // 检测自身碰撞
        for (let i = 0; i < this.snake.body.length; i++) {
            if (head.x === this.snake.body[i].x && head.y === this.snake.body[i].y) {
                return true;
            }
        }

        return false;
    },

    // 吃到食物
    eatFood() {
        this.score += 10;
        document.getElementById('currentScore').textContent = this.score;

        // 播放音效
        audio.play('eat');

        // 生成粒子效果
        this.createParticles(this.food.x, this.food.y);

        // 生成新食物
        this.generateFood();
    },

    // 生成食物
    generateFood() {
        let x, y;
        let valid = false;

        while (!valid) {
            x = Math.floor(Math.random() * render.gridSize);
            y = Math.floor(Math.random() * render.gridSize);

            // 确保食物不在蛇身上
            valid = !this.snake.body.some(segment => segment.x === x && segment.y === y);
        }

        // 彩虹主题下随机生成颜色
        const settings = storage.getSettings();
        let color = null;
        if (settings.theme === 'rainbow') {
            const hue = Math.floor(Math.random() * 360);
            color = `hsl(${hue}, 70%, 60%)`;
        }

        this.food = { x, y, color };
    },

    // 创建粒子效果
    createParticles(gridX, gridY) {
        const x = gridX * render.cellSize + render.cellSize / 2;
        const y = gridY * render.cellSize + render.cellSize / 2;

        for (let i = 0; i < 10; i++) {
            const angle = (Math.PI * 2 * i) / 10;
            const speed = 2 + Math.random() * 2;

            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 3 + Math.random() * 3,
                alpha: 1,
                color: this.food.color || '#FF6B6B'
            });
        }
    },

    // 更新粒子
    updateParticles() {
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.alpha -= 0.02;
            particle.size *= 0.95;
            return particle.alpha > 0;
        });
    },

    // 渲染游戏
    render() {
        render.clear();
        render.drawFood(this.food);
        render.drawSnake(this.snake);
        render.drawParticles(this.particles);
    },

    // 切换暂停
    togglePause() {
        if (!this.isRunning) return;

        this.isPaused = !this.isPaused;
        this.updatePauseButton();
        audio.play('click');
    },

    // 更新暂停按钮
    updatePauseButton() {
        const btn = document.getElementById('pauseBtn');
        btn.textContent = this.isPaused ? '继续' : '暂停';
    },

    // 游戏结束
    gameOver() {
        this.isRunning = false;
        this.isPaused = false;

        // 停止游戏循环
        clearInterval(this.gameLoop);
        clearInterval(this.timerInterval);

        // 播放音效
        audio.play('gameOver');

        // 保存记录
        const isNewRecord = storage.updateHighScore(this.score);
        storage.addGameRecord(this.score, this.gameTime, this.difficulty);

        // 显示游戏结束弹窗
        setTimeout(() => {
            this.showGameOverModal(isNewRecord);
        }, 500);
    },

    // 显示游戏结束弹窗
    showGameOverModal(isNewRecord) {
        document.getElementById('finalScore').textContent = this.score;

        // 根据分数显示不同消息
        let message = '再接再厉!';
        if (isNewRecord) {
            message = '恭喜!新纪录!';
            audio.play('newRecord');
        } else if (this.score >= 100) {
            message = '太棒了!';
        } else if (this.score >= 50) {
            message = '不错哦!';
        }

        document.getElementById('scoreMessage').textContent = message;
        document.getElementById('gameOverModal').classList.add('show');
    },

    // 重新开始
    restart() {
        document.getElementById('gameOverModal').classList.remove('show');
        this.start();
    },

    // 停止游戏
    stop() {
        this.isRunning = false;
        this.isPaused = false;
        clearInterval(this.gameLoop);
        clearInterval(this.timerInterval);
        document.getElementById('gameOverModal').classList.remove('show');
    }
};

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    game.init();
});
