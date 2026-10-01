import { Enemy } from "./enemy.js";
import WordPools from "../data/wordpools.js";

export function createBoo(x, y, config) {

    const { category, poolLevel, speed, customDictionary } = config;

    const pool = customDictionary ? customDictionary : WordPools.boo[category][poolLevel];
    const word = pool[Math.floor(Math.random() * pool.length)];

    return new Enemy({
        x,
        y,
        word,
        speed,
        type: "boo"
    });
}