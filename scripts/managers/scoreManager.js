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

    loseLife() {
        console.log("Antes:", this.lives);
        if (this.lives <= 0) return;

        this.lives--;

        console.log("Depois:", this.lives);

        this.wordsMissed++;

        this.updateHUD();

        if (this.lives <= 0) {
            this.gameOver();
        }
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

    gameOver() {

        this.gameOverState = true;
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

    isGameOver() {
        return this.gameOverState;
    }

    reset() {

        this.score = 0;
        this.lives = 3;

        this.wordsCorrect = 0;
        this.wordsMissed = 0;

        this.gameOverState = false;

        this.updateHUD();

    }
}