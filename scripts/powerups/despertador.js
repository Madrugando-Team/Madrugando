export class Despertador {

    constructor(enemyManager, enemySpawner, scoreManager, waveManager) {

        this.enemyManager = enemyManager;
        this.enemySpawner = enemySpawner;
        this.scoreManager = scoreManager;
        this.waveManager = waveManager;

    }

    activate() {
        // Elimina os inimigos e pontua cada eliminação.
        const enemiesKilled = this.enemyManager.killAll();

        for (let index = 0; index < enemiesKilled; index++) {
            this.scoreManager.addScore(10);
            this.waveManager.wordCorrect();
        }

        // Pausando o spawn de inimigos por 750ms
        this.enemySpawner.pauseSpawning(750);

        console.log("⏰ Despertador ativado!");

    }
}
