import { Scene } from "../assets/images/scenario/scene.js";
import { EnemyManager } from "./managers/EnemyManager.js";
import { EnemySpawner, DifficultyConfig } from "./managers/EnemySpawner.js";
import { InputManager } from "./managers/InputManager.js";
import { InputBar } from "./ui/InputBar.js";
import ScoreManager from "./managers/scoreManager.js";
import WaveManager from "./managers/WaveManager.js";
import { PowerUpManager } from "./managers/PowerUpManager.js";
import HUD from "./ui/HUD.js";
import { BossManager } from "./managers/BossManager.js";


export default class Game {

    constructor() {

        this.canvas = document.getElementById("gameCanvas");
        this.ctx = this.canvas.getContext("2d");

        this.lastTime = 0;

        this.gameStarted = false;

        this.scene = new Scene();

        this.scoreManager = new ScoreManager();

        this.waveManager = new WaveManager();

        this.bossManager = new BossManager();

        this.hud = new HUD();


        this.enemyManager = new EnemyManager(
            this.scoreManager,
            this.canvas.height
        );


        this.enemySpawner = new EnemySpawner(
            this.enemyManager,
            "medium",
            {
                canvasWidth: this.canvas.width,
                category: "science"
            },
            this.waveManager
        );

        this.powerUpManager = new PowerUpManager(
            this.canvas.width,
            this.canvas.height,
            this.enemyManager,
            this.enemySpawner,
            this.scoreManager,
            this.waveManager
        );

        this.inputManager = new InputManager(
            this.enemyManager,
            this.scoreManager,
            this.waveManager,
            this.powerUpManager
        );


        this.inputBar = new InputBar(
            this.inputManager,
            this.canvas
        );

        this.menu = document.getElementById("game-menu");

        this.playButton = document.getElementById("play-button");


        this.playButton.addEventListener("click", () => {

            this.mainMenu.style.display = "none";

            this.gameConfig.style.display = "flex";

        });

        this.canvas.addEventListener("click", (event) => {

            if (!this.gameStarted)
                return;

            if (this.waveManager.getState() !== "question")
                return;

            if (!this.bossManager.hasBoss())
                return;


            const rect =
                this.canvas.getBoundingClientRect();


            const scaleX =
                this.canvas.width / rect.width;

            const scaleY =
                this.canvas.height / rect.height;


            const mouseX =
                (event.clientX - rect.left) * scaleX;

            const mouseY =
                (event.clientY - rect.top) * scaleY;


            const result =
                this.bossManager.handleClick(
                    mouseX,
                    mouseY
                );

            if (!result)
                return;

            if (result.result === "wrong") {

                this.scoreManager.loseLife();

            }

            if (result.result === "correct") {

                this.waveManager.nextWave();

                this.enemyManager.reset();

                this.powerUpManager.clear();

                this.bossManager.removeBoss();

            }

        });


        window.addEventListener("keydown", (event) => {

            if (
                event.key === "Enter" &&
                this.scoreManager.gameOverState
            ) {

                this.returnToMenu();

            }

        });


        this.hud.hide();

        this.mainMenu =
            document.getElementById("main-menu");

        this.gameConfig =
            document.getElementById("game-config");

        this.backButton =
            this.gameConfig.querySelector("back-button");

        this.backButton.addEventListener("back", () => {

            this.gameConfig.style.display = "none";

            this.mainMenu.style.display = "flex";

        });

        this.subjectSelect =
            document.getElementById("subject-select");

        this.difficultySelect =
            document.getElementById("difficulty-select");

        this.startGameButton =
            document.getElementById("start-game-button");


        this.startGameButton.addEventListener("click", () => {

            const subject =
                this.subjectSelect.value;

            const difficulty =
                this.difficultySelect.value;

            if (!subject || !difficulty)
                return;

            this.selectedSubject = subject;
            this.selectedDifficulty = difficulty;

            this.startGame();

        });
    }


    startGame() {

        const difficulty =
            DifficultyConfig[this.selectedDifficulty];

        this.enemySpawner.setDifficulty(
            this.selectedDifficulty
        );

        this.enemySpawner.setCategory(
            this.selectedSubject
        );

        this.powerUpManager.setCategory(
            this.selectedSubject
        );

        this.scoreManager.setLives(
            difficulty.lives
        );

        this.gameStarted = true;

        this.menu.style.display = "none";

        this.hud.show();

        this.lastTime = performance.now();

    }


    start() {

        requestAnimationFrame(
            this.loop.bind(this)
        );

    }


    loop(timestamp) {

        const deltaTime =
            timestamp - this.lastTime;

        this.lastTime = timestamp;


        this.update(deltaTime);

        this.draw();


        requestAnimationFrame(
            this.loop.bind(this)
        );

    }


    update(deltaTime) {
        if (!this.gameStarted) {
            if (this.scene.update) {
                this.scene.update(deltaTime);
            }
            return;
        }

        if (this.scoreManager.gameOverState) {
            return;
        }

        // Gameplay normal: inimigos, digitação e power-ups
        if (this.waveManager.getState() === "playing") {
            this.enemySpawner.update(deltaTime);
            this.enemyManager.update(deltaTime);
            this.powerUpManager.update(deltaTime);
            this.inputManager.update(deltaTime);
            this.inputBar.update(deltaTime);
        }

        // O Boss precisa continuar sendo atualizado durante a questão
        this.bossManager.update(deltaTime);

        if (
            this.waveManager.getState() === "question" &&
            !this.bossManager.hasBoss()
        ) {
            this.bossManager.spawn(
                this.selectedSubject
            );
        }

        this.updateHUD();

        if (this.scene.update) {
            this.scene.update(deltaTime);
        }
    }


    draw() {

        const ctx = this.ctx;

        const width = this.canvas.width;

        const height = this.canvas.height;


        ctx.clearRect(
            0,
            0,
            width,
            height
        );


        this.scene.render(
            ctx,
            width,
            height
        );


        if (!this.gameStarted) {

            return;

        }

        this.enemyManager.draw(ctx);

        this.bossManager.draw(ctx);

        if (this.waveManager.getState() === "playing") {
            this.powerUpManager.draw(ctx);
        }

        this.inputBar.draw(ctx);

        if (this.scoreManager.gameOverState) {

            this.drawGameOver(ctx);

        }

    }


    updateHUD() {

        this.hud.setWave(
            this.waveManager.getWave()
        );


        this.hud.setProgress(
            this.waveManager.getWordsCorrect(),
            this.waveManager.getWordsRequired()
        );

    }


    drawGameOver(ctx) {

        const width = this.canvas.width;

        const height = this.canvas.height;


        ctx.fillStyle = "rgba(5, 8, 20, 0.65)";


        ctx.fillRect(
            0,
            0,
            width,
            height
        );


        const boxWidth = 500;

        const boxHeight = 220;


        const boxX =
            (width - boxWidth) / 2;

        const boxY =
            (height - boxHeight) / 2;


        ctx.fillStyle =
            "rgba(15, 20, 45, 0.95)";

        ctx.strokeStyle =
            "rgba(160, 170, 230, 0.35)";

        ctx.lineWidth = 2;


        ctx.beginPath();


        ctx.roundRect(
            boxX,
            boxY,
            boxWidth,
            boxHeight,
            20
        );


        ctx.fill();

        ctx.stroke();


        ctx.textAlign = "center";

        ctx.textBaseline = "middle";


        ctx.font = "bold 56px Arial";

        ctx.fillStyle = "#f5f3ff";


        ctx.shadowColor =
            "rgba(150, 140, 255, 0.5)";

        ctx.shadowBlur = 15;


        ctx.fillText(
            "GAME OVER",
            width / 2,
            boxY + 65
        );


        ctx.shadowBlur = 0;


        ctx.font = "20px Arial";

        ctx.fillStyle = "#f4f0c9";


        ctx.fillText(
            `Pontuação: ${this.scoreManager.getScore()}`,
            width / 2,
            boxY + 120
        );


        ctx.font = "16px Arial";

        ctx.fillStyle =
            "rgba(235, 233, 255, 0.7)";


        ctx.fillText(
            "Pressione ENTER para voltar ao menu",
            width / 2,
            boxY + 170
        );


        ctx.textAlign = "left";

        ctx.textBaseline = "alphabetic";

    }


    returnToMenu() {

        this.gameStarted = false;


        this.scoreManager.reset();

        this.enemyManager.reset();

        this.enemySpawner.reset();

        this.powerUpManager.reset();

        this.inputManager.reset();

        this.waveManager.reset();

        this.bossManager.removeBoss();


        this.menu.style.display = "flex";

        this.hud.hide();

    }

}