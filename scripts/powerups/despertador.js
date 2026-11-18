// Efeito "PUF!" no centro da tela: nasce pequeno, se expande e some
const PUF_IMAGE = new Image();
PUF_IMAGE.src = new URL(
    "../../assets/images/effects/puf.webp",
    import.meta.url
).href;

// Centro da área de jogo, em proporção do canvas (no PC: 640 × 340).
// Assim o PUF também fica no meio da tela do celular em pé.
const PUF_CENTER = { x: 0.5, y: 340 / 720 };
const PUF_START_SIZE = 80;   // px do canvas ao surgir
const PUF_END_SIZE = 900;    // px do canvas ao terminar de expandir
const PUF_DURATION = 750;    // ms
const PUF_FADE_START = 0.35; // a partir de 35% da animação começa a sumir

export class Despertador {

    constructor(enemyManager, enemySpawner, scoreManager, waveManager) {

        this.enemyManager = enemyManager;
        this.enemySpawner = enemySpawner;
        this.scoreManager = scoreManager;
        this.waveManager = waveManager;

        // "PUF!" em andamento (null quando não há)
        this.burst = null;

    }

    activate() {

        // "PUF!" no centro da tela
        this.burst = { age: 0 };

        // Elimina os inimigos e pontua cada eliminação.
        // Conta os Scromblus antes de eliminar: cada um vale 50 pontos
        const scromblusKilled = this.enemyManager.enemies.filter(
            enemy => enemy.type === "scromblus" && enemy.isActive()
        ).length;

        // Elimina os inimigos e pontua cada eliminação.
        // (o Boozarro não entra na contagem do killAll)
        const enemiesKilled = this.enemyManager.killAll();

        const otherEnemiesKilled = enemiesKilled - scromblusKilled;

        for (let index = 0; index < otherEnemiesKilled; index++) {
            this.scoreManager.addScore(10);
        }

        for (let index = 0; index < scromblusKilled; index++) {
            this.scoreManager.addScore(50);
        }
        this.waveManager.wordCorrect(enemiesKilled);

        // Pausando o spawn de inimigos por 750ms
        this.enemySpawner.pauseSpawning(750);

        console.log("⏰ Despertador ativado!");

    }


    update(deltaTime) {

        if (!this.burst)
            return;

        this.burst.age += deltaTime;

        if (this.burst.age >= PUF_DURATION) {
            this.burst = null;
        }
    }

    // Desenhado por cima dos inimigos
    drawEffects(ctx) {

        if (!this.burst)
            return;

        if (!PUF_IMAGE.complete || PUF_IMAGE.naturalWidth === 0)
            return;

        const progress = this.burst.age / PUF_DURATION;

        // Expansão rápida no começo, desacelerando no fim (ease-out)
        const eased = 1 - (1 - progress) ** 3;
        const size =
            PUF_START_SIZE + (PUF_END_SIZE - PUF_START_SIZE) * eased;

        // Some aos poucos enquanto se expande
        const alpha = progress < PUF_FADE_START
            ? 1
            : 1 - (progress - PUF_FADE_START) / (1 - PUF_FADE_START);

        const scale = size / Math.max(
            PUF_IMAGE.naturalWidth,
            PUF_IMAGE.naturalHeight
        );

        const width = PUF_IMAGE.naturalWidth * scale;
        const height = PUF_IMAGE.naturalHeight * scale;

        ctx.save();
        ctx.globalAlpha = Math.max(alpha, 0);
        ctx.drawImage(
            PUF_IMAGE,
            ctx.canvas.width * PUF_CENTER.x - width / 2,
            ctx.canvas.height * PUF_CENTER.y - height / 2,
            width,
            height
        );
        ctx.restore();
    }

    reset() {
        this.burst = null;
    }
}
