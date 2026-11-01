export class PowerUp {
    constructor({ x, y, type, speed, word }) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.speed = speed;
        this.word = word;
        this.correctWords = 0;
        this.requiredWords = 1;
        this.unlocked = false;

        this.alive = true;

    }

    update(deltaTime) {
        this.x += this.speed * (deltaTime / 16);

        // Saiu da tela pela direita
        if (this.x > 1280 + 100) {
            this.kill();
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = "#f5f3ff";
        const icons = {
            despertador: "⏰",
            gelo: "❄️",
            reverso: "🔄",
            duplicador: "✕2"
        };
        ctx.font = "32px Arial";

        ctx.fillText(
            icons[this.type],
            this.x,
            this.y
        );

        ctx.font = "20px Arial";
        ctx.fillText(
            this.word,
            this.x,
            this.y + 30
        );
        ctx.restore();
    }

    registerCorrectWord() {

        if (this.unlocked) {
            return;
        }

        this.correctWords++;

        if (this.correctWords >= this.requiredWords) {
            this.unlocked = true;
        }
    }


    isUnlocked() {

        return this.unlocked;

    }


    kill() {
        this.alive = false;
    }

    isDead() {
        return !this.alive;
    }
}
