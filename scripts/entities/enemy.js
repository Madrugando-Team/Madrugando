import { drawCoin } from "../utils/coin.js";

// ---------- Sprites ----------

const loadSprite = (folder, file) => {
    const image = new Image();
    image.src = new URL(
        `../../assets/images/enemies/${folder}/${file}`,
        import.meta.url
    ).href;
    return image;
};

const SPRITES = {
    boo: {
        variants: [
            loadSprite("boo", "boo-1.webp"),
            loadSprite("boo", "boo-2.webp")
        ],
        hit: loadSprite("boo", "boo-hit.webp"),
        frozen: loadSprite("boo", "boo-congelado.webp")
    },
    boozarro: {
        variants: [
            loadSprite("boozarro", "boozarro.webp")
        ],
        hit: loadSprite("boozarro", "boozarro-hit.webp")
        // frozen: usa o do Boo (definido abaixo)
    },
    scromblus: {
        // Uma imagem por fase (1ª, 2ª e 3ª palavra)
        phases: [
            loadSprite("scromblus", "scromblus-fase-1.webp"),
            loadSprite("scromblus", "scromblus-fase-2.webp"),
            loadSprite("scromblus", "scromblus-fase-3.webp")
        ],
        // Frame de hit ao passar para a fase 2 e para a fase 3
        phaseHits: [
            loadSprite("scromblus", "scromblus-hit-1.webp"),
            loadSprite("scromblus", "scromblus-hit-2.webp")
        ],
        frozen: loadSprite("scromblus", "scromblus-congelado.webp")
    }
};

// O Boolhante reutiliza a animação do Boo, com tratamento dourado no draw.
SPRITES.boolhante = SPRITES.boo;

// O Boozarro congelado usa o mesmo sprite do Boo
SPRITES.boozarro.frozen = SPRITES.boo.frozen;

// Pré-renderiza uma vez os frames dourados do Boolhante. Aplicar ctx.filter
// a cada frame causava picos de renderização em computadores mais modestos.
const GOLD_SPRITE_FILTER = "sepia(1) saturate(5) hue-rotate(350deg) brightness(1.08)";
const GOLD_SPRITE_CACHE = new WeakMap();

const createGoldSprite = (image) => {
    if (!image?.complete || image.naturalWidth === 0 || GOLD_SPRITE_CACHE.has(image)) {
        return GOLD_SPRITE_CACHE.get(image) ?? image;
    }

    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d");
    if (!context) return image;

    context.filter = GOLD_SPRITE_FILTER;
    context.drawImage(image, 0, 0);
    GOLD_SPRITE_CACHE.set(image, canvas);
    return canvas;
};

for (const image of [
    ...SPRITES.boo.variants,
    SPRITES.boo.hit,
    SPRITES.boo.frozen
]) {
    if (image.complete && image.naturalWidth > 0) {
        createGoldSprite(image);
    } else {
        image.addEventListener("load", () => createGoldSprite(image), { once: true });
    }
}

// O Scromblus usa o último frame de hit na animação de derrota
SPRITES.scromblus.kill = SPRITES.scromblus.phaseHits[1];

export const BOO_VARIANT_COUNT = SPRITES.boo.variants.length;

// Configuração visual por tipo de inimigo
const TYPE_CONFIG = {
    boo: {
        height: 110,           // altura na tela (px do canvas)
        platePosition: 0.62,   // altura da placa no corpo (0 = topo, 1 = base)
        textColor: "#ffffff",
        deathDuration: 800     // ms piscando antes de sumir
    },
    boolhante: {
        height: 110,
        platePosition: 0.62,
        textColor: "#fff2a6",
        deathDuration: 800
    },
    // Mesmo tamanho e placa do Boo
    boozarro: {
        height: 110,
        platePosition: 0.62,
        textColor: "#ffffff",
        deathDuration: 800
    },
    scromblus: {
        height: 130,
        textColor: "#1b3d12",  // verde-escuro, combinando com o Scromblus
        deathDuration: 900     // ms girando até sumir
    }
};

// Balão de fala do Scromblus (a palavra fica acima da cabeça)
const BALLOON_HEIGHT = 34;
const BALLOON_PADDING_X = 14;
const BALLOON_RADIUS = 14;
const BALLOON_TAIL = 12;        // altura da ponta que aponta para o Scromblus
const BALLOON_SPRITE_GAP = -4;  // negativo: a ponta encosta um pouco na cabeça

const PLATE_HEIGHT = 30;
const PLATE_PADDING_X = 12;

// Boo: pisca 2 vezes durante a animação de hit
const HIT_BLINK_INTERVAL = 200; // ms (visível / invisível)

// Scromblus: frame de hit ao trocar de fase e giro da derrota
const PHASE_HIT_DURATION = 300; // ms
const KILL_SPIN_TURNS = 2;      // voltas completas até sumir

// Scromblus: entrada deslizando de cima da tela ao surgir
const ENTRY_DURATION = 700;     // ms

// Reverso: altura mínima (linha da palavra) até onde os inimigos sobem.
// Fica logo abaixo dos corações e do troféu, com a palavra visível.
// Para ajustar a altura da linha, mude o REVERSE_MIN_Y: um número maior a deixa mais baixa.
const REVERSE_MIN_Y = 120;      // px do canvas

// Gelo: inimigos acima desta linha (palavra ainda fora da tela ou
// embaixo do HUD) descem até ela antes de congelar
const FREEZE_MIN_Y = REVERSE_MIN_Y;

const isLoaded = (image) =>
    image && image.complete && image.naturalWidth > 0;


export class Enemy {

    constructor({ x, y, word, speed, type, variant = 0 }) {

        this.x = x;
        this.y = y;
        this.word = word;
        this.speed = speed;
        this.type = type;
        this.variant = variant;
        this.alive = true;
        this.frozen = false;
        this.reversed = false;

        // Animação de derrota (Boo pisca, Scromblus gira e encolhe)
        this.hitTimer = 0;

        // Frame de hit do Scromblus ao trocar de fase
        this.phaseHitTimer = 0;

        // Animação de entrada (apenas visual)
        this.entryTimer = 0;
        this.boolhanteCoinCollected = false;

    }


    getConfig() {
        return TYPE_CONFIG[this.type] ?? TYPE_CONFIG.boo;
    }


    update(deltaTime) {

        // A entrada é só visual: não interfere no movimento nem no chão
        if (this.entryTimer > 0) {
            this.entryTimer = Math.max(this.entryTimer - deltaTime, 0);
        }

        // Durante a derrota o inimigo fica parado e some ao fim da animação
        if (this.isHit()) {

            this.hitTimer -= deltaTime;

            if (this.hitTimer <= 0) {
                this.hitTimer = 0;
                this.alive = false;
            }

            return;
        }

        // Pausa rápida no frame de hit do Scromblus
        if (this.phaseHitTimer > 0) {
            this.phaseHitTimer = Math.max(this.phaseHitTimer - deltaTime, 0);
            return;
        }

        if (this.frozen) {
            return;
        }

        const step = this.speed * (deltaTime / 16);

        // Reverso: sobe só até a linha abaixo do HUD e espera ali.
        // Quem nasceu durante o efeito (acima da linha) desce até ela.
        if (this.reversed) {

            if (this.y > REVERSE_MIN_Y) {
                this.y = Math.max(this.y - step, REVERSE_MIN_Y);
            } else if (this.y < REVERSE_MIN_Y) {
                this.y = Math.min(this.y + step, REVERSE_MIN_Y);
            }

            return;
        }

        this.y += step;

    }


    // ---------- Geometria ----------
    // x é a borda esquerda da palavra e y é a linha de base do texto.
    // O sprite é desenhado centralizado na palavra.

    getWordWidth(ctx) {
        ctx.save();
        ctx.font = "bold 20px Arial";
        const width = ctx.measureText(this.word).width;
        ctx.restore();
        return width;
    }

    getSpriteSize(sprite) {
        const { height } = this.getConfig();

        const ratio = isLoaded(sprite)
            ? sprite.naturalWidth / sprite.naturalHeight
            : 0.6;

        return { width: height * ratio, height };
    }

    // Centro horizontal do inimigo. É fixado no primeiro desenho para o
    // sprite não "andar" para os lados quando a palavra muda de tamanho
    // (troca de fase do Scromblus). Só a placa/balão se ajusta à palavra.
    getCenterX(wordWidth) {

        if (this.anchorX === undefined) {
            this.anchorX = this.x + wordWidth / 2;
        }

        return this.anchorX;
    }

    // Centro vertical da placa (Boo) ou do balão (Scromblus)
    getPlateCenterY() {
        return this.y - 7;
    }

    // Topo do sprite: no Boo a placa fica sobre o corpo;
    // no Scromblus o corpo fica abaixo do balão de fala.
    getSpriteTop() {

        const { height, platePosition } = this.getConfig();

        if (this.type === "scromblus") {
            return this.getPlateCenterY() +
                BALLOON_HEIGHT / 2 +
                BALLOON_TAIL +
                BALLOON_SPRITE_GAP;
        }

        return this.getPlateCenterY() - height * platePosition;
    }

    // Centro do sprite na tela (usado pelo "PUF!" do Despertador)
    getCenter() {

        const x = this.anchorX ?? this.x + this.word.length * 5;

        return {
            x,
            y: this.getSpriteTop() + this.getConfig().height / 2
        };
    }

    getCoinCenter() {
        const sprite = this.getCurrentSprite();
        const { height } = this.getConfig();
        const width = isLoaded(sprite)
            ? height * sprite.naturalWidth / sprite.naturalHeight
            : 66;
        const center = this.getCenter();
        const radius = Math.max(12, Math.min(17, height * 0.14));
        return {
            x: center.x + width / 2 - radius * 0.2,
            y: this.getSpriteTop() + radius * 0.8
        };
    }

    // Base do sprite, usada para saber quando o inimigo toca o chão
    getBottom() {
        return this.getSpriteTop() + this.getConfig().height;
    }


    // ---------- Desenho ----------

    draw(ctx) {

        // Boo e Boozarro piscam durante a derrota
        if (this.type !== "scromblus" && this.isHit()) {
            const elapsed = this.getConfig().deathDuration - this.hitTimer;
            const visible =
                Math.floor(elapsed / HIT_BLINK_INTERVAL) % 2 === 0;

            if (!visible)
                return;
        }

        const sprite = this.getCurrentSprite();

        // Sprite ainda não carregou: mantém o desenho antigo
        if (!isLoaded(sprite)) {
            this.drawAsText(ctx);
            if (this.type === "boolhante" && !this.boolhanteCoinCollected) {
                const wordWidth = this.getWordWidth(ctx);
                const centerX = this.getCenterX(wordWidth);
                this.drawCoinBadge(ctx, centerX, this.getSpriteTop(), 66, this.getConfig().height);
            }
            return;
        }

        const wordWidth = this.getWordWidth(ctx);
        const centerX = this.getCenterX(wordWidth);
        const plateCenterY = this.getPlateCenterY();

        const { width, height } = this.getSpriteSize(sprite);
        const spriteTop = this.getSpriteTop();

        ctx.save();

        // Entrada: desenha o inimigo mais acima e o aproxima da posição real,
        // desacelerando no final (ease-out)
        if (this.entryTimer > 0) {
            const remaining = this.entryTimer / ENTRY_DURATION;
            ctx.translate(0, -this.entryDistance * remaining ** 3);
        }

        // Scromblus derrotado: gira e encolhe em torno do próprio centro
        if (this.type === "scromblus" && this.isHit()) {

            const progress =
                1 - this.hitTimer / this.getConfig().deathDuration;

            const spriteCenterY = spriteTop + height / 2;

            ctx.translate(centerX, spriteCenterY);
            ctx.rotate(progress * KILL_SPIN_TURNS * Math.PI * 2);
            ctx.scale(1 - progress, 1 - progress);
            ctx.globalAlpha = 1 - progress * 0.3;

            ctx.drawImage(sprite, -width / 2, -height / 2, width, height);

            ctx.restore();
            return;
        }

        if (this.type === "boolhante") {
            const goldSprite = createGoldSprite(sprite);
            ctx.drawImage(goldSprite, centerX - width / 2, spriteTop, width, height);
            if (!this.boolhanteCoinCollected) {
                this.drawCoinBadge(ctx, centerX, spriteTop, width, height);
            }
        } else {
            ctx.drawImage(sprite, centerX - width / 2, spriteTop, width, height);
        }

        // Durante a derrota a palavra some: ela já foi acertada
        if (!this.isHit()) {
            if (this.type === "scromblus") {
                this.drawBalloon(ctx, centerX, plateCenterY, wordWidth);
            } else {
                this.drawPlate(ctx, centerX, plateCenterY, wordWidth, width);
            }
        }

        ctx.restore();
    }

    drawCoinBadge(ctx, centerX, spriteTop, width, height) {
        const radius = Math.max(12, Math.min(17, height * 0.14));
        const x = centerX + width / 2 - radius * 0.2;
        const y = spriteTop + radius * 0.8;
        // A imagem já é a moeda inteira (com borda): sem círculo atrás
        drawCoin(ctx, x, y, radius * 2.4);
    }


    getCurrentSprite() {

        const sprites = SPRITES[this.type];

        if (!sprites)
            return null;

        if (this.type === "scromblus") {

            const phase = Math.min(this.currentWordIndex ?? 0, 2);

            if (this.isHit())
                return sprites.kill;

            // Frame de hit: phase já avançou, então phase 1 → hit 1, phase 2 → hit 2
            if (this.phaseHitTimer > 0)
                return sprites.phaseHits[Math.max(phase - 1, 0)];

            if (this.frozen)
                return sprites.frozen;

            return sprites.phases[phase];
        }

        // Boo e Boozarro
        if (this.frozen)
            return sprites.frozen;

        if (this.isHit())
            return sprites.hit;

        return sprites.variants[this.variant] ?? sprites.variants[0];
    }


    // Placa preta com a palavra. Cresce quando a palavra é maior que o sprite.
    drawPlate(ctx, centerX, centerY, wordWidth, spriteWidth) {

        const plateWidth = Math.max(
            wordWidth + PLATE_PADDING_X * 2,
            spriteWidth * 0.9
        );

        const left = centerX - plateWidth / 2;
        const top = centerY - PLATE_HEIGHT / 2;

        ctx.fillStyle = "rgba(0, 0, 0, 0.92)";
        ctx.beginPath();

        if (ctx.roundRect) {
            ctx.roundRect(left, top, plateWidth, PLATE_HEIGHT, 8);
        } else {
            ctx.rect(left, top, plateWidth, PLATE_HEIGHT);
        }

        ctx.fill();

        ctx.fillStyle = this.getConfig().textColor;
        ctx.font = "bold 20px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        ctx.fillText(this.word, centerX, this.y);
    }


    // Balão de fala do Scromblus, com a ponta apontando para a cabeça.
    // Cresce com a palavra, como a placa do Boo.
    drawBalloon(ctx, centerX, centerY, wordWidth) {

        const width = wordWidth + BALLOON_PADDING_X * 2;
        const left = centerX - width / 2;
        const top = centerY - BALLOON_HEIGHT / 2;
        const bottom = top + BALLOON_HEIGHT;

        ctx.beginPath();

        if (ctx.roundRect) {
            ctx.roundRect(left, top, width, BALLOON_HEIGHT, BALLOON_RADIUS);
        } else {
            ctx.rect(left, top, width, BALLOON_HEIGHT);
        }

        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#1b2a14";
        ctx.lineWidth = 2.5;
        ctx.lineJoin = "round";

        ctx.fill();
        ctx.stroke();

        // Ponta do balão: desenhada por cima, cobrindo o contorno da base
        const tailX = centerX;

        ctx.beginPath();
        ctx.moveTo(tailX - 9, bottom - 1.5);
        ctx.lineTo(tailX + 3, bottom + BALLOON_TAIL);
        ctx.lineTo(tailX + 9, bottom - 1.5);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(tailX - 9, bottom);
        ctx.lineTo(tailX + 3, bottom + BALLOON_TAIL);
        ctx.lineTo(tailX + 9, bottom);
        ctx.stroke();

        ctx.fillStyle = this.getConfig().textColor;
        ctx.font = "bold 20px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        ctx.fillText(this.word, centerX, this.y);
    }


    // Desenho em texto, usado enquanto o sprite carrega
    drawAsText(ctx) {
        ctx.fillStyle = this.type === "scromblus"
            ? "limegreen"
            : "white";

        ctx.font = "20px Arial";
        ctx.fillText(this.word, this.x, this.y);
    }


    // Referente ao power-up Gelo, que congela os inimigos na tela;
    freeze() {

        // Quem acabou de nascer ainda está com a palavra fora da tela.
        // Ele continua descendo e só congela ao chegar na linha em que a
        // palavra fica legível (o Gelo chama freezeAll a cada quadro).
        if (this.y < FREEZE_MIN_Y)
            return;

        this.frozen = true;

    }


    unfreeze() {

        this.frozen = false;

    }

    // Referente ao power-up Reverso, que inverte a direção dos inimigos na tela;
    reverse() {
        this.reversed = true;
    }

    unreverse() {
        this.reversed = false;
    }


    // Faz o inimigo surgir deslizando de cima da tela, em vez de aparecer
    // de uma vez. A distância cobre tudo o que estaria visível ao nascer.
    startEntry() {

        this.entryDistance = Math.max(this.getBottom(), 0) + 10;
        this.entryTimer = ENTRY_DURATION;

    }


    // Frame de hit do Scromblus ao avançar de fase
    startPhaseHit() {

        this.phaseHitTimer = PHASE_HIT_DURATION;

    }


    // Inicia a animação de derrota (Boo pisca, Scromblus gira e encolhe)
    hit() {

        if (this.isHit() || this.isDead())
            return;

        this.phaseHitTimer = 0;
        this.hitTimer = this.getConfig().deathDuration;
        if (this.type === "boolhante") {
            this.boolhanteCoinCollected = true;
        }

    }


    isHit() {

        return this.hitTimer > 0;

    }


    // Pode ser acertado / ainda está "em jogo"
    isActive() {

        return this.alive && !this.isHit();

    }


    kill() {

        this.alive = false;

    }


    isDead() {

        return !this.alive;

    }
}
