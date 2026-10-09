import { Enemy } from "./enemy.js";
import WordPools from "../data/wordpools.js";

export function createScromblus(x, y, config) {

    const {
        category = "science",
        speed = 1.1,
        poolLevel = "medium",
        customDictionary,
        scoreManager
    } = config;

    const pool = customDictionary
        ? customDictionary
        : WordPools.boo[category][poolLevel];

    const shuffledPool = [...pool]
        .sort(() => Math.random() - 0.5);

    const words = shuffledPool.slice(0, 3);

    const scromblus = new Enemy({
        x,
        y,
        word: words[0],
        speed,
        type: "scromblus"
    });

    scromblus.words = words;
    scromblus.currentWordIndex = 0;

    scromblus.advanceWord = function () {

        this.currentWordIndex++;

        if (this.currentWordIndex >= this.words.length) {

            scoreManager?.gainLife(1);

            this.kill();

            return true;
        }

        this.word = this.words[this.currentWordIndex];

        return false;
    };

    return scromblus;
}