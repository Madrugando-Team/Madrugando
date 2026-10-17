
import { Enemy } from "./enemy.js";
import { getWordsByCategory } from "../data/wordpools.js";

export function createScromblus(x, y, config) {

    const {
        category = "science",
        speed = 1.1,
        poolLevel = "medium",
        customDictionary,
        scoreManager
    } = config;

    // Utiliza o dicionário personalizado ou
    // busca palavras da matéria selecionada.
    // A categoria "all" reúne todas as matérias.
    const pool = customDictionary
        ? customDictionary
        : getWordsByCategory(category, poolLevel);

    // Verifica se existem palavras disponíveis.
    if (!Array.isArray(pool) || pool.length === 0) {
        console.error(
            `Nenhuma palavra encontrada para ${category} (${poolLevel})`
        );
        return null;
    }

    // Remove palavras duplicadas.
    const uniqueWords = [
        ...new Set(
            pool.filter(
                word => typeof word === "string" && word.trim()
            )
        )
    ];

    // O Scromblus precisa de 3 palavras diferentes.
    if (uniqueWords.length < 3) {
        console.warn(
            "O Scromblus precisa de pelo menos 3 palavras diferentes."
        );
        return null;
    }

    // Embaralha as palavras usando Fisher-Yates.
    const shuffledPool = [...uniqueWords];

    for (let i = shuffledPool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        [shuffledPool[i], shuffledPool[j]] =
            [shuffledPool[j], shuffledPool[i]];
    }

    // Seleciona 3 palavras.
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

        // Completou as 3 palavras.
        if (this.currentWordIndex >= this.words.length) {

            scoreManager?.gainLife(1);

            this.kill();

            return true;
        }

        // Avança para a próxima palavra.
        this.word = this.words[this.currentWordIndex];

        return false;
    };

    return scromblus;
}
