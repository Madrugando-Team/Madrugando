import HUD from "../ui/hud.js";

export default class ScoreManager {
    constructor() {
        this.score = 0;
        this.lives = 3;
        console.log("Vidas iniciais:", this.lives);
        this.wordsCorrect = 0;
        this.wordsMissed = 0;
        this.multiplier = 1;

        this.gameOverState = false;

        // Invencibilidade temporária após receber dano
        this.invincible = false;
        this.invincibilityDuration = 3000; // 3 segundos
        this.invincibilityTimer = 0;

        this.hud = new HUD();

        this.updateHUD();
    }
    // adiciona os pontos à pontuação e atualiza o HUD

    addScore(points = 10) {
        this.score += points * this.multiplier;
        this.wordsCorrect++;

        this.updateHUD();
    }

    setMultiplier(value) {
        this.multiplier = value;
    }

    loseLife(source = "boss") {

        // Impede dano após o Game Over
        if (this.gameOverState || this.lives <= 0) {
            return false;
        }

        // Apenas inimigos que chegam ao chão
        // são bloqueados pela invencibilidade
        if (source === "enemy" && this.invincible) {
            return false;
        }

        this.lives--;
        this.wordsMissed++;

        console.log("Vida perdida:", source);
        console.log("Vidas restantes:", this.lives);

        this.updateHUD();

        if (this.lives <= 0) {
            this.gameOver();
        } else if (source === "enemy") {

            // Ativa invencibilidade somente após
            // receber dano de um inimigo
            this.invincible = true;
            this.invincibilityTimer = this.invincibilityDuration;
        }

        return true;
    }

    gainLife(amount = 1) {
        if (this.lives >= 3) return;

        this.lives = Math.min(this.lives + amount, 3);

        this.updateHUD();
    }

    setLives(lives) {
        this.lives = Math.min(Math.max(lives, 0), 3);
        this.updateHUD();

        if (this.lives <= 0) {
            this.gameOver();
        }
    }

    updateHUD() {
        this.hud.setScore(this.score);
        this.hud.setLives(this.lives);
    }

    update(deltaTime) {
        if (!this.invincible || this.gameOverState) {
            return;
        }

        this.invincibilityTimer -= deltaTime;

        if (this.invincibilityTimer <= 0) {
            this.invincibilityTimer = 0;
            this.invincible = false;
        }
    }

    gameOver() {
        if (this.gameOverState) return;

        this.gameOverState = true;

        this.invincible = false;
        this.invincibilityTimer = 0;

        this.hud.setInvincibility(false);
    }
    getScore() {
        return this.score;
    }
    getWordsCorrect() {
        return this.wordsCorrect;
    }
    getLives() {
        return this.lives;
    }

    isInvincible() {
        return this.invincible;
    }

    isGameOver() {
        return this.gameOverState;
    }


    reset() {

        this.score = 0;
        this.lives = 3;

        this.wordsCorrect = 0;
        this.wordsMissed = 0;
        this.multiplier = 1;

        this.gameOverState = false;
        this.invincible = false;
        this.invincibilityTimer = 0;

        this.updateHUD();

    }
}