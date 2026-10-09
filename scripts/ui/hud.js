
export default class HUD {

    constructor() {

        this.score =
            document.getElementById("score");

        this.lives =
            document.getElementById("lives");

        this.level =
            document.getElementById("level");

        this.words =
            document.getElementById("words");

        this.waveProgress =
            document.getElementById("wave-progress");

        this.waveNumber =
            document.getElementById("wave-number");

        this.progressBar =
            document.getElementById("progress-bar");

        this.progressFill =
            document.getElementById("progress-fill");

        this.progressText =
            document.getElementById("progress-text");

        this.currentWave = 1;
        this.bossTimerVisible = false;
    }

    show() {

        const hud =
            document.getElementById("hud");

        if (hud) {
            hud.style.display = "";
        }
    }

    hide() {

        const hud =
            document.getElementById("hud");

        if (hud) {
            hud.style.display = "none";
        }
    }

    setScore(value) {

        if (this.score) {
            this.score.textContent = value;
        }
    }

    setLives(value) {

        if (this.lives) {
            this.lives.textContent =
                "❤️".repeat(value) +
                "🖤".repeat(3 - value);
        }
    }

    setLevel(value) {

        if (this.level) {
            this.level.textContent = value;
        }
    }

    setWords(value) {

        if (this.words) {
            this.words.textContent = value;
        }
    }

    setWave(wave) {

        this.currentWave = wave;

        if (this.waveNumber && !this.bossTimerVisible) {
            this.waveNumber.textContent =
                `WAVE ${wave}`;
        }
    }

    setProgress(current, required) {

        if (
            !this.progressFill ||
            !this.progressText
        ) {
            return;
        }

        const percentage =
            required > 0
                ? (current / required) * 100
                : 0;

        this.progressFill.style.width =
            `${percentage}%`;

        this.progressText.textContent =
            `${current} / ${required}`;
    }

    showBossTimer(seconds) {

        if (!this.waveProgress || !this.waveNumber)
            return;

        this.bossTimerVisible = true;

        this.waveProgress.classList.add(
            "boss-timer-active"
        );

        this.waveProgress.classList.toggle(
            "timer-warning",
            seconds <= 10
        );

        this.waveNumber.textContent =
            `${seconds}s`;
    }

    hideBossTimer() {

        if (!this.waveProgress || !this.waveNumber)
            return;

        this.bossTimerVisible = false;

        this.waveProgress.classList.remove(
            "boss-timer-active",
            "timer-warning"
        );

        this.waveNumber.textContent =
            `WAVE ${this.currentWave}`;
    }
}