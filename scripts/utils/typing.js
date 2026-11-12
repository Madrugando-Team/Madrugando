// Regra única para comparar o que o jogador digita com as palavras do jogo.
//
// No modo fácil os acentos são opcionais: a palavra aparece escrita
// corretamente ("fácil"), mas digitar "facil" também vale. O mesmo vale
// para o ç ("cabeça" aceita "cabeca").

let ignoreAccents = false;

// Chamado pelo Game ao iniciar a partida
export function setIgnoreAccents(value) {
    ignoreAccents = Boolean(value);
}

export function normalizeTyping(text) {

    const lower = String(text).toLocaleLowerCase("pt-BR");

    if (!ignoreAccents)
        return lower;

    // Separa letra e acento (NFD) e remove só os acentos
    return lower
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

// A palavra digitada é igual à palavra do inimigo/power-up?
export function wordsMatch(typed, word) {
    return normalizeTyping(typed) === normalizeTyping(word);
}

// A palavra começa com o que já foi digitado?
export function wordStartsWith(word, prefix) {
    return normalizeTyping(word).startsWith(normalizeTyping(prefix));
}
