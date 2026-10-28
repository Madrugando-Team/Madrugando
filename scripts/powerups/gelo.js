export class Gelo {
    constructor(enemyManager) {
        this.enemyManager = enemyManager;
        this.duration = 5000;
        this.timer = 0;
        this.active = false;
    }

    activate() {
        this.enemyManager.freezeAll();
        this.timer = this.duration;
        this.active = true;

        console.log("❄️ Gelo ativado!");
    }

    update(deltaTime) {
        if (!this.active) {
            return;
        }

        // Garante que inimigos que surgirem enquanto o efeito estiver ativo também sejam congelados.
        this.enemyManager.freezeAll();

        this.timer -= deltaTime;

        if (this.timer <= 0) {
            this.enemyManager.unfreezeAll();
            this.timer = 0;
            this.active = false;

            console.log("❄️ Gelo acabou!");
        }
    }

    reset() {
        if (this.active) {
            this.enemyManager.unfreezeAll();
        }

        this.timer = 0;
        this.active = false;
    }
}