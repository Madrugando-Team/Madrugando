// Controla o modo de tela cheia do jogo.
//
// A página inteira entra em tela cheia, o cabeçalho é escondido e o bloco do
// jogo (.game-container, que tem tamanho fixo de 1280×720) é ampliado
// proporcionalmente para caber na tela. Assim canvas, HUD e menus crescem
// juntos sem precisar alterar o CSS de cada um.

// Tamanho do bloco do jogo, incluindo a borda de 3px do canvas
const GAME_WIDTH = 1286;
const GAME_HEIGHT = 726;

export class FullscreenToggle {

    constructor({ container, buttons, onExit } = {}) {

        this.container = container;
        this.buttons = [...(buttons || [])];
        this.onExit = onExit;

        // Ex.: Safari no iPhone não permite tela cheia em páginas
        if (!this.isSupported()) {
            this.buttons.forEach(button => {
                button.hidden = true;
            });
            return;
        }

        this.buttons.forEach(button => {
            button.addEventListener("click", () => {
                this.toggle();

                // Tira o foco para o Enter/Espaço não acionar o botão de novo
                button.blur();
            });
        });

        const onChange = () => this.handleChange();

        document.addEventListener("fullscreenchange", onChange);
        document.addEventListener("webkitfullscreenchange", onChange);

        window.addEventListener("resize", () => this.updateScale());

        this.updateButtons();
    }

    isSupported() {
        return Boolean(
            document.fullscreenEnabled ||
            document.webkitFullscreenEnabled
        );
    }

    isActive() {
        return Boolean(
            document.fullscreenElement ||
            document.webkitFullscreenElement
        );
    }

    toggle() {
        if (this.isActive()) {
            this.exit();
        } else {
            this.enter();
        }
    }

    enter() {

        const root = document.documentElement;

        const request =
            root.requestFullscreen ||
            root.webkitRequestFullscreen;

        if (!request)
            return;

        const result = request.call(root);

        // Alguns navegadores recusam (ex.: sem gesto do usuário)
        result?.catch?.(error => {
            console.warn("Não foi possível entrar em tela cheia:", error);
        });
    }

    exit() {

        const exit =
            document.exitFullscreen ||
            document.webkitExitFullscreen;

        if (exit && this.isActive()) {
            exit.call(document)?.catch?.(() => { });
        }
    }

    handleChange() {

        const active = this.isActive();

        document.body.classList.toggle("is-fullscreen", active);

        this.updateScale();
        this.updateButtons();

        // O Esc do navegador sai da tela cheia antes de chegar ao jogo,
        // então avisamos o Game para pausar a partida.
        if (!active) {
            this.onExit?.();
        }
    }

    updateScale() {

        if (!this.container)
            return;

        const scale = this.isActive()
            ? Math.min(
                window.innerWidth / GAME_WIDTH,
                window.innerHeight / GAME_HEIGHT
            )
            : 1;

        this.container.style.setProperty("--game-scale", scale);
    }

    updateButtons() {

        const active = this.isActive();

        this.buttons.forEach(button => {

            const label = active ? "Sair da tela cheia" : "Tela cheia";

            button.textContent = button.hasAttribute("data-fullscreen-label")
                ? `⛶ ${label}`
                : "⛶";

            button.setAttribute("aria-label", label);
            button.title = label;
        });
    }
}