// Simple audio system using Web Audio API for procedural sound generation

class AudioManager {
	private audioContext: AudioContext | null = null;
	private gainNode: GainNode | null = null;

	init() {
		if (typeof window !== "undefined" && !this.audioContext) {
			this.audioContext = new (window.AudioContext ||
				(window as any).webkitAudioContext)();
			this.gainNode = this.audioContext.createGain();
			this.gainNode.connect(this.audioContext.destination);
			this.gainNode.gain.value = 0.3; // Master volume
		}
	}

	private playTone(
		frequency: number,
		duration: number,
		type: OscillatorType = "sine"
	) {
		if (!this.audioContext || !this.gainNode) {
			this.init();
			if (!this.audioContext || !this.gainNode) return;
		}

		const oscillator = this.audioContext.createOscillator();
		const gainNode = this.audioContext.createGain();

		oscillator.connect(gainNode);
		gainNode.connect(this.gainNode);

		oscillator.frequency.value = frequency;
		oscillator.type = type;

		gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
		gainNode.gain.exponentialRampToValueAtTime(
			0.01,
			this.audioContext.currentTime + duration
		);

		oscillator.start(this.audioContext.currentTime);
		oscillator.stop(this.audioContext.currentTime + duration);
	}

	playShootSound() {
		// Short, sharp sound for shooting
		this.playTone(800, 0.05, "square");
		setTimeout(() => {
			this.playTone(600, 0.03, "square");
		}, 20);
	}

	playHitSound() {
		// Higher pitch for hit
		this.playTone(1200, 0.1, "sine");
		setTimeout(() => {
			this.playTone(1000, 0.08, "sine");
		}, 30);
	}

	playReloadSound() {
		// Lower pitch sequence for reload
		this.playTone(400, 0.1, "sine");
		setTimeout(() => {
			this.playTone(350, 0.1, "sine");
		}, 150);
		setTimeout(() => {
			this.playTone(450, 0.15, "sine");
		}, 300);
	}

	playEnemyAttackSound() {
		// Lower, menacing sound
		this.playTone(200, 0.2, "sawtooth");
	}

	playDamageSound() {
		// Warning sound for taking damage
		this.playTone(300, 0.3, "sawtooth");
		setTimeout(() => {
			this.playTone(250, 0.2, "sawtooth");
		}, 100);
	}
}

export const audioManager = new AudioManager();

