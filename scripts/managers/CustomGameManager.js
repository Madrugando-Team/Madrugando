export class CustomGameManager {

    constructor() {

        this.games = [];

        this.load();

    }


    add(game) {

        this.games.push(game);

        this.save();

    }


    remove(id) {

        this.games =
            this.games.filter(
                game => game.id !== id
            );

        this.save();

    }


    update(game) {

        const index =
            this.games.findIndex(
                item => item.id === game.id
            );

        if (index === -1) {
            return false;
        }

        this.games[index] = game;

        this.save();

        return true;

    }


    getAll() {

        return this.games;

    }


    getById(id) {

        return this.games.find(
            game => game.id === id
        );

    }


    has(id) {

        return this.games.some(
            game => game.id === id
        );

    }


    clear() {

        this.games = [];

        this.save();

    }


    save() {

        localStorage.setItem(
            "madrugando_custom_games",
            JSON.stringify(this.games)
        );

    }


    load() {

        const data =
            localStorage.getItem(
                "madrugando_custom_games"
            );

        if (!data) {
            this.games = [];
            return;
        }

        try {

            this.games = JSON.parse(data);

        } catch (error) {

            console.error(
                "Erro ao carregar Custom Games:",
                error
            );

            this.games = [];

        }

    }

}