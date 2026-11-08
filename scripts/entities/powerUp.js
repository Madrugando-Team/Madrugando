// Ícones dos power-ups, carregados uma única vez ao importar o módulo.
const POWERUP_ICON_FILES = {
    despertador: "despertador.webp",
    gelo: "gelo.webp",
    reverso: "reverso.webp",
    duplicador: "duplicador.webp"
};

const POWERUP_ICONS = Object.fromEntries(
    Object.entries(POWERUP_ICON_FILES).map(([type, file]) => {
        const image = new Image();
        image.src = new URL(
            `../../assets/images/powerups/${file}`,
            import.meta.url
        ).href;
        return [type, image];
    })
);

// Emojis usados só se a imagem não carregar
const FALLBACK_ICONS = {
    despertador: "⏰",
    gelo: "❄️",
    reverso: "🔄",
    duplicador: "✕2"
};

// Tamanho máximo do ícone (lado maior, em px do canvas)
const ICON_SIZE = 58;

// Espaço entre o fundo do ícone e o topo da palavra
const ICON_GAP = 6;

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
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        ctx.font = "20px Arial";

        // A palavra continua na mesma posição de antes
        const wordY = this.y + 30;
        const wordWidth = ctx.measureText(this.word).width;
        const centerX = this.x + wordWidth / 2;

        ctx.fillText(this.word, this.x, wordY);

        // Ícone centralizado acima da palavra
        const iconBottom = wordY - 20 - ICON_GAP;
        const image = POWERUP_ICONS[this.type];

        if (image && image.complete && image.naturalWidth > 0) {

            const scale = ICON_SIZE / Math.max(
                image.naturalWidth,
                image.naturalHeight
            );

            const width = image.naturalWidth * scale;
            const height = image.naturalHeight * scale;

            // Brilho suave para destacar ícones escuros no cenário noturno
            ctx.shadowColor = "rgba(255, 255, 255, 0.45)";
            ctx.shadowBlur = 10;

            ctx.drawImage(
                image,
                centerX - width / 2,
                iconBottom - height,
                width,
                height
            );

        } else {

            ctx.font = "32px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "bottom";

            ctx.fillText(
                FALLBACK_ICONS[this.type] ?? "?",
                centerX,
                iconBottom
            );
        }

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
