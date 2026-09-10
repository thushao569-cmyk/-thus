export type MatrixState = number[][]; // 5 rows x 16 cols (0 or 1)

export type PuppetInstrument = 'bell' | 'drum' | 'trumpet' | 'tuba' | 'clarinet' | 'oboe' | 'harp';

export type PuppetOutfit = 'classic' | 'tuxedo' | 'scarlet' | 'navy' | 'princess' | 'prince';

export interface PuppetData {
  id: string;
  name: string;
  role?: 'lead' | 'companion' | 'dancer';
  instrument: PuppetInstrument;
  instrumentLabel: string;
  themeColor: string; // e.g. #C83C23 (Scarlet) or #1D4E89 (Navy) or #18181B (Tuxedo Black)
  secondaryColor?: string;
  outfit?: PuppetOutfit;
  isBlackNutcracker?: boolean;
  matrix: MatrixState;
  slots: PhraseSlot[];
  phraseSlots?: PhraseSlot[];
}

export interface PresetPattern {
  id: string;
  name: string;
  enName: string;
  description: string;
  matrix: MatrixState;
  bpm: number;
}

export interface ActiveJoints {
  leftArm: boolean;
  body: boolean;
  rightArm: boolean;
  leftLeg: boolean;
  rightLeg: boolean;
  isFiveChord?: boolean;
  isTripleChord?: boolean;
}

export interface JointKinematics {
  leftArmAngle: number; // degrees, e.g. 0 to -48 deg (or -5 deg during spin)
  bodyElevate: number;  // px, e.g. 0 to -22 px
  bodyTilt: number;     // degrees, subtle body sway, e.g. -3 to +3 deg
  rightArmAngle: number; // degrees, e.g. 0 to +48 deg (or -120 deg when single hand raised high)
  leftLegAngle: number;  // degrees, e.g. 0 to -35 deg (forward kick/step)
  rightLegAngle: number; // degrees, e.g. 0 to -35 deg (forward kick/step)
  spinAngle?: number;    // degrees (0 to 360+) for the 360-degree pirouette rotation
  isFiveChord?: boolean; // whether on a beat where all 5 notes are active
  isTripleChord?: boolean;
}

export interface HitFlash {
  row: number;
  col: number;
  timestamp: number;
}

export type StyleBias = 'sleeves' | 'body' | 'balanced';

export interface AtomicClip {
  id: string;
  name: string;
  category: 'sleeves' | 'body' | 'balanced' | 'dynamic' | 'calm';
  categoryLabel: string;
  description: string;
  pattern: number[][]; // 5 rows x 4 cols
  tags: string[];
}

export interface PhraseSlot {
  index: number; // 0, 1, 2, 3 (each slot corresponds to 4 frames)
  clipId: string;
  clipName: string;
  isCustomized?: boolean;
}

export interface AudioBeatInfo {
  peaks: number[]; // normalized waveform points
  beats: { frame: number; energy: number; isDownbeat: boolean }[];
  duration: number;
  bpm: number;
  phraseEnergies: number[]; // 4 phrase energy values (0.0 to 1.0)
}
