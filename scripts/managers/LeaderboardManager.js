const STORAGE_KEY = "madrugando_leaderboard";

export class LeaderboardManager {

    constructor() {
        this.records = this.load();
    }

    load() {
        try {
            const savedRecords = JSON.parse(
                localStorage.getItem(STORAGE_KEY) || "[]"
            );

            if (!Array.isArray(savedRecords))
                return [];

            return savedRecords.filter(record =>
                record &&
                typeof record.id === "string" &&
                typeof record.name === "string" &&
                typeof record.subject === "string" &&
                Number.isFinite(record.score) &&
                typeof record.createdAt === "string" &&
                Number.isFinite(new Date(record.createdAt).getTime())
            );
        } catch (error) {
            console.error("Erro ao carregar o placar:", error);
            return [];
        }
    }

    add(record) {
        this.records.push(record);
        this.records.sort((first, second) =>
            second.score - first.score ||
            new Date(first.createdAt) - new Date(second.createdAt)
        );

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.records));
        } catch (error) {
            console.error("Erro ao salvar o placar:", error);
        }

        return this.getAll();
    }

    getAll() {
        return this.records
            .filter(record => !record.subject.startsWith("Personalizado:"))
            .sort((first, second) =>
            second.score - first.score ||
            new Date(first.createdAt) - new Date(second.createdAt)
            );
    }

}
