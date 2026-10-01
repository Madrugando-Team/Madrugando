import ScienceQuestions from "../data/questions/science/questions.js";
import EnglishQuestions from "../data/questions/english/questions.js";
import PortugueseQuestions from "../data/questions/portuguese/questions.js";
import GeographyQuestions from "../data/questions/geography/questions.js";
import HistoryQuestions from "../data/questions/history/questions.js";

const Questions = {
    science: ScienceQuestions,
    english: EnglishQuestions,
    portuguese: PortugueseQuestions,
    geography: GeographyQuestions,
    history: HistoryQuestions
};

export class Boss {

    constructor({ x, y, category, question }) {

        this.x = x;
        this.y = y;
        this.category = category;

        this.question =
            question ??
            this.getRandomQuestion();

        this.alive = true;
        this.active = false;
        this.fade = 0;

        this.introStarted = false;
        this.introFinished = false;

        this.optionRects = [];
        this.wrongOptions = new Set();

        this.selectedOption = 0;
        this.hoveredOption = null;

        this.questionScroll = 0;
        this.questionScrollMax = 0;
        this.questionScrollArea = null;

        this.optionScrolls = [];
        this.optionScrollData = [];

        this.draggingScrollbar = null;
        this.scrollDragOffset = 0;
        this.suppressNextClick = false;
    }

    getRandomQuestion() {

        const questions =
            Questions[this.category];

        const index =
            Math.floor(
                Math.random() * questions.length
            );

        return questions[index];
    }

    startIntro() {

        if (this.introStarted)
            return;

        this.introStarted = true;

        const sound =
            new Audio("../assets/sounds/boss.mp3");

        sound.play();
    }

    update(deltaTime) {

        if (!this.introStarted)
            return;

        if (!this.introFinished) {

            this.fade +=
                0.02 * (deltaTime / 16);

            if (this.fade >= 1) {

                this.fade = 1;
                this.introFinished = true;
                this.active = true;
            }
        }
    }

    wrapText(ctx, text, maxWidth) {

        const words = text.split(" ");
        const lines = [];
        let currentLine = "";

        for (const word of words) {

            const testLine =
                currentLine === ""
                    ? word
                    : `${currentLine} ${word}`;

            const width =
                ctx.measureText(testLine).width;

            if (
                width > maxWidth &&
                currentLine !== ""
            ) {

                lines.push(currentLine);
                currentLine = word;

            } else {

                currentLine = testLine;
            }
        }

        if (currentLine !== "")
            lines.push(currentLine);

        return lines;
    }

    drawScrollbar(ctx, x, y, width, height, contentHeight, scroll, maxScroll) {

        if (maxScroll <= 0)
            return;

        const barWidth = 6;

        const trackX =
            x + width - barWidth - 6;

        const trackY = y + 6;

        const trackHeight =
            height - 12;

        ctx.fillStyle =
            "rgba(120, 130, 180, 0.15)";

        ctx.beginPath();

        ctx.roundRect(
            trackX,
            trackY,
            barWidth,
            trackHeight,
            3
        );

        ctx.fill();

        const thumbHeight =
            Math.max(
                25,
                trackHeight *
                (height / contentHeight)
            );

        const availableTrack =
            trackHeight - thumbHeight;

        const thumbY =
            trackY +
            (scroll / maxScroll) *
            availableTrack;

        ctx.fillStyle =
            "rgba(160, 170, 230, 0.55)";

        ctx.beginPath();

        ctx.roundRect(
            trackX,
            thumbY,
            barWidth,
            thumbHeight,
            3
        );

        ctx.fill();
    }

    draw(ctx) {

        if (!this.introStarted)
            return;

        if (this.fade > 0) {

            ctx.fillStyle =
                `rgba(5, 8, 20, ${this.fade * 0.85})`;

            ctx.fillRect(
                0,
                0,
                ctx.canvas.width,
                ctx.canvas.height
            );
        }

        if (!this.active)
            return;

        const centerX =
            ctx.canvas.width / 2;

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.font = "bold 28px Arial";
        ctx.fillStyle = "#f5f3ff";

        ctx.fillText(
            "BOSS",
            centerX,
            250
        );

        ctx.font = "20px Arial";

        const questionMaxWidth = 800;

        const questionLines =
            this.wrapText(
                ctx,
                this.question.question,
                questionMaxWidth
            );

        const questionLineHeight = 28;
        const questionPadding = 30;

        const questionContentHeight =
            questionLines.length *
            questionLineHeight +
            questionPadding * 2;

        const questionVisibleHeight = 160;
        const boxWidth = 860;

        const boxX =
            centerX - boxWidth / 2;

        const boxY = 300;

        const questionBoxHeight =
            Math.min(
                questionContentHeight,
                questionVisibleHeight
            );

        this.questionScrollMax =
            Math.max(
                0,
                questionContentHeight -
                questionVisibleHeight
            );

        ctx.fillStyle =
            "rgba(15, 20, 45, 0.95)";

        ctx.strokeStyle =
            "rgba(160, 170, 230, 0.35)";

        ctx.lineWidth = 2;

        ctx.beginPath();

        ctx.roundRect(
            boxX,
            boxY,
            boxWidth,
            questionBoxHeight,
            14
        );

        ctx.fill();
        ctx.stroke();

        const questionInnerX =
            boxX + questionPadding;

        const questionInnerY =
            boxY + questionPadding;

        const questionInnerWidth =
            boxWidth - questionPadding * 2;

        const questionInnerHeight =
            questionBoxHeight -
            questionPadding * 2;

        this.questionScrollArea = {
            x: boxX,
            y: boxY,
            width: boxWidth,
            height: questionBoxHeight
        };

        ctx.save();

        ctx.beginPath();

        ctx.rect(
            questionInnerX,
            questionInnerY,
            questionInnerWidth,
            questionInnerHeight
        );

        ctx.clip();

        ctx.font = "20px Arial";
        ctx.fillStyle = "#f5f3ff";

        const questionStartY =
            questionInnerY +
            questionLineHeight / 2 -
            this.questionScroll;

        questionLines.forEach(
            (line, index) => {

                ctx.fillText(
                    line,
                    centerX,
                    questionStartY +
                    index * questionLineHeight
                );
            }
        );

        ctx.restore();

        this.drawScrollbar(
            ctx,
            boxX,
            boxY,
            boxWidth,
            questionBoxHeight,
            questionContentHeight,
            this.questionScroll,
            this.questionScrollMax
        );

        ctx.font = "17px Arial";

        const optionMaxWidth = 340;
        const optionPadding = 20;
        const gap = 12;

        const optionWidth =
            optionMaxWidth +
            optionPadding * 2;

        const totalWidth =
            optionWidth * 2 +
            gap;

        const startX =
            centerX -
            totalWidth / 2;

        const startY =
            boxY +
            questionBoxHeight +
            25;

        const inputBarSpace = 70;
        const inputBarGap = 10;

        const optionsBottomLimit =
            ctx.canvas.height -
            inputBarSpace -
            inputBarGap;

        const rowGap = 12;

        const availableOptionsHeight =
            optionsBottomLimit -
            startY -
            rowGap;

        const optionMaxHeight =
            Math.max(
                50,
                Math.floor(
                    availableOptionsHeight / 2
                )
            );

        const optionData = [];

        this.question.options.forEach(
            (option, index) => {

                const lines =
                    this.wrapText(
                        ctx,
                        option,
                        optionMaxWidth - 15
                    );

                const lineHeight = 24;

                const contentHeight =
                    lines.length *
                    lineHeight +
                    optionPadding * 2;

                const visibleHeight =
                    Math.min(
                        contentHeight,
                        optionMaxHeight
                    );

                const maxScroll =
                    Math.max(
                        0,
                        contentHeight -
                        visibleHeight
                    );

                optionData.push({
                    option,
                    index,
                    lines,
                    contentHeight,
                    visibleHeight,
                    maxScroll
                });
            }
        );

        if (
            this.optionScrolls.length !==
            this.question.options.length
        ) {

            this.optionScrolls =
                new Array(
                    this.question.options.length
                ).fill(0);
        }

        optionData.forEach(
            data => {

                const index = data.index;

                this.optionScrolls[index] =
                    Math.max(
                        0,
                        Math.min(
                            data.maxScroll,
                            this.optionScrolls[index] || 0
                        )
                    );
            }
        );

        const rowHeights = [];

        optionData.forEach(
            data => {

                const row =
                    Math.floor(
                        data.index / 2
                    );

                if (
                    !rowHeights[row] ||
                    data.visibleHeight >
                    rowHeights[row]
                ) {

                    rowHeights[row] =
                        data.visibleHeight;
                }
            }
        );

        this.optionRects = [];
        this.optionScrollData = [];

        let currentY = startY;
        let currentRow = 0;

        for (
            let i = 0;
            i < optionData.length;
            i += 2
        ) {

            const rowHeight =
                rowHeights[currentRow];

            for (
                let column = 0;
                column < 2;
                column++
            ) {

                const data =
                    optionData[i + column];

                if (!data)
                    continue;

                const x =
                    startX +
                    column *
                    (optionWidth + gap);

                const y = currentY;

                const availableHeight =
                    Math.max(
                        0,
                        optionsBottomLimit - y
                    );

                const visibleHeight =
                    Math.min(
                        rowHeight,
                        availableHeight
                    );

                if (visibleHeight <= 0)
                    continue;

                this.optionRects.push({
                    x,
                    y,
                    width: optionWidth,
                    height: visibleHeight,
                    index: data.index
                });

                const scrollData = {
                    index: data.index,
                    x,
                    y,
                    width: optionWidth,
                    height: visibleHeight,
                    contentHeight: data.contentHeight,
                    maxScroll: data.maxScroll
                };

                this.optionScrollData.push(
                    scrollData
                );

                const isSelected =
                    this.selectedOption ===
                        data.index &&
                    !this.wrongOptions.has(
                        data.index
                    );

                const scale =
                    isSelected
                        ? 1.03
                        : 1;

                const drawX =
                    x + optionWidth / 2;

                const drawY =
                    y + visibleHeight / 2;

                ctx.save();

                ctx.translate(
                    drawX,
                    drawY
                );

                ctx.scale(
                    scale,
                    scale
                );

                ctx.translate(
                    -drawX,
                    -drawY
                );

                if (
                    this.wrongOptions.has(
                        data.index
                    )
                ) {

                    ctx.fillStyle =
                        "rgba(180, 45, 45, 0.95)";

                    ctx.strokeStyle =
                        "rgba(230, 100, 100, 0.5)";

                    ctx.lineWidth = 2;

                } else if (isSelected) {

                    ctx.fillStyle =
                        "rgba(65, 82, 125, 1)";

                    ctx.strokeStyle =
                        "rgba(190, 200, 255, 0.95)";

                    ctx.lineWidth = 3;

                } else {

                    ctx.fillStyle =
                        "rgba(35, 59, 83, 0.95)";

                    ctx.strokeStyle =
                        "rgba(160, 170, 230, 0.35)";

                    ctx.lineWidth = 2;
                }

                ctx.beginPath();

                ctx.roundRect(
                    x,
                    y,
                    optionWidth,
                    visibleHeight,
                    10
                );

                ctx.fill();
                ctx.stroke();

                ctx.save();

                ctx.beginPath();

                ctx.rect(
                    x,
                    y,
                    optionWidth,
                    visibleHeight
                );

                ctx.clip();

                ctx.font = "17px Arial";
                ctx.fillStyle = "#f5f3ff";

                const textStartY =
                    y +
                    optionPadding +
                    12 -
                    this.optionScrolls[data.index];

                data.lines.forEach(
                    (line, lineIndex) => {

                        ctx.fillText(
                            line,
                            x + optionWidth / 2,
                            textStartY +
                            lineIndex * 24
                        );
                    }
                );

                ctx.restore();

                this.drawScrollbar(
                    ctx,
                    x,
                    y,
                    optionWidth,
                    visibleHeight,
                    data.contentHeight,
                    this.optionScrolls[data.index],
                    data.maxScroll
                );

                ctx.restore();
            }

            currentY +=
                rowHeight + gap;

            currentRow++;
        }

        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
    }

    handleClick(mouseX, mouseY) {

        if (!this.active)
            return null;

        if (this.suppressNextClick) {

            this.suppressNextClick =
                false;

            return null;
        }

        for (const option of this.optionRects) {

            if (
                mouseX >= option.x &&
                mouseX <=
                    option.x + option.width &&
                mouseY >= option.y &&
                mouseY <=
                    option.y + option.height
            ) {

                if (
                    this.wrongOptions.has(
                        option.index
                    )
                ) {

                    return null;
                }

                this.selectedOption =
                    option.index;

                if (
                    option.index ===
                    this.question.correctAnswer
                ) {

                    console.log(
                        "Resposta correta!"
                    );

                    this.kill();

                    return {
                        result: "correct"
                    };
                }

                console.log(
                    "Resposta incorreta!"
                );

                this.wrongOptions.add(
                    option.index
                );

                this.selectNextOption(1);

                return {
                    result: "wrong"
                };
            }
        }

        return null;
    }

    selectNextOption(direction) {

        if (!this.active)
            return;

        const total =
            this.question.options.length;

        if (total === 0)
            return;

        let index =
            this.selectedOption;

        for (let i = 0; i < total; i++) {

            index += direction;

            if (index >= total)
                index = 0;

            if (index < 0)
                index = total - 1;

            if (!this.wrongOptions.has(index)) {

                this.selectedOption =
                    index;

                return;
            }
        }
    }

    moveVertical(direction) {

        if (!this.active)
            return;

        const current =
            this.selectedOption;

        const target =
            current < 2
                ? current + 2
                : current - 2;

        if (
            !this.wrongOptions.has(
                target
            )
        ) {

            this.selectedOption =
                target;

            return;
        }

        const rowMate =
            current % 2 === 0
                ? current + 1
                : current - 1;

        if (
            rowMate >= 0 &&
            rowMate <
                this.question.options.length &&
            !this.wrongOptions.has(
                rowMate
            )
        ) {

            this.selectedOption =
                rowMate;

            return;
        }

        for (
            let i = 0;
            i < this.question.options.length;
            i++
        ) {

            if (
                !this.wrongOptions.has(i)
            ) {

                this.selectedOption = i;
                return;
            }
        }
    }

    handleKeyDown(event) {

        if (!this.active)
            return null;

        if (event.key === "ArrowLeft") {

            this.selectNextOption(-1);

            event.preventDefault();

            return null;
        }

        if (event.key === "ArrowRight") {

            this.selectNextOption(1);

            event.preventDefault();

            return null;
        }

        if (event.key === "ArrowUp") {

            this.moveVertical("up");

            event.preventDefault();

            return null;
        }

        if (event.key === "ArrowDown") {

            this.moveVertical("down");

            event.preventDefault();

            return null;
        }

        if (event.key === "Enter") {

            event.preventDefault();

            return this.confirmSelectedOption();
        }

        return null;
    }

    confirmSelectedOption() {

        if (!this.active)
            return null;

        const index =
            this.selectedOption;

        if (
            this.wrongOptions.has(index)
        ) {

            return null;
        }

        if (
            index ===
            this.question.correctAnswer
        ) {

            this.kill();

            return {
                result: "correct"
            };
        }

        this.wrongOptions.add(index);

        this.selectNextOption(1);

        return {
            result: "wrong"
        };
    }

    handleWheel(deltaY, mouseX, mouseY) {

        if (!this.active)
            return;

        if (
            this.questionScrollArea &&
            mouseX >=
                this.questionScrollArea.x &&
            mouseX <=
                this.questionScrollArea.x +
                this.questionScrollArea.width &&
            mouseY >=
                this.questionScrollArea.y &&
            mouseY <=
                this.questionScrollArea.y +
                this.questionScrollArea.height
        ) {

            this.questionScroll =
                Math.max(
                    0,
                    Math.min(
                        this.questionScrollMax,
                        this.questionScroll +
                        deltaY
                    )
                );

            return;
        }

        for (
            const option
            of this.optionScrollData
        ) {

            if (
                mouseX >= option.x &&
                mouseX <=
                    option.x + option.width &&
                mouseY >= option.y &&
                mouseY <=
                    option.y + option.height
            ) {

                const index =
                    option.index;

                this.optionScrolls[index] =
                    Math.max(
                        0,
                        Math.min(
                            option.maxScroll,
                            this.optionScrolls[index] +
                            deltaY
                        )
                    );

                return;
            }
        }
    }

    handleMouseDown(mouseX, mouseY) {

        if (!this.active)
            return;

        if (
            this.isInsideScrollbar(
                mouseX,
                mouseY,
                this.questionScrollArea,
                this.questionScroll,
                this.questionScrollMax
            )
        ) {

            this.draggingScrollbar = {
                type: "question"
            };

            this.suppressNextClick = true;

            return;
        }

        for (
            const option
            of this.optionScrollData
        ) {

            if (
                option.maxScroll <= 0
            ) {

                continue;
            }

            if (
                this.isInsideScrollbar(
                    mouseX,
                    mouseY,
                    option,
                    this.optionScrolls[
                        option.index
                    ],
                    option.maxScroll
                )
            ) {

                this.draggingScrollbar = {
                    type: "option",
                    index: option.index
                };

                this.suppressNextClick = true;

                return;
            }
        }
    }

    handleMouseUp() {

        this.draggingScrollbar =
            null;
    }

    handleMouseMove(mouseX, mouseY) {

        if (!this.draggingScrollbar) {

            this.hoveredOption = null;

            for (const option of this.optionRects) {

                if (
                    mouseX >= option.x &&
                    mouseX <=
                        option.x + option.width &&
                    mouseY >= option.y &&
                    mouseY <=
                        option.y + option.height
                ) {

                    if (
                        !this.wrongOptions.has(
                            option.index
                        )
                    ) {

                        this.hoveredOption =
                            option.index;

                        this.selectedOption =
                            option.index;
                    }

                    break;
                }
            }

            return;
        }

        if (
            this.draggingScrollbar.type ===
            "question"
        ) {

            const area =
                this.questionScrollArea;

            if (
                !area ||
                this.questionScrollMax <= 0
            ) {

                return;
            }

            const contentHeight =
                area.height +
                this.questionScrollMax;

            this.questionScroll =
                this.calculateScrollbarScroll(
                    mouseY,
                    area,
                    contentHeight,
                    this.questionScrollMax
                );

            return;
        }

        const index =
            this.draggingScrollbar.index;

        const area =
            this.optionScrollData.find(
                item =>
                    item.index === index
            );

        if (
            !area ||
            area.maxScroll <= 0
        ) {

            return;
        }

        this.optionScrolls[index] =
            this.calculateScrollbarScroll(
                mouseY,
                area,
                area.contentHeight,
                area.maxScroll
            );
    }

    calculateScrollbarScroll(mouseY, area, contentHeight, maxScroll) {

        const trackHeight =
            area.height - 12;

        const thumbHeight =
            Math.max(
                25,
                trackHeight *
                (area.height / contentHeight)
            );

        const availableTrack =
            trackHeight -
            thumbHeight;

        if (availableTrack <= 0)
            return 0;

        const trackY =
            area.y + 6;

        let position =
            mouseY -
            trackY -
            thumbHeight / 2;

        position =
            Math.max(
                0,
                Math.min(
                    availableTrack,
                    position
                )
            );

        return (
            position /
            availableTrack
        ) * maxScroll;
    }

    isInsideScrollbar(mouseX, mouseY, area, scroll, maxScroll) {

        if (
            !area ||
            maxScroll <= 0
        ) {

            return false;
        }

        const barWidth = 6;

        const trackX =
            area.x +
            area.width -
            barWidth -
            6;

        const trackY =
            area.y + 6;

        const trackHeight =
            area.height - 12;

        const contentHeight =
            area.height +
            maxScroll;

        const thumbHeight =
            Math.max(
                25,
                trackHeight *
                (area.height / contentHeight)
            );

        const availableTrack =
            trackHeight -
            thumbHeight;

        if (availableTrack <= 0)
            return false;

        const thumbY =
            trackY +
            (scroll / maxScroll) *
            availableTrack;

        return (
            mouseX >= trackX - 5 &&
            mouseX <=
                trackX + barWidth + 5 &&
            mouseY >= thumbY &&
            mouseY <=
                thumbY + thumbHeight
        );
    }

    kill() {

        this.alive = false;
        this.active = false;
    }

    isDead() {
        return !this.alive;
    }

    isActive() {
        return this.active;
    }
}