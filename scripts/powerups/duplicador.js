// Filtro dourado desenhado por cima do fundo enquanto o efeito está ativo
const OVERLAY = new Image();
OVERLAY.src = new URL(
    "../../assets/images/effects/duplicador.webp",
    import.meta.url
).href;

const OVERLAY_FADE_IN = 300;  // ms
const OVERLAY_FADE_OUT = 600; // ms (some aos poucos no fim do efeito)

export class Duplicador {

    constructor(scoreManager) {

        this.scoreManager = scoreManager;

        this.duration = 5000;
        this.timer = 0;
        this.active = false;

    }


    activate() {

        this.scoreManager.setMultiplier(2);

        this.timer = this.duration;
        this.active = true;

        console.log("✖️2 Duplicador ativado!");

    }


    update(deltaTime) {

        if (!this.active) {
            return;
        }

        this.timer -= deltaTime;

        if (this.timer <= 0) {

            this.scoreManager.setMultiplier(1);

            this.timer = 0;
            this.active = false;

            console.log("✖️2 Duplicador acabou!");

        }

    }


    // Desenha o filtro do 2x. Aparece suavemente ao ativar e
    // vai sumindo nos últimos instantes, avisando que o efeito vai acabar.
    drawOverlay(ctx, width, height) {

        if (!this.active)
            return;

        if (!OVERLAY.complete || OVERLAY.naturalWidth === 0)
            return;

        const elapsed = this.duration - this.timer;

        const alpha = Math.min(
            1,
            elapsed / OVERLAY_FADE_IN,
            this.timer / OVERLAY_FADE_OUT
        );

        ctx.save();
        ctx.globalAlpha = Math.max(alpha, 0);
        ctx.drawImage(OVERLAY, 0, 0, width, height);
        ctx.restore();
    }


    reset() {

        this.scoreManager.setMultiplier(1);

        this.timer = 0;
        this.active = false;

    }

}