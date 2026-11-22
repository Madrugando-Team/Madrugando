
import { Enemy, BOO_VARIANT_COUNT } from "./enemy.js";
import {
    getWordsByCategory,
    getRandomWordLevel,
    getRandomCustomWord,
    getCustomWordsForLevels
} from "../data/wordpools.js";

export function createBoo(x, y, config) {

    const {
        category,
        difficulty,
        poolLevel,
        speed,
        customDictionary,
        forcedWordLevel,
        type = "boo"
    } = config;

    // Prioriza o dicionário personalizado.
    // Caso contrário, busca as palavras da matéria
    // selecionada ou de todas as matérias.
    let word;
    if (customDictionary && forcedWordLevel) {
        word = getCustomWordsForLevels(customDictionary, [forcedWordLevel])[0];
    } else if (customDictionary) {
        word = getRandomCustomWord(customDictionary, difficulty);
    } else {
        const pool = getWordsByCategory(
            category,
            forcedWordLevel ?? (difficulty ? getRandomWordLevel(difficulty) : poolLevel)
        );
        word = Array.isArray(pool) && pool.length
            ? pool[Math.floor(Math.random() * pool.length)]
            : null;
    }

    if (!word) {
        console.error(
            `Nenhuma palavra encontrada para ${category} (${poolLevel})`
        );
        return null;
    }

    return new Enemy({
        x,
        y,
        word,
        speed,
        type,
        // Sorteia uma das variações visuais do Boo
        variant: Math.floor(Math.random() * BOO_VARIANT_COUNT)
    });
}
