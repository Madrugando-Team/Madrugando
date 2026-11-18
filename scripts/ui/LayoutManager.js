// Escolhe o formato da tela do jogo e ajusta o canvas a ela.
//
// - PC (padrão): canvas 1280×720, exatamente como sempre foi.
// - Celular/tablet em pé ("retrato"): o canvas passa a ter 540 de largura e
//   a altura acompanha a área visível da tela. Quando o teclado virtual abre,
//   a área visível diminui e o canvas fica mais baixo, então a barra de
//   digitação continua logo acima do teclado.
// - Celular/tablet deitado: mantém 1280×720 e só reduz para caber na tela.
//
// O bloco do jogo (.game-container) é desenhado no tamanho "lógico" e
// reduzido com transform: scale, como já acontece na tela cheia. Assim o
// HUD e os menus continuam usando as mesmas medidas em px.

export const LANDSCAPE_WIDTH = 1280;
export const LANDSCAPE_HEIGHT = 720;

// Largura lógica no modo retrato. Num celular de ~400px de largura a escala
// fica perto de 0,75, o que mantém textos de 20px legíveis.
export const PORTRAIT_WIDTH = 540;

// Larguras de tela (px CSS) até onde o modo retrato é usado
const PORTRAIT_MAX_WIDTH = 900;

export const LAYOUT = {
    DESKTOP: "desktop",
    PORTRAIT: "portrait",
    TOUCH_LANDSCAPE: "touch-landscape"
};

export class LayoutManager {

    constructor({ canvas, container, onResize } = {}) {

        this.canvas = canvas;
        this.container = container;
        this.onResize = onResize;

        this.mode = LAYOUT.DESKTOP;

        this.touchQuery = window.matchMedia("(pointer: coarse)");
        this.portraitQuery = window.matchMedia(
            `(orientation: portrait) and (max-width: ${PORTRAIT_MAX_WIDTH}px)`
        );
        this.smallScreenQuery = window.matchMedia(
            `(max-width: ${LANDSCAPE_WIDTH + 6}px), (max-height: ${LANDSCAPE_HEIGHT + 6}px)`
        );

        const update = () => this.scheduleUpdate();

        window.addEventListener("resize", update);
        window.addEventListener("orientationchange", update);
        window.visualViewport?.addEventListener("resize", update);
        window.visualViewport?.addEventListener("scroll", update);

        this.update();
    }

    // Vários eventos chegam juntos (resize + visualViewport): junta num frame
    scheduleUpdate() {

        if (this.pending)
            return;

        this.pending = requestAnimationFrame(() => {
            this.pending = null;
            this.update();
        });
    }

    getViewport() {

        const viewport = window.visualViewport;

        return {
            width: viewport?.width ?? window.innerWidth,
            height: viewport?.height ?? window.innerHeight,
            left: viewport?.offsetLeft ?? 0,
            top: viewport?.offsetTop ?? 0
        };
    }

    // Usa media queries (tamanho da janela, não a área visível): assim o
    // teclado aberto não muda o modo, e o zoom da página não atrapalha
    detectMode() {

        if (this.portraitQuery.matches)
            return LAYOUT.PORTRAIT;

        if (this.touchQuery.matches && this.smallScreenQuery.matches)
            return LAYOUT.TOUCH_LANDSCAPE;

        return LAYOUT.DESKTOP;
    }

    isPortrait() {
        return this.mode === LAYOUT.PORTRAIT;
    }

    isCompact() {
        return this.mode !== LAYOUT.DESKTOP;
    }

    update() {

        const viewport = this.getViewport();
        const mode = this.detectMode();

        let width = LANDSCAPE_WIDTH;
        let height = LANDSCAPE_HEIGHT;
        let scale = 1;

        if (mode === LAYOUT.PORTRAIT) {

            scale = viewport.width / PORTRAIT_WIDTH;
            width = PORTRAIT_WIDTH;
            height = Math.round(viewport.height / scale);

        } else if (mode === LAYOUT.TOUCH_LANDSCAPE) {

            scale = Math.min(
                viewport.width / LANDSCAPE_WIDTH,
                viewport.height / LANDSCAPE_HEIGHT
            );
        }

        const body = document.body;

        body.classList.toggle("is-portrait", mode === LAYOUT.PORTRAIT);
        body.classList.toggle("is-touch-landscape", mode === LAYOUT.TOUCH_LANDSCAPE);
        body.classList.toggle("is-compact", mode !== LAYOUT.DESKTOP);

        const style = this.container.style;

        if (mode === LAYOUT.DESKTOP) {
            ["--layout-w", "--layout-h", "--layout-scale", "--layout-x", "--layout-y"]
                .forEach(name => style.removeProperty(name));
        } else {

            // Centraliza na horizontal quando sobra espaço (deitado)
            const offsetX = (viewport.width - width * scale) / 2;
            const offsetY = mode === LAYOUT.PORTRAIT
                ? 0
                : (viewport.height - height * scale) / 2;

            style.setProperty("--layout-w", `${width}px`);
            style.setProperty("--layout-h", `${height}px`);
            style.setProperty("--layout-scale", scale);
            style.setProperty("--layout-x", `${viewport.left + offsetX}px`);
            style.setProperty("--layout-y", `${viewport.top + offsetY}px`);
        }

        this.mode = mode;

        const oldWidth = this.canvas.width;
        const oldHeight = this.canvas.height;

        if (oldWidth === width && oldHeight === height)
            return;

        // Mudar o tamanho do canvas apaga o desenho; o jogo redesenha
        // tudo no próximo quadro
        this.canvas.width = width;
        this.canvas.height = height;

        this.onResize?.({
            oldWidth,
            oldHeight,
            width,
            height,
            mode
        });

        // O campo em uso (ex.: nome do jogador) continua visível
        // quando o teclado abre
        const active = document.activeElement;

        if (active?.matches?.("input:not(#typing-capture), textarea, select")) {
            active.scrollIntoView({ block: "nearest" });
        }
    }
}
