import { Enemy } from "./enemy.js";
import BoozarroWords from "../data/boozarroWords.js";

// Boozarro: um Boo com uma palavra escrita errada.
// Digitar a palavra tira uma vida; deixá-lo chegar ao chão não causa dano.
export function createBoozarro(x, y, { speed }) {

    const word =
        BoozarroWords[Math.floor(Math.random() * BoozarroWords.length)];

    return new Enemy({
        x,
        y,
        word,
        speed,
        type: "boozarro"
    });
}
