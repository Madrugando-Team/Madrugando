import { PowerUp } from "../entities/powerUp.js";
import { getWordsByCategory } from "../data/wordpools.js";
import { Gelo } from "../powerups/gelo.js";
import { Despertador } from "../powerups/despertador.js";
import { Reverso } from "../powerups/reverso.js";
import { Duplicador } from "../powerups/duplicador.js";

export class PowerUpManager {
    constructor(canvasWidth,
        canvasHeight,
        enemyManager,
        enemySpawner,
        scoreManager,
        waveManager) {
        this.powerUps = [];

        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;

        this.enemyManager = enemyManager;
        this.enemySpawner = enemySpawner;
        this.scoreManager = scoreManager;
        this.waveManager = waveManager;

        // O "science" é só um valor inicial de segurança. Antes da partida começar, ele será substituído pela escolha do jogador.
        this.category = "science";

        this.currentWave = 1;
        this.powerUpsSpawned = 0;
        this.customDictionary = null;



        this.timer = 0;
        this.gelo = new Gelo(this.enemyManager);
        this.despertador = new Despertador(this.enemyManager, this.enemySpawner);
        this.reverso = new Reverso(this.enemyManager);
        this.duplicador = new Duplicador(this.scoreManager);
        // Por enquanto, apenas para teste
        this.powerUpInterval = 20000;

        this.types = [
            "despertador",
            "gelo",
            "reverso",
            "duplicador"
        ];
    }

    setCategory(category) {
        this.category = category;

        // Desativa o dicionário personalizado
        // ao iniciar uma partida normal.
        this.customDictionary = null;
    }
    setCustomDictionary(dictionary) {
        if (!Array.isArray(dictionary) || dictionary.length === 0) {
            console.warn("Dicionário personalizado inválido.");
            this.customDictionary = null;
            return;
        }

        this.customDictionary = dictionary;

        console.log(
            `Dicionário personalizado carregado: ${dictionary.length} palavras`
        );
    }

    getRandomWord(excludeWord = null) {

        let pool;

        if (this.customDictionary !== null) {

            pool = this.customDictionary;

        } else {

            const levels = ["easy", "medium"];

            const level = levels[
                Math.floor(Math.random() * levels.length)
            ];

            pool = getWordsByCategory(this.category, level);
        }

        if (!pool || pool.length === 0) {
            return null;
        }

        // Evita repetir a palavra anterior,
        // desde que existam alternativas.
        const alternatives = pool.filter(
            word => word.toLowerCase() !==
                excludeWord?.toLowerCase()
        );

        const availableWords = alternatives.length > 0
            ? alternatives
            : pool;

        return availableWords[
            Math.floor(Math.random() * availableWords.length)
        ];

    }

    update(deltaTime) {

        const wave = this.waveManager.getWave();

        // Detecta mudança de Wave
        if (wave !== this.currentWave) {

            this.currentWave = wave;

            this.powerUpsSpawned = 0;
            this.timer = 0;

        }

        const maxPowerUps = this.currentWave;


        // Atualiza os efeitos ativos
        this.gelo.update(deltaTime);
        this.reverso.update(deltaTime);
        this.duplicador.update(deltaTime);


        // Só conta o tempo quando NÃO existe
        // Power-up na tela e ainda é permitido
        // gerar Power-ups nesta Wave
        if (
            this.powerUps.length === 0 &&
            this.powerUpsSpawned < maxPowerUps
        ) {

            this.timer += deltaTime;

            if (this.timer >= this.powerUpInterval) {

                this.spawn();

                this.powerUpsSpawned++;

                this.timer = 0;

            }

        }


        // Atualiza o Power-up que estiver na tela
        this.powerUps.forEach(powerUp => {

            powerUp.update(deltaTime);

        });


        this.removeDead();
    }

    spawn() {
        const type =
            this.types[
            Math.floor(
                Math.random() *
                this.types.length
            )
            ];

        const word = this.getRandomWord();

        if (word === null) {
            return;
        }

        const powerUp = new PowerUp({
            x: -50,
            y: this.canvasHeight / 2,
            type: type,
            speed: 1.4,
            word: word
        });

        this.powerUps.push(powerUp);

        console.log(
            "Power-up apareceu:",
            type
        );
    }
    hasWordStartingWith(prefix) {

        if (this.powerUps.length === 0) {
            return false;
        }

        return this.powerUps.some(powerUp =>
            powerUp.word.toLowerCase().startsWith(
                prefix.toLowerCase())
        );
    }

    processWord(word) {

        const result = {
            correct: false,
            powerUp: null
        };

        this.powerUps.forEach(powerUp => {

            if (powerUp.word.toLowerCase() !== word.toLowerCase()) {
                return;
            }

            result.correct = true;
            result.powerUp = powerUp;

            powerUp.registerCorrectWord();

            console.log(
                `Power-up ${powerUp.type}: ` +
                `${powerUp.correctWords}/${powerUp.requiredWords}`
            );

            // Chegou em 3 palavras corretas
            if (powerUp.isUnlocked()) {

                console.log(
                    `Power-up ${powerUp.type} desbloqueado!`
                );

                if (powerUp.type === "gelo") {
                    this.gelo.activate();
                };

                if (powerUp.type === "despertador") {
                    this.despertador.activate();
                };

                if (powerUp.type === "reverso") {
                    this.reverso.activate();
                };

                if (powerUp.type === "duplicador") {
                    this.duplicador.activate();
                };


                powerUp.kill();

                return;
            }

            // Ainda não chegou em 3
            // Escolhe uma nova palavra
            const oldWord = powerUp.word;

            const newWord = this.getRandomWord(oldWord);

            if (newWord !== null) {
                powerUp.word = newWord;
            }

            console.log(
                `Nova palavra do Power-up: ${newWord}`
            );
        });

        this.removeDead();

        return result;
    }

    draw(ctx) {
        this.powerUps.forEach(powerUp => {
            powerUp.draw(ctx);
        });
    }

    removeDead() {
        this.powerUps =
            this.powerUps.filter(
                powerUp => !powerUp.isDead()
            );
    }

    registerCorrectWord() {

        if (this.powerUps.length === 0) {
            return;
        }

        const powerUp = this.powerUps[0];

        powerUp.registerCorrectWord();

        console.log(
            `Power-up ${powerUp.type}: ${powerUp.correctWords}/${powerUp.requiredWords}`
        );

    }

    clear() {
        this.powerUps = [];
    }

    reset() {

        this.powerUps = [];
        this.timer = 0;

        this.currentWave = 1;
        this.powerUpsSpawned = 0;

        // Limpa o dicionário da partida anterior
        this.customDictionary = null;


        this.gelo.reset();
        this.reverso.reset();
        this.duplicador.reset();

    }

}