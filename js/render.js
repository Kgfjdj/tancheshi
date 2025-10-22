// 渲染引擎模块
const render = {
    canvas: null,
    ctx: null,
    gridSize: 20,
    cellSize: 20,

    // 初始化画布
    init() {
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) {
            console.error('Canvas元素未找到!');
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();

        console.log('Canvas初始化成功:', {
            width: this.canvas.width,
            height: this.canvas.height,
            cellSize: this.cellSize
        });

        // 监听窗口大小变化
        window.addEventListener('resize', () => this.resizeCanvas());
    },

    // 调整画布大小
    resizeCanvas() {
        const container = this.canvas.parentElement;
        const size = Math.min(container.clientWidth, container.clientHeight, 600);

        this.canvas.width = size;
        this.canvas.height = size;
        this.cellSize = size / this.gridSize;
    },

    // 清空画布
    clear() {
        if (!this.ctx || !this.canvas) {
            console.warn('Canvas未初始化,无法清空');
            return;
        }

        const settings = storage.getSettings();
        const theme = settings.theme || 'classic';

        // 根据主题设置背景色
        const backgrounds = {
            classic: '#1A1A2E',
            dark: '#121212',
            rainbow: '#F8F9FA'
        };

        this.ctx.fillStyle = backgrounds[theme] || backgrounds.classic;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制网格线
        if (settings.showGrid) {
            this.drawGrid();
        }
    },

    // 绘制网格
    drawGrid() {
        const settings = storage.getSettings();
        const theme = settings.theme || 'classic';

        // 根据主题设置网格线颜色
        const gridColors = {
            classic: 'rgba(255, 255, 255, 0.05)',
            dark: 'rgba(255, 255, 255, 0.03)',
            rainbow: 'rgba(0, 0, 0, 0.05)'
        };

        this.ctx.strokeStyle = gridColors[theme] || gridColors.classic;
        this.ctx.lineWidth = 1;

        // 绘制垂直线
        for (let x = 0; x <= this.gridSize; x++) {
            const xPos = x * this.cellSize;
            this.ctx.beginPath();
            this.ctx.moveTo(xPos, 0);
            this.ctx.lineTo(xPos, this.canvas.height);
            this.ctx.stroke();
        }

        // 绘制水平线
        for (let y = 0; y <= this.gridSize; y++) {
            const yPos = y * this.cellSize;
            this.ctx.beginPath();
            this.ctx.moveTo(0, yPos);
            this.ctx.lineTo(this.canvas.width, yPos);
            this.ctx.stroke();
        }
    },

    // 绘制蛇
    drawSnake(snake) {
        if (!snake || !snake.body || !this.ctx) {
            return;
        }

        const settings = storage.getSettings();
        const theme = settings.theme || 'classic';

        snake.body.forEach((segment, index) => {
            const x = segment.x * this.cellSize;
            const y = segment.y * this.cellSize;

            // 根据主题和位置设置颜色
            if (theme === 'rainbow') {
                // 彩虹模式:渐变色
                const hue = (index * 10) % 360;
                this.ctx.fillStyle = `hsl(${hue}, 70%, 60%)`;
            } else {
                // 其他主题
                const colors = {
                    classic: index === 0 ? '#00FF9C' : '#00D084',
                    dark: index === 0 ? '#D0A0FF' : '#BB86FC'
                };
                this.ctx.fillStyle = colors[theme] || colors.classic;
            }

            // 绘制圆角矩形
            const padding = 2;
            const radius = 4;
            this.roundRect(
                x + padding,
                y + padding,
                this.cellSize - padding * 2,
                this.cellSize - padding * 2,
                radius
            );
            this.ctx.fill();

            // 绘制蛇头的眼睛
            if (index === 0) {
                this.drawEyes(segment, snake.direction);
            }
        });
    },

    // 绘制蛇头的眼睛
    drawEyes(head, direction) {
        const x = head.x * this.cellSize;
        const y = head.y * this.cellSize;
        const eyeSize = 3;

        this.ctx.fillStyle = '#000';

        // 根据方向调整眼睛位置
        let eye1X, eye1Y, eye2X, eye2Y;

        switch (direction) {
            case 'up':
                eye1X = x + this.cellSize * 0.3;
                eye1Y = y + this.cellSize * 0.3;
                eye2X = x + this.cellSize * 0.7;
                eye2Y = y + this.cellSize * 0.3;
                break;
            case 'down':
                eye1X = x + this.cellSize * 0.3;
                eye1Y = y + this.cellSize * 0.7;
                eye2X = x + this.cellSize * 0.7;
                eye2Y = y + this.cellSize * 0.7;
                break;
            case 'left':
                eye1X = x + this.cellSize * 0.3;
                eye1Y = y + this.cellSize * 0.3;
                eye2X = x + this.cellSize * 0.3;
                eye2Y = y + this.cellSize * 0.7;
                break;
            case 'right':
                eye1X = x + this.cellSize * 0.7;
                eye1Y = y + this.cellSize * 0.3;
                eye2X = x + this.cellSize * 0.7;
                eye2Y = y + this.cellSize * 0.7;
                break;
        }

        this.ctx.beginPath();
        this.ctx.arc(eye1X, eye1Y, eyeSize, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.arc(eye2X, eye2Y, eyeSize, 0, Math.PI * 2);
        this.ctx.fill();
    },

    // 绘制食物
    drawFood(food) {
        if (!food || !this.ctx) {
            return;
        }

        const settings = storage.getSettings();
        const theme = settings.theme || 'classic';

        const x = food.x * this.cellSize;
        const y = food.y * this.cellSize;

        // 根据主题设置食物颜色
        const colors = {
            classic: '#FF6B6B',
            dark: '#03DAC6',
            rainbow: food.color || '#FF6B6B'
        };

        this.ctx.fillStyle = colors[theme] || colors.classic;

        // 绘制圆形食物(带呼吸动画效果)
        const time = Date.now() / 1000;
        const pulse = Math.sin(time * 5) * 0.1 + 1; // 0.9 到 1.1 之间
        const size = (this.cellSize * 0.8 * pulse) / 2;

        this.ctx.beginPath();
        this.ctx.arc(
            x + this.cellSize / 2,
            y + this.cellSize / 2,
            size,
            0,
            Math.PI * 2
        );
        this.ctx.fill();

        // 添加高光效果
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.beginPath();
        this.ctx.arc(
            x + this.cellSize / 2 - size / 3,
            y + this.cellSize / 2 - size / 3,
            size / 3,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
    },

    // 绘制圆角矩形辅助函数
    roundRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
    },

    // 绘制粒子效果(吃食物时)
    drawParticles(particles) {
        particles.forEach(particle => {
            this.ctx.fillStyle = particle.color;
            this.ctx.globalAlpha = particle.alpha;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1;
    }
};

// 初始化渲染引擎
document.addEventListener('DOMContentLoaded', () => {
    render.init();
});
