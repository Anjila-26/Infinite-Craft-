"use client";

// Sound manager for the game
class SoundManager {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    if (typeof window !== "undefined") {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  private playTone(frequency: number, duration: number, type: OscillatorType = "sine", volume: number = 0.1) {
    if (!this.enabled || !this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = type;

      gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch (e) {
      console.error("Failed to play sound", e);
    }
  }

  // Play when picking up an element
  playPickup() {
    this.playTone(440, 0.1, "sine", 0.08);
  }

  // Play when dropping an element
  playDrop() {
    this.playTone(330, 0.08, "sine", 0.06);
  }

  // Play when combining elements
  playCombine() {
    this.playTone(523, 0.15, "sine", 0.1);
    setTimeout(() => this.playTone(659, 0.15, "sine", 0.1), 100);
  }

  // Play when discovering a new element
  playDiscovery() {
    this.playTone(523, 0.2, "sine", 0.15);
    setTimeout(() => this.playTone(659, 0.2, "sine", 0.15), 150);
    setTimeout(() => this.playTone(784, 0.3, "sine", 0.15), 300);
  }

  // Play first discovery (you discovered something new!)
  playFirstDiscovery() {
    this.playTone(523, 0.2, "sine", 0.2);
    setTimeout(() => this.playTone(659, 0.2, "sine", 0.2), 100);
    setTimeout(() => this.playTone(784, 0.2, "sine", 0.2), 200);
    setTimeout(() => this.playTone(1047, 0.4, "sine", 0.2), 300);
  }

  // Play error/failed combination
  playError() {
    this.playTone(200, 0.2, "sawtooth", 0.05);
  }
}

export const soundManager = typeof window !== "undefined" ? new SoundManager() : null;

