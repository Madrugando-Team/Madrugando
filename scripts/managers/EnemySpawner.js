import { createBoo } from "../entities/boo.js";
import { createScromblus } from "../entities/scromblus.js";
import { createBoozarro } from "../entities/boozarro.js";

// Chance de um Boo nascer como Boozarro (palavra errada que não deve
// ser digitada) e quantos podem estar na tela ao mesmo tempo
const BOOZARRO_CHANCE = 0.15;
const MAX_BOOZARROS = 1;

// O dano acontece quando os pés do Boo tocam o chão (e não mais a palavra),
// o que encurta o percurso em ~5%. Reduzir a velocidade na mesma proporção
// mantém o tempo de queda igual ao de antes dos sprites.
const BOO_SPEED_MULTIPLIER = 0.95;

// Mesmo ajuste para o Scromblus. Como a palavra fica no balão acima da
// cabeça, os pés ficam ~145px abaixo dela e o percurso encurta ~21%.
const SCROMBLUS_SPEED_MULTIPLIER = 0.79;

// Tempo de espera para o próximo Scromblus, contado a partir do momento
// em que o anterior sai de cena (derrotado ou ao chegar ao chão).
// Depende das vidas do jogador no momento.
const SCROMBLUS_COOLDOWN_FULL_LIVES = 5000;     // ms com os 3 corações
const SCROMBLUS_COOLDOWN_MISSING_LIFE = 12000;  // ms com algum coração perdido
const MAX_LIVES = 3;

// ---------- Velocidade dos inimigos por onda ----------
// Cada lista tem a velocidade de uma onda por posição: 1ª onda, 2ª onda...
// Para ajustar uma onda específica, basta mudar o número dela.
// A velocidade vale para o Boo e o Boozarro; o Scromblus usa metade dela.
// (Antes era fixa: fácil 1.0, médio 1.05, difícil 1.1.)
export const WAVE_SPEEDS = {
    //      onda: 1     2     3     4     5     6     7     8     9     10
    easy: [0.50, 0.60, 0.70, 0.80, 0.90, 1.00, 1.10, 1.20, 1.30, 1.40],
    medium: [0.55, 0.70, 0.85, 1.00, 1.15, 1.30, 1.45, 1.60, 1.75, 1.90],
    hard: [0.60, 0.85, 1.10, 1.35, 1.60, 1.85, 2.10, 2.35, 2.60, 2.85]
};

// Depois da última onda da lista, a velocidade continua subindo
// este valor a cada nova onda.
export const WAVE_SPEED_STEP = {
    easy: 0.10,
    medium: 0.15,
    hard: 0.25
};

export const DifficultyConfig = {

    easy: {
        spawnInterval: 3000,
        maxEnemies: 3,
        poolLevel: "easy",
        lives: 3,
        bossTime: 60

    },
    medium: {
        spawnInterval: 2950,
        maxEnemies: 4,
        poolLevel: "medium",
        lives: 3,
        bossTime: 45

    },
    hard: {
        spawnInterval: 2900,
        maxEnemies: 5,
        poolLevel: "hard",
        lives: 2,
        bossTime: 30

    }
};

export class EnemySpawner {
    constructor(
        enemyManager,
        difficulty = "easy",
        config = {},
        waveManager,
        scoreManager
    ) {
        this.enemyManager = enemyManager;
        this.waveManager = waveManager;
        this.scoreManager = scoreManager;
        this.spawnPauseTimer = 0;
        this.customDictionary = null;

        this.canvasWidth =
            config.canvasWidth ?? 1280;

        this.canvasHeight =
            config.canvasHeight ?? 720;

        this.enemyConfig = {
            category: config.category ?? "science",
            ...config.enemyConfig
        };


        this.setDifficulty(difficulty);

        this.timer = 0;

        // Controle dos Scromblus
        this.scromblusTimer = 0;

        this.currentWave = 1;
        this.scromblusSpawned = 0;
        this.scromblusQuota = this.getScromblusQuota();
        this.boolhanteToken = false;
        this.nextBoolhanteWave = 2;
        this.boolhanteSpawnedWave = null;
        this.boolhanteTargetProgress = null;
        this.boolhanteEnabled = true;
        this.hasUnusedBoolhanteRewards = () => true;
    }

    pauseSpawning(duration = 500) {
        this.spawnPauseTimer = duration;
    }

    setDifficulty(level) {
        this.difficulty = level;
        this.config = DifficultyConfig[level];
        if (this.currentWave) {
            this.scromblusQuota = this.getScromblusQuota();
        }
    }

    // Velocidade dos inimigos na onda atual (tabela WAVE_SPEEDS)
    getWaveSpeed() {

        const speeds =
            WAVE_SPEEDS[this.difficulty] ?? WAVE_SPEEDS.medium;

        const wave = Math.max(1, this.currentWave || 1);

        if (wave <= speeds.length) {
            return speeds[wave - 1];
        }

        // Ondas além da tabela: continua subindo a partir da última
        const extraWaves = wave - speeds.length;
        const step = WAVE_SPEED_STEP[this.difficulty] ?? 0.1;

        return speeds[speeds.length - 1] + extraWaves * step;
    }

    // Com os 3 corações o Scromblus volta mais rápido;
    // com algum coração perdido ele demora mais para surgir.
    getScromblusCooldown() {

        const lives = this.scoreManager?.getLives() ?? MAX_LIVES;

        return lives >= MAX_LIVES
            ? SCROMBLUS_COOLDOWN_FULL_LIVES
            : SCROMBLUS_COOLDOWN_MISSING_LIFE;
    }

    getScromblusQuota() {
        if (this.difficulty === "easy") {
            return Math.random() < 0.5 ? 1 : 0;
        }

        if (this.difficulty === "medium") {
            return 1;
        }

        return Math.max(1, this.currentWave || 1);
    }

    update(deltaTime) {
        // Detecta mudança de wave
        const wave = this.waveManager.getWave();

        if (this.spawnPauseTimer > 0) {

            this.spawnPauseTimer -= deltaTime;

            return;
        }

        if (wave !== this.currentWave) {
            this.currentWave = wave;
            this.scromblusSpawned = 0;
            this.scromblusTimer = 0;
            this.scromblusQuota = this.getScromblusQuota();
            this.boolhanteTargetProgress = this.getRandomBoolhanteProgress();
        }

        // Geração normal de Boos
        this.timer += deltaTime;

        if (
            this.timer >= this.config.spawnInterval &&
            this.enemyManager.hasSpace(
                this.config.maxEnemies
            )
        ) {
            this.spawn();
            this.timer = 0;
        }

        // Geração de Scromblus
        // O tempo de espera só corre quando não há Scromblus em jogo:
        // começa a contar depois que o anterior é derrotado ou chega ao chão.
        if (this.enemyManager.hasScromblus()) {
            this.scromblusTimer = 0;
        } else {
            this.scromblusTimer += deltaTime;
        }

        if (
            this.scromblusSpawned < this.scromblusQuota &&
            !this.enemyManager.hasScromblus() &&
            this.scromblusTimer >= this.getScromblusCooldown() &&
            this.enemyManager.hasSpace(
                this.config.maxEnemies
            )
        ) {
            const spawned = this.spawnScromblus();

            if (spawned) {
                this.scromblusSpawned++;
                this.scromblusTimer = 0;
            }
        }
    }

    spawn() {

        if (this.shouldSpawnBoolhante() && this.spawnBoolhante()) return;

        if (this.shouldSpawnBoozarro()) {
            this.spawnBoozarro();
            return;
        }

        const enemy = createBoo(
            0,
            0,
            {
                speed: this.getWaveSpeed() * this.getHeightSpeedFactor() * BOO_SPEED_MULTIPLIER,
                category: this.enemyConfig.category,
                difficulty: this.difficulty,
                poolLevel: this.config.poolLevel,
                customDictionary: this.customDictionary
            }
        );
        if (!enemy) {
            return;
        }
        enemy.x = this.findSafeX(
            enemy.word.length * 10
        );

        this.enemyManager.add(enemy);

    }

    setBoolhanteRewardAvailability(check) {
        this.hasUnusedBoolhanteRewards = check;
    }

    setBoolhanteEnabled(enabled) {
        this.boolhanteEnabled = enabled !== false;
        if (!this.boolhanteEnabled) this.boolhanteToken = false;
    }

    hasBoolhanteToken() {
        return this.boolhanteToken;
    }

    shouldSpawnBoolhante() {
        if (this.boolhanteTargetProgress === null) {
            this.boolhanteTargetProgress = this.getRandomBoolhanteProgress();
        }
        return this.boolhanteEnabled &&
            !this.boolhanteToken &&
            this.currentWave >= this.nextBoolhanteWave &&
            this.boolhanteSpawnedWave !== this.currentWave &&
            this.waveManager.getWordsCorrect() >= this.boolhanteTargetProgress &&
            this.hasUnusedBoolhanteRewards();
    }

    getRandomBoolhanteProgress() {
        const required = this.waveManager.getWordsRequired();
        if (required <= 4) return 1;
        return 1 + Math.floor(Math.random() * (required - 2));
    }

    spawnBoolhante() {
        const wordLevel = this.difficulty === "easy" ? "medium" : "hard";
        const enemy = createBoo(0, 0, {
            speed: this.getWaveSpeed() * this.getHeightSpeedFactor() * BOO_SPEED_MULTIPLIER,
            category: this.enemyConfig.category,
            difficulty: this.difficulty,
            poolLevel: this.config.poolLevel,
            customDictionary: this.customDictionary,
            forcedWordLevel: wordLevel,
            type: "boolhante"
        });
        if (!enemy) return false;
        enemy.x = this.findSafeX(enemy.word.length * 10);
        this.enemyManager.add(enemy);
        this.boolhanteSpawnedWave = this.currentWave;
        return true;
    }

    collectBoolhanteToken() {
        this.boolhanteToken = true;
    }

    useBoolhanteToken() {
        if (!this.boolhanteToken) return false;
        this.boolhanteToken = false;
        this.nextBoolhanteWave = this.currentWave + 2;
        return true;
    }

    shouldSpawnBoozarro() {

        const boozarrosOnScreen = this.enemyManager.enemies.filter(
            enemy => enemy.type === "boozarro" && enemy.isActive()
        ).length;

        return boozarrosOnScreen < MAX_BOOZARROS &&
            Math.random() < BOOZARRO_CHANCE;
    }

    spawnBoozarro() {

        const enemy = createBoozarro(0, 0, {
            speed: this.getWaveSpeed() * this.getHeightSpeedFactor() * BOO_SPEED_MULTIPLIER,
            customDictionary: this.customDictionary
        });

        enemy.x = this.findSafeX(
            enemy.word.length * 10
        );

        this.enemyManager.add(enemy);
    }

    spawnScromblus() {

        const enemy = createScromblus(
            0,
            0,
            {
                speed: this.getWaveSpeed() * this.getHeightSpeedFactor() * 0.5 * SCROMBLUS_SPEED_MULTIPLIER,
                category: this.enemyConfig.category,
                difficulty: this.difficulty,
                poolLevel: this.config.poolLevel,
                customDictionary: this.customDictionary,
                scoreManager: this.scoreManager
            }
        );
        if (!enemy) {
            return;
        }

        enemy.x = this.findSafeX(
            enemy.word.length * 10
        );

        // O Scromblus nasce com o corpo inteiro visível (a palavra fica
        // no balão acima dele), então ele entra deslizando de cima
        enemy.startEntry();

        this.enemyManager.add(enemy);

        console.log(
            `Scromblus ${this.scromblusSpawned + 1} de ${this.currentWave} na Wave ${this.currentWave}`
        );
        return true;
    }

    // A velocidade da tabela vale para a altura do PC (720). Em telas mais
    // altas ou mais baixas (celular em pé, com ou sem teclado) a velocidade
    // acompanha a altura, então o tempo até o chão continua o mesmo.
    getHeightSpeedFactor() {
        return this.canvasHeight / 720;
    }

    // Distância mínima das bordas. Na tela estreita do celular em pé
    // a margem do PC (100px) tiraria espaço demais.
    getSideMargin() {
        return this.canvasWidth < 800 ? 24 : 100;
    }

    findSafeX(wordWidth = 100) {

        const margin = this.getSideMargin();
        const minDistance = 50;
        const maxAttempts = 10;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {

            const x =
                Math.random() *
                (this.canvasWidth - margin * 2 - wordWidth) +
                margin;

            let safe = true;

            for (const enemy of this.enemyManager.enemies) {

                const distance =
                    Math.abs(enemy.x - x);

                if (distance < wordWidth + minDistance) {
                    safe = false;
                    break;
                }
            }

            if (safe) {
                return x;
            }
        }

        return this.randomX();
    }

    randomX() {
        const margin = this.getSideMargin();

        return (
            Math.random() *
            (this.canvasWidth - margin * 2)
        ) + margin;
    }

    reset() {

        this.timer = 0;
        this.scromblusTimer = 0;
        this.currentWave = 1;
        this.scromblusSpawned = 0;
        this.scromblusQuota = this.getScromblusQuota();
        this.customDictionary = null;
        this.boolhanteToken = false;
        this.nextBoolhanteWave = 2;
        this.boolhanteSpawnedWave = null;
        this.boolhanteTargetProgress = null;

    }

    setCategory(category) {
        this.enemyConfig.category = category;
        this.customDictionary = null;
    }

    setCustomDictionary(dictionary) {
        this.customDictionary = dictionary;
    }

}
