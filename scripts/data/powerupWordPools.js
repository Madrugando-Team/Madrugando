// Palavras dos power-ups.
// Nenhuma pode começar com uma palavra de inimigo (ex.: "mar" em "marcha-ré"),
// senão o Boo é eliminado no meio da digitação e o power-up fica impossível de pegar.
const PowerUpWordPools = {
    despertador: [
        "tic-tac",
        "contra-relógio",
        "trim-trim"
    ],
    gelo: [
        "bola-de-neve",
        "picolé-de-limão",
        "pinguim-imperador"
    ],
    reverso: [
        "vice-versa",
        "vira-vira",
        "bate-volta"
    ],
    duplicador: [
        "dose-dupla",
        "super-bônus",
        "pé-de-meia"
    ]
};

export default PowerUpWordPools;