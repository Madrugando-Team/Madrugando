// Centraliza a reprodução das músicas e dos efeitos sonoros do jogo.
// Os caminhos são resolvidos a partir deste arquivo (import.meta.url),
// então funcionam independentemente da página que carrega o jogo.

const audioPath = (file) =>
    new URL(`../../assets/audio/${file}`, import.meta.url).href;

// Trilhas do jogo. Para trocar uma música, basta alterar o arquivo aqui.
// TODO: substituir a trilha do menu quando o arquivo definitivo for entregue.
export const MUSIC_TRACKS = {
    menu: {
        src: audioPath("MENU.mp3"),
        volume: 0.4
    },
    gameplay: {
        src: audioPath("GAMEPLAY.mp3"),
        volume: 0.35
    }
};

// Efeitos sonoros. volume vai de 0 a 1; pitchVariation varia levemente
// o tom a cada execução para sons repetitivos não cansarem.
export const SFX_SOUNDS = {
    acerto: {
        src: audioPath("sfx/acerto.mp3"),
        volume: 0.5,
        pitchVariation: 0.06
    },
    scromblusDerrotado: {
        src: audioPath("sfx/scromblus-derrotado.mp3"),
        volume: 0.8
    },
    despertador: {
        src: audioPath("sfx/despertador.mp3"),
        volume: 0.8
    },
    gelo: {
        src: audioPath("sfx/gelo.mp3"),
        volume: 0.7
    },
    reverso: {
        src: audioPath("sfx/reverso.mp3"),
        volume: 0.7
    },
    duplicador: {
        src: audioPath("sfx/duplicador.mp3"),
        volume: 0.7
    },
    // Caixas de seleção do menu e troca de alternativa no Boss
    clique: {
        src: audioPath("sfx/clique.mp3"),
        volume: 0.45
    },
    // Alternativa errada no Boss
    derrota: {
        src: audioPath("sfx/derrota.mp3"),
        volume: 0.8
    }
};

const STORAGE_KEY = "madrugando_audio";
const FADE_DURATION = 600; // ms

export class AudioManager {

    constructor(tracks = MUSIC_TRACKS, sfx = SFX_SOUNDS) {

        this.tracks = tracks;
        this.sfx = sfx;

        // Efeitos usam a Web Audio API: menor latência e permite
        // tocar o mesmo som várias vezes ao mesmo tempo.
        const AudioContextClass =
            window.AudioContext || window.webkitAudioContext;

        this.audioContext = AudioContextClass
            ? new AudioContextClass()
            : null;

        this.sfxBuffers = {};

        // Um elemento <audio> por trilha, criado sob demanda.
        this.musicElements = {};

        this.currentMusic = null;   // nome da trilha que deveria estar tocando
        this.musicPaused = false;   // pausado pelo jogo (menu de pausa)
        this.unlocked = false;      // navegador já liberou a reprodução?
        this.fades = new Map();     // fades em andamento por elemento

        this.muted = this.loadSettings().muted ?? false;

        this.bindUnlock();
        this.bindVisibility();
        this.loadSfx();
    }

    // ---------- Configurações (localStorage) ----------

    loadSettings() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
        } catch {
            return {};
        }
    }

    saveSettings() {
        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({ muted: this.muted })
            );
        } catch {
            // Sem localStorage (modo privado etc.): segue sem salvar.
        }
    }

    // ---------- Política de autoplay ----------

    // Navegadores bloqueiam áudio até a primeira interação do usuário.
    // Na primeira tecla/clique, tentamos tocar a trilha pendente.
    bindUnlock() {

        const unlock = () => {
            this.unlocked = true;

            window.removeEventListener("pointerdown", unlock, true);
            window.removeEventListener("keydown", unlock, true);

            this.audioContext?.resume();

            this.syncCurrentMusic();
        };

        window.addEventListener("pointerdown", unlock, true);
        window.addEventListener("keydown", unlock, true);
    }

    // Pausa a música quando a aba fica oculta e retoma ao voltar,
    // desde que o jogo não esteja pausado.
    bindVisibility() {

        document.addEventListener("visibilitychange", () => {

            const element = this.getCurrentElement();

            if (!element)
                return;

            if (document.hidden) {
                element.pause();
            } else {
                this.syncCurrentMusic();
            }
        });
    }

    // ---------- Música ----------

    getElement(name) {

        const track = this.tracks[name];

        if (!track)
            return null;

        if (!this.musicElements[name]) {

            const element = new Audio(track.src);

            element.loop = true;
            element.preload = "auto";
            element.volume = 0;

            element.addEventListener("error", () => {
                console.warn(
                    `Música "${name}" não encontrada: ${track.src}`
                );
            });

            this.musicElements[name] = element;
        }

        return this.musicElements[name];
    }

    getCurrentElement() {
        return this.currentMusic
            ? this.getElement(this.currentMusic)
            : null;
    }

    // Troca para a trilha indicada, com fade entre as músicas.
    // restart = true recomeça a trilha mesmo que já seja a atual.
    playMusic(name, { restart = true } = {}) {

        if (!this.tracks[name]) {
            console.warn(`Trilha desconhecida: ${name}`);
            return;
        }

        const isSameTrack = this.currentMusic === name;

        if (isSameTrack && !restart && !this.musicPaused) {
            return;
        }

        // Faz o fade-out das outras trilhas.
        Object.entries(this.musicElements).forEach(([trackName, element]) => {
            if (trackName !== name) {
                this.fadeTo(element, 0, () => element.pause());
            }
        });

        this.currentMusic = name;
        this.musicPaused = false;

        const element = this.getElement(name);

        if (isSameTrack && restart) {
            element.currentTime = 0;
        } else if (!isSameTrack) {
            element.currentTime = 0;
            element.volume = 0;
        }

        this.syncCurrentMusic();
    }

    // Para a música atual com fade-out (ex.: Game Over).
    stopMusic() {

        const element = this.getCurrentElement();

        this.currentMusic = null;
        this.musicPaused = false;

        if (element) {
            this.fadeTo(element, 0, () => element.pause());
        }
    }

    // Pausa mantendo a posição (menu de pausa).
    pauseMusic() {

        this.musicPaused = true;

        const element = this.getCurrentElement();

        if (element) {
            this.cancelFade(element);
            element.pause();
        }
    }

    resumeMusic() {

        this.musicPaused = false;

        this.syncCurrentMusic();
    }

    // Garante que a trilha atual esteja tocando no volume correto,
    // respeitando mudo, pausa, aba oculta e bloqueio de autoplay.
    syncCurrentMusic() {

        const element = this.getCurrentElement();

        if (!element)
            return;

        if (this.musicPaused || document.hidden)
            return;

        const targetVolume = this.muted
            ? 0
            : this.tracks[this.currentMusic].volume;

        if (this.muted) {
            this.cancelFade(element);
            element.volume = 0;
            element.pause();
            return;
        }

        if (element.paused) {

            const playPromise = element.play();

            if (playPromise) {
                playPromise.catch(error => {
                    // NotAllowedError: ainda sem interação do usuário.
                    // A trilha toca quando o bindUnlock disparar.
                    if (error.name !== "NotAllowedError") {
                        console.warn("Não foi possível tocar a música:", error);
                    }
                });
            }
        }

        this.fadeTo(element, targetVolume);
    }

    // ---------- Efeitos sonoros ----------

    // Baixa e decodifica todos os efeitos uma vez, no início.
    // Um arquivo ausente só gera um aviso: o restante continua funcionando.
    loadSfx() {

        if (!this.audioContext)
            return;

        Object.entries(this.sfx).forEach(async ([name, sound]) => {
            try {
                const response = await fetch(sound.src);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const data = await response.arrayBuffer();

                this.sfxBuffers[name] =
                    await this.audioContext.decodeAudioData(data);

            } catch (error) {
                console.warn(
                    `Efeito sonoro "${name}" não carregado (${sound.src}):`,
                    error.message
                );
            }
        });
    }

    playSfx(name) {

        const sound = this.sfx[name];
        const buffer = this.sfxBuffers[name];

        if (!sound || !buffer || this.muted || !this.audioContext)
            return;

        if (this.audioContext.state === "suspended") {
            this.audioContext.resume();
        }

        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;

        if (sound.pitchVariation) {
            source.playbackRate.value =
                1 + (Math.random() * 2 - 1) * sound.pitchVariation;
        }

        const gain = this.audioContext.createGain();
        gain.gain.value = sound.volume ?? 1;

        source.connect(gain);
        gain.connect(this.audioContext.destination);

        source.start();
    }

    // ---------- Mudo ----------

    setMuted(muted) {

        this.muted = muted;
        this.saveSettings();

        this.syncCurrentMusic();
    }

    toggleMuted() {
        this.setMuted(!this.muted);
        return this.muted;
    }

    isMuted() {
        return this.muted;
    }

    // ---------- Fade ----------

    cancelFade(element) {

        const frame = this.fades.get(element);

        if (frame) {
            cancelAnimationFrame(frame);
            this.fades.delete(element);
        }
    }

    // Usa requestAnimationFrame com tempo real para não depender do loop do jogo
    // (a música continua fazendo fade com o jogo pausado ou em Game Over).
    fadeTo(element, target, onComplete) {

        this.cancelFade(element);

        const start = element.volume;
        const startTime = performance.now();

        const step = (now) => {

            // O horário do rAF pode ser um pouco anterior a startTime,
            // por isso o progresso é limitado entre 0 e 1.
            const progress = Math.min(
                Math.max((now - startTime) / FADE_DURATION, 0),
                1
            );

            // HTMLMediaElement lança erro com volume fora de [0, 1].
            element.volume = Math.min(
                Math.max(start + (target - start) * progress, 0),
                1
            );

            if (progress < 1) {
                this.fades.set(element, requestAnimationFrame(step));
            } else {
                this.fades.delete(element);
                onComplete?.();
            }
        };

        this.fades.set(element, requestAnimationFrame(step));
    }
}