import { Scene } from "../assets/images/scenario/scene.js";
import { EnemyManager } from "./managers/EnemyManager.js";
import { EnemySpawner, DifficultyConfig } from "./managers/EnemySpawner.js";
import { InputManager } from "./managers/InputManager.js";
import { InputBar } from "./ui/InputBar.js";
import ScoreManager from "./managers/scoreManager.js";
import WaveManager from "./managers/WaveManager.js";
import { PowerUpManager } from "./managers/PowerUpManager.js";
import HUD from "./ui/hud.js";
import { BossManager } from "./managers/BossManager.js";
import { CustomGameManager } from "./managers/CustomGameManager.js";
import { LeaderboardManager } from "./managers/LeaderboardManager.js";
import WordPools from "./data/wordpools.js";


export default class Game {

    constructor() {

        this.canvas = document.getElementById("gameCanvas");
        this.ctx = this.canvas.getContext("2d");

        this.lastTime = 0;

        this.gameStarted = false;

        this.gamePaused = false;

        this.gameOverButtons = [];

        this.gameOverHoveredButton = null;
        this.gameOverHoverProgress = [0, 0, 0];

        this.scene = new Scene();

        this.scoreManager = new ScoreManager();

        this.waveManager = new WaveManager();

        this.bossManager = new BossManager();

        this.hud = new HUD();

        this.customGameManager =
            new CustomGameManager();

        this.leaderboardManager =
            new LeaderboardManager();

        this.playerName = "";
        this.currentRunRecordId = null;
        this.gameOverOverlayDisplayed = false;
        this.leaderboardPreviousScreen = null;

        this.customGameDictionary = [];

        this.customGameQuestions = [];

        this.isCustomGame = false;

        this.currentCustomGame = null;

        this.customGameEditingId = null;

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
            this.waveManager,
            this.scoreManager
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

        this.menu =
            document.getElementById("game-menu");

        this.pauseMenu =
            document.getElementById("pause-menu");

        this.resumeButton =
            document.getElementById("resume-button");

        this.pauseMenuButton =
            document.getElementById("pause-menu-button");

        this.playButton = document.getElementById("play-button");

        this.resumeButton.addEventListener("click", () => {

            this.resumeGame();

        });



        this.pauseMenuButton.addEventListener("click", () => {

            this.returnToMenu();

        });

        this.canvas.addEventListener("click", (event) => {

            if (this.scoreManager.isGameOver()) {
                return;
            }

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

                if (this.scoreManager.isGameOver()) {
                    return;
                }

                this.bossManager.startTimeoutReveal();

                return;
            }

            if (result.result === "correct") {

                this.waveManager.nextWave();

                this.enemyManager.reset();

                this.powerUpManager.clear();

                this.bossManager.removeBoss();

                this.hud.show();

            }

        });

        this.canvas.addEventListener("click", (event) => {
            if (!this.scoreManager.isGameOver()) return;

            const rect = this.canvas.getBoundingClientRect();

            const mouseX =
                (event.clientX - rect.left) *
                (this.canvas.width / rect.width);

            const mouseY =
                (event.clientY - rect.top) *
                (this.canvas.height / rect.height);

            const button = this.gameOverButtons?.find(btn =>
                mouseX >= btn.x &&
                mouseX <= btn.x + btn.w &&
                mouseY >= btn.y &&
                mouseY <= btn.y + btn.h
            );

            if (!button) return;

            switch (button.action) {
                case "replay":
                    this.replayGame();
                    break;

                case "menu":
                    this.returnToMenu();
                    break;

                case "feedback":
                    window.open(
                        "https://docs.google.com/forms/d/e/1FAIpQLSfwjlcUTLN0vOwwBRd5dYCP5cnkZp1jPoY1F-7u2ZMgYKhtqQ/viewform?usp=publish-editor",
                        "_blank",
                        "noopener,noreferrer"
                    );
                    break;
            }
        });

        this.canvas.addEventListener("mousemove", (event) => {
            if (!this.scoreManager.isGameOver()) {
                return;
            }


            const rect = this.canvas.getBoundingClientRect();

            const mouseX =
                (event.clientX - rect.left) *
                (this.canvas.width / rect.width);

            const mouseY =
                (event.clientY - rect.top) *
                (this.canvas.height / rect.height);

            const hoveredIndex = this.gameOverButtons.findIndex(btn =>
                mouseX >= btn.x &&
                mouseX <= btn.x + btn.w &&
                mouseY >= btn.y &&
                mouseY <= btn.y + btn.h
            );
            this.gameOverHoveredButton =
                hoveredIndex >= 0 ? hoveredIndex : null;

            this.canvas.style.cursor =
                hoveredIndex >= 0 ? "pointer" : "default";
        });

        this.canvas.addEventListener("mouseleave", () => {
            this.gameOverHoveredButton = null;
            this.canvas.style.cursor = "default";
        });

        this.canvas.addEventListener("wheel", (event) => {

            if (!this.gameStarted)
                return;

            if (
                this.waveManager.getState() !==
                "question"
            )
                return;

            if (!this.bossManager.hasBoss())
                return;

            const rect =
                this.canvas.getBoundingClientRect();

            const scaleX =
                this.canvas.width /
                rect.width;

            const scaleY =
                this.canvas.height /
                rect.height;

            const mouseX =
                (event.clientX - rect.left) *
                scaleX;

            const mouseY =
                (event.clientY - rect.top) *
                scaleY;

            this.bossManager.handleWheel(
                event.deltaY,
                mouseX,
                mouseY
            );

            event.preventDefault();

        }, {
            passive: false
        });


        this.canvas.addEventListener("mousedown", (event) => {

            if (!this.gameStarted)
                return;

            if (
                this.waveManager.getState() !==
                "question"
            )
                return;

            if (!this.bossManager.hasBoss())
                return;

            const rect =
                this.canvas.getBoundingClientRect();

            const scaleX =
                this.canvas.width /
                rect.width;

            const scaleY =
                this.canvas.height /
                rect.height;

            const mouseX =
                (event.clientX - rect.left) *
                scaleX;

            const mouseY =
                (event.clientY - rect.top) *
                scaleY;

            this.bossManager.handleMouseDown(
                mouseX,
                mouseY
            );

        });


        this.canvas.addEventListener("mousemove", (event) => {

            if (!this.gameStarted)
                return;

            if (
                this.waveManager.getState() !==
                "question"
            )
                return;

            if (!this.bossManager.hasBoss())
                return;

            const rect =
                this.canvas.getBoundingClientRect();

            const scaleX =
                this.canvas.width /
                rect.width;

            const scaleY =
                this.canvas.height /
                rect.height;

            const mouseX =
                (event.clientX - rect.left) *
                scaleX;

            const mouseY =
                (event.clientY - rect.top) *
                scaleY;

            this.bossManager.handleMouseMove(
                mouseX,
                mouseY
            );

        });


        window.addEventListener("mouseup", () => {

            this.bossManager.handleMouseUp();

        });

        // Pausa automaticamente quando o jogador troca de aba ou minimiza o navegador
        document.addEventListener("visibilitychange", () => {
            if (
                document.hidden &&
                this.gameStarted &&
                !this.gamePaused &&
                !this.scoreManager.isGameOver() &&
                this.waveManager.getState() === "playing"
            ) {
                this.pauseGame();
            }
        });

        window.addEventListener("keydown", (event) => {

            if (this.scoreManager.gameOverState) {
                return;
            }


            // Jogo ainda não começou
            if (!this.gameStarted) {
                return;
            }

            if (event.key === "Escape") {

                if (
                    this.waveManager.getState() !== "playing"
                ) {
                    return;
                }

                if (this.gamePaused) {

                    this.resumeGame();

                } else {

                    this.pauseGame();

                }

                return;
            }


            if (this.gamePaused) {
                return;
            }


            // A partir daqui é controle do Boss
            if (
                this.waveManager.getState() !== "question"
            ) {
                return;
            }


            if (!this.bossManager.hasBoss()) {
                return;
            }


            const result =
                this.bossManager.handleKeyDown(
                    event
                );


            if (!result) {
                return;
            }


            if (result.result === "wrong") {

                this.scoreManager.loseLife();

                if (this.scoreManager.isGameOver()) {
                    return;
                }

                this.bossManager.startTimeoutReveal();

                return;
            }

            if (result.result === "correct") {

                this.waveManager.nextWave();

                this.enemyManager.reset();

                this.powerUpManager.clear();

                this.bossManager.removeBoss();

                this.hud.show();

            }

        });

        this.hud.hide();


        this.mainMenu =
            document.getElementById("main-menu");

        this.leaderboardMenu =
            document.getElementById("leaderboard-menu");

        this.leaderboardRows =
            document.getElementById("leaderboard-rows");

        this.leaderboardEmpty =
            document.getElementById("leaderboard-empty");

        this.leaderboardSubjectFilter =
            document.getElementById("leaderboard-subject-filter");

        this.leaderboardDifficultyFilter =
            document.getElementById("leaderboard-difficulty-filter");

        this.gameOverOverlay =
            document.getElementById("game-over-overlay");

        this.gameOverPanel =
            this.gameOverOverlay.querySelector(".game-over-panel");

        this.gameOverTableWrap =
            this.gameOverOverlay.querySelector(".game-over-table-wrap");

        this.gameOverScore =
            document.getElementById("game-over-score");

        this.gameOverLeaderboardRows =
            document.getElementById("game-over-leaderboard-rows");

        this.gameOverLeaderboardEmpty =
            document.getElementById("game-over-leaderboard-empty");

        this.leaderboardButton =
            document.getElementById("leaderboard-button");

        this.playerNameInput =
            document.getElementById("player-name");

        this.gameConfig =
            document.getElementById("game-config");

        this.customGameMenu =
            document.getElementById("custom-game-menu");

        this.customGameConfig =
            document.getElementById("custom-game-config");

        this.customizeButton =
            document.getElementById("customize-button");

        this.createCustomGameButton =
            document.getElementById("create-custom-game-button");

        this.importCustomGameButton =
            document.getElementById("import-custom-game-button");

        this.customGameNameInput =
            document.getElementById("custom-game-name");

        this.customGameDifficultySelect =
            document.getElementById("custom-game-difficulty");

        this.saveCustomGameButton =
            document.getElementById("save-custom-game-button");

        this.customGameList =
            document.getElementById("custom-game-list");

        this.dictionaryWordInput =
            document.getElementById("dictionary-word");

        this.addWordButton =
            document.getElementById("add-word-button");

        this.clearDictionaryButton =
            document.getElementById("clear-dictionary-button");

        this.questionTextInput =
            document.getElementById("question-text");

        this.addQuestionButton =
            document.getElementById("add-question-button");

        this.dictionaryList =
            document.getElementById("dictionary-list");

        this.openDictionaryImportButton =
            document.getElementById("open-dictionary-import-button");

        this.dictionaryImportDialog =
            document.getElementById("dictionary-import-dialog");

        this.dictionarySubjectSelect =
            document.getElementById("dictionary-subject-select");

        this.dictionaryLevelSelect =
            document.getElementById("dictionary-level-select");

        this.importDictionaryButton =
            document.getElementById("import-dictionary-button");

        this.cancelDictionaryImportButton =
            document.getElementById("cancel-dictionary-import-button");

        this.questionList =
            document.getElementById("question-list");

        this.questionCount =
            document.getElementById("question-count");


        this.playButton.addEventListener("click", () => {

            this.mainMenu.style.display = "none";

            this.gameConfig.style.display = "flex";

        });


        this.customizeButton.addEventListener("click", () => {

            this.mainMenu.style.display = "none";

            this.customGameMenu.style.display = "flex";

            this.renderCustomGames();

        });

        this.leaderboardButton.addEventListener("click", () => {
            const menuScreens = [
                this.mainMenu,
                this.gameConfig,
                this.customGameMenu,
                this.customGameConfig
            ];
            this.leaderboardPreviousScreen = menuScreens.find(
                screen => getComputedStyle(screen).display !== "none"
            ) || this.mainMenu;

            this.mainMenu.style.display = "none";
            this.gameConfig.style.display = "none";
            this.customGameMenu.style.display = "none";
            this.customGameConfig.style.display = "none";
            this.leaderboardMenu.style.display = "flex";
            this.renderLeaderboard();
        });

        this.leaderboardSubjectFilter.addEventListener("change", () => {
            this.renderLeaderboard();
        });

        this.leaderboardDifficultyFilter.addEventListener("change", () => {
            this.renderLeaderboard();
        });

        document.getElementById("game-over-replay-button").addEventListener("click", () => {
            this.replayGame();
        });

        document.getElementById("game-over-menu-button").addEventListener("click", () => {
            this.returnToMenu();
        });

        document.getElementById("game-over-feedback-button").addEventListener("click", () => {
            window.open(
                "https://docs.google.com/forms/d/e/1FAIpQLSfwjlcUTLN0vOwwBRd5dYCP5cnkZp1jPoY1F-7u2ZMgYKhtqQ/viewform?usp=publish-editor",
                "_blank",
                "noopener,noreferrer"
            );
        });


        this.createCustomGameButton.addEventListener("click", () => {

            this.customGameMenu.style.display = "none";

            this.customGameConfig.style.display = "flex";

            this.resetCustomGameForm();

        });


        this.importCustomGameButton.addEventListener("click", () => {

            this.importCustomGame();

        });


        this.gameConfigBackButton =
            this.gameConfig.querySelector("back-button");

        this.leaderboardBackButton =
            this.leaderboardMenu.querySelector("back-button");

        this.customGameBackButton =
            this.customGameMenu.querySelector("back-button");

        this.customGameConfigBackButton =
            this.customGameConfig.querySelector("back-button");


        this.gameConfigBackButton.addEventListener("back", () => {

            this.gameConfig.style.display = "none";

            this.mainMenu.style.display = "flex";

        });

        this.leaderboardBackButton.addEventListener("back", () => {
            this.leaderboardMenu.style.display = "none";
            const previousScreen =
                this.leaderboardPreviousScreen || this.mainMenu;
            previousScreen.style.display = "flex";
            this.leaderboardPreviousScreen = null;
        });


        this.customGameBackButton.addEventListener("back", () => {

            this.customGameMenu.style.display = "none";

            this.mainMenu.style.display = "flex";

        });


        this.customGameConfigBackButton.addEventListener("back", () => {

            this.customGameConfig.style.display = "none";

            this.customGameMenu.style.display = "flex";

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

            const playerName = this.playerNameInput.value.trim();

            if (!playerName) {
                this.playerNameInput.setCustomValidity("Digite seu nome para iniciar.");
                this.playerNameInput.reportValidity();
                return;
            }

            this.playerNameInput.setCustomValidity("");

            if (!subject || !difficulty)
                return;

            this.playerName = playerName;
            this.selectedSubject = subject;

            this.selectedDifficulty = difficulty;

            this.startGame();

        });


        this.addWordButton.addEventListener("click", () => {

            this.addDictionaryWord();

        });

        this.clearDictionaryButton.addEventListener("click", () => {
            if (this.customGameDictionary.length === 0)
                return;

            if (!confirm("Tem certeza de que deseja excluir todas as palavras do dicionário?"))
                return;

            this.customGameDictionary = [];
            this.renderDictionary();
        });

        this.openDictionaryImportButton.addEventListener("click", () => {
            this.dictionarySubjectSelect.value = "";
            this.dictionaryLevelSelect.value = "";
            this.dictionaryImportDialog.showModal();
        });

        this.cancelDictionaryImportButton.addEventListener("click", () => {
            this.dictionaryImportDialog.close();
        });

        this.importDictionaryButton.addEventListener("click", () => {
            this.importBaseDictionary();
        });


        this.addQuestionButton.addEventListener("click", () => {

            this.addCustomQuestion();

        });

        this.saveCustomGameButton.addEventListener(
            "click",
            () => {

                this.saveCustomGame();

            }
        );

    }

    createCustomGameFromForm() {

        const name =
            this.customGameNameInput.value.trim();

        const difficulty =
            this.customGameDifficultySelect.value;

        return {

            id: crypto.randomUUID(),

            name: name,

            difficulty: difficulty,

            dictionary: [
                ...this.customGameDictionary
            ],

            questions: [
                ...this.customGameQuestions
            ]

        };

    }

    addDictionaryWord() {

        const word = this.dictionaryWordInput.value;

        if (!/^[\p{L}]{1,22}$/u.test(word)) {
            this.dictionaryWordInput.setCustomValidity(
                "Use apenas letras (com ou sem acento), com até 22 caracteres e sem espaços."
            );
            this.dictionaryWordInput.reportValidity();
            return;
        }

        this.dictionaryWordInput.setCustomValidity("");

        if (this.customGameDictionary.some(
            existingWord => existingWord.toLocaleLowerCase("pt-BR") === word.toLocaleLowerCase("pt-BR")
        ))
            return;

        this.customGameDictionary.push(word);

        this.dictionaryWordInput.value = "";
        this.dictionaryWordInput.setCustomValidity("");

        this.renderDictionary();

    }

    importBaseDictionary() {

        if (!this.dictionarySubjectSelect.reportValidity() ||
            !this.dictionaryLevelSelect.reportValidity())
            return;

        const subject = this.dictionarySubjectSelect.value;
        const level = this.dictionaryLevelSelect.value;
        const subjectPools = WordPools.boo[subject];

        if (!subjectPools || !subjectPools[level])
            return;

        const existingWords = new Set(
            this.customGameDictionary.map(word => word.toLocaleLowerCase("pt-BR"))
        );
        const importedWords = subjectPools[level].filter(
            word => /^[\p{L}]{1,22}$/u.test(word)
        );

        importedWords.forEach(word => {
            const normalizedWord = word.toLocaleLowerCase("pt-BR");
            if (!existingWords.has(normalizedWord)) {
                this.customGameDictionary.push(word);
                existingWords.add(normalizedWord);
            }
        });

        this.renderDictionary();
        this.dictionaryImportDialog.close();
    }

    renderDictionary() {

        this.dictionaryList.innerHTML = "";

        this.customGameDictionary.forEach(
            (word, index) => {

                const item =
                    document.createElement("div");

                item.className = "dictionary-item";

                item.innerHTML = `
                    <span>${word}</span>

                    <button type="button">
                        Excluir
                    </button>
                `;

                item
                    .querySelector("button")
                    .addEventListener("click", () => {

                        this.customGameDictionary.splice(
                            index,
                            1
                        );

                        this.renderDictionary();

                    });

                this.dictionaryList.appendChild(item);

            }
        );

    }

    addCustomQuestion() {

        const question =
            this.questionTextInput.value.trim();

        const optionInputs =
            this.customGameConfig.querySelectorAll(
                ".question-option input[type='text']"
            );

        const correctAnswer =
            this.customGameConfig.querySelector(
                "input[name='correct-answer']:checked"
            );

        if (!question)
            return;

        if (!correctAnswer)
            return;

        const options =
            Array.from(optionInputs).map(
                input => input.value.trim()
            );

        if (options.some(option => !option))
            return;

        const questionData = {

            question: question,

            options: options,

            correctAnswer:
                Number(correctAnswer.value)

        };

        this.customGameQuestions.push(
            questionData
        );

        this.resetQuestionForm();

        this.renderQuestions();

    }

    resetQuestionForm() {

        this.questionTextInput.value = "";

        const optionInputs =
            this.customGameConfig.querySelectorAll(
                ".question-option input[type='text']"
            );

        optionInputs.forEach(input => {

            input.value = "";

        });

        const correctAnswer =
            this.customGameConfig.querySelector(
                "input[name='correct-answer']:checked"
            );

        if (correctAnswer) {

            correctAnswer.checked = false;

        }

    }

    renderQuestions() {

        this.questionList.innerHTML = "";

        this.questionCount.textContent =
            `${this.customGameQuestions.length} ${this.customGameQuestions.length === 1
                ? "questão"
                : "questões"
            }`;

        this.customGameQuestions.forEach(
            (question, index) => {

                const item =
                    document.createElement("div");

                item.className =
                    "saved-question-item";

                item.innerHTML = `
                <div class="saved-question-content">

                    <strong>
                        ${index + 1}. ${question.question}
                    </strong>

                    <div class="saved-question-options">

                        ${question.options.map(
                    (option, optionIndex) => `
                                <span class="${optionIndex === question.correctAnswer
                            ? "correct"
                            : ""
                        }">
                                    ${String.fromCharCode(
                            65 + optionIndex
                        )})
                                    ${option}
                                </span>
                            `
                ).join("")}

                    </div>

                </div>

                <button
                    type="button"
                    class="delete-question-button"
                >
                    Excluir
                </button>
            `;

                item
                    .querySelector(
                        ".delete-question-button"
                    )
                    .addEventListener("click", () => {

                        this.customGameQuestions.splice(
                            index,
                            1
                        );

                        this.renderQuestions();

                    });

                this.questionList.appendChild(item);

            }
        );

    }

    saveCustomGame() {

        const name =
            this.customGameNameInput.value.trim();

        const difficulty =
            this.customGameDifficultySelect.value;

        if (!name) {

            console.log(
                "Digite um nome para o Custom Game."
            );

            return;

        }

        if (name.length > 64) {
            alert("O nome do jogo deve ter no máximo 64 caracteres.");
            return;
        }

        const invalidWord = this.customGameDictionary.find(
            word => typeof word !== "string" || !/^[\p{L}]{1,22}$/u.test(word)
        );

        if (invalidWord) {
            alert("O dicionário só pode conter palavras com letras, sem espaços ou símbolos, e com até 22 caracteres.");
            return;
        }

        if (!difficulty) {

            console.log(
                "Selecione uma dificuldade."
            );

            return;

        }

        if (
            this.customGameDictionary.length === 0
        ) {

            console.log(
                "Adicione pelo menos uma palavra ao dicionário."
            );

            return;

        }

        if (
            this.customGameQuestions.length === 0
        ) {

            console.log(
                "Adicione pelo menos uma questão."
            );

            return;

        }

        const game =
            this.createCustomGameFromForm();

        if (this.customGameEditingId) {

            game.id =
                this.customGameEditingId;

            this.customGameManager.update(game);

        }
        else {

            this.customGameManager.add(game);

        }

        console.log(
            "Custom Game salvo:",
            game
        );

        console.log(
            "Custom Games armazenados:",
            this.customGameManager.getAll()
        );

        this.customGameConfig.style.display =
            "none";

        this.customGameMenu.style.display =
            "flex";

        this.customGameEditingId = null;

        this.renderCustomGames();

    }

    resetCustomGameForm() {

        this.customGameEditingId = null;

        this.customGameDictionary = [];

        this.customGameQuestions = [];

        this.customGameNameInput.value = "";

        this.customGameDifficultySelect.value = "";

        this.dictionaryWordInput.value = "";

        this.questionTextInput.value = "";

        this.dictionaryList.innerHTML = "";

        this.questionList.innerHTML = "";

        this.questionCount.textContent =
            "0 questões";

        const optionInputs =
            this.customGameConfig.querySelectorAll(
                ".question-option input[type='text']"
            );

        optionInputs.forEach(input => {

            input.value = "";

        });

        const correctAnswer =
            this.customGameConfig.querySelector(
                "input[name='correct-answer']:checked"
            );

        if (correctAnswer) {

            correctAnswer.checked = false;

        }

    }

    startGame() {

        this.isCustomGame = false;
        this.currentCustomGame = null;
        this.currentRunRecordId = null;
        this.gameOverOverlayDisplayed = false;
        this.gameOverOverlay.style.display = "none";

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

        // Limita o deltaTime para evitar "saltos" após troca de aba ou travamentos
        const deltaTime = Math.min(timestamp - this.lastTime, 50);

        this.lastTime = timestamp;

        this.update(deltaTime);

        this.draw();

        requestAnimationFrame(
            this.loop.bind(this)
        );

    }
    pauseGame() {

        this.gamePaused = true;

        this.pauseMenu.style.display = "flex";

        this.inputManager.setPaused(true);

    }

    resumeGame() {

        this.gamePaused = false;

        this.pauseMenu.style.display = "none";

        this.inputManager.setPaused(false);

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

        if (this.gamePaused) {
            return;
        }

        // Atualiza o tempo de invencibilidade
        this.scoreManager.update(deltaTime);

        // Atualiza a animação de invencibilidade
        this.hud.setInvincibility(
            this.scoreManager.isInvincible()
        );

        if (this.waveManager.getState() === "playing") {
            this.enemySpawner.update(deltaTime);

            this.enemyManager.update(deltaTime);

            this.powerUpManager.update(deltaTime);

            this.inputManager.update(deltaTime);

            this.inputBar.update(deltaTime);

        }

        this.bossManager.update(deltaTime);

        this.updateBossHUD();

        if (
            this.waveManager.getState() === "question" &&
            this.bossManager.isTimerExpired() &&
            !this.bossManager.timeoutRevealActive &&
            !this.bossManager.timeoutRevealFinished
        ) {
            this.scoreManager.loseLife();

            if (this.scoreManager.isGameOver()) {
                return;
            }

            this.bossManager.startTimeoutReveal();

            return;
        }

        if (
            this.waveManager.getState() === "question" &&
            this.bossManager.timeoutRevealFinished
        ) {
            this.waveManager.nextWave();

            this.enemyManager.reset();
            this.powerUpManager.clear();

            this.bossManager.removeBoss();

            this.hud.show();

            return;
        }

        // Cria o Boss quando a wave entra na fase de perguntas
        if (
            this.waveManager.getState() === "question" &&
            !this.bossManager.hasBoss()
        ) {
            this.enemyManager.reset();

            if (this.isCustomGame) {

                this.bossManager.spawnCustom(
                    this.customGameQuestions,
                    this.selectedDifficulty
                );

            } else {

                this.bossManager.spawn(
                    this.selectedSubject,
                    this.selectedDifficulty
                );

            }
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

        ctx.clearRect(0, 0, width, height);

        this.scene.render(ctx, width, height);

        if (!this.gameStarted) {
            return;
        }

        // Renderiza o Game Over antes de qualquer outro elemento
        if (this.scoreManager.isGameOver()) {
            this.drawGameOver(ctx);
            return;
        }

        this.enemyManager.draw(ctx);
        this.bossManager.draw(ctx);

        if (this.waveManager.getState() === "playing") {
            this.powerUpManager.draw(ctx);
            this.inputBar.draw(ctx);
        }
    }

    updateBossHUD() {

        const isBossQuestion =
            this.waveManager.getState() === "question" &&
            this.bossManager.hasBoss();

        if (isBossQuestion) {

            this.hud.showBossTimer(
                this.bossManager.getTimeRemaining()
            );

        } else {

            this.hud.hideBossTimer();

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

    drawGameOver() {
        if (this.gameOverOverlayDisplayed)
            return;

        if (this.isCustomGame) {
            this.gameOverPanel.classList.add("custom-game-over");
            this.gameOverTableWrap.style.display = "none";
        } else {
            this.gameOverPanel.classList.remove("custom-game-over");
            this.gameOverTableWrap.style.display = "";
            this.recordCurrentRun();
            this.renderGameOverLeaderboard();
        }

        this.gameOverScore.textContent =
            `Pontuação: ${this.scoreManager.getScore()}`;
        this.gameOverOverlay.style.display = "flex";
        this.gameOverOverlayDisplayed = true;
    }

    getSubjectLabel() {
        if (this.isCustomGame && this.currentCustomGame)
            return `Personalizado: ${this.currentCustomGame.name}`;

        const labels = {
            science: "Ciências",
            languages: "Linguagens",
            geography: "Geografia",
            history: "História",
            math: "Matemática",
            all: "Todas as Matérias"
        };

        return labels[this.selectedSubject] || "Não informado";
    }

    formatLeaderboardDate(value) {
        return new Intl.DateTimeFormat("pt-BR", {
            dateStyle: "short",
            timeStyle: "short"
        }).format(new Date(value));
    }

    recordCurrentRun() {
        if (this.currentRunRecordId || !this.playerName)
            return;

        const record = {
            id: crypto.randomUUID(),
            name: this.playerName,
            subject: this.getSubjectLabel(),
            difficulty: this.selectedDifficulty,
            score: this.scoreManager.getScore(),
            createdAt: new Date().toISOString()
        };

        this.currentRunRecordId = record.id;
        this.leaderboardManager.add(record);
    }

    getDifficultyLabel(difficulty) {
        return {
            easy: "Fácil",
            medium: "Médio",
            hard: "Difícil"
        }[difficulty] || "Não informado";
    }

    getDifficultyClass(difficulty) {
        return ["easy", "medium", "hard"].includes(difficulty)
            ? `difficulty-${difficulty}`
            : "difficulty-unknown";
    }

    renderGameOverLeaderboard() {
        const records = this.leaderboardManager.getAll();
        this.gameOverLeaderboardRows.replaceChildren();
        this.gameOverLeaderboardEmpty.hidden = records.length > 0;

        records.forEach((record, index) => {
            const row = document.createElement("tr");
            row.classList.add(this.getDifficultyClass(record.difficulty));
            if (record.id === this.currentRunRecordId)
                row.classList.add("current-run");

            const values = [
                `#${index + 1}`,
                record.name,
                record.subject,
                this.getDifficultyLabel(record.difficulty),
                String(record.score),
                this.formatLeaderboardDate(record.createdAt)
            ];

            values.forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = value;
                row.appendChild(cell);
            });

            this.gameOverLeaderboardRows.appendChild(row);
        });
    }

    renderLeaderboard() {
        const records = this.leaderboardManager.getAll();
        const selectedSubject = this.leaderboardSubjectFilter.value;
        const selectedDifficulty = this.leaderboardDifficultyFilter.value;

        const subjects = [...new Set(records.map(record => record.subject))]
            .sort((first, second) => first.localeCompare(second, "pt-BR"));
        this.leaderboardSubjectFilter.replaceChildren();
        const allSubjectsOption = document.createElement("option");
        allSubjectsOption.value = "all";
        allSubjectsOption.textContent = "Todas";
        this.leaderboardSubjectFilter.appendChild(allSubjectsOption);

        subjects.forEach(subject => {
            const option = document.createElement("option");
            option.value = subject;
            option.textContent = subject;
            this.leaderboardSubjectFilter.appendChild(option);
        });
        this.leaderboardSubjectFilter.value = subjects.includes(selectedSubject)
            ? selectedSubject
            : "all";

        const filteredRecords = records.filter(record =>
            (this.leaderboardSubjectFilter.value === "all" ||
                record.subject === this.leaderboardSubjectFilter.value) &&
            (selectedDifficulty === "all" ||
                record.difficulty === selectedDifficulty)
        );

        this.leaderboardRows.replaceChildren();
        this.leaderboardEmpty.hidden = filteredRecords.length > 0;

        filteredRecords.forEach((record, index) => {
            const row = document.createElement("tr");
            row.classList.add(this.getDifficultyClass(record.difficulty));
            const values = [
                `#${index + 1}`,
                record.name,
                record.subject,
                this.getDifficultyLabel(record.difficulty),
                String(record.score),
                this.formatLeaderboardDate(record.createdAt)
            ];

            values.forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = value;
                row.appendChild(cell);
            });

            this.leaderboardRows.appendChild(row);
        });
    }

    replayGame() {
        const wasCustomGame = this.isCustomGame;
        const customGame = this.currentCustomGame;

        this.returnToMenu();

        if (wasCustomGame && customGame) {
            this.startCustomGame(customGame);
        } else {
            this.startGame();
        }
    }

    returnToMenu() {

        this.gameStarted = false;
        this.gameOverOverlayDisplayed = false;
        this.gameOverOverlay.style.display = "none";

        this.gameOverButtons = [];

        this.gameOverHoveredButton = null;
        this.gameOverHoverProgress = [0, 0, 0];

        this.canvas.style.cursor = "default";
        this.gamePaused = false;
        this.pauseMenu.style.display = "none";
        this.inputManager.setPaused(false);

        this.scoreManager.reset();

        this.hud.setInvincibility(false);

        this.enemyManager.reset();

        this.enemySpawner.reset();

        this.powerUpManager.reset();

        this.inputManager.reset();

        this.waveManager.reset();

        this.bossManager.removeBoss();

        this.menu.style.display = "flex";

        this.hud.hide();

        this.mainMenu.style.display = "flex";

        this.leaderboardMenu.style.display = "none";

        this.gameConfig.style.display = "none";

        this.customGameMenu.style.display = "none";

        this.customGameConfig.style.display = "none";


    }

    renderCustomGames() {

        this.customGameList.innerHTML = "";

        const games =
            this.customGameManager.getAll();

        if (games.length === 0) {

            this.customGameList.innerHTML = `
                <div class="empty-custom-games">
                    Nenhum jogo customizado criado.
                </div>
            `;

            return;
        }

        games.forEach(game => {

            const item =
                document.createElement("div");

            item.className = "custom-game-item";

            item.innerHTML = `
                <span class="custom-game-name">
                    ${game.name}
                </span>

                <div class="custom-game-actions">

                    <button
                        type="button"
                        class="custom-game-play"
                    >
                        Jogar
                    </button>

                    <button
                        type="button"
                        class="custom-game-edit"
                    >
                        Editar
                    </button>

                    <button
                        type="button"
                        class="custom-game-export"
                    >
                        Exportar
                    </button>

                    <button
                        type="button"
                        class="custom-game-delete"
                    >
                        Excluir
                    </button>

                </div>
            `;

            item.addEventListener("dblclick", () => {

                this.startCustomGame(game);

            });

            item
                .querySelector(".custom-game-play")
                .addEventListener("click", (event) => {

                    event.stopPropagation();

                    this.startCustomGame(game);

                });

            item
                .querySelector(".custom-game-edit")
                .addEventListener("click", (event) => {

                    event.stopPropagation();

                    this.editCustomGame(game);

                });

            item
                .querySelector(".custom-game-export")
                .addEventListener("click", (event) => {

                    event.stopPropagation();

                    this.exportCustomGame(game);

                });

            item
                .querySelector(".custom-game-delete")
                .addEventListener("click", (event) => {

                    event.stopPropagation();

                    this.deleteCustomGame(game);

                });

            this.customGameList.appendChild(item);

        });

    }

    startCustomGame(game) {

        this.playerName = "";
        this.currentRunRecordId = null;
        this.gameOverOverlayDisplayed = false;
        this.gameOverOverlay.style.display = "none";

        this.isCustomGame = true;
        this.currentCustomGame = game;

        const difficulty =
            DifficultyConfig[game.difficulty];

        this.selectedDifficulty =
            game.difficulty;

        this.selectedSubject = null;

        this.enemySpawner.setDifficulty(
            game.difficulty
        );

        this.enemySpawner.setCustomDictionary(
            game.dictionary
        );

        this.powerUpManager.setCustomDictionary(
            game.dictionary
        );

        this.scoreManager.setLives(
            difficulty.lives
        );

        this.customGameQuestions =
            game.questions;

        this.gameStarted = true;

        this.menu.style.display =
            "none";

        this.hud.show();

        this.lastTime =
            performance.now();

    }

    editCustomGame(game) {

        this.customGameEditingId = game.id;

        this.customGameNameInput.value =
            game.name;

        this.customGameDifficultySelect.value =
            game.difficulty;

        this.customGameDictionary = [
            ...game.dictionary
        ];

        this.customGameQuestions =
            game.questions.map(question => ({
                question: question.question,
                options: [...question.options],
                correctAnswer: question.correctAnswer
            }));

        this.renderDictionary();

        this.renderQuestions();

        this.customGameMenu.style.display =
            "none";

        this.customGameConfig.style.display =
            "flex";

    }

    exportCustomGame(game) {

        const data = {
            name: game.name,
            difficulty: game.difficulty,
            dictionary: game.dictionary,
            questions: game.questions
        };

        const json =
            JSON.stringify(data, null, 4);

        const blob =
            new Blob(
                [json],
                {
                    type: "application/json"
                }
            );

        const url =
            URL.createObjectURL(blob);

        const link =
            document.createElement("a");

        link.href = url;

        link.download =
            `${game.name}.json`;

        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);

        URL.revokeObjectURL(url);

    }

    deleteCustomGame(game) {

        this.customGameManager.remove(game.id);

        this.renderCustomGames();

    }

    importCustomGame() {

        const input =
            document.createElement("input");

        input.type = "file";
        input.accept = ".json,application/json";

        input.addEventListener(
            "change",
            async () => {

                const file =
                    input.files[0];

                if (!file)
                    return;

                try {

                    const text =
                        await file.text();

                    const data =
                        JSON.parse(text);

                    if (
                        !data ||
                        typeof data !== "object"
                    ) {
                        throw new Error(
                            "Arquivo inválido."
                        );
                    }

                    if (
                        typeof data.name !== "string" ||
                        !data.name.trim() ||
                        data.name.trim().length > 64
                    ) {
                        throw new Error(
                            "O nome do Custom Game deve ter entre 1 e 64 caracteres."
                        );
                    }

                    if (
                        ![
                            "easy",
                            "medium",
                            "hard"
                        ].includes(data.difficulty)
                    ) {
                        throw new Error(
                            "A dificuldade do Custom Game é inválida."
                        );
                    }

                    if (
                        !Array.isArray(data.dictionary) ||
                        data.dictionary.length === 0
                    ) {
                        throw new Error(
                            "O Custom Game precisa possuir pelo menos uma palavra."
                        );
                    }

                    if (data.dictionary.some(
                        word => typeof word !== "string" || !/^[\p{L}]{1,22}$/u.test(word)
                    )) {
                        throw new Error(
                            "O dicionário deve conter apenas palavras com letras e até 22 caracteres."
                        );
                    }

                    if (
                        !Array.isArray(data.questions) ||
                        data.questions.length === 0
                    ) {
                        throw new Error(
                            "O Custom Game precisa possuir pelo menos uma pergunta."
                        );
                    }

                    for (const question of data.questions) {

                        if (
                            !question ||
                            typeof question.question !== "string" ||
                            !question.question.trim()
                        ) {
                            throw new Error(
                                "Uma das perguntas é inválida."
                            );
                        }

                        if (
                            !Array.isArray(question.options) ||
                            question.options.length !== 4
                        ) {
                            throw new Error(
                                "Cada pergunta deve possuir exatamente 4 alternativas."
                            );
                        }

                        if (
                            question.options.some(
                                option =>
                                    typeof option !== "string" ||
                                    !option.trim()
                            )
                        ) {
                            throw new Error(
                                "Todas as alternativas devem possuir texto."
                            );
                        }

                        if (
                            !Number.isInteger(
                                question.correctAnswer
                            ) ||
                            question.correctAnswer < 0 ||
                            question.correctAnswer >=
                            question.options.length
                        ) {
                            throw new Error(
                                "Uma das perguntas possui uma resposta correta inválida."
                            );
                        }

                    }

                    const game = {

                        id: crypto.randomUUID(),

                        name:
                            data.name.trim(),

                        difficulty:
                            data.difficulty,

                        dictionary:
                            [...new Set(data.dictionary.map(
                                word => word.toLocaleLowerCase("pt-BR")
                            ))],

                        questions:
                            data.questions.map(
                                question => ({

                                    question:
                                        question.question.trim(),

                                    options:
                                        question.options.map(
                                            option =>
                                                option.trim()
                                        ),

                                    correctAnswer:
                                        question.correctAnswer

                                })
                            )

                    };

                    if (
                        game.dictionary.length === 0
                    ) {
                        throw new Error(
                            "O dicionário não possui palavras válidas."
                        );
                    }

                    this.customGameManager.add(
                        game
                    );

                    this.renderCustomGames();

                }
                catch (error) {

                    console.error(
                        "Erro ao importar Custom Game:",
                        error
                    );

                    alert(
                        error.message ||
                        "Não foi possível importar o Custom Game."
                    );

                }

            }
        );

        input.click();

    }

}
