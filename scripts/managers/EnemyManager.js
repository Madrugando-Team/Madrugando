export class EnemyManager {

    constructor(scoreManager, canvasHeight) {

        this.enemies = [];
        this.scoreManager = scoreManager;
        this.canvasHeight = canvasHeight;

    }


    add(enemy) {

        this.enemies.push(enemy);

    }


    update(deltaTime) {

        this.enemies.forEach(enemy => {

            enemy.update(deltaTime);

            // Ignora inimigos eliminados ou na animação de hit
            if (!enemy.isActive()) {
                return;
            }

            // Verifica se Boo ou Scromblus chegaram ao chão
            if (enemy.getBottom() >= this.canvasHeight - 20) {

                // Remove o inimigo normalmente
                enemy.kill();

                // O ScoreManager decide se o dano
                // deve ser aplicado ou ignorado
                this.scoreManager.loseLife("enemy");

            }

        });

        this.removeDead();
    }


    draw(ctx) {

        this.enemies.forEach(enemy => {

            enemy.draw(ctx);

        });

    }


    processWord(word) {

        const result = {
            correct: false,
            killed: false,
            enemy: null,
            enemiesHit: 0,
            scromblusDefeated: false
        };

        this.enemies.forEach(enemy => {
            // Boo já atingido (piscando) não pode ser acertado de novo
            if (!enemy.isActive()) {
                return;
            }

            if (enemy.word.toLowerCase() !== word.toLowerCase()) {
                return;
            }

            result.correct = true;
            result.enemy = enemy;
            result.enemiesHit++;

            if (enemy.type === "scromblus") {
                const completed = enemy.advanceWord();
                result.killed = completed;

                if (completed) {
                    result.scromblusDefeated = true;
                }
            } else {
                // Boo para e pisca antes de sumir
                enemy.hit();
                result.killed = true;
            }
        });

        return result;
    }


    hasSpace(maxEnemies) {

        // Boos piscando após o hit não ocupam vaga
        return this.enemies.filter(
            enemy => enemy.isActive()
        ).length < maxEnemies;

    }


    removeDead() {

        this.enemies =
            this.enemies.filter(enemy => !enemy.isDead());

    }

    hasWordStartingWith(prefix) {

        return this.enemies.some(enemy =>
            enemy.isActive() &&
            enemy.word.toLowerCase().startsWith(
                prefix.toLowerCase())
        );
    }

    reset() {

        this.enemies = [];

    }
    hasScromblus() {

        return this.enemies.some(
            enemy => enemy.type === "scromblus" && enemy.isActive()
        );

    }

    killAll() {
        // Boos já atingidos não contam de novo
        const enemiesToKill = this.enemies.filter(
            enemy => enemy.isActive()
        );

        // Boos mostram a animação de hit; o Scromblus some na hora
        enemiesToKill.forEach(enemy => {
            enemy.hit();
        });

        this.removeDead();

        return enemiesToKill.length;

    }
    freezeAll() {

        this.enemies.forEach(enemy => {
            enemy.freeze();
        });

    }

    unfreezeAll() {

        this.enemies.forEach(enemy => {
            enemy.unfreeze();
        });

    }

    reverseAll() {

        this.enemies.forEach(enemy => {
            enemy.reverse();
        });

    }

    unreverseAll() {

        this.enemies.forEach(enemy => {
            enemy.unreverse();
        });

    }


}
