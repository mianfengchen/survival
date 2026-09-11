// Lightweight WebAudio synth — no external audio files.
// All sounds are generated procedurally from oscillators + noise bursts, so the
// game ships zero audio assets while still having punchy combat feedback.

export class AudioManager {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this.volume = 0.5;
    this.lastHitAt = 0;
    this.hitVoiceCount = 0;
    this.hitVoiceWindowStart = 0;
    this.noiseBuffer = null;
  }

  // Must be called from a user gesture (click / keydown) so the browser allows audio.
  ensureContext() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    }
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) {
      return null;
    }
    this.ctx = new Ctor();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : this.volume;
    this.master.connect(this.ctx.destination);
    this.noiseBuffer = this.createNoiseBuffer();
    return this.ctx;
  }

  setMuted(muted) {
    this.muted = Boolean(muted);
    if (this.master) {
      this.master.gain.value = this.muted ? 0 : this.volume;
    }
  }

  createNoiseBuffer() {
    const length = Math.floor(this.ctx.sampleRate * 0.4);
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  // Core tone: an oscillator with an ADSR-ish gain envelope and optional pitch slide.
  tone({ type = "sine", freq = 440, freqEnd = null, duration = 0.12, gain = 0.3, delay = 0, attack = 0.005 }) {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (freqEnd && freqEnd !== freq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), now + duration);
    }
    env.gain.setValueAtTime(0.0001, now);
    env.gain.exponentialRampToValueAtTime(gain, now + attack);
    env.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(env);
    env.connect(this.master);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  // Filtered noise burst — used for impacts / explosions.
  noise({ duration = 0.14, gain = 0.3, type = "lowpass", freq = 1200, delay = 0 }) {
    if (!this.ctx || this.muted || !this.noiseBuffer) return;
    const now = this.ctx.currentTime + delay;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.setValueAtTime(freq, now);
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(gain, now);
    env.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    src.connect(filter);
    filter.connect(env);
    env.connect(this.master);
    src.start(now);
    src.stop(now + duration + 0.02);
  }

  // Throttle hit sounds so a wall of projectiles doesn't turn into a buzz.
  canPlayHit() {
    if (!this.ctx) return false;
    const now = this.ctx.currentTime;
    if (now - this.hitVoiceWindowStart > 0.1) {
      this.hitVoiceWindowStart = now;
      this.hitVoiceCount = 0;
    }
    if (this.hitVoiceCount >= 4) {
      return false;
    }
    this.hitVoiceCount += 1;
    return true;
  }

  playHit(crit = false) {
    if (this.muted || !this.canPlayHit()) return;
    if (crit) {
      this.tone({ type: "square", freq: 660, freqEnd: 320, duration: 0.12, gain: 0.16 });
      this.noise({ duration: 0.1, gain: 0.16, freq: 2600, type: "bandpass" });
    } else {
      this.noise({ duration: 0.06, gain: 0.1, freq: 1800, type: "highpass" });
      this.tone({ type: "triangle", freq: 420, freqEnd: 260, duration: 0.06, gain: 0.08 });
    }
  }

  playKill(elite = false) {
    if (this.muted) return;
    this.noise({ duration: elite ? 0.22 : 0.14, gain: elite ? 0.26 : 0.18, freq: elite ? 900 : 1300, type: "lowpass" });
    this.tone({ type: "sawtooth", freq: elite ? 220 : 300, freqEnd: elite ? 70 : 110, duration: elite ? 0.24 : 0.16, gain: 0.16 });
  }

  playBossDown() {
    if (this.muted) return;
    this.noise({ duration: 0.6, gain: 0.34, freq: 700, type: "lowpass" });
    this.tone({ type: "sawtooth", freq: 200, freqEnd: 48, duration: 0.7, gain: 0.26 });
    this.tone({ type: "square", freq: 320, freqEnd: 80, duration: 0.5, gain: 0.12, delay: 0.04 });
  }

  playLevelUp() {
    if (this.muted) return;
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, index) => {
      this.tone({ type: "triangle", freq, duration: 0.16, gain: 0.16, delay: index * 0.07 });
    });
  }

  playPlayerHurt() {
    if (this.muted) return;
    this.tone({ type: "sawtooth", freq: 180, freqEnd: 90, duration: 0.18, gain: 0.2 });
    this.noise({ duration: 0.12, gain: 0.16, freq: 600, type: "lowpass" });
  }

  playDeath() {
    if (this.muted) return;
    this.tone({ type: "sawtooth", freq: 260, freqEnd: 40, duration: 0.9, gain: 0.28 });
    this.noise({ duration: 0.5, gain: 0.2, freq: 500, type: "lowpass", delay: 0.05 });
  }

  playPickup() {
    if (this.muted) return;
    this.tone({ type: "sine", freq: 880, freqEnd: 1240, duration: 0.08, gain: 0.06 });
  }
}
