import { Boss, getQuestionsForCategory } from "../entities/boss.js";
import { DifficultyConfig } from "./EnemySpawner.js";

export class BossManager {

    constructor() {

        this.boss = null;
        this.customQuestions = null;
        this.questionCycles = new Map();
        this.activeQuestionPool = [];
        this.activeQuestionPoolKey = null;

        this.timeLimit = 45;
        this.timeRemaining = 45;
        this.timerActive = false;


        this.timeoutRevealActive = false;
        this.timeoutRevealTimer = 0;
        this.timeoutRevealDuration = 2000;
        this.timeoutRevealFinished = false;
    }

    getTimeLimit(difficulty) {

        return DifficultyConfig[difficulty]?.bossTime ?? 45;

    }

    startTimer(difficulty) {

        this.timeLimit = this.getTimeLimit(difficulty);
        this.timeRemaining = this.timeLimit;
        this.timerActive = true;

    }

    startTimeoutReveal() {
        if (!this.boss || this.timeoutRevealActive) {
            return false;
        }

        this.stopTimer();

        this.timeoutRevealActive = true;
        this.timeoutRevealFinished = false;
        this.timeoutRevealTimer = this.timeoutRevealDuration;

        this.boss.revealCorrectAnswer();

        return true;
    }

    updateTimeoutReveal(deltaTime) {
        if (!this.timeoutRevealActive) return;

        this.timeoutRevealTimer -= deltaTime;

        if (this.timeoutRevealTimer <= 0) {
            this.timeoutRevealTimer = 0;
            this.timeoutRevealActive = false;
            this.timeoutRevealFinished = true;
        }
    }

    resetTimer() {

        this.timeRemaining = this.timeLimit;
        this.timerActive = true;

    }

    stopTimer() {

        this.timerActive = false;

    }

    resumeTimer() {
        if (this.boss && this.timeRemaining > 0 && !this.timeoutRevealActive) {
            this.timerActive = true;
        }
    }

    getTimeRemaining() {

        return Math.ceil(this.timeRemaining);

    }

    isTimerExpired() {
        return this.boss !== null && this.timeRemaining <= 0;
    }

    addTime(seconds) {
        if (!this.boss || !this.timerActive || seconds <= 0) return false;
        this.timeRemaining += seconds;
        return true;
    }

    eliminateWrongOption() {
        if (!this.boss || !this.timerActive) return false;
        return this.boss.eliminateWrongOption();
    }

    canEliminateWrongOption() {
        return Boolean(
            this.boss &&
            this.timerActive &&
            this.boss.canEliminateWrongOption()
        );
    }

    canSwitchQuestion() {
        if (!this.boss || !this.timerActive) return false;
        return this.hasAlternativeQuestion();
    }

    switchQuestion() {
        if (!this.canSwitchQuestion()) return false;
        const question = this.drawQuestion(
            this.activeQuestionPoolKey,
            this.activeQuestionPool,
            this.getQuestionKey(this.boss.question)
        );
        if (!question) return false;
        return this.boss.setQuestion(
            this.randomizeQuestion(question),
            this.customQuestions ? null : this.boss.questionCategory
        );
    }

    resetQuestionCycles() {
        this.questionCycles.clear();
        this.activeQuestionPool = [];
        this.activeQuestionPoolKey = null;
    }

    getQuestionKey(question) {
        return String(question?.question ?? "")
            .normalize("NFC")
            .trim()
            .replace(/\s+/g, " ")
            .toLocaleLowerCase("pt-BR");
    }

    shuffleQuestions(questions) {
        const shuffled = [...questions];
        for (let index = shuffled.length - 1; index > 0; index--) {
            const other = Math.floor(Math.random() * (index + 1));
            [shuffled[index], shuffled[other]] = [shuffled[other], shuffled[index]];
        }
        return shuffled;
    }

    getQuestionCycle(poolKey, questions) {
        const uniqueQuestions = [...new Map(
            questions.map(question => [this.getQuestionKey(question), question])
        ).values()];
        const signature = uniqueQuestions
            .map(question => this.getQuestionKey(question))
            .sort()
            .join("\u001f");
        let cycle = this.questionCycles.get(poolKey);
        if (!cycle || cycle.signature !== signature) {
            cycle = { signature, source: uniqueQuestions, remaining: [], lastKey: null };
            this.questionCycles.set(poolKey, cycle);
        }
        return cycle;
    }

    refillQuestionCycle(cycle, excludedKey = null) {
        cycle.remaining = this.shuffleQuestions(cycle.source);
        if (cycle.remaining.length > 1 && cycle.lastKey) {
            const firstKey = this.getQuestionKey(cycle.remaining[0]);
            if (firstKey === cycle.lastKey || firstKey === excludedKey) {
                const alternateIndex = cycle.remaining.findIndex(question => {
                    const key = this.getQuestionKey(question);
                    return key !== cycle.lastKey && key !== excludedKey;
                });
                if (alternateIndex > 0) {
                    [cycle.remaining[0], cycle.remaining[alternateIndex]] =
                        [cycle.remaining[alternateIndex], cycle.remaining[0]];
                }
            }
        }
    }

    drawQuestion(poolKey, questions, excludedKey = null) {
        if (!poolKey || !Array.isArray(questions) || questions.length === 0) return null;
        const cycle = this.getQuestionCycle(poolKey, questions);
        if (!cycle.source.length) return null;
        if (!cycle.remaining.length) this.refillQuestionCycle(cycle, excludedKey);

        if (excludedKey) {
            cycle.remaining = cycle.remaining.filter(
                question => this.getQuestionKey(question) !== excludedKey
            );
        }

        if (!cycle.remaining.length && excludedKey) {
            // A pergunta atual já saiu neste ciclo. Ao recarregá-lo para o
            // Switch, pulamos a atual e deixamos as demais antes da repetição.
            if (cycle.source.length < 2) return null;
            this.refillQuestionCycle(cycle, excludedKey);
            cycle.remaining = cycle.remaining.filter(
                question => this.getQuestionKey(question) !== excludedKey
            );
        }
        if (!cycle.remaining.length) return null;

        const [question] = cycle.remaining.splice(
            Math.floor(Math.random() * cycle.remaining.length),
            1
        );
        cycle.lastKey = this.getQuestionKey(question);
        return question;
    }

    hasAlternativeQuestion() {
        if (!this.boss || !this.activeQuestionPoolKey) return false;
        return this.activeQuestionPool.some(
            question => this.getQuestionKey(question) !== this.getQuestionKey(this.boss.question)
        );
    }

    spawn(category, difficulty = "medium") {

        this.customQuestions = null;
        this.activeQuestionPool = getQuestionsForCategory(category);
        this.activeQuestionPoolKey = `base:${category ?? "all"}`;
        const question = this.drawQuestion(
            this.activeQuestionPoolKey,
            this.activeQuestionPool
        );

        this.boss = new Boss({

            x: 640,
            y: 150,
            category: category,
            question

        });

        this.boss.startIntro();

        this.startTimer(difficulty);

    }

    spawnCustom(questions, difficulty = "medium", poolKey = "custom") {

        if (!questions || questions.length === 0)
            return;

        this.customQuestions = questions;
        this.activeQuestionPool = questions;
        this.activeQuestionPoolKey = `custom:${poolKey}`;
        const question = this.drawQuestion(
            this.activeQuestionPoolKey,
            questions
        );

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
        if (!this.boss) {
            return;
        }

        this.boss.update(deltaTime);

        if (this.timeoutRevealActive) {
            this.updateTimeoutReveal(deltaTime);
            return;
        }

        if (!this.boss.isActive() || !this.timerActive) {
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

        this.timeoutRevealActive = false;
        this.timeoutRevealFinished = false;
        this.timeoutRevealTimer = 0;

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
