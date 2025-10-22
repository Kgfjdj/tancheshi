// UI控制器模块
const ui = {
    currentScreen: 'welcomeScreen',
    previousScreen: null,

    // 初始化UI
    init() {
        this.setupEventListeners();
        this.updateAllSettings();
        this.showWelcome();
    },

    // 设置事件监听
    setupEventListeners() {
        // 难度选择(主菜单)
        document.querySelectorAll('.difficulty-buttons .difficulty-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.difficulty-buttons .difficulty-btn').forEach(b => {
                    b.classList.remove('active');
                });
                btn.classList.add('active');
                game.difficulty = btn.dataset.difficulty;
                game.speed = game.difficulties[game.difficulty];
                storage.updateSettings({ difficulty: game.difficulty });
                audio.play('click');
            });
        });

        // 难度选择(设置页面)
        document.querySelectorAll('[data-setting-difficulty]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('[data-setting-difficulty]').forEach(b => {
                    b.classList.remove('active');
                });
                btn.classList.add('active');
                game.difficulty = btn.dataset.settingDifficulty;
                game.speed = game.difficulties[game.difficulty];
                storage.updateSettings({ difficulty: game.difficulty });
                audio.play('click');
                this.updateMainMenuDifficulty();
            });
        });

        // 音效开关
        document.getElementById('soundToggle').addEventListener('change', (e) => {
            storage.updateSettings({ soundEnabled: e.target.checked });
            audio.updateSettings();
        });

        // 背景音乐开关
        document.getElementById('musicToggle').addEventListener('change', (e) => {
            storage.updateSettings({ musicEnabled: e.target.checked });
            audio.updateSettings();
        });

        // 网格线开关
        document.getElementById('gridToggle').addEventListener('change', (e) => {
            storage.updateSettings({ showGrid: e.target.checked });
        });

        // 主题选择
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.theme-btn').forEach(b => {
                    b.classList.remove('active');
                });
                btn.classList.add('active');
                const theme = btn.dataset.theme;
                storage.updateSettings({ theme: theme });
                document.body.className = `theme-${theme}`;
                audio.play('click');
            });
        });

        // 添加按钮点击音效
        document.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', () => {
                audio.play('click');
            });
        });
    },

    // 显示欢迎屏幕
    showWelcome() {
        this.switchScreen('welcomeScreen');
    },

    // 显示主菜单
    showMainMenu() {
        this.switchScreen('mainMenu');
        this.updateMainMenuHighScore();
        this.updateMainMenuDifficulty();
    },

    // 更新主菜单最高分显示
    updateMainMenuHighScore() {
        document.getElementById('mainMenuHighScore').textContent = storage.getHighScore();
    },

    // 更新主菜单难度显示
    updateMainMenuDifficulty() {
        const settings = storage.getSettings();
        document.querySelectorAll('.difficulty-buttons .difficulty-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.difficulty === settings.difficulty) {
                btn.classList.add('active');
            }
        });
    },

    // 开始游戏
    startGame() {
        this.switchScreen('gameScreen');
        // 确保渲染引擎已初始化
        setTimeout(() => {
            render.init();
            game.start();
        }, 100);
    },

    // 退出到主菜单
    exitToMenu() {
        game.stop();
        this.showMainMenu();
    },

    // 显示设置
    showSettings() {
        this.previousScreen = this.currentScreen;
        this.switchScreen('settingsScreen');
        this.updateSettingsUI();
    },

    // 更新设置UI
    updateSettingsUI() {
        const settings = storage.getSettings();

        // 更新难度
        document.querySelectorAll('[data-setting-difficulty]').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.settingDifficulty === settings.difficulty) {
                btn.classList.add('active');
            }
        });

        // 更新开关
        document.getElementById('soundToggle').checked = settings.soundEnabled;
        document.getElementById('musicToggle').checked = settings.musicEnabled;
        document.getElementById('gridToggle').checked = settings.showGrid;

        // 更新主题
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.theme === settings.theme) {
                btn.classList.add('active');
            }
        });
    },

    // 显示统计
    showStats() {
        this.previousScreen = this.currentScreen;
        this.switchScreen('statsScreen');
        this.updateStatsUI();
    },

    // 更新统计UI
    updateStatsUI() {
        const stats = storage.getStats();
        const history = storage.getHistory();

        // 更新统计卡片
        document.getElementById('totalGames').textContent = stats.totalGames;
        document.getElementById('statsHighScore').textContent = storage.getHighScore();
        document.getElementById('avgScore').textContent = storage.getAverageScore();
        document.getElementById('totalTime').textContent = storage.formatTime(stats.totalPlayTime);

        // 更新历史记录表格
        const tbody = document.getElementById('historyTableBody');
        tbody.innerHTML = '';

        if (history.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="no-data">暂无记录</td></tr>';
        } else {
            history.forEach(record => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${record.date}</td>
                    <td>${record.score}</td>
                    <td>${storage.formatTime(record.duration)}</td>
                    <td>${this.getDifficultyText(record.difficulty)}</td>
                `;
                tbody.appendChild(row);
            });
        }
    },

    // 获取难度文本
    getDifficultyText(difficulty) {
        const texts = {
            easy: '简单',
            medium: '中等',
            hard: '困难'
        };
        return texts[difficulty] || difficulty;
    },

    // 显示帮助
    showHelp() {
        this.previousScreen = this.currentScreen;
        this.switchScreen('helpScreen');
    },

    // 返回上一页
    goBack() {
        if (this.previousScreen) {
            this.switchScreen(this.previousScreen);
            this.previousScreen = null;
        } else {
            this.showMainMenu();
        }
    },

    // 切换屏幕
    switchScreen(screenId) {
        // 移除所有屏幕的active类
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // 添加active类到目标屏幕
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenId;
        }
    },

    // 更新所有设置
    updateAllSettings() {
        const settings = storage.getSettings();

        // 应用主题
        document.body.className = `theme-${settings.theme}`;

        // 更新游戏设置
        game.difficulty = settings.difficulty;
        game.speed = game.difficulties[game.difficulty];

        // 更新音频设置
        audio.updateSettings();
    }
};

// 初始化UI
document.addEventListener('DOMContentLoaded', () => {
    ui.init();
});
