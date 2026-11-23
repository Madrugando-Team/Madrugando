const ITEM_DEFINITIONS = [
    { id: "eraser", label: "Borracha", description: "Elimina uma alternativa errada.", fallback: "🧽", image: "itemBORRACHA.webp" },
    { id: "shield", label: "Escudo", description: "Protege contra um erro.", fallback: "🛡️", image: "itemSHIELD.webp" },
    { id: "time", label: "Ampulheta", description: "Acrescenta 15 segundos.", fallback: "⌛", image: "itemTEMPO.webp" },
    { id: "switch", label: "Switch", description: "Troca por outra questão da matéria.", fallback: "↔️", image: "itemSWITCH.webp" }
];

const ITEM_IMAGES = Object.fromEntries(ITEM_DEFINITIONS.filter(item => item.image).map(item => {
    const image = new Image();
    image.src = new URL(`../../assets/images/itens/${item.image}`, import.meta.url).href;
    return [item.id, image];
}));

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
        this.rewardItemId = null;
        this.activeItemId = null;
        this.roulette = null;
        this.reveal = null;
        this.coinAnimation = null;
        this.tokenAvailable = false;
        this.onRewardUsed = null;
    }

    reset() {
        this.used.clear();
        this.usedThisRound = false;
        this.shieldArmed = false;
        this.hoveredItem = null;
        this.rewardItemId = null;
        this.activeItemId = null;
        this.roulette = null;
        this.reveal = null;
        this.coinAnimation = null;
        this.tokenAvailable = false;
    }

    beginBossRound() {
        this.usedThisRound = false;
        this.shieldArmed = false;
        this.hoveredItem = null;
        this.activeItemId = null;
    }

    getUnusedItems(bossManager = null) {
        return ITEM_DEFINITIONS.filter(item =>
            !this.used.has(item.id) && (!bossManager || this.canUse(item, bossManager))
        );
    }

    hasUnusedItems() {
        return this.getUnusedItems().length > 0;
    }

    hasReward() {
        return this.rewardItemId !== null;
    }

    isRouletteActive() {
        return Boolean(this.roulette || this.reveal);
    }

    startRoulette(bossManager) {
        if (this.roulette || this.reveal || this.rewardItemId) return false;
        const candidates = this.getUnusedItems(bossManager);
        if (!candidates.length) return false;
        const winner = candidates[Math.floor(Math.random() * candidates.length)];
        const winnerIndex = ITEM_DEFINITIONS.findIndex(item => item.id === winner.id);
        let finalRotation = Math.PI * 12 + Math.PI / 2 - winnerIndex * Math.PI / 2;
        if (finalRotation < Math.PI * 10) finalRotation += Math.PI * 2;
        this.roulette = { winner, elapsed: 0, duration: 4200, finalRotation };
        return true;
    }

    collectToken(x, y) {
        this.coinAnimation = { x, y, elapsed: 0, duration: 700 };
    }

    update(deltaTime) {
        if (this.coinAnimation) {
            this.coinAnimation.elapsed += deltaTime;
            if (this.coinAnimation.elapsed >= this.coinAnimation.duration) this.coinAnimation = null;
        }
        if (this.roulette) {
            this.roulette.elapsed += deltaTime;
            if (this.roulette.elapsed >= this.roulette.duration) {
                const winner = this.roulette.winner;
                this.roulette = null;
                this.reveal = { item: winner, elapsed: 0, duration: 3000 };
            }
            return false;
        }
        if (this.reveal) {
            this.reveal.elapsed += deltaTime;
            if (this.reveal.elapsed < this.reveal.duration) return false;
            this.rewardItemId = this.reveal.item.id;
            this.reveal = null;
            return true;
        }
        return false;
    }

    getButtons() {
        const groupWidth = ITEM_DEFINITIONS.length * this.buttonSize + (ITEM_DEFINITIONS.length - 1) * this.gap;
        const canvasRect = this.canvas.getBoundingClientRect();
        const timerRect = document.getElementById("wave-progress")?.getBoundingClientRect();
        const scoreRect = document.querySelector("#hud .hud-right .hud-box")?.getBoundingClientRect();
        const scaleX = this.canvas.width / canvasRect.width;
        let startX = this.canvas.width / 2 + 120;
        if (timerRect && scoreRect) {
            const timerRight = (timerRect.right - canvasRect.left) * scaleX;
            const scoreLeft = (scoreRect.left - canvasRect.left) * scaleX;
            const freeSpace = scoreLeft - timerRight;
            if (freeSpace > groupWidth) startX = timerRight + (freeSpace - groupWidth) / 2;
        }
        const hudRect = document.getElementById("hud")?.getBoundingClientRect();
        const scaleY = this.canvas.height / canvasRect.height;
        let top = hudRect ? (hudRect.top - canvasRect.top) * scaleY : this.top;
        if (this.canvas.width < 800) {
            startX = (this.canvas.width - groupWidth) / 2;
            top = hudRect ? (hudRect.bottom - canvasRect.top) * scaleY + 12 : this.top + 70;
        }
        return ITEM_DEFINITIONS.map((item, index) => ({
            ...item, x: startX + index * (this.buttonSize + this.gap), y: top, size: this.buttonSize
        }));
    }

    getSlot() {
        const buttons = this.getButtons();
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        return { x: (first.x + last.x + last.size) / 2, y: first.y + first.size / 2, size: this.buttonSize };
    }

    canUse(item, bossManager) {
        if (this.usedThisRound || this.used.has(item.id)) return false;
        if (item.id === "eraser") return bossManager.canEliminateWrongOption();
        if (item.id === "switch") return bossManager.canSwitchQuestion();
        return true;
    }

    containsPoint(x, y) {
        if (this.roulette || this.reveal) {
            return x >= 0 && x <= this.canvas.width && y >= 0 && y <= this.canvas.height;
        }
        if (!this.rewardItemId && !this.activeItemId && !this.tokenAvailable) return false;
        if (this.tokenAvailable && !this.rewardItemId && !this.activeItemId) {
            const token = this.getTokenButton();
            return Math.hypot(x - token.x, y - token.y) <= token.radius + 8;
        }
        const slot = this.getSlot();
        return Math.hypot(x - slot.x, y - slot.y) <= slot.size / 2 + 8;
    }

    handleClick(x, y, bossManager, tokenAvailable = false) {
        this.tokenAvailable = tokenAvailable;
        if (this.roulette || this.reveal) return true;
        if (this.tokenAvailable && !this.rewardItemId && !this.activeItemId) {
            const token = this.getTokenButton();
            if (Math.hypot(x - token.x, y - token.y) <= token.radius + 8) {
                if (this.startRoulette(bossManager)) bossManager.stopTimer();
                return true;
            }
        }
        if (this.activeItemId && this.containsItemSlotPoint(x, y)) return true;
        if (!this.containsPoint(x, y)) return false;
        const item = ITEM_DEFINITIONS.find(candidate => candidate.id === this.rewardItemId);
        if (!item || !this.canUse(item, bossManager)) return true;
        let activated = false;
        switch (item.id) {
            case "eraser": activated = bossManager.eliminateWrongOption(); break;
            case "shield": this.shieldArmed = true; activated = true; break;
            case "time": activated = bossManager.addTime(15); break;
            case "switch": activated = bossManager.switchQuestion(); break;
        }
        if (activated) {
            this.used.add(item.id);
            this.usedThisRound = true;
            this.rewardItemId = null;
            this.onRewardUsed?.();
        }
        return true;
    }

    containsItemSlotPoint(x, y) {
        const slot = this.getSlot();
        return Math.hypot(x - slot.x, y - slot.y) <= slot.size / 2 + 8;
    }

    getHoveredItem(x, y) {
        const itemId = this.rewardItemId || this.activeItemId;
        if (itemId && this.containsItemSlotPoint(x, y)) return itemId;
        if (this.tokenAvailable && !itemId) {
            const token = this.getTokenButton();
            if (Math.hypot(x - token.x, y - token.y) <= token.radius + 8) return "token";
        }
        return null;
    }

    activateReward(bossManager) {
        const item = ITEM_DEFINITIONS.find(candidate => candidate.id === this.rewardItemId);
        if (!item || !this.canUse(item, bossManager)) return false;
        let activated = false;
        switch (item.id) {
            case "eraser": activated = bossManager.eliminateWrongOption(); break;
            case "shield": this.shieldArmed = true; activated = true; break;
            case "time": activated = bossManager.addTime(15); break;
            case "switch": activated = bossManager.switchQuestion(); break;
        }
        if (!activated) return false;
        this.used.add(item.id);
        this.usedThisRound = true;
        this.activeItemId = item.id;
        this.rewardItemId = null;
        this.onRewardUsed?.();
        return true;
    }

    blockNextWrongAnswer() {
        if (!this.shieldArmed) return false;
        this.shieldArmed = false;
        return true;
    }

    drawCoinAnimation(ctx) {
        if (!this.coinAnimation) return;
        const progress = Math.min(1, this.coinAnimation.elapsed / this.coinAnimation.duration);
        const x = this.coinAnimation.x + Math.sin(progress * Math.PI) * 8;
        const y = this.coinAnimation.y - 55 * progress;
        const size = 42 * (1 - progress * 0.15);
        ctx.save();
        ctx.globalAlpha = 1 - progress;
        ctx.font = `${size * 0.85}px Arial`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("🪙", x, y);
        ctx.restore();
    }

    getTokenButton() {
        const slot = this.getSlot();
        return { x: slot.x, y: slot.y, radius: slot.size / 2 };
    }

    drawTokenButton(ctx, available) {
        if (!available || this.roulette || this.reveal || this.rewardItemId || this.activeItemId) return;
        const token = this.getTokenButton();
        const pulse = 1 + Math.sin(performance.now() / 180) * 0.06;
        ctx.save();
        ctx.shadowColor = "rgba(255, 198, 55, .95)";
        ctx.shadowBlur = 18;
        ctx.fillStyle = "rgba(40, 32, 15, .95)";
        ctx.strokeStyle = "#ffd85d";
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(token.x, token.y, token.radius * pulse, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.font = "28px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("🪙", token.x, token.y);
        if (this.hoveredItem === "token") {
            this.drawTooltip(ctx, "Ficha da roleta", "Clique para sortear e ativar um item.", token.x, token.y + token.radius + 8);
        }
        ctx.restore();
    }

    drawTooltip(ctx, title, description, anchorX, anchorY) {
        const width = 252;
        const height = 58;
        const left = Math.min(Math.max(8, anchorX - width / 2), this.canvas.width - width - 8);
        const top = Math.min(this.canvas.height - height - 8, anchorY + 4);
        ctx.fillStyle = "rgba(12, 16, 39, .96)";
        ctx.strokeStyle = "rgba(255, 220, 120, .88)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(left, top, width, height, 10);
        else ctx.rect(left, top, width, height);
        ctx.fill(); ctx.stroke();
        ctx.textAlign = "center"; ctx.textBaseline = "top";
        ctx.fillStyle = "#ffe9a1"; ctx.font = "bold 13px Arial";
        ctx.fillText(title, left + width / 2, top + 8);
        ctx.fillStyle = "#fff"; ctx.font = "12px Arial";
        ctx.fillText(description, left + width / 2, top + 30);
    }

    drawEvent(ctx) {
        if (!this.roulette && !this.reveal) return;
        ctx.save();
        ctx.fillStyle = "rgba(7, 9, 25, .84)";
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.roulette) {
            this.drawRoulette(ctx);
        } else {
            this.drawRewardReveal(ctx);
        }
        ctx.restore();
    }

    drawRoulette(ctx) {
        const { elapsed, duration, finalRotation } = this.roulette;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const progress = Math.min(1, elapsed / duration);
        const eased = 1 - (1 - progress) ** 4;
        const rotation = finalRotation * eased;
        const radiusX = Math.min(this.canvas.width * 0.38, 500);
        const radiusY = Math.min(this.canvas.height * 0.29, 220);
        const wheelScale = Math.min(1, this.canvas.width / 520, this.canvas.height / 520);
        const discY = centerY + 8;

        // A elipse e as bordas em perspectiva dão a aparência de uma roleta deitada.
        ctx.save();
        ctx.translate(centerX, discY);
        ctx.scale(1, Math.max(0.25, radiusY / radiusX));
        ctx.fillStyle = "rgba(30, 36, 76, .92)";
        ctx.strokeStyle = "rgba(255, 218, 112, .95)";
        ctx.lineWidth = 6;
        ctx.shadowColor = "rgba(255, 203, 72, .7)";
        ctx.shadowBlur = 40;
        ctx.beginPath(); ctx.arc(0, 0, radiusX, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(228, 216, 255, .62)";
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(0, 0, radiusX * 0.78, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();

        const wheelItems = ITEM_DEFINITIONS.map((item, index) => {
            const angle = index * Math.PI / 2 + rotation;
            const depth = Math.sin(angle);
            return {
                item,
                x: centerX + Math.cos(angle) * radiusX * 0.7,
                y: discY + depth * radiusY * 0.7,
                depth
            };
        }).sort((a, b) => a.depth - b.depth);
        for (const entry of wheelItems) {
            const size = (94 + (entry.depth + 1) * 30) * wheelScale;
            this.drawItemIcon(ctx, entry.item, entry.x, entry.y, size, !this.used.has(entry.item.id));
        }

        ctx.fillStyle = "#fff0a0";
        ctx.strokeStyle = "#8a5b12";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(centerX - 22, discY + radiusY + 22);
        ctx.lineTo(centerX + 22, discY + radiusY + 22);
        ctx.lineTo(centerX, discY + radiusY - 9);
        ctx.closePath(); ctx.fill(); ctx.stroke();
    }

    drawRewardReveal(ctx) {
        const { item, elapsed, duration } = this.reveal;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const pulse = 1 + Math.sin(elapsed / 90) * 0.04;
        const iconRadius = 78 * pulse;
        const rays = 16;
        ctx.save();
        ctx.translate(centerX, centerY - 35);
        ctx.rotate(elapsed / 1400);
        for (let index = 0; index < rays; index++) {
            ctx.rotate(Math.PI * 2 / rays);
            ctx.globalAlpha = 0.24 + Math.sin(elapsed / 110 + index) * 0.1;
            ctx.fillStyle = index % 2 ? "#ffe788" : "#fff8cc";
            ctx.beginPath(); ctx.moveTo(0, -iconRadius - 10); ctx.lineTo(-10, -iconRadius - 105); ctx.lineTo(10, -iconRadius - 105); ctx.closePath(); ctx.fill();
        }
        ctx.restore();
        ctx.globalAlpha = Math.min(1, elapsed / 250, (duration - elapsed) / 350);
        this.drawItemIcon(ctx, item, centerX, centerY - 35, 142);
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillStyle = "#fff4bc"; ctx.font = "bold 32px Arial";
        ctx.fillText(item.label, centerX, centerY + 65);
        ctx.fillStyle = "#fff"; ctx.font = "20px Arial";
        ctx.fillText(item.description, centerX, centerY + 104);
        ctx.restore();
    }

    drawItemIcon(ctx, item, x, y, size, available = true) {
        ctx.save();
        ctx.globalAlpha = available ? 1 : 0.34;
        ctx.shadowColor = "rgba(255, 220, 120, .65)"; ctx.shadowBlur = 13;
        ctx.fillStyle = "rgba(30, 36, 75, .98)"; ctx.strokeStyle = "rgba(234, 218, 255, .9)"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(x, y, size / 2, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
        const image = ITEM_IMAGES[item.id];
        if (image?.complete && image.naturalWidth > 0) ctx.drawImage(image, x - size * .31, y - size * .31, size * .62, size * .62);
        else { ctx.font = `${size * .48}px Arial`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "#fff"; ctx.fillText(item.fallback, x, y + 1); }
        ctx.restore();
    }

    draw(ctx, bossManager, tokenAvailable = false) {
        this.tokenAvailable = tokenAvailable;
        if (this.roulette || this.reveal) {
            this.drawEvent(ctx);
            return;
        }
        this.drawTokenButton(ctx, tokenAvailable && !this.rewardItemId && !this.activeItemId);
        const visibleItemId = this.rewardItemId || this.activeItemId;
        if (!visibleItemId) return;
        const slot = this.getSlot();
        const item = ITEM_DEFINITIONS.find(candidate => candidate.id === visibleItemId);
        const spinning = false;
        const armed = item?.id === "shield" && this.shieldArmed;
        const hovered = this.hoveredItem === item?.id;
        ctx.save();
        ctx.shadowColor = armed ? "rgba(95,195,255,.9)" : "rgba(245,194,65,.85)";
        ctx.shadowBlur = spinning ? 20 + Math.sin(this.roulette.elapsed / 70) * 8 : hovered || armed ? 18 : 12;
        ctx.fillStyle = armed ? "rgba(34,104,145,.98)" : "rgba(24,31,65,.96)";
        ctx.strokeStyle = spinning ? "#ffe17d" : "rgba(255,220,120,.95)";
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(slot.x, slot.y, slot.size / 2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.shadowBlur = 0;
        const image = ITEM_IMAGES[item.id];
        if (image?.complete && image.naturalWidth > 0) {
            ctx.drawImage(image, slot.x - 17, slot.y - 17, 34, 34);
        } else {
            ctx.font = item.id === "switch" ? "25px Arial" : "23px Arial";
            ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "#fff";
            ctx.fillText(item.fallback, slot.x, slot.y + 1);
        }
        ctx.font = "bold 12px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "top"; ctx.fillStyle = "#fff";
        ctx.fillText(spinning ? "SORTEANDO ITEM" : item.label, slot.x, slot.y + slot.size / 2 + 8);
        if (this.hoveredItem === item.id) {
            const tooltipWidth = 238;
            const tooltipHeight = 58;
            const left = Math.min(
                Math.max(8, slot.x - tooltipWidth / 2),
                this.canvas.width - tooltipWidth - 8
            );
            const top = Math.min(
                this.canvas.height - tooltipHeight - 8,
                slot.y + slot.size / 2 + 30
            );
            ctx.fillStyle = "rgba(12, 16, 39, .96)";
            ctx.strokeStyle = "rgba(255, 220, 120, .88)";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(left, top, tooltipWidth, tooltipHeight, 10);
            else ctx.rect(left, top, tooltipWidth, tooltipHeight);
            ctx.fill(); ctx.stroke();
            ctx.textAlign = "center"; ctx.textBaseline = "top";
            ctx.fillStyle = "#ffe9a1"; ctx.font = "bold 13px Arial";
            ctx.fillText(item.label, left + tooltipWidth / 2, top + 8);
            ctx.fillStyle = "#fff"; ctx.font = "12px Arial";
            ctx.fillText(item.description, left + tooltipWidth / 2, top + 30);
        }
        ctx.restore();
    }
}
