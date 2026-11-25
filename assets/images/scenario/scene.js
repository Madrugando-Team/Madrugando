// Imagem de fundo do jogo (1280×720, mesmo tamanho do canvas)
const BACKGROUND = new Image();
BACKGROUND.src = new URL("./fundo.webp", import.meta.url).href;

export class Scene {

    render(ctx, w, h) {

        ctx.clearRect(0, 0, w, h);

        // Usa a imagem de fundo quando ela já estiver carregada
        if (BACKGROUND.complete && BACKGROUND.naturalWidth > 0) {

            // Preenche a tela sem distorcer: no PC (1280×720) a imagem cabe
            // inteira; no celular em pé é recortada nas laterais
            const scale = Math.max(
                w / BACKGROUND.naturalWidth,
                h / BACKGROUND.naturalHeight
            );
            const drawWidth = BACKGROUND.naturalWidth * scale;
            const drawHeight = BACKGROUND.naturalHeight * scale;

            ctx.drawImage(
                BACKGROUND,
                (w - drawWidth) / 2,
                (h - drawHeight) / 2,
                drawWidth,
                drawHeight
            );
            return;
        }

        // Enquanto a imagem carrega (ou se falhar): só um degradê com as
        // cores do fundo novo. Antes era desenhado o cenário antigo
        // (parede, janela e escrivaninha), que aparecia por um instante
        // ao abrir o jogo em conexões mais lentas.
        const sky = ctx.createLinearGradient(0, 0, 0, h);
        sky.addColorStop(0, "#01144f");
        sky.addColorStop(0.25, "#000c48");
        sky.addColorStop(0.5, "#001f5d");
        sky.addColorStop(0.75, "#033373");
        sky.addColorStop(1, "#083b7b");

        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, h);
    }
}