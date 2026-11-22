import { Enemy } from "./enemy.js";
import BoozarroWords from "../data/boozarroWords.js";
import { normalizeTyping } from "../utils/typing.js";

const VOWELS = "aeiouáéíóúâêôãõ";
const CUSTOM_TYPO_RULES = [
    [new RegExp(`s(?=[${VOWELS}])`, "gu"), "z"],
    [new RegExp(`s(?=[aouáãâô])`, "gu"), "ç"],
    [new RegExp(`z(?=[${VOWELS}])`, "gu"), "s"],
    [new RegExp(`c(?=[aouáãâô])`, "gu"), "ç"],
    [new RegExp(`ç(?=[aouáãâô])`, "gu"), "c"],
    [new RegExp(`s(?=[${VOWELS}])`, "gu"), "ss"],
    [/ss/gu, "s"],
    [/g(?=[eéií])/gu, "j"],
    [/j(?=[eéií])/gu, "g"],
    [/ch/gu, "x"],
    [/x/gu, "ch"],
    [/b/gu, "v"],
    [/v/gu, "b"],
    [/m(?=[pb])/gu, "n"],
    [/n(?=[pb])/gu, "m"]
];

function createCustomBoozarroWord(dictionary) {
    const validWords = new Set(dictionary.map(word => normalizeTyping(word)));
    const variants = new Set();

    for (const source of dictionary) {
        if (typeof source !== "string" || !source.trim()) continue;
        const word = source.toLocaleLowerCase("pt-BR").normalize("NFC");

        for (const [pattern, replacement] of CUSTOM_TYPO_RULES) {
            const typo = word.replace(pattern, replacement);
            const normalizedTypo = normalizeTyping(typo);
            if (typo !== word && !validWords.has(normalizedTypo)) {
                variants.add(typo);
            }
        }

        // Se não houver troca ortográfica comum, inverte um par de letras
        // adjacentes ou duplica uma letra para criar um erro visualmente próximo.
        for (let index = 0; index < word.length - 1; index++) {
            const letters = Array.from(word);
            [letters[index], letters[index + 1]] = [letters[index + 1], letters[index]];
            const typo = letters.join("");
            if (typo !== word && !validWords.has(normalizeTyping(typo))) {
                variants.add(typo);
            }
        }

        if (word.length) {
            const typo = `${word}${Array.from(word).at(-1)}`;
            if (!validWords.has(normalizeTyping(typo))) variants.add(typo);
        }
    }

    const choices = [...variants];
    if (choices.length) {
        return choices[Math.floor(Math.random() * choices.length)];
    }

    let fallback = `${String(dictionary[0] ?? "palavra").toLocaleLowerCase("pt-BR")}x`;
    while (validWords.has(normalizeTyping(fallback))) fallback += "x";
    return fallback;
}

// Boozarro: um Boo com uma palavra escrita errada.
// Digitar a palavra tira uma vida; deixá-lo chegar ao chão não causa dano.
export function createBoozarro(x, y, { speed, customDictionary = null }) {

    const word = Array.isArray(customDictionary) && customDictionary.length
        ? createCustomBoozarroWord(customDictionary)
        : BoozarroWords[Math.floor(Math.random() * BoozarroWords.length)];

    return new Enemy({
        x,
        y,
        word,
        speed,
        type: "boozarro"
    });
}
