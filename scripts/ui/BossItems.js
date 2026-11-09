const ITEM_DEFINITIONS = [
    {
        id: "eraser",
        label: "Borracha",
        fallback: "🧽",
        image: "itemBORRACHA.webp"
    },
    {
        id: "shield",
        label: "Escudo",
        fallback: "🛡️",
        image: "itemSHIELD.webp"
    },
    {
        id: "time",
        label: "Ampulheta",
        fallback: "⌛",
        image: "itemTEMPO.webp"
    },
    {
        id: "switch",
        label: "Switch",
        fallback: "↔️",
        image: null
    }
];

const ITEM_IMAGES = Object.fromEntries(
    ITEM_DEFINITIONS
        .filter(item => item.image)
        .map(item => {
            const image = new Image();
            image.src = new URL(
                `../../assets/images/itens/${item.image}`,
                import.meta.url
            ).href;
            return [item.id, image];
        })
);

export class BossItems {
    constructor(canvas) {
        this.canvas = canvas;
        this.used = new Set();
        this.usedThisRound = false;
        this.shieldArmed = false;
        this.hoveredItem = null;
        this.buttonSize = 54;
        this.gap = 10;
        this.top = 28;
    }

    reset() {
        this.used.clear();
        this.usedThisRound = false;
        this.shieldArmed = false;
        this.hoveredItem = null;
    }

    getButtons() {
        const groupWidth = ITEM_DEFINITIONS.length * this.buttonSize +
            (ITEM_DEFINITIONS.length - 1) * this.gap;
        const canvasRect = this.canvas.getBoundingClientRect();
        const timerRect = document
            .getElementById("wave-progress")
            ?.getBoundingClientRect();
        const scoreRect = document
            .querySelector("#hud > .hud-box:last-child")
            ?.getBoundingClientRect();
        const scaleX = this.canvas.width / canvasRect.width;
        let startX = this.canvas.width / 2 + 120;

        if (timerRect && scoreRect) {
            const timerRight =
                (timerRect.right - canvasRect.left) * scaleX;
            const scoreLeft =
                (scoreRect.left - canvasRect.left) * scaleX;
            const freeSpace = scoreLeft - timerRight;

            if (freeSpace > groupWidth) {
                startX = timerRight + (freeSpace - groupWidth) / 2;
            }
        }

        const hudRect = document.getElementById("hud")?.getBoundingClientRect();
        const scaleY = this.canvas.height / canvasRect.height;
        const top = hudRect
            ? (hudRect.top - canvasRect.top) * scaleY
            : this.top;

        return ITEM_DEFINITIONS.map((item, index) => ({
            ...item,
            x: startX + index * (this.buttonSize + this.gap),
            y: top,
            size: this.buttonSize
        }));
    }

    canUse(item, bossManager) {
        if (this.usedThisRound || this.used.has(item.id)) return false;
        if (item.id === "eraser") return bossManager.canEliminateWrongOption();
        if (item.id === "switch") return bossManager.canSwitchQuestion();
        return true;
    }

    containsPoint(x, y) {
        return this.getButtons().some(button => {
            const centerX = button.x + button.size / 2;
            const centerY = button.y + button.size / 2;
            return Math.hypot(x - centerX, y - centerY) <= button.size / 2 + 5;
        });
    }

    handleClick(x, y, bossManager) {
        const button = this.getButtons().find(item => {
            const centerX = item.x + item.size / 2;
            const centerY = item.y + item.size / 2;
            return Math.hypot(x - centerX, y - centerY) <= item.size / 2 + 5;
        });
        if (!button) return false;
        if (!this.canUse(button, bossManager)) return true;

        let activated = false;
        switch (button.id) {
            case "eraser":
                activated = bossManager.eliminateWrongOption();
                break;
            case "shield":
                this.shieldArmed = true;
                activated = true;
                break;
            case "time":
                activated = bossManager.addTime(15);
                break;
            case "switch":
                activated = bossManager.switchQuestion();
                break;
        }

        if (activated) {
            this.used.add(button.id);
            this.usedThisRound = true;
        }
        return true;
    }

    blockNextWrongAnswer() {
        if (!this.shieldArmed) return false;
        this.shieldArmed = false;
        return true;
    }

    draw(ctx, bossManager) {
        for (const button of this.getButtons()) {
            const centerX = button.x + button.size / 2;
            const centerY = button.y + button.size / 2;
            const isArmed = button.id === "shield" && this.shieldArmed;
            const usable = this.canUse(button, bossManager);
            const hovered = this.hoveredItem === button.id;

            ctx.save();
            ctx.globalAlpha = usable || isArmed ? 1 : 0.42;
            ctx.shadowColor = isArmed
                ? "rgba(95, 195, 255, 0.9)"
                : "rgba(145, 125, 255, 0.55)";
            ctx.shadowBlur = hovered || isArmed ? 18 : 8;
            ctx.fillStyle = isArmed
                ? "rgba(34, 104, 145, 0.98)"
                : "rgba(24, 31, 65, 0.96)";
            ctx.strokeStyle = isArmed
                ? "#7cdbff"
                : "rgba(196, 182, 255, 0.82)";
            ctx.lineWidth = isArmed ? 3 : 2;
            ctx.beginPath();
            ctx.arc(centerX, centerY, button.size / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.shadowBlur = 0;

            const image = ITEM_IMAGES[button.id];
            if (image?.complete && image.naturalWidth > 0) {
                ctx.drawImage(image, button.x + 10, button.y + 10, 34, 34);
            } else {
                ctx.font = button.id === "switch" ? "25px Arial" : "23px Arial";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillStyle = "#fff";
                ctx.fillText(button.fallback, centerX, centerY + 1);
            }

            if (hovered) {
                ctx.font = "12px Arial";
                ctx.textAlign = "center";
                ctx.textBaseline = "top";
                ctx.fillStyle = "#fff";
                ctx.fillText(button.label, centerX, button.y + button.size + 7);
            }
            ctx.restore();
        }
    }
}
