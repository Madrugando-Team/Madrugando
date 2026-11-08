
import { Enemy } from "./enemy.js";
import {
    getWordsByCategory,
    getRandomWordLevel,
    getRandomCustomWord
} from "../data/wordpools.js";

export function createBoo(x, y, config) {

    const {
        category,
        difficulty,
        poolLevel,
        speed,
        customDictionary
    } = config;

    // Prioriza o dicionário personalizado.
    // Caso contrário, busca as palavras da matéria
    // selecionada ou de todas as matérias.
    let word;
    if (customDictionary) {
        word = getRandomCustomWord(customDictionary, difficulty);
    } else {
        const pool = getWordsByCategory(
            category,
            difficulty ? getRandomWordLevel(difficulty) : poolLevel
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
        type: "boo"
    });
}
