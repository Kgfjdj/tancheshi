// 本地存储管理模块
const storage = {
    STORAGE_KEY: 'snakeGameData',

    // 默认数据结构
    defaultData: {
        highScore: 0,
        settings: {
            difficulty: 'medium',
            soundEnabled: true,
            musicEnabled: true,
            theme: 'classic',
            showGrid: true
        },
        history: [],
        stats: {
            totalGames: 0,
            totalPlayTime: 0,
            totalScore: 0
        }
    },

    // 初始化存储
    init() {
        const data = this.loadData();
        if (!data) {
            this.saveData(this.defaultData);
        }
    },

    // 加载数据
    loadData() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('加载数据失败:', error);
            return null;
        }
    },

    // 保存数据
    saveData(data) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('保存数据失败:', error);
            return false;
        }
    },

    // 获取最高分
    getHighScore() {
        const data = this.loadData() || this.defaultData;
        return data.highScore || 0;
    },

    // 更新最高分
    updateHighScore(score) {
        const data = this.loadData() || this.defaultData;
        if (score > data.highScore) {
            data.highScore = score;
            this.saveData(data);
            return true; // 返回true表示破纪录
        }
        return false;
    },

    // 获取设置
    getSettings() {
        const data = this.loadData() || this.defaultData;
        return data.settings || this.defaultData.settings;
    },

    // 更新设置
    updateSettings(newSettings) {
        const data = this.loadData() || this.defaultData;
        data.settings = { ...data.settings, ...newSettings };
        this.saveData(data);
    },

    // 添加游戏记录
    addGameRecord(score, duration, difficulty) {
        const data = this.loadData() || this.defaultData;

        // 创建新记录
        const record = {
            score: score,
            date: new Date().toISOString().split('T')[0],
            duration: duration,
            difficulty: difficulty
        };

        // 添加到历史记录(保留最近20条)
        data.history.unshift(record);
        if (data.history.length > 20) {
            data.history = data.history.slice(0, 20);
        }

        // 更新统计数据
        data.stats.totalGames += 1;
        data.stats.totalPlayTime += duration;
        data.stats.totalScore += score;

        this.saveData(data);
    },

    // 获取历史记录
    getHistory() {
        const data = this.loadData() || this.defaultData;
        return data.history || [];
    },

    // 获取统计数据
    getStats() {
        const data = this.loadData() || this.defaultData;
        return data.stats || this.defaultData.stats;
    },

    // 获取平均分数
    getAverageScore() {
        const stats = this.getStats();
        if (stats.totalGames === 0) return 0;
        return Math.round(stats.totalScore / stats.totalGames);
    },

    // 格式化时间(秒转为分:秒)
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    },

    // 重置所有数据
    resetData() {
        if (confirm('确定要重置所有数据吗?此操作无法撤销!')) {
            this.saveData(this.defaultData);
            alert('数据已重置!');
            location.reload();
        }
    }
};

// 页面加载时初始化存储
storage.init();
