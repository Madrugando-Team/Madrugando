export class InputBar {

    constructor(inputManager, canvas) {

        this.inputManager = inputManager;

        this.canvas = canvas;

        this.height = 75;

        this.cursorVisible = true;

        this.cursorTimer = 0;

    }


    update(deltaTime) {

        this.cursorTimer += deltaTime;


        if (this.cursorTimer >= 500) {

            this.cursorVisible =
                !this.cursorVisible;

            this.cursorTimer = 0;

        }

    }


    getRainbowColor() {

        const colors = [
            "#FF4D6D",
            "#FF9F43",
            "#FFE66D",
            "#4DFF88",
            "#4DDFFF",
            "#8A7CFF"
        ];


        return colors[
            Math.floor(Date.now() / 50) % colors.length
        ];

    }


    draw(ctx) {

        const y =
            this.canvas.height - this.height;


        const gradient =
            ctx.createLinearGradient(
                0,
                y,
                0,
                this.canvas.height
            );


        gradient.addColorStop(
            0,
            "#171d3d"
        );


        gradient.addColorStop(
            1,
            "#0b1027"
        );


        ctx.fillStyle = gradient;


        ctx.fillRect(
            0,
            y,
            this.canvas.width,
            this.height
        );

        const state =
            this.inputManager.getState();


        let glowColor =
            "rgba(130, 125, 255, 0.35)";


        if (state === "success") {

            glowColor =
                "rgba(50, 255, 120, 0.65)";

        }


        if (state === "error") {

            glowColor =
                "rgba(255, 60, 70, 0.65)";

        }


        if (state === "combo") {

            glowColor = this.getRainbowColor();

        }


        ctx.shadowColor =
            glowColor;

        ctx.shadowBlur = 12;


        ctx.strokeStyle =
            glowColor;

        ctx.lineWidth = 2;


        ctx.beginPath();

        ctx.moveTo(
            0,
            y
        );

        ctx.lineTo(
            this.canvas.width,
            y
        );

        ctx.stroke();


        ctx.shadowBlur = 0;

        const text =
            this.inputManager.getInput();


        ctx.font =
            "28px Arial";


        ctx.textBaseline =
            "middle";


        let textColor =
            "#e9e7ff";


        switch (state) {

            case "success":

                textColor =
                    "#4DFF88";

                break;


            case "combo":

                textColor =
                    this.getRainbowColor();

                break;


            case "error":

                textColor =
                    "#FF5364";

                break;


            default:

                textColor =
                    "#e9e7ff";

                break;

        }

        ctx.shadowColor =
            textColor;

        ctx.shadowBlur =
            state === "normal"
                ? 4
                : 12;


        ctx.fillStyle =
            textColor;


        ctx.fillText(
            text,
            28,
            y + this.height / 2
        );


        ctx.shadowBlur = 0;

        if (this.cursorVisible) {

            const x =
                28 +
                ctx.measureText(text).width;


            ctx.fillStyle =
                textColor;


            ctx.shadowColor =
                textColor;

            ctx.shadowBlur = 8;


            ctx.fillRect(
                x + 5,
                y + 21,
                2,
                32
            );


            ctx.shadowBlur = 0;

        }

        ctx.textBaseline =
            "alphabetic";

    }

}


export default InputBar;