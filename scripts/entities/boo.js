
import { Enemy } from "./enemy.js";
import { getWordsByCategory } from "../data/wordpools.js";

export function createBoo(x, y, config) {

    const {
        category,
        poolLevel,
        speed,
        customDictionary
    } = config;

    // Prioriza o dicionário personalizado.
    // Caso contrário, busca as palavras da matéria
    // selecionada ou de todas as matérias.
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

    const word = pool[
        Math.floor(Math.random() * pool.length)
    ];

    return new Enemy({
        x,
        y,
        word,
        speed,
        type: "boo"
    });
}
