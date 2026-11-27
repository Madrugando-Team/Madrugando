// Aviso "HORA DA QUESTÃO!" mostrado no fim da onda, antes do Boss aparecer.
// Entra com um pequeno "pulo", fica na tela balançando de leve e some.
// É desenhado no canvas; o tempo vem do deltaTime do jogo, então
// pausar o jogo também pausa o aviso.

const IMAGE = new Image();
IMAGE.src = new URL(
    "../../assets/images/effects/hora-da-questao.webp",
    import.meta.url
).href;

// Tempos em milissegundos (o total é o que o jogador espera antes do Boss)
const DURATION = 1800;
const ENTER_TIME = 350;
const EXIT_TIME = 250;

// Largura do aviso: 72% da tela, no máximo 560px (a imagem é 600×438)
const WIDTH_RATIO = 0.72;
const MAX_WIDTH = 560;

// Ease-out com leve ultrapassagem (o aviso "pula" ao entrar)
const easeOutBack = (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

export class QuestionIntro {

    constructor() {
        this.elapsed = 0;
        this.started = false;
        this.finished = false;
    }

    // Verdadeiro entre o início e o fim do aviso
    isActive() {
        return this.started && !this.finished;
    }

    // Verdadeiro depois que o aviso terminou (libera o Boss)
    isFinished() {
        return this.finished;
    }

    update(deltaTime) {
        if (this.finished) {
            return;
        }

        this.started = true;
        this.elapsed += deltaTime;

        if (this.elapsed >= DURATION) {
            this.finished = true;
        }
    }

    // Volta ao estado inicial para o aviso aparecer de novo na próxima onda
    reset() {
        this.elapsed = 0;
        this.started = false;
        this.finished = false;
    }

    draw(ctx, canvasWidth, canvasHeight) {
        if (!this.isActive() || !IMAGE.complete || IMAGE.naturalWidth === 0) {
            return;
        }

        const t = this.elapsed;
        let scale = 1;
        let alpha = 1;

        if (t < ENTER_TIME) {
            const progress = t / ENTER_TIME;
            scale = 0.4 + 0.6 * easeOutBack(progress);
            alpha = Math.min(1, progress * 2);
        } else if (t > DURATION - EXIT_TIME) {
            const progress = (t - (DURATION - EXIT_TIME)) / EXIT_TIME;
            scale = 1 + 0.08 * progress;
            alpha = 1 - progress;
        } else {
            // Respira e balança de leve enquanto está parado
            scale = 1 + Math.sin(t / 140) * 0.012;
        }

        const width = Math.min(canvasWidth * WIDTH_RATIO, MAX_WIDTH);
        const height = width * IMAGE.naturalHeight / IMAGE.naturalWidth;
        const sway = t >= ENTER_TIME ? Math.sin(t / 210) * 0.018 : 0;

        ctx.save();
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.translate(canvasWidth / 2, canvasHeight * 0.45);
        ctx.rotate(sway);
        ctx.scale(scale, scale);
        ctx.drawImage(IMAGE, -width / 2, -height / 2, width, height);
        ctx.restore();
    }
}
