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

        // Campo de texto invisível que recebe as letras durante a partida.
        // Acentos feitos com tecla morta (´ + a = á) passam pelo sistema de
        // entrada do sistema operacional; no Linux (IBus/Fcitx) a letra
        // acentuada só chega a um campo editável, nunca ao keydown da janela.
        this.composing = false;
        this.textInput = this.createTextInput();

    }

    createTextInput() {

        const input = document.createElement("input");

        input.type = "text";
        input.id = "typing-capture";
        input.autocomplete = "off";
        input.spellcheck = false;
        input.tabIndex = -1;
        input.setAttribute("autocapitalize", "off");
        input.setAttribute("autocorrect", "off");
        input.setAttribute("aria-hidden", "true");

        // Fica na tela (alguns sistemas ignoram campos fora dela),
        // mas invisível e sem receber cliques
        Object.assign(input.style, {
            position: "fixed",
            top: "0",
            left: "0",
            width: "1px",
            height: "1px",
            opacity: "0",
            border: "0",
            padding: "0",
            pointerEvents: "none"
        });

        input.addEventListener("compositionstart", () => {
            this.composing = true;
        });

        input.addEventListener("compositionend", () => {
            this.composing = false;
            this.consumeTextInput();
        });

        input.addEventListener("input", (event) => {

            // Durante a composição (ex.: depois do ´ e antes da vogal)
            // o texto ainda não está pronto
            if (this.composing || event.isComposing)
                return;

            this.consumeTextInput();
        });

        document.body.appendChild(input);

        return input;
    }

    // Pega o que foi digitado no campo invisível e o esvazia
    consumeTextInput() {

        const text = this.textInput.value;

        this.textInput.value = "";

        if (!text || !this.canType())
            return;

        for (const character of text) {
            this.typeCharacter(character.toLowerCase());
        }
    }

    // Mantém o foco no campo invisível enquanto a partida corre,
    // sem roubar o foco de outro campo (ex.: configurações)
    syncFocus() {

        if (!this.canType()) {
            this.releaseFocus();
            return;
        }

        const active = document.activeElement;

        if (active === this.textInput)
            return;

        const otherFieldFocused =
            active &&
            active !== document.body &&
            active.matches("input, textarea, select, [contenteditable]");

        if (otherFieldFocused)
            return;

        this.textInput.focus({ preventScroll: true });
    }

    releaseFocus() {

        if (document.activeElement === this.textInput) {
            this.textInput.blur();
        }

        this.textInput.value = "";
        this.composing = false;
    }

    canType() {
        return this.enabled &&
            !this.paused &&
            this.waveManager.getState() === "playing";
    }

    setPaused(value) {

        this.paused = value;

        if (value) this.releaseFocus();

    }

    setEnabled(value) {
        this.enabled = value;

        if (!value) this.releaseFocus();
    }

    update(deltaTime) {

        this.syncFocus();

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

        // Apaga tudo de uma vez: Ctrl+Backspace (Option+Backspace no Mac)
        // ou a tecla Delete
        const clearAll =
            key === "delete" ||
            (key === "backspace" &&
                (event.ctrlKey || event.altKey || event.metaKey));

        if (clearAll) {

            this.currentInput = "";

            // Evita que o navegador use o atalho para outra coisa
            event.preventDefault();

            return;
        }

        if (key === "backspace") {

            this.currentInput =
                this.currentInput.slice(0, -1);

            return;
        }

        if (key.length !== 1) {
            return;
        }

        // Com o campo invisível focado, a letra chega pelo evento "input"
        // (consumeTextInput); tratar aqui também a contaria duas vezes
        if (event.target === this.textInput) {
            return;
        }

        this.typeCharacter(key);

    }


    // Acrescenta uma letra (ou hífen válido) à palavra digitada
    typeCharacter(key) {

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

        // Conta a palavra digitada (estatística do placar).
        // Combo conta como 1 palavra; o Boozarro não conta.
        if (enemyResult.scoredHits > 0 || powerUpResult.correct) {
            this.scoreManager.addWordTyped();
        }

        // Acertou inimigo (Boo ou Scromblus)
        if (enemyResult.scoredHits > 0) {

            if (enemyResult.enemiesKilled > 0) {

                // Cada inimigo eliminado vale 10 pontos;
                // derrotar o Scromblus vale 50 no lugar dos 10
                const ENEMY_POINTS = 10;
                const SCROMBLUS_POINTS = 50;

                const basePoints =
                    ENEMY_POINTS * enemyResult.enemiesKilled +
                    (enemyResult.scromblusDefeated
                        ? SCROMBLUS_POINTS - ENEMY_POINTS
                        : 0);

                // Combo: a soma é multiplicada pela quantidade de inimigos
                // eliminados de uma vez (2 → ×2, 3 → ×3...)
                const comboMultiplier = enemyResult.enemiesKilled;

                this.scoreManager.addScore(basePoints * comboMultiplier);

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