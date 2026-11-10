// ---------- Animação de vento (efeito visual do Reverso) ----------
// Cada quadro guarda só as duas faixas laterais da tela, lado a lado:
// [ faixa esquerda (0..210) | faixa direita (1078..1280) ].
// O resto da tela era transparente, então não precisa ser baixado.

const WIND_FRAME_COUNT = 72;
const WIND_FPS = 24;                 // quadros por segundo (72 quadros = 3 s em loop)
const WIND_LEFT_WIDTH = 210;         // largura da faixa esquerda
const WIND_RIGHT_WIDTH = 202;        // largura da faixa direita
const WIND_OPACITY = 0.7;            // linhas um pouco transparentes
const WIND_FADE_IN = 300;            // ms
const WIND_FADE_OUT = 600;           // ms

const WIND_FRAMES = Array.from({ length: WIND_FRAME_COUNT }, (_, index) => {
    const image = new Image();
    const number = String(index + 1).padStart(2, "0");
    image.src = new URL(
        `../../assets/images/effects/reverso/vento-${number}.webp`,
        import.meta.url
    ).href;
    return image;
});

const isLoaded = (image) =>
    image.complete && image.naturalWidth > 0;

export class Reverso {

    constructor(enemyManager) {

        this.enemyManager = enemyManager;

        this.duration = 5000;
        this.timer = 0;
        this.active = false;

    }


    activate() {

        this.enemyManager.reverseAll();

        this.timer = this.duration;
        this.active = true;

        console.log("🔄 Reverso ativado!");

    }


    update(deltaTime) {

        if (!this.active) {
            return;
        }

        // Garante que inimigos que surgirem enquanto o efeito estiver ativo também sejam invertidos.
        this.enemyManager.reverseAll();

        this.timer -= deltaTime;

        if (this.timer <= 0) {

            this.enemyManager.unreverseAll();

            this.timer = 0;
            this.active = false;

            console.log("🔄 Reverso acabou!");

        }

    }


    // Desenha o vento nas laterais. A animação segue o tempo do efeito,
    // então para junto quando o jogo é pausado.
    drawOverlay(ctx, width, height) {

        if (!this.active)
            return;

        const elapsed = this.duration - this.timer;

        const frameIndex =
            Math.floor(elapsed / 1000 * WIND_FPS) % WIND_FRAME_COUNT;

        const frame = WIND_FRAMES[frameIndex];

        // Quadro ainda carregando: pula este desenho
        if (!isLoaded(frame))
            return;

        const fade = Math.min(
            1,
            elapsed / WIND_FADE_IN,
            this.timer / WIND_FADE_OUT
        );

        ctx.save();
        ctx.globalAlpha = Math.max(fade, 0) * WIND_OPACITY;

        // Faixa esquerda
        ctx.drawImage(
            frame,
            0, 0, WIND_LEFT_WIDTH, frame.naturalHeight,
            0, 0, WIND_LEFT_WIDTH, height
        );

        // Faixa direita
        ctx.drawImage(
            frame,
            WIND_LEFT_WIDTH, 0, WIND_RIGHT_WIDTH, frame.naturalHeight,
            width - WIND_RIGHT_WIDTH, 0, WIND_RIGHT_WIDTH, height
        );

        ctx.restore();
    }


    reset() {

        if (this.active) {
            this.enemyManager.unreverseAll();
        }

        this.timer = 0;
        this.active = false;

    }

}