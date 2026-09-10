import { PuppetInstrument } from '../types';

// Web Audio API music box & oriental chime synthesizer

class SoundEngine {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // 5 Musical Scale Rows for Celestial Chime (Lead puppet):
  // Row 0: 羽 (High chime) - Left Arm
  // Row 1: 徵 (Mid-high chime) - Body
  // Row 2: 角 (Mid chime) - Right Arm
  // Row 3: 商 (Mid-low chime) - Left Leg
  // Row 4: 宫 (Deep bass chime) - Right Leg
  private readonly frequencies = [
    [880, 1046.5, 1174.66, 1318.51], // Row 0: Left Arm (羽 - High tones)
    [587.33, 659.25, 783.99, 880],   // Row 1: Body (徵 - Mid-high tones)
    [392, 440, 523.25, 587.33],      // Row 2: Right Arm (角 - Mid tones)
    [293.66, 329.63, 392, 440],      // Row 3: Left Leg (商 - Mid-low tones)
    [196, 220, 261.63, 293.66],      // Row 4: Right Leg (宫 - Bass tones)
  ];

  // 5 Percussion / Drum Tonal Scales (Companion Drummer puppet):
  // Row 0: 钹铃 (Hi-hat/cymbals/碰铃) - Crisp metallic accents
  // Row 1: 堂鼓 (Tenor tom/战鼓) - Resonant pitched drum
  // Row 2: 军鼓 (Snare drum/小军鼓) - Snappy rattle attack
  // Row 3: 梆子 (Woodblock/板鼓) - Tonal wooden clapper
  // Row 4: 地鼓 (Deep bass drum/底鼓) - Punchy sub-bass kick
  private readonly drumScalePitches = [
    [7200, 7800, 8400, 9200],  // Row 0: Cymbals / hi-hat metallic frequencies
    [220, 250, 290, 330],      // Row 1: Tenor tom fundamental frequencies (Hz)
    [180, 200, 225, 250],      // Row 2: Snare body fundamentals (Hz)
    [750, 840, 960, 1100],     // Row 3: Woodblock / bangu clapper resonant frequencies (Hz)
    [45, 52, 60, 68],          // Row 4: Deep bass kick resonant frequencies (Hz)
  ];

  public playTine(row: number, col: number, instrument: PuppetInstrument = 'bell') {
    if (this.isMuted) return;

    switch (instrument) {
      case 'drum':
        this.playPercussion(row, col);
        break;
      case 'trumpet':
        this.playTrumpet(row, col);
        break;
      case 'tuba':
        this.playTuba(row, col);
        break;
      case 'clarinet':
        this.playClarinet(row, col);
        break;
      case 'oboe':
        this.playOboe(row, col);
        break;
      case 'harp':
        this.playHarp(row, col);
        break;
      case 'bell':
      default:
        this.playBell(row, col);
        break;
    }
  }

  // 1. 小号 (Trumpet): Bright, heroic brass with characteristic lip-buzz attack and brassy formants
  public playTrumpet(row: number, col: number) {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const freqOptions = this.frequencies[row] || this.frequencies[1];
      const baseFreq = freqOptions[col % freqOptions.length] * 0.8; // Soprano brass register

      const noteGain = this.ctx.createGain();
      noteGain.gain.setValueAtTime(0.001, now);
      noteGain.gain.linearRampToValueAtTime(0.32, now + 0.04); // Fast brass attack
      noteGain.gain.exponentialRampToValueAtTime(0.24, now + 0.25);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);

      // Dual sawtooth oscillators slightly detuned for chorus richness
      const osc1 = this.ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(baseFreq, now);

      const osc2 = this.ctx.createOscillator();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(baseFreq * 1.004, now);

      // Brassy lowpass/peaking formant filter (opens on attack)
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(baseFreq * 2.2, now);
      filter.frequency.exponentialRampToValueAtTime(baseFreq * 5.5, now + 0.05);
      filter.frequency.exponentialRampToValueAtTime(baseFreq * 2.8, now + 0.35);
      filter.Q.setValueAtTime(3.2, now);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(noteGain);
      noteGain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.92);
      osc2.stop(now + 0.92);
    } catch {
      // Audio autoplay policy
    }
  }

  // 2. 大号 (Tuba): Deep, round low brass with majestic weight and warm resonant undertones
  public playTuba(row: number, col: number) {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const freqOptions = this.frequencies[row] || this.frequencies[4];
      // Shifted down to deep contrabass register
      const baseFreq = (freqOptions[col % freqOptions.length] * 0.35);

      const noteGain = this.ctx.createGain();
      noteGain.gain.setValueAtTime(0.001, now);
      noteGain.gain.linearRampToValueAtTime(0.48, now + 0.06);
      noteGain.gain.exponentialRampToValueAtTime(0.35, now + 0.4);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.3);

      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(baseFreq, now);

      // Sub-bass sine oscillator for deep resonant foundation
      const subOsc = this.ctx.createOscillator();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(baseFreq, now);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(baseFreq * 3.5, now);
      filter.Q.setValueAtTime(2.5, now);

      osc.connect(filter);
      subOsc.connect(noteGain);
      filter.connect(noteGain);
      noteGain.connect(this.ctx.destination);

      osc.start(now);
      subOsc.start(now);
      osc.stop(now + 1.35);
      subOsc.stop(now + 1.35);
    } catch {
      // Audio autoplay policy
    }
  }

  // 3. 单簧管 (Clarinet): Hollow, velvety woody sound characterized by strong odd harmonics
  public playClarinet(row: number, col: number) {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const freqOptions = this.frequencies[row] || this.frequencies[2];
      const baseFreq = freqOptions[col % freqOptions.length] * 0.75;

      const noteGain = this.ctx.createGain();
      noteGain.gain.setValueAtTime(0.001, now);
      noteGain.gain.linearRampToValueAtTime(0.3, now + 0.04);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.0);

      // Square wave generates purely odd harmonics (1st, 3rd, 5th), authentic to clarinet cylindrical bore
      const osc = this.ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(baseFreq, now);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(baseFreq * 2.8, now);
      filter.Q.setValueAtTime(1.8, now);

      osc.connect(filter);
      filter.connect(noteGain);
      noteGain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 1.05);
    } catch {
      // Audio autoplay policy
    }
  }

  // 4. 双簧管 (Oboe): Penetrating, expressive double-reed timbre with nasal formant peaks
  public playOboe(row: number, col: number) {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const freqOptions = this.frequencies[row] || this.frequencies[1];
      const baseFreq = freqOptions[col % freqOptions.length];

      const noteGain = this.ctx.createGain();
      noteGain.gain.setValueAtTime(0.001, now);
      noteGain.gain.linearRampToValueAtTime(0.28, now + 0.035);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.0);

      // Sawtooth wave passed through dual narrow bandpass filters (Oboe formant region ~1100Hz & ~2800Hz)
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(baseFreq, now);

      const formant1 = this.ctx.createBiquadFilter();
      formant1.type = 'bandpass';
      formant1.frequency.setValueAtTime(1200, now);
      formant1.Q.setValueAtTime(4.0, now);

      const formant2 = this.ctx.createBiquadFilter();
      formant2.type = 'bandpass';
      formant2.frequency.setValueAtTime(2600, now);
      formant2.Q.setValueAtTime(3.5, now);

      const formantGain = this.ctx.createGain();
      formantGain.gain.setValueAtTime(0.5, now);

      osc.connect(formant1);
      osc.connect(formant2);
      formant1.connect(noteGain);
      formant2.connect(formantGain);
      formantGain.connect(noteGain);
      noteGain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 1.05);
    } catch {
      // Audio autoplay policy
    }
  }

  // 5. 竖琴 (Harp): Crystalline, plucked concert harp with rich shimmering harmonic decay
  public playHarp(row: number, col: number) {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const freqOptions = this.frequencies[row] || this.frequencies[0];
      const baseFreq = freqOptions[col % freqOptions.length];

      // Plucked string envelope: instant attack, long singing decay
      const noteGain = this.ctx.createGain();
      noteGain.gain.setValueAtTime(0.38, now);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

      // Fundamental sine + second harmonic sine for pristine nylon/gut string clarity
      const osc1 = this.ctx.createOscillator();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(baseFreq, now);

      const osc2 = this.ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(baseFreq * 2, now);
      const overtoneGain = this.ctx.createGain();
      overtoneGain.gain.setValueAtTime(0.22, now);
      overtoneGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

      // Finger pluck transient
      const pluckBuffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.012), this.ctx.sampleRate);
      const data = pluckBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.2));
      }
      const pluckSrc = this.ctx.createBufferSource();
      pluckSrc.buffer = pluckBuffer;
      const pluckGain = this.ctx.createGain();
      pluckGain.gain.setValueAtTime(0.12, now);
      pluckSrc.connect(pluckGain);
      pluckGain.connect(noteGain);

      osc1.connect(noteGain);
      osc2.connect(overtoneGain);
      overtoneGain.connect(noteGain);
      noteGain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      pluckSrc.start(now);
      osc1.stop(now + 1.85);
      osc2.stop(now + 0.65);
    } catch {
      // Audio autoplay policy
    }
  }

  // 6. 八音钟琴 (Original Bell Chime)
  public playBell(row: number, col: number) {
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const freqOptions = this.frequencies[row] || this.frequencies[1];
      const baseFreq = freqOptions[col % freqOptions.length];

      // Master gain for this note
      const noteGain = this.ctx.createGain();
      noteGain.gain.setValueAtTime(0.35, now);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
      noteGain.connect(this.ctx.destination);

      // Fundamental oscillator (triangle/sine blend for sweet bell chime)
      const osc1 = this.ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(baseFreq, now);

      // Metallic chime harmonic (music box metal tine has overtone ~2.76x or 4x)
      const osc2 = this.ctx.createOscillator();
      const overtoneGain = this.ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(baseFreq * 2.76, now);
      overtoneGain.gain.setValueAtTime(0.18, now);
      overtoneGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

      // Mechanical "click / plucking" sound of the music box cylinder tooth
      const clickBuffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.015), this.ctx.sampleRate);
      const clickData = clickBuffer.getChannelData(0);
      for (let i = 0; i < clickData.length; i++) {
        clickData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (clickData.length * 0.25));
      }
      const clickSource = this.ctx.createBufferSource();
      clickSource.buffer = clickBuffer;
      const clickGain = this.ctx.createGain();
      clickGain.gain.setValueAtTime(0.08, now);
      clickSource.connect(clickGain);
      clickGain.connect(this.ctx.destination);

      osc1.connect(noteGain);
      osc2.connect(overtoneGain);
      overtoneGain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      clickSource.start(now);

      osc1.stop(now + 1.2);
      osc2.stop(now + 0.4);
    } catch {
      // Audio autoplay policy or unavailable
    }
  }

  // Synthesized mechanical percussion drum instruments with 5 pitch tiers
  public playPercussion(row: number, col: number) {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const pitchArr = this.drumScalePitches[row] || this.drumScalePitches[2];
      const pitch = pitchArr[col % pitchArr.length];

      if (row === 4) {
        // Row 4: Deep Bass Drum (沉稳大堂鼓 / 底鼓)
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        // Punchy pitch drop from 160Hz down to fundamental sub-pitch
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(pitch, now + 0.06);

        gain.gain.setValueAtTime(0.55, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.35);

      } else if (row === 3) {
        // Row 3: Tonal Woodblock / Bangu Clapper (梆子 / 板鼓)
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(pitch, now);
        osc.frequency.exponentialRampToValueAtTime(pitch * 0.7, now + 0.05);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.09);

      } else if (row === 2) {
        // Row 2: Snappy Snare Drum (连击小军鼓)
        // 1. Tonal pop
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(pitch, now);
        osc.frequency.exponentialRampToValueAtTime(pitch * 0.5, now + 0.08);
        oscGain.gain.setValueAtTime(0.3, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(oscGain);
        oscGain.connect(this.ctx.destination);

        // 2. Snare rattle noise
        const noiseLen = Math.floor(this.ctx.sampleRate * 0.16);
        const noiseBuf = this.ctx.createBuffer(1, noiseLen, this.ctx.sampleRate);
        const data = noiseBuf.getChannelData(0);
        for (let i = 0; i < noiseLen; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (noiseLen * 0.35));
        }
        const noiseSrc = this.ctx.createBufferSource();
        noiseSrc.buffer = noiseBuf;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1400, now);
        filter.Q.setValueAtTime(1.5, now);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.28, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

        noiseSrc.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);

        osc.start(now);
        noiseSrc.start(now);
        osc.stop(now + 0.13);
        noiseSrc.stop(now + 0.18);

      } else if (row === 1) {
        // Row 1: Tenor Tom / War Drum (回响堂鼓 / 通鼓)
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(pitch * 1.5, now);
        osc.frequency.exponentialRampToValueAtTime(pitch, now + 0.07);

        gain.gain.setValueAtTime(0.42, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.28);

      } else {
        // Row 0: Cymbals / Hi-Hat / Chime Slap (钹铃 / 碰铃 / 水袖响镲)
        const len = Math.floor(this.ctx.sampleRate * 0.09);
        const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) {
          d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.25));
        }
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(pitch, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        src.start(now);
        src.stop(now + 0.1);
      }
    } catch {
      // Audio autoplay policy or unavailable
    }
  }

  // Soft sound when placing/removing ink drop
  public playInkDrop() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      // Pitch drop mimicking water droplet hitting paper
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.08);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch {
      // Ignore audio error
    }
  }
}

export const soundEngine = new SoundEngine();
