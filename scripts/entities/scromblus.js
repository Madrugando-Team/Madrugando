
import { Enemy } from "./enemy.js";
import {
    getWordsByCategory,
    getRandomWordLevel,
    getCustomWordsForLevels
} from "../data/wordpools.js";

export function createScromblus(x, y, config) {

    const {
        category = "science",
        difficulty,
        speed = 1.1,
        poolLevel = "medium",
        customDictionary,
        scoreManager
    } = config;

    // Utiliza o dicionário personalizado ou
    // busca palavras da matéria selecionada.
    // A categoria "all" reúne todas as matérias.
    // O Scromblus usa uma composição fixa de níveis por dificuldade,
    // em vez de sortear o nível de cada palavra de forma independente.
    const levelComposition = {
        easy: ["easy", "easy", "medium"],
        medium: ["easy", "medium", "medium"],
        hard: ["easy", "medium", "hard"]
    }[difficulty] || [
        difficulty ? getRandomWordLevel(difficulty) : poolLevel,
        difficulty ? getRandomWordLevel(difficulty) : poolLevel,
        difficulty ? getRandomWordLevel(difficulty) : poolLevel
    ];

    const pool = customDictionary
        ? customDictionary
        : null;

    // Verifica se o dicionário personalizado tem palavras disponíveis.
    if (customDictionary && (!Array.isArray(pool) || pool.length === 0)) {
        console.error(
            `Nenhuma palavra encontrada para ${category} (${poolLevel})`
        );
        return null;
    }

    const cleanWords = words => [...new Set(
        words.filter(word => typeof word === "string" && word.trim())
    )];

    // No modo base, seleciona exatamente os níveis pedidos. Se uma matéria
    // não tiver palavras suficientes em algum nível, completa com outros
    // níveis disponíveis para não impedir o aparecimento do chefe.
    let uniqueWords;
    if (pool) {
        uniqueWords = getCustomWordsForLevels(pool, levelComposition);
        if (uniqueWords.length < 3) {
            const remaining = cleanWords(pool).filter(
                word => !uniqueWords.includes(word)
            );
            while (uniqueWords.length < 3 && remaining.length) {
                const index = Math.floor(Math.random() * remaining.length);
                uniqueWords.push(remaining.splice(index, 1)[0]);
            }
        }
    } else {
        const selected = [];
        for (const level of levelComposition) {
            const available = cleanWords(
                getWordsByCategory(category, level)
            ).filter(word => !selected.includes(word));
            if (available.length) {
                selected.push(available[Math.floor(Math.random() * available.length)]);
            }
        }

        if (selected.length < 3) {
            const fallback = cleanWords([
                ...getWordsByCategory(category, "easy"),
                ...getWordsByCategory(category, "medium"),
                ...getWordsByCategory(category, "hard")
            ]).filter(word => !selected.includes(word));
            while (selected.length < 3 && fallback.length) {
                const index = Math.floor(Math.random() * fallback.length);
                selected.push(fallback.splice(index, 1)[0]);
            }
        }
        uniqueWords = selected;
    }

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

            // Gira e encolhe antes de sumir
            this.hit();

            return true;
        }

        // Avança para a próxima palavra e mostra o frame de hit
        this.word = this.words[this.currentWordIndex];

        this.startPhaseHit();

        return false;
    };

    return scromblus;
}
