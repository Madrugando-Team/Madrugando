// Ícone da moeda (ficha do Boolhante), usado nos desenhos em canvas:
// selo no Boolhante, moeda que sobe ao derrotá-lo e botão da roleta.
// Se a imagem ainda não carregou, desenha o emoji no lugar.

const COIN_IMAGE = new Image();
COIN_IMAGE.src = new URL(
    "../../assets/images/itens/moeda.webp",
    import.meta.url
).href;

// Desenha a moeda centralizada em (x, y), com `size` px de lado
export function drawCoin(ctx, x, y, size) {
    if (COIN_IMAGE.complete && COIN_IMAGE.naturalWidth > 0) {
        ctx.drawImage(COIN_IMAGE, x - size / 2, y - size / 2, size, size);
        return;
    }

    ctx.save();
    ctx.font = `${size * 0.85}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🪙", x, y);
    ctx.restore();
}
