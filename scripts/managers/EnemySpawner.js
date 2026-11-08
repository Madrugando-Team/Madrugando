import { createBoo } from "../entities/boo.js";
import { createScromblus } from "../entities/scromblus.js";

// O dano acontece quando os pés do Boo tocam o chão (e não mais a palavra),
// o que encurta o percurso em ~5%. Reduzir a velocidade na mesma proporção
// mantém o tempo de queda igual ao de antes dos sprites.
const BOO_SPEED_MULTIPLIER = 0.95;

// Mesmo ajuste para o Scromblus. Como a palavra fica no balão acima da
// cabeça, os pés ficam ~145px abaixo dela e o percurso encurta ~21%.
const SCROMBLUS_SPEED_MULTIPLIER = 0.79;

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
        this.scromblusInterval = 10000;

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
        this.scromblusTimer += deltaTime;

        if (
            this.scromblusSpawned < this.scromblusQuota &&
            !this.enemyManager.hasScromblus() &&
            this.scromblusTimer >= this.scromblusInterval &&
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
