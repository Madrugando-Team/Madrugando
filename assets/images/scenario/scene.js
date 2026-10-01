    export class Scene {

    render(ctx, w, h) {

        ctx.clearRect(0, 0, w, h);

        // Parede
        const wall = ctx.createLinearGradient(0, 0, 0, h);
        wall.addColorStop(0, "#232a44");
        wall.addColorStop(1, "#121a2e");

        ctx.fillStyle = wall;
        ctx.fillRect(0, 0, w, h);

        // Luz ambiente
        const ambientLight = ctx.createRadialGradient(
            w * 0.5, h * 0.4, 100,
            w * 0.5, h * 0.6, Math.max(w, h)
        );
        ambientLight.addColorStop(0, "rgba(255,255,255,0.08)");
        ambientLight.addColorStop(1, "rgba(0,0,0,0.25)");

        ctx.fillStyle = ambientLight;
        ctx.fillRect(0, 0, w, h);

        // Janela
        const windowX = w * 0.62;
        const windowY = 70;
        const windowW = 260;
        const windowH = 180;

        ctx.fillStyle = "#2a1c12";
        ctx.fillRect(windowX - 10, windowY - 10, windowW + 20, windowH + 20);

        const sky = ctx.createLinearGradient(windowX, windowY, windowX, windowY + windowH);
        sky.addColorStop(0, "#0b1630");
        sky.addColorStop(1, "#274a7a");

        ctx.fillStyle = sky;
        ctx.fillRect(windowX, windowY, windowW, windowH);

        ctx.fillStyle = "#fff6d0";
        ctx.beginPath();
        ctx.arc(windowX + 190, windowY + 55, 18, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "rgba(255,255,255,0.05)";
        ctx.beginPath();
        ctx.arc(windowX + 190, windowY + 55, 35, 0, Math.PI * 2);
        ctx.fill();

        for (let i = 0; i < 50; i++) {
            const x = windowX + ((i * 67) % windowW);
            const y = windowY + ((i * 43) % windowH);

            ctx.fillStyle = "rgba(255,255,255,0.7)";
            ctx.beginPath();
            ctx.arc(x, y, 1, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.strokeStyle = "#4d3623";
        ctx.lineWidth = 4;

        ctx.beginPath();
        ctx.moveTo(windowX + windowW / 2, windowY);
        ctx.lineTo(windowX + windowW / 2, windowY + windowH);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(windowX, windowY + windowH / 2);
        ctx.lineTo(windowX + windowW, windowY + windowH / 2);
        ctx.stroke();

        // Chão
        const floor = ctx.createLinearGradient(0, h - 200, 0, h);
        floor.addColorStop(0, "#4a3628");
        floor.addColorStop(1, "#2f2016");

        ctx.fillStyle = floor;
        ctx.fillRect(0, h - 200, w, 200);

        // Linhas do chão
        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        for (let x = 0; x < w; x += 55) {
            ctx.beginPath();
            ctx.moveTo(x, h - 200);
            ctx.lineTo(x + 10, h);
            ctx.stroke();
        }

        // Escrivaninha
        const deskX = 120;
        const deskY = h - 260;
        const deskWidth = 720;
        const deskHeight = 140;
        const deskTopHeight = 18;

        ctx.fillStyle = "rgba(0,0,0,0.18)";
        ctx.fillRect(deskX + 8, deskY + 8, deskWidth, deskHeight + 10);

        ctx.fillStyle = "#8B5A2B";
        ctx.fillRect(deskX, deskY, deskWidth, deskTopHeight);

        ctx.fillStyle = "#6E4420";
        ctx.fillRect(deskX, deskY + deskTopHeight, 35, deskHeight - deskTopHeight);
        ctx.fillRect(deskX + deskWidth - 35, deskY + deskTopHeight, 35, deskHeight - deskTopHeight);

        ctx.fillStyle = "#7A4A24";
        ctx.fillRect(deskX + 35, deskY + deskTopHeight, deskWidth - 70, 28);

        // Livro
        const bookWidth = 190;
        const bookX = deskX + (deskWidth - bookWidth) / 2;
        const bookY = deskY - 18;

        ctx.strokeStyle = "#F5F5F5";
        ctx.lineWidth = 12;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        ctx.beginPath();
        ctx.moveTo(bookX, bookY);
        ctx.lineTo(bookX + bookWidth * 0.25, bookY + 5);
        ctx.lineTo(bookX + bookWidth * 0.5 - 8, bookY + 10);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(bookX + bookWidth * 0.5 + 8, bookY + 10);
        ctx.lineTo(bookX + bookWidth * 0.75, bookY + 5);
        ctx.lineTo(bookX + bookWidth, bookY);
        ctx.stroke();

        ctx.strokeStyle = "#D8D8D8";
        ctx.lineWidth = 6;

        ctx.beginPath();
        ctx.moveTo(bookX + bookWidth / 2, bookY + 4);
        ctx.lineTo(bookX + bookWidth / 2, bookY + 16);
        ctx.stroke();
    }
}