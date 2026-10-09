import { Boss } from "../entities/boss.js";
import { DifficultyConfig } from "./EnemySpawner.js";

export class BossManager {

    constructor() {

        this.boss = null;

        this.timeLimit = 45;
        this.timeRemaining = 45;
        this.timerActive = false;

    }

    getTimeLimit(difficulty) {

        return DifficultyConfig[difficulty]?.bossTime ?? 45;

    }

    startTimer(difficulty) {

        this.timeLimit = this.getTimeLimit(difficulty);
        this.timeRemaining = this.timeLimit;
        this.timerActive = true;

    }

    resetTimer() {

        this.timeRemaining = this.timeLimit;
        this.timerActive = true;

    }

    stopTimer() {

        this.timerActive = false;

    }

    getTimeRemaining() {

        return Math.ceil(this.timeRemaining);

    }

    isTimerExpired() {
        return this.boss !== null && this.timeRemaining <= 0;
    }

    spawn(category, difficulty = "medium") {

        this.boss = new Boss({

            x: 640,
            y: 150,
            category: category

        });

        this.boss.startIntro();

        this.startTimer(difficulty);

    }

    spawnCustom(questions, difficulty = "medium") {

        if (!questions || questions.length === 0)
            return;

        const question =
            questions[
                Math.floor(
                    Math.random() * questions.length
                )
            ];

        const randomizedQuestion =
            this.randomizeQuestion(question);

        this.boss = new Boss({

            x: 640,
            y: 150,
            question: randomizedQuestion

        });

        this.boss.startIntro();

        this.startTimer(difficulty);

    }

    randomizeQuestion(question) {

        const correctOption =
            question.options[question.correctAnswer];

        const options = [
            ...question.options
        ];

        for (
            let i = options.length - 1;
            i > 0;
            i--
        ) {

            const j =
                Math.floor(
                    Math.random() * (i + 1)
                );

            [
                options[i],
                options[j]
            ] = [
                options[j],
                options[i]
            ];

        }

        return {

            question: question.question,

            options: options,

            correctAnswer:
                options.indexOf(correctOption)

        };

    }

    update(deltaTime) {

        if (!this.boss)
            return;

        this.boss.update(deltaTime);

        if (
            !this.boss.isActive() ||
            !this.timerActive
        ) {
            return;
        }

        this.timeRemaining -= deltaTime / 1000;

        if (this.timeRemaining <= 0) {
            this.timeRemaining = 0;
            this.stopTimer();
        }

    }

    draw(ctx) {

        if (!this.boss)
            return;

        this.boss.draw(ctx);

    }

    drawTimer(ctx) {

        if (!this.boss || !this.boss.isActive())
            return;

        const seconds = this.getTimeRemaining();

        ctx.save();

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "bold 28px Arial";

        ctx.fillStyle =
            seconds <= 10 ? "#ff4d4d" : "#ffffff";

        ctx.fillText(
            `${seconds}s`,
            ctx.canvas.width / 2,
            210
        );

        ctx.restore();

    }

    hasBoss() {

        return this.boss !== null;

    }

    removeBoss() {

        this.stopTimer();
        this.boss = null;

    }

    handleClick(mouseX, mouseY) {

        if (!this.boss || !this.timerActive)
            return null;

        return this.boss.handleClick(
            mouseX,
            mouseY
        );

    }

    handleKeyDown(event) {

        if (!this.boss || !this.timerActive)
            return null;

        return this.boss.handleKeyDown(event);

    }

    handleWheel(deltaY, mouseX, mouseY) {

        if (!this.boss)
            return;

        this.boss.handleWheel(
            deltaY,
            mouseX,
            mouseY
        );

    }

    handleMouseDown(mouseX, mouseY) {

        if (!this.boss)
            return;

        this.boss.handleMouseDown(
            mouseX,
            mouseY
        );

    }

    handleMouseMove(mouseX, mouseY) {

        if (!this.boss)
            return;

        this.boss.handleMouseMove(
            mouseX,
            mouseY
        );

    }

    handleMouseUp() {

        if (!this.boss)
            return;

        this.boss.handleMouseUp();

    }

}