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
const SCROMBLUS_COOLDOWN_FULL_LIVES = 8000;     // ms com os 3 corações
const SCROMBLUS_COOLDOWN_MISSING_LIFE = 18000;  // ms com algum coração perdido
const MAX_LIVES = 3;

export const DifficultyConfig = {

    easy: {
        spawnInterval: 3000,
        speed: 1,
        maxEnemies: 3,
        poolLevel: "easy",
        lives: 3,
        bossTime: 60

    },
    medium: {
        spawnInterval: 2950,
        speed: 1.05,
        maxEnemies: 4,
        poolLevel: "medium",
        lives: 3,
        bossTime: 45

    },
    hard: {
        spawnInterval: 2900,
        speed: 1.1,
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

    // Com os 3 corações o Scromblus volta mais rápido;
    // com algum coração perdido ele demora mais para surgir.
    getScromblusCooldown() {

        const lives = this.scoreManager?.getLives() ?? MAX_LIVES;

        return lives >= MAX_LIVES
            ? SCROMBLUS_COOLDOWN_FULL_LIVES
            : SCROMBLUS_COOLDOWN_MISSING_LIFE;
    }

    // Quantos Scromblus podem surgir por onda.
    // Cresce com as ondas em todas as dificuldades, mais devagar nas fáceis.
    getScromblusQuota() {

        const wave = Math.max(1, this.currentWave || 1);

        if (this.difficulty === "easy") {
            return Math.ceil(wave / 3);   // ondas 1-3: 1 | 4-6: 2 | 7-9: 3
        }

        if (this.difficulty === "medium") {
            return Math.ceil(wave / 2);   // ondas 1-2: 1 | 3-4: 2 | 5-6: 3
        }

        return wave;                      // difícil: igual à onda
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

        if (this.shouldSpawnBoozarro()) {
            this.spawnBoozarro();
            return;
        }

        const enemy = createBoo(
            0,
            0,
            {
                speed: this.config.speed * BOO_SPEED_MULTIPLIER,
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

    shouldSpawnBoozarro() {

        const boozarrosOnScreen = this.enemyManager.enemies.filter(
            enemy => enemy.type === "boozarro" && enemy.isActive()
        ).length;

        return boozarrosOnScreen < MAX_BOOZARROS &&
            Math.random() < BOOZARRO_CHANCE;
    }

    spawnBoozarro() {

        const enemy = createBoozarro(0, 0, {
            speed: this.config.speed * BOO_SPEED_MULTIPLIER
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
                speed: this.config.speed * 0.5 * SCROMBLUS_SPEED_MULTIPLIER,
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

    findSafeX(wordWidth = 100) {

        const margin = 100;
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
        const margin = 100;

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

    }

    setCategory(category) {
        this.enemyConfig.category = category;
        this.customDictionary = null;
    }

    setCustomDictionary(dictionary) {
        this.customDictionary = dictionary;
    }

}