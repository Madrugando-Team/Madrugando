// Imagens das vidas (caminho resolvido a partir deste arquivo)
const HEART_FULL = new URL(
    "../../assets/images/hud/coracao-cheio.webp",
    import.meta.url
).href;

const HEART_EMPTY = new URL(
    "../../assets/images/hud/coracao-vazio.webp",
    import.meta.url
).href;

const MAX_LIVES = 3;

export default class HUD {

    constructor() {

        this.score =
            document.getElementById("score");

        this.lives =
            document.getElementById("lives");

        // Elemento que contém o retângulo e os corações
        this.livesContainer = this.lives?.parentElement;

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

        if (!this.lives)
            return;

        const lives = Math.max(0, Math.min(value, MAX_LIVES));

        // Cria as imagens dos corações uma única vez
        if (!this.heartImages) {

            this.heartImages = [];

            for (let i = 0; i < MAX_LIVES; i++) {

                const heart = document.createElement("img");

                heart.className = "life-heart";
                heart.alt = "";
                heart.draggable = false;

                this.heartImages.push(heart);
            }

            this.lives.replaceChildren(...this.heartImages);
        }

        // Só troca a imagem dos corações que mudaram
        this.heartImages.forEach((heart, index) => {

            const src = index < lives ? HEART_FULL : HEART_EMPTY;

            if (heart.src !== src) {
                heart.src = src;
            }

            heart.classList.toggle("empty", index >= lives);
        });

        this.lives.setAttribute(
            "aria-label",
            `${lives} de ${MAX_LIVES} vidas`
        );
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

    setInvincibility(active) {
        if (!this.livesContainer) return;

        this.livesContainer.classList.toggle(
            "invincibility-active",
            active
        );
    }
}