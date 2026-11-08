
import { Enemy, BOO_VARIANT_COUNT } from "./enemy.js";
import {
    getWordsByCategory,
    getRandomWordLevel
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
    const pool = customDictionary
        ? customDictionary
        : getWordsByCategory(
            category,
            difficulty ? getRandomWordLevel(difficulty) : poolLevel
        );

    // Verifica se existem palavras disponíveis.
    if (!Array.isArray(pool) || pool.length === 0) {
        console.error(
            `Nenhuma palavra encontrada para ${category} (${poolLevel})`
        );
        return null;
    }

    const word = pool[
        Math.floor(Math.random() * pool.length)
    ];

    return new Enemy({
        x,
        y,
        word,
        speed,
        type: "boo",
        // Sorteia uma das variações visuais do Boo
        variant: Math.floor(Math.random() * BOO_VARIANT_COUNT)
    });
}
