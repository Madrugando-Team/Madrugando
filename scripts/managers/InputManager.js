export class InputManager {

    constructor(enemyManager, scoreManager, waveManager, powerUpManager, audioManager = null) {

        this.enemyManager = enemyManager;
        this.scoreManager = scoreManager;
        this.waveManager = waveManager;
        this.powerUpManager = powerUpManager;
        this.audioManager = audioManager;

        this.paused = false;
        this.enabled = false;

        this.currentInput = "";
        this.state = "normal";
        this.stateTimer = 0;

        window.addEventListener(
            "keydown",
            this.handleInput.bind(this)
        );

    }
    setPaused(value) {

        this.paused = value;

    }

    setEnabled(value) {
        this.enabled = value;
    }

    update(deltaTime) {

        if (this.state === "normal") {
            return;
        }

        this.stateTimer -= deltaTime;

        if (this.stateTimer <= 0) {

            // A entrada já é limpa no acerto; aqui só termina o feedback visual.
            this.state = "normal";

        }

    }


    handleInput(event) {

        if (this.paused || !this.enabled) {
            return;
        }

        // Durante a pergunta do Boss as teclas pertencem ao Boss.
        if (this.waveManager.getState() !== "playing") {
            return;
        }

        const key = event.key.toLowerCase();


        if (key === "backspace") {

            this.currentInput =
                this.currentInput.slice(0, -1);

            return;
        }

        if (key.length !== 1) {
            return;
        }


        const isLetter = /[a-zà-ÿ]/i.test(key);
        const isValidHyphen = key === "-" &&
            this.currentInput.length > 0 &&
            (
                this.enemyManager.hasWordStartingWith(
                    `${this.currentInput}-`
                ) ||
                this.powerUpManager.hasWordStartingWith(
                    `${this.currentInput}-`
                )
            );

        if (isLetter || isValidHyphen) {

            // Uma nova letra encerra o feedback de acerto/combo
            // sem descartar a tecla digitada.
            if (this.state !== "normal") {
                this.state = "normal";
                this.stateTimer = 0;
            }

            this.currentInput += key;

            this.checkWord();

        }

    }


    checkWord() {

        const enemyPossible =
            this.enemyManager.hasWordStartingWith(
                this.currentInput
            );

        const powerUpPossible =
            this.powerUpManager.hasWordStartingWith(
                this.currentInput
            );

        // A palavra ainda pode ser de inimigo ou PowerUp
        if (!enemyPossible && !powerUpPossible) {
            return;
        }

        // Verifica se existe uma palavra COMPLETA de PowerUp
        const powerUpResult =
            this.powerUpManager.processWord(
                this.currentInput
            );

        // Verifica se existe uma palavra COMPLETA de inimigo
        const enemyResult =
            this.enemyManager.processWord(
                this.currentInput
            );

        // Ainda estamos digitando
        if (!powerUpResult.correct && !enemyResult.correct) {
            return;
        }

        // Acertou inimigo (Boo ou Scromblus)
        if (enemyResult.scoredHits > 0) {

            if (enemyResult.enemiesKilled > 0) {
                this.scoreManager.addScore(10 * enemyResult.enemiesKilled);
                this.waveManager.wordCorrect(enemyResult.enemiesKilled);
            }

            // Derrotar o Scromblus tem som próprio no lugar do acerto comum
            this.audioManager?.playSfx(
                enemyResult.scromblusDefeated
                    ? "scromblusDerrotado"
                    : "acerto"
            );
        }

        // Digitou a palavra errada do Boozarro: perde uma vida
        if (enemyResult.boozarroHits > 0) {

            this.audioManager?.playSfx("derrota");

            for (let i = 0; i < enemyResult.boozarroHits; i++) {
                this.scoreManager.loseLife("boozarro");
            }
        }

        // Acertou PowerUp
        if (powerUpResult.correct) {

            console.log(
                `Power-up acertado: ` +
                `${powerUpResult.powerUp.type}`
            );

            // Cada power-up toca o som do próprio tipo ao ser ativado
            if (powerUpResult.powerUp.isUnlocked()) {
                this.audioManager?.playSfx(
                    powerUpResult.powerUp.type
                );
            }
        }

        this.currentInput = "";

        if (enemyResult.enemiesKilled > 1) {
            this.state = "combo";
            this.stateTimer = 360;
        } else {
            this.state = "success";
            this.stateTimer = 90;
        }
    }

    getInput() {

        return this.currentInput;

    }

    getValidInputLength() {
        let validLength = 0;

        for (let index = 1; index <= this.currentInput.length; index++) {
            const prefix = this.currentInput.slice(0, index);
            const matchesEnemy =
                this.enemyManager.hasWordStartingWith(prefix);
            const matchesPowerUp =
                this.powerUpManager.hasWordStartingWith(prefix);

            if (!matchesEnemy && !matchesPowerUp) {
                break;
            }

            validLength = index;
        }

        return validLength;
    }


    getState() {

        return this.state;

    }

    reset() {

        this.paused = false;

        this.currentInput = "";
        this.state = "normal";
        this.stateTimer = 0;

    }

}