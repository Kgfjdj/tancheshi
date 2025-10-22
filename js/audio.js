// 音效管理模块(使用Web Audio API)
const audio = {
    context: null,
    sounds: {},
    musicGain: null,
    soundGain: null,

    // 初始化音频上下文
    init() {
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            this.musicGain = this.context.createGain();
            this.soundGain = this.context.createGain();
            this.musicGain.connect(this.context.destination);
            this.soundGain.connect(this.context.destination);

            // 生成所有音效
            this.generateSounds();
        } catch (error) {
            console.warn('音频初始化失败,将静音运行:', error);
        }
    },

    // 生成各种音效(使用合成音)
    generateSounds() {
        // 吃食物音效
        this.sounds.eat = () => {
            if (!this.context) return;
            const oscillator = this.context.createOscillator();
            const gainNode = this.context.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.soundGain);

            oscillator.frequency.setValueAtTime(800, this.context.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(1200, this.context.currentTime + 0.1);

            gainNode.gain.setValueAtTime(0.3, this.context.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);

            oscillator.start(this.context.currentTime);
            oscillator.stop(this.context.currentTime + 0.1);
        };

        // 游戏结束音效
        this.sounds.gameOver = () => {
            if (!this.context) return;
            const oscillator = this.context.createOscillator();
            const gainNode = this.context.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.soundGain);

            oscillator.frequency.setValueAtTime(400, this.context.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(100, this.context.currentTime + 0.3);

            gainNode.gain.setValueAtTime(0.3, this.context.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.3);

            oscillator.start(this.context.currentTime);
            oscillator.stop(this.context.currentTime + 0.3);
        };

        // 按钮点击音效
        this.sounds.click = () => {
            if (!this.context) return;
            const oscillator = this.context.createOscillator();
            const gainNode = this.context.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.soundGain);

            oscillator.frequency.setValueAtTime(600, this.context.currentTime);
            gainNode.gain.setValueAtTime(0.2, this.context.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.05);

            oscillator.start(this.context.currentTime);
            oscillator.stop(this.context.currentTime + 0.05);
        };

        // 破纪录音效
        this.sounds.newRecord = () => {
            if (!this.context) return;
            const times = [0, 0.1, 0.2, 0.3];
            const frequencies = [523, 659, 784, 1047];

            times.forEach((time, index) => {
                const oscillator = this.context.createOscillator();
                const gainNode = this.context.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(this.soundGain);

                oscillator.frequency.setValueAtTime(frequencies[index], this.context.currentTime + time);
                gainNode.gain.setValueAtTime(0.2, this.context.currentTime + time);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + time + 0.1);

                oscillator.start(this.context.currentTime + time);
                oscillator.stop(this.context.currentTime + time + 0.1);
            });
        };
    },

    // 播放音效
    play(soundName) {
        const settings = storage.getSettings();
        if (!settings.soundEnabled || !this.sounds[soundName]) return;

        try {
            // 恢复音频上下文(某些浏览器需要用户交互后才能播放)
            if (this.context && this.context.state === 'suspended') {
                this.context.resume();
            }
            this.sounds[soundName]();
        } catch (error) {
            console.warn('播放音效失败:', error);
        }
    },

    // 更新音效设置
    updateSettings() {
        const settings = storage.getSettings();
        if (this.soundGain) {
            this.soundGain.gain.value = settings.soundEnabled ? 1 : 0;
        }
        if (this.musicGain) {
            this.musicGain.gain.value = settings.musicEnabled ? 0.3 : 0;
        }
    }
};

// 初始化音频
audio.init();
