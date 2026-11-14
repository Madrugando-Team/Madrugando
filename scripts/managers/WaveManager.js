export default class WaveManager {

    constructor() {

        this.currentWave = 1;
        this.wordsCorrect = 0;
        this.state = "playing";

    }

    wordCorrect(count = 1) {

        if (this.state !== "playing") {
            return;
        }

        this.wordsCorrect += Math.max(0, Math.floor(count));

        console.log(
            `Wave ${this.currentWave}: ${this.wordsCorrect} / ${this.getWordsRequired()}`
        );

        if (this.wordsCorrect >= this.getWordsRequired()) {

            this.startQuestion();

        }

    }

    // Palavras necessárias para concluir a onda:
    // 10 na primeira e +2 a cada onda (10, 12, 14, 16...)
    getWordsRequired() {

        const FIRST_WAVE_WORDS = 10;
        const WORDS_PER_WAVE = 2;

        return FIRST_WAVE_WORDS + ((this.currentWave - 1) * WORDS_PER_WAVE);

    }

    getProgress() {

        return this.wordsCorrect / this.getWordsRequired();

    }

    startQuestion() {

        this.state = "question";

        console.log(
            `Wave ${this.currentWave} concluída!`
        );


    }

    nextWave() {

        this.currentWave++;

        this.wordsCorrect = 0;

        this.state = "playing";

    }

    getWave() {

        return this.currentWave;

    }

    getWordsCorrect() {

        return this.wordsCorrect;

    }

    getState() {

        return this.state;

    }

    reset() {

        this.currentWave = 1;
        this.wordsCorrect = 0;
        this.state = "playing";

    }

}
