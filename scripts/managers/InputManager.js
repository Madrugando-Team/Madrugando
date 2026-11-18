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
        // No celular é ele que abre o teclado virtual.
        this.composing = false;

        // Texto do campo já processado e, para cada letra, a "geração" da
        // palavra em que entrou (muda a cada acerto ou ao apagar tudo)
        this.fieldText = "";
        this.fieldGenerations = [];
        this.inputGeneration = 0;

        this.touchQuery = window.matchMedia("(pointer: coarse)");

        this.textInput = this.createTextInput();

    }

    createTextInput() {

        const input = document.createElement("input");

        input.type = "text";
        input.id = "typing-capture";
        input.autocomplete = "off";
        input.spellcheck = false;
        input.tabIndex = -1;
        input.setAttribute("autocapitalize", "none");
        input.setAttribute("autocorrect", "off");
        input.setAttribute("enterkeyhint", "done");
        input.setAttribute("aria-hidden", "true");

        // Fica na tela (alguns sistemas ignoram campos fora dela),
        // mas invisível e sem receber cliques. A fonte de 16px evita
        // o zoom automático do iPhone ao focar o campo.
        Object.assign(input.style, {
            position: "fixed",
            top: "0",
            left: "0",
            width: "1px",
            height: "1px",
            opacity: "0",
            border: "0",
            padding: "0",
            fontSize: "16px",
            pointerEvents: "none"
        });

        input.addEventListener("compositionstart", () => {
            this.composing = true;
        });

        input.addEventListener("compositionend", () => {
            this.composing = false;
            this.consumeTextInput();
        });

        input.addEventListener("input", () => {
            this.consumeTextInput();
        });

        document.body.appendChild(input);

        return input;
    }

    // Compara o campo invisível com o que já foi processado e aplica só a
    // diferença. Isso cobre três casos:
    // - PC: cada tecla chega sozinha e o campo é esvaziado em seguida;
    // - tecla morta (´ depois a): o "´" provisório é trocado por "á";
    // - teclado do celular (Gboard etc.): a palavra fica "em composição"
    //   e cresce letra a letra; não dá para esvaziar o campo no meio dela.
    consumeTextInput() {

        const text = this.textInput.value;
        const previous = this.fieldText;

        let common = 0;

        while (
            common < previous.length &&
            common < text.length &&
            previous[common] === text[common]
        ) {
            common++;
        }

        // Letras que sumiram do campo (apagar no teclado do celular ou
        // troca do "´" provisório). Só desfaz as da palavra atual.
        for (let index = previous.length - 1; index >= common; index--) {

            if (this.fieldGenerations[index] === this.inputGeneration &&
                this.currentInput.length > 0) {
                this.currentInput = this.currentInput.slice(0, -1);
            }
        }

        this.fieldGenerations.length = common;

        for (const character of text.slice(common)) {

            const accepted =
                this.canType() &&
                this.typeCharacter(character.toLowerCase());

            this.fieldGenerations.push(
                accepted ? this.inputGeneration : -1
            );
        }

        this.fieldText = text;

        // Fora de uma composição o campo pode ser esvaziado
        if (!this.composing) {
            this.clearField();
        }
    }

    clearField() {
        this.textInput.value = "";
        this.fieldText = "";
        this.fieldGenerations = [];
    }

    isTouchDevice() {
        return this.touchQuery.matches;
    }

    // Mantém o foco no campo invisível enquanto a partida corre,
    // sem roubar o foco de outro campo (ex.: configurações).
    // No celular o foco só é dado por um toque (focusForTyping), porque
    // o navegador só abre o teclado em resposta a um gesto do usuário.
    syncFocus() {

        if (!this.canType()) {
            this.releaseFocus();
            return;
        }

        if (this.isTouchDevice())
            return;

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

    // Chamado dentro de um toque/clique: foca o campo e abre o teclado
    focusForTyping() {

        if (!this.enabled || this.paused)
            return;

        if (this.waveManager.getState() !== "playing")
            return;

        // Já focado mas com o teclado fechado (ex.: botão "voltar" do
        // Android): tirar e devolver o foco faz o teclado reaparecer
        if (document.activeElement === this.textInput) {
            this.textInput.blur();
        }

        this.textInput.focus({ preventScroll: true });
    }

    isTypingFocused() {
        return document.activeElement === this.textInput;
    }

    // Celular sem o teclado aberto: a barra mostra "toque para digitar"
    needsTapToType() {
        return this.isTouchDevice() &&
            this.canType() &&
            !this.isTypingFocused();
    }

    releaseFocus() {

        if (document.activeElement === this.textInput) {
            this.textInput.blur();
        }

        this.composing = false;
        this.clearField();
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

        if (value) {
            // Ao iniciar a partida pelo botão (um toque), já abre o teclado
            this.focusForTyping();
        } else {
            this.releaseFocus();
        }
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

        // Apaga tudo de uma vez: Ctrl+Backspace (Option+Backspace no Mac)
        // ou a tecla Delete
        const clearAll =
            key === "delete" ||
            (key === "backspace" &&
                (event.ctrlKey || event.altKey || event.metaKey));

        if (clearAll) {

            this.currentInput = "";
            this.inputGeneration++;

            // Evita que o navegador use o atalho para outra coisa
            event.preventDefault();

            return;
        }

        if (key === "backspace") {

            // No meio de uma composição (teclado do celular, tecla morta)
            // quem apaga é o próprio campo, tratado em consumeTextInput
            if (event.target === this.textInput &&
                (this.composing || this.textInput.value !== "")) {
                return;
            }

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


    // Acrescenta uma letra (ou hífen válido) à palavra digitada.
    // Retorna se a tecla foi aceita.
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

            return true;
        }

        return false;
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

        // Letras já processadas não podem mais apagar a próxima palavra
        this.inputGeneration++;

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
        this.inputGeneration++;

    }

}