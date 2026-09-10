import { AtomicClip, AudioBeatInfo, MatrixState, PhraseSlot, StyleBias } from '../types';
import { ATOMIC_CLIPS } from '../data/atomicClips';

class AudioChoreographyEngine {
  private audioCtx: AudioContext | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private isPlaying = false;
  private playbackStartTime = 0;
  private playbackPauseOffset = 0;
  private playbackSpeed = 1.0;

  private currentBeatInfo: AudioBeatInfo | null = null;

  private getContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Generates an authentic classical Chinese demo piece (bamboo flute + guzheng + chime)
   * if user doesn't upload their own audio.
   */
  public async generateClassicalDemo(): Promise<AudioBuffer> {
    const ctx = this.getContext();
    const sampleRate = ctx.sampleRate;
    const duration = 8.0; // 8 seconds, loops across the 16 beats at 120 BPM
    const length = sampleRate * duration;
    const buffer = ctx.createBuffer(2, length, sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    // Pentatonic scale frequencies: Gong (Do), Shang (Re), Jiao (Mi), Zhi (Sol), Yu (La)
    // C4, D4, E4, G4, A4, C5, D5, E5, G5, A5
    const pentatonic = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 880.0];

    // Compose a gentle classical flute & zither progression across 16 beats
    // Phrases:
    // Phrase 1 (0-2s): Gentle intro (Yu & Zhi)
    // Phrase 2 (2-4s): Gathering flow (Gong, Shang, Jiao)
    // Phrase 3 (4-6s): Climax flourish (High G5, E5, D5)
    // Phrase 4 (6-8s): Settling bow (Low Gong & Yu chime)
    const melodyBeats = [
      { beat: 0, freq: pentatonic[4], dur: 0.9, vol: 0.28 },
      { beat: 2, freq: pentatonic[3], dur: 0.7, vol: 0.25 },
      { beat: 4, freq: pentatonic[0], dur: 0.5, vol: 0.32 },
      { beat: 5, freq: pentatonic[1], dur: 0.5, vol: 0.35 },
      { beat: 6, freq: pentatonic[2], dur: 0.8, vol: 0.38 },
      { beat: 8, freq: pentatonic[8], dur: 0.4, vol: 0.55 }, // Climax peak
      { beat: 9, freq: pentatonic[7], dur: 0.4, vol: 0.50 },
      { beat: 10, freq: pentatonic[6], dur: 0.6, vol: 0.45 },
      { beat: 12, freq: pentatonic[3], dur: 0.8, vol: 0.35 },
      { beat: 14, freq: pentatonic[0], dur: 1.4, vol: 0.30 }, // Serene closing
    ];

    const beatDuration = duration / 16;

    for (const note of melodyBeats) {
      const startTime = note.beat * beatDuration;
      const noteSamples = Math.floor(note.dur * sampleRate);
      const startSample = Math.floor(startTime * sampleRate);

      for (let i = 0; i < noteSamples && startSample + i < length; i++) {
        const t = i / sampleRate;
        // Flute timbre with subtle breath noise and gentle vibrato
        const vibrato = 1 + 0.012 * Math.sin(2 * Math.PI * 5.5 * t);
        const freq = note.freq * vibrato;
        // Envelope: soft swell and decay
        const env = Math.sin((Math.PI * i) / noteSamples);
        const breath = (Math.random() * 2 - 1) * 0.02;

        const val = (Math.sin(2 * Math.PI * freq * t) * 0.7 +
          Math.sin(2 * Math.PI * freq * 2 * t) * 0.22 +
          Math.sin(2 * Math.PI * freq * 3 * t) * 0.08 + breath) * env * note.vol;

        left[startSample + i] += val;
        right[startSample + i] += val * 0.95;
      }
    }

    // Add wooden drum / chime on downbeats (beats 0, 4, 8, 12)
    for (let beat = 0; beat < 16; beat += 4) {
      const startTime = beat * beatDuration;
      const startSample = Math.floor(startTime * sampleRate);
      const drumSamples = Math.floor(0.25 * sampleRate);

      for (let i = 0; i < drumSamples && startSample + i < length; i++) {
        const t = i / sampleRate;
        const env = Math.exp(-t * 18);
        const drumPitch = 120 * Math.exp(-t * 30);
        const strike = Math.sin(2 * Math.PI * drumPitch * t) * env * 0.4;
        left[startSample + i] += strike;
        right[startSample + i] += strike;
      }
    }

    // Normalize
    let maxPeak = 0.001;
    for (let i = 0; i < length; i++) {
      maxPeak = Math.max(maxPeak, Math.abs(left[i]), Math.abs(right[i]));
    }
    const norm = 0.85 / maxPeak;
    for (let i = 0; i < length; i++) {
      left[i] *= norm;
      right[i] *= norm;
    }

    this.audioBuffer = buffer;
    this.currentBeatInfo = this.analyzeBuffer(buffer);
    return buffer;
  }

  /**
   * Decode an uploaded user audio file
   */
  public async loadAudioFile(file: File): Promise<AudioBeatInfo> {
    const ctx = this.getContext();
    const arrayBuffer = await file.arrayBuffer();
    const decoded = await ctx.decodeAudioData(arrayBuffer);
    this.audioBuffer = decoded;
    const beatInfo = this.analyzeBuffer(decoded);
    this.currentBeatInfo = beatInfo;
    return beatInfo;
  }

  /**
   * Acoustic analysis: energy detection, beat quantization, phrase segmentation
   */
  public analyzeBuffer(buffer: AudioBuffer): AudioBeatInfo {
    const channel = buffer.getChannelData(0);
    const sampleRate = buffer.sampleRate;
    const duration = buffer.duration;

    // Build visual peaks waveform (120 points)
    const peakCount = 128;
    const blockSize = Math.floor(channel.length / peakCount);
    const peaks: number[] = [];

    for (let i = 0; i < peakCount; i++) {
      let sum = 0;
      const start = i * blockSize;
      const end = Math.min(start + blockSize, channel.length);
      for (let j = start; j < end; j++) {
        sum += channel[j] * channel[j];
      }
      peaks.push(Math.sqrt(sum / (end - start)));
    }

    // Normalize peaks
    const maxPeak = Math.max(...peaks, 0.001);
    const normalizedPeaks = peaks.map((p) => p / maxPeak);

    // Compute phrase energy for 4 phrases across the cycle
    // Phrase 0: Frames 0-3 (0% - 25% of audio)
    // Phrase 1: Frames 4-7 (25% - 50%)
    // Phrase 2: Frames 8-11 (50% - 75%)
    // Phrase 3: Frames 12-15 (75% - 100%)
    const phraseEnergies: number[] = [0, 0, 0, 0];
    const phraseSampleCount = Math.floor(channel.length / 4);

    for (let p = 0; p < 4; p++) {
      let phraseSum = 0;
      const pStart = p * phraseSampleCount;
      const pEnd = Math.min(pStart + phraseSampleCount, channel.length);
      for (let i = pStart; i < pEnd; i += 32) {
        phraseSum += channel[i] * channel[i];
      }
      phraseEnergies[p] = Math.sqrt(phraseSum / ((pEnd - pStart) / 32));
    }

    const maxPhraseEnergy = Math.max(...phraseEnergies, 0.001);
    const normalizedPhraseEnergies = phraseEnergies.map((e) => e / maxPhraseEnergy);

    // Estimate BPM (default to 96 ~ 120 BPM for classical Chinese music)
    let estimatedBpm = 96;
    if (duration > 0) {
      // Find rhythm periodicity
      const barDuration = duration / 4;
      const bpmCandidate = Math.round((60 / barDuration) * 4);
      if (bpmCandidate >= 60 && bpmCandidate <= 160) {
        estimatedBpm = bpmCandidate;
      }
    }

    // 16 beat markers
    const beats = Array.from({ length: 16 }, (_, idx) => {
      const phraseIdx = Math.floor(idx / 4);
      const isDownbeat = idx % 4 === 0;
      return {
        frame: idx,
        energy: normalizedPhraseEnergies[phraseIdx] * (isDownbeat ? 1.0 : 0.7),
        isDownbeat,
      };
    });

    const beatInfo: AudioBeatInfo = {
      peaks: normalizedPeaks,
      beats,
      duration,
      bpm: estimatedBpm,
      phraseEnergies: normalizedPhraseEnergies,
    };

    this.currentBeatInfo = beatInfo;
    return beatInfo;
  }

  /**
   * AtomicDance Choreography Planner:
   * Maps acoustic phrases into 4 cohesive Atomic Clips,
   * modulated by density and styleBias.
   */
  public planChoreography(
    beatInfo: AudioBeatInfo,
    density: number = 0.6, // 0.1 to 1.0
    styleBias: StyleBias = 'balanced'
  ): { slots: PhraseSlot[]; matrix: MatrixState } {
    const slots: PhraseSlot[] = [];
    const matrix: MatrixState = [
      Array(16).fill(0),
      Array(16).fill(0),
      Array(16).fill(0),
      Array(16).fill(0),
      Array(16).fill(0),
    ];

    // Filter candidate clips by styleBias
    const sleevesClips = ATOMIC_CLIPS.filter((c) => c.category === 'sleeves');
    const bodyClips = ATOMIC_CLIPS.filter((c) => c.category === 'body');
    const dynamicClips = ATOMIC_CLIPS.filter((c) => c.category === 'dynamic');
    const calmClips = ATOMIC_CLIPS.filter((c) => c.category === 'calm');
    const balancedClips = ATOMIC_CLIPS.filter((c) => c.category === 'balanced');

    for (let phraseIdx = 0; phraseIdx < 4; phraseIdx++) {
      const energy = beatInfo.phraseEnergies[phraseIdx] ?? 0.5;
      let candidatePool: AtomicClip[] = [];

      // 1. Phrase character determination based on energy
      if (energy > 0.72) {
        // High energy climax -> swift, dramatic postures
        candidatePool = [...dynamicClips, ...sleevesClips];
      } else if (energy < 0.38) {
        // Low energy calm -> serene, mindful postures
        candidatePool = [...calmClips, ...bodyClips];
      } else {
        // Moderate energy -> flowing or balanced postures
        candidatePool = [...balancedClips, ...sleevesClips, ...bodyClips];
      }

      // 2. Modulate pool with Style Bias
      if (styleBias === 'sleeves') {
        const biased = candidatePool.filter((c) => c.category === 'sleeves');
        if (biased.length > 0) candidatePool = biased;
      } else if (styleBias === 'body') {
        const biased = candidatePool.filter((c) => c.category === 'body');
        if (biased.length > 0) candidatePool = biased;
      }

      // Fallback if empty
      if (candidatePool.length === 0) candidatePool = ATOMIC_CLIPS;

      // Select clip (pseudo-randomly seeded by phrase energy and index)
      const selectedClip = candidatePool[(phraseIdx * 3 + Math.floor(energy * 7)) % candidatePool.length];

      slots.push({
        index: phraseIdx,
        clipId: selectedClip.id,
        clipName: selectedClip.name,
        isCustomized: false,
      });

      // 3. Populate matrix (4 frames per phrase) with density modulation
      const startCol = phraseIdx * 4;
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 4; col++) {
          const rawVal = selectedClip.pattern[row]?.[col] ?? 0;
          if (rawVal === 1) {
            // Downbeat (col 0) is preserved unless density is extremely low (< 0.25)
            const isDownbeat = col === 0;
            const threshold = isDownbeat ? 0.2 : 1.0 - density;

            // Density modulation: sparsify if density is low, add decor if high
            if (density >= 0.3 || isDownbeat) {
              matrix[row][startCol + col] = 1;
            } else {
              matrix[row][startCol + col] = 0;
            }
          } else if (density > 0.85 && (row === 0 || row === 2 || row === 3)) {
            // High density adds occasional light ornamentation
            if (col === 2 && phraseIdx % 2 === 0) {
              matrix[row][startCol + col] = 1;
            }
          }
        }
      }
    }

    return { slots, matrix };
  }

  /**
   * Apply a specific atomic clip into a single phrase slot (0-3)
   */
  public applyClipToSlot(
    currentMatrix: MatrixState,
    slotIdx: number,
    clip: AtomicClip,
    density: number = 0.6
  ): MatrixState {
    const newMatrix = currentMatrix.map((r) => [...r]);
    const startCol = slotIdx * 4;

    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 4; col++) {
        const rawVal = clip.pattern[row]?.[col] ?? 0;
        if (rawVal === 1) {
          const isDownbeat = col === 0;
          if (density >= 0.3 || isDownbeat) {
            newMatrix[row][startCol + col] = 1;
          } else {
            newMatrix[row][startCol + col] = 0;
          }
        } else {
          newMatrix[row][startCol + col] = 0;
        }
      }
    }
    return newMatrix;
  }

  /**
   * Audio playback control
   */
  public play(onEnded?: () => void) {
    if (!this.audioBuffer) return;
    const ctx = this.getContext();
    this.stop();

    const source = ctx.createBufferSource();
    source.buffer = this.audioBuffer;
    source.playbackRate.value = this.playbackSpeed;
    source.loop = true;
    source.connect(ctx.destination);

    source.start(0, this.playbackPauseOffset % this.audioBuffer.duration);
    this.playbackStartTime = ctx.currentTime - (this.playbackPauseOffset % this.audioBuffer.duration);
    this.sourceNode = source;
    this.isPlaying = true;

    source.onended = () => {
      this.isPlaying = false;
      if (onEnded) onEnded();
    };
  }

  public pause() {
    if (this.sourceNode && this.isPlaying) {
      const ctx = this.getContext();
      this.playbackPauseOffset = (ctx.currentTime - this.playbackStartTime) * this.playbackSpeed;
      try {
        this.sourceNode.stop();
      } catch {
        // ignore already stopped
      }
      this.sourceNode = null;
      this.isPlaying = false;
    }
  }

  public stop() {
    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
      } catch {
        // ignore
      }
      this.sourceNode = null;
    }
    this.isPlaying = false;
    this.playbackPauseOffset = 0;
  }

  public setSpeed(speed: number) {
    this.playbackSpeed = speed;
    if (this.sourceNode) {
      this.sourceNode.playbackRate.value = speed;
    }
  }

  public seek(progressRatio: number) {
    if (!this.audioBuffer) return;
    this.playbackPauseOffset = progressRatio * this.audioBuffer.duration;
    if (this.isPlaying) {
      this.play();
    }
  }

  public getIsPlaying() {
    return this.isPlaying;
  }

  public getBeatInfo() {
    return this.currentBeatInfo;
  }
}

export const audioChoreographer = new AudioChoreographyEngine();
