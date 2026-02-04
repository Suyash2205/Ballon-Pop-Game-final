/* ========================================
   Audio System (Web Audio API)
   ======================================== */

class AudioSystem {
  constructor() {
    this.context = null;
    this.enabled = true;
  }

  init() {
    try {
      this.context = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.log('Web Audio API not supported');
    }
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }

  playTone(frequency, duration, type = 'sine', volume = 0.3) {
    if (!this.context || !this.enabled) return;

    try {
      // Resume context if suspended (needed for autoplay policy)
      if (this.context.state === 'suspended') {
        this.context.resume();
      }

      const oscillator = this.context.createOscillator();
      const gainNode = this.context.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.context.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = type;

      gainNode.gain.setValueAtTime(volume, this.context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        this.context.currentTime + duration
      );

      oscillator.start(this.context.currentTime);
      oscillator.stop(this.context.currentTime + duration);
    } catch (e) {
      // Ignore audio errors
    }
  }

  playPop() {
    this.playTone(800, 0.1, 'sine', 0.4);
    setTimeout(() => this.playTone(600, 0.1, 'sine', 0.2), 50);
  }

  playCorrect() {
    this.playTone(523, 0.1, 'sine', 0.3);
    setTimeout(() => this.playTone(659, 0.1, 'sine', 0.3), 100);
    setTimeout(() => this.playTone(784, 0.15, 'sine', 0.3), 200);
  }

  // Removed harsh wrong sound - we use playTick for soft feedback instead
  playWrong() {
    // Soft, non-punishing sound
    this.playTone(350, 0.15, 'sine', 0.15);
  }

  playTick() {
    this.playTone(1000, 0.05, 'sine', 0.1);
  }

  // Removed - no game over in kid-friendly version
  playGameOver() {
    // Just a gentle end sound
    this.playTone(400, 0.2, 'sine', 0.2);
  }

  playStreak() {
    this.playTone(880, 0.1, 'sine', 0.2);
    setTimeout(() => this.playTone(1100, 0.15, 'sine', 0.2), 100);
  }
}

// Singleton instance
const audioSystem = new AudioSystem();
export default audioSystem;
