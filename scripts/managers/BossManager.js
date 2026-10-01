import { Boss } from "../entities/boss.js";

export class BossManager {

    constructor() {

        this.boss = null;

    }

    spawn(category) {

        this.boss = new Boss({

            x: 640,
            y: 150,

            category: category

        });

        this.boss.startIntro();

    }

    spawnCustom(questions) {

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

    }

    draw(ctx) {

        if (!this.boss)
            return;

        this.boss.draw(ctx);

    }

    hasBoss() {

        return this.boss !== null;

    }

    removeBoss() {

        this.boss = null;

    }

    handleClick(mouseX, mouseY) {

        if (!this.boss)
            return null;

        return this.boss.handleClick(
            mouseX,
            mouseY
        );

    }

    handleKeyDown(event) {

        if (!this.boss)
            return null;

        return this.boss.handleKeyDown(
            event
        );

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