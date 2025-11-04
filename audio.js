import * as Tone from 'tone';

class AudioManager {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.sounds = {};
        this.player = null;
        this.assetsLoaded = false;
    }

    async loadSound(name, url) {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        this.sounds[name] = audioBuffer;
    }

    async loadAssets() {
        if (this.assetsLoaded) return;

        this.player = new Tone.Player("./song.mp3").toDestination();
        
        await Promise.all([
            this.loadSound('hit', './hit.mp3'),
            this.loadSound('miss', './miss.mp3'),
            Tone.loaded() // This will wait for the player to be ready
        ]);
        
        // Sync the player to the transport. It will start at time 0.
        this.player.sync().start(0);
        this.assetsLoaded = true;
    }

    playSound(name) {
        if (!this.sounds[name] || this.audioContext.state === 'suspended') return;
        const source = this.audioContext.createBufferSource();
        source.buffer = this.sounds[name];
        source.connect(this.audioContext.destination);
        source.start(0);
    }

    async playMusic() {
        await this.loadAssets(); // Ensure assets are loaded before playing

        if (Tone.context.state !== 'running') {
            await Tone.start();
        }
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        Tone.Transport.position = 0; // Explicitly set position to 0
        Tone.Transport.start();
    }

    stopMusic() {
        Tone.Transport.stop();
        // When stopping, also seek to the beginning for the next playthrough.
        Tone.Transport.position = 0;
        // Cancel all scheduled events to prevent them from playing again on restart
        Tone.Transport.cancel(0);
    }

    getCurrentTime() {
        return Tone.Transport.seconds;
    }
}

export default AudioManager;