import { createBoo } from "../entities/boo.js";
import { createScromblus } from "../entities/scromblus.js";

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
        spawnInterval: 2750,
        speed: 1.1,
        maxEnemies: 4,
        poolLevel: "medium",
        lives: 3,
        bossTime: 45

    },
    hard: {
        spawnInterval: 2500,
        speed: 1.2,
        maxEnemies: 5,
        poolLevel: "medium",
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
    }

    pauseSpawning(duration = 500) {
        this.spawnPauseTimer = duration;
    }

    setDifficulty(level) {
        this.config = DifficultyConfig[level];
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

        const maxScromblus = this.currentWave;

        if (
            this.scromblusSpawned < maxScromblus &&
            !this.enemyManager.hasScromblus() &&
            this.scromblusTimer >= this.scromblusInterval &&
            this.enemyManager.hasSpace(
                this.config.maxEnemies
            )
        ) {
            this.spawnScromblus();
            this.scromblusSpawned++;
            this.scromblusTimer = 0;
        }
    }

    spawn() {

        const enemy = createBoo(
            0,
            0,
            {
                speed: this.config.speed,
                category: this.enemyConfig.category,
                poolLevel: this.config.poolLevel,
                customDictionary: this.customDictionary
            }
        );

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
                speed: this.config.speed,
                category: this.enemyConfig.category,
                poolLevel: this.config.poolLevel,
                customDictionary: this.customDictionary,
                scoreManager: this.scoreManager
            }
        );

        enemy.x = this.findSafeX(
            enemy.word.length * 10
        );

        this.enemyManager.add(enemy);

        console.log(
            `Scromblus ${this.scromblusSpawned + 1} de ${this.currentWave} na Wave ${this.currentWave}`
        );
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
        this.customDictionary = null;

    }

    setCategory(category) {
        this.enemyConfig.category = category;
    }

    setCustomDictionary(dictionary) {
        this.customDictionary = dictionary;
    }

}