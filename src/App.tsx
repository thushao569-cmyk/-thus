import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Stage } from './components/Stage';
import { ScrollMatrix } from './components/ScrollMatrix';
import { Controls } from './components/Controls';
import { AudioPanel } from './components/AudioPanel';
import { LayoutResizer } from './components/LayoutResizer';
import { PRESETS } from './data/presets';
import { ATOMIC_CLIPS } from './data/atomicClips';
import { soundEngine } from './utils/audio';
import { PuppetPhysicsEngine } from './utils/motionPhysics';
import { audioChoreographer } from './utils/audioAnalysis';
import { PuppetModal } from './components/PuppetModal';
import {
  MatrixState,
  ActiveJoints,
  HitFlash,
  PresetPattern,
  PhraseSlot,
  AtomicClip,
  AudioBeatInfo,
  StyleBias,
  JointKinematics,
  PuppetData,
} from './types';

// Default percussion rhythm matrix for the companion drummer puppet
const COMPANION_DRUM_MATRIX: MatrixState = [
  // Row 0: 镲片 (Cymbals) - 8th note groove
  [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1],
  // Row 1: 通鼓 (Tenor Tom) - fills
  [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1],
  // Row 2: 军鼓 (Snare Drum) - backbeat on 4 & 12
  [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1],
  // Row 3: 木梆 (Woodblock) - syncopation
  [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 1],
  // Row 4: 底鼓 (Bass Drum) - downbeats
  [1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 0, 1],
];

export default function App() {
  const initialPreset = PRESETS[0];

  // 1. Multi-puppet state
  const [puppets, setPuppets] = useState<PuppetData[]>([
    {
      id: 'puppet-lead',
      name: '领舞 · 钟鸣小人',
      instrument: 'bell',
      instrumentLabel: '八音钟琴 (A5/G5/E5/D5/C5)',
      themeColor: '#C83C23',
      matrix: initialPreset.matrix.map((row) => [...row]),
      slots: [
        { index: 0, clipId: 'sleeve-cloud', clipName: '舒臂探云', isCustomized: false },
        { index: 1, clipId: 'balanced-yin-yang', clipName: '阴阳相济', isCustomized: false },
        { index: 2, clipId: 'body-breath', clipName: '吐纳归元', isCustomized: false },
        { index: 3, clipId: 'strike-calm', clipName: '沉身定势', isCustomized: false },
      ],
    },
    {
      id: 'puppet-drum',
      name: '伴舞 · 鼓点小人',
      instrument: 'drum',
      instrumentLabel: '机械打击乐 (镲片/通鼓/军鼓/梆子/底鼓)',
      themeColor: '#1D4E89',
      matrix: COMPANION_DRUM_MATRIX.map((row) => [...row]),
      slots: [
        { index: 0, clipId: 'drum-intro', clipName: '破阵鸣钲', isCustomized: false },
        { index: 1, clipId: 'drum-snare', clipName: '响弦点阵', isCustomized: false },
        { index: 2, clipId: 'drum-roll', clipName: '连通疾步', isCustomized: false },
        { index: 3, clipId: 'drum-cadence', clipName: '五音齐合', isCustomized: false },
      ],
    },
    {
      id: 'puppet-black-tux',
      name: '黑色礼服 · 小号小人',
      instrument: 'trumpet',
      instrumentLabel: '小号 (Bb5/F5/D5/Bb4/F4)',
      outfit: 'tuxedo',
      isBlackNutcracker: true,
      themeColor: '#18181B',
      matrix: [
        [1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 1],
        [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
        [0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1],
        [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0],
        [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 1],
      ],
      slots: [
        { index: 0, clipId: 'tux-1', clipName: '号鸣破晓', isCustomized: false },
        { index: 1, clipId: 'tux-2', clipName: '高亢穿云', isCustomized: false },
        { index: 2, clipId: 'tux-3', clipName: '运指疾奏', isCustomized: false },
        { index: 3, clipId: 'tux-4', clipName: '铜管合璧', isCustomized: false },
      ],
    },
    {
      id: 'puppet-princess',
      name: '糖果芭蕾公主 · 仙子舞者',
      instrument: 'harp',
      instrumentLabel: '竖琴 (C6/A5/F5/D5/C4) · 芭蕾足尖舞',
      outfit: 'princess',
      themeColor: '#EC4899',
      matrix: [
        [1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0],
        [0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0],
        [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
        [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
        [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
      ],
      slots: [
        { index: 0, clipId: 'sugar-plum-1', clipName: '仙子足尖', isCustomized: false },
        { index: 1, clipId: 'sugar-plum-2', clipName: '花之圆舞', isCustomized: false },
        { index: 2, clipId: 'sugar-plum-3', clipName: '金弦拂掠', isCustomized: false },
        { index: 3, clipId: 'sugar-plum-4', clipName: '轻盈飞旋', isCustomized: false },
      ],
    },
    {
      id: 'puppet-prince',
      name: '胡桃夹子王子 · 皇家舞者',
      instrument: 'bell',
      instrumentLabel: '八音钟琴 (A5/G5/E5/D5/C5) · 皇家仪仗舞',
      outfit: 'prince',
      themeColor: '#2563EB',
      matrix: [
        [0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
        [0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0],
        [0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0],
        [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0],
      ],
      slots: [
        { index: 0, clipId: 'prince-1', clipName: '王室仪仗', isCustomized: false },
        { index: 1, clipId: 'prince-2', clipName: '佩剑行礼', isCustomized: false },
        { index: 2, clipId: 'prince-3', clipName: '英武腾跃', isCustomized: false },
        { index: 3, clipId: 'prince-4', clipName: '双人凯旋', isCustomized: false },
      ],
    },
  ]);

  const [selectedPuppetId, setSelectedPuppetId] = useState<string>('puppet-black-tux');

  // Puppet configuration modal state
  const [isPuppetModalOpen, setIsPuppetModalOpen] = useState<boolean>(false);
  const [puppetModalMode, setPuppetModalMode] = useState<'add' | 'edit'>('add');
  const [puppetToEdit, setPuppetToEdit] = useState<PuppetData | null>(null);

  // Currently active puppet
  const selectedPuppet =
    puppets.find((p) => p.id === selectedPuppetId) || puppets[0];

  const [currentPresetId, setCurrentPresetId] = useState<string | null>(
    initialPreset.id
  );
  const [bpm, setBpm] = useState<number>(initialPreset.bpm);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Audio analysis & Macro layer
  const [density, setDensity] = useState<number>(0.6);
  const [styleBias, setStyleBias] = useState<StyleBias>('balanced');
  const [beatInfo, setBeatInfo] = useState<AudioBeatInfo | null>(null);

  // Per-puppet kinematics & active joints
  const [puppetKinematics, setPuppetKinematics] = useState<
    Record<string, JointKinematics>
  >({});
  const [puppetActiveJoints, setPuppetActiveJoints] = useState<
    Record<string, ActiveJoints>
  >({});

  // Playhead tracking
  const [needleColPos, setNeedleColPos] = useState<number>(0);
  const [activeCol, setActiveCol] = useState<number>(0);
  const [recentHits, setRecentHits] = useState<HitFlash[]>([]);
  const [ripples, setRipples] = useState<{ id: string; row: number; col: number }[]>([]);

  // Split layout resizer ratio (stage vs matrix)
  const [splitPercent, setSplitPercent] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('nutcracker_split_percent');
      if (saved) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed >= 18 && parsed <= 82) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return 52;
  });
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const workspaceRef = useRef<HTMLDivElement>(null);

  const handleSplitDrag = useCallback((newPercent: number) => {
    setSplitPercent(newPercent);
    try {
      localStorage.setItem('nutcracker_split_percent', newPercent.toString());
    } catch {
      // ignore
    }
  }, []);

  const handleResetSplit = useCallback(() => {
    setSplitPercent(52);
    try {
      localStorage.setItem('nutcracker_split_percent', '52');
    } catch {
      // ignore
    }
  }, []);

  // Physics engine instances mapped per puppet ID
  const physicsEnginesRef = useRef<Map<string, PuppetPhysicsEngine>>(new Map());

  const getPhysicsEngine = useCallback((puppetId: string) => {
    if (!physicsEnginesRef.current.has(puppetId)) {
      physicsEnginesRef.current.set(puppetId, new PuppetPhysicsEngine());
    }
    return physicsEnginesRef.current.get(puppetId)!;
  }, []);

  // High precision animation loop refs
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const needlePosRef = useRef<number>(0);
  const prevTriggeredColRef = useRef<number>(-1);

  const puppetsRef = useRef<PuppetData[]>(puppets);
  puppetsRef.current = puppets;

  const selectedPuppetIdRef = useRef<string>(selectedPuppetId);
  selectedPuppetIdRef.current = selectedPuppetId;

  const bpmRef = useRef<number>(bpm);
  bpmRef.current = bpm;

  const playbackSpeedRef = useRef<number>(playbackSpeed);
  playbackSpeedRef.current = playbackSpeed;

  const isPlayingRef = useRef<boolean>(isPlaying);
  isPlayingRef.current = isPlaying;

  // Sound mute state
  useEffect(() => {
    soundEngine.isMuted = isMuted;
  }, [isMuted]);

  // Sync playback speed to audioChoreographer
  useEffect(() => {
    audioChoreographer.setSpeed(playbackSpeed);
  }, [playbackSpeed]);

  // Toggle play/pause synchronized with audio
  const handleTogglePlay = () => {
    setIsPlaying((prev) => {
      const next = !prev;
      if (next) {
        audioChoreographer.play();
      } else {
        audioChoreographer.pause();
      }
      return next;
    });
  };

  // Open modal to add a new puppet
  const handleOpenAddPuppet = () => {
    setPuppetModalMode('add');
    setPuppetToEdit(null);
    setIsPuppetModalOpen(true);
  };

  // Open modal to edit an existing puppet
  const handleOpenEditPuppet = (puppet: PuppetData) => {
    setPuppetModalMode('edit');
    setPuppetToEdit(puppet);
    setIsPuppetModalOpen(true);
  };

  // Save created or updated puppet
  const handleSavePuppet = (savedPuppet: PuppetData) => {
    setPuppets((prev) => {
      const exists = prev.some((p) => p.id === savedPuppet.id);
      if (exists) {
        return prev.map((p) => (p.id === savedPuppet.id ? savedPuppet : p));
      } else {
        return [...prev, savedPuppet];
      }
    });
    setSelectedPuppetId(savedPuppet.id);
    soundEngine.playInkDrop();
  };

  // Delete puppet handler
  const handleDeletePuppet = (puppetId: string) => {
    setPuppets((prev) => {
      if (prev.length <= 1) return prev;
      const remaining = prev.filter((p) => p.id !== puppetId);
      if (selectedPuppetId === puppetId && remaining.length > 0) {
        setSelectedPuppetId(remaining[0].id);
      }
      return remaining;
    });
    soundEngine.playInkDrop();
  };

  // Audio loaded handler from AudioPanel
  const handleAudioLoaded = useCallback(
    (info: AudioBeatInfo) => {
      setBeatInfo(info);
      if (info.bpm && info.bpm >= 60 && info.bpm <= 160) {
        setBpm(info.bpm);
      }
      // Auto plan initial AtomicDance choreography for the selected puppet
      const planned = audioChoreographer.planChoreography(info, density, styleBias);
      setPuppets((prev) =>
        prev.map((p) =>
          p.id === selectedPuppetIdRef.current
            ? { ...p, matrix: planned.matrix, slots: planned.slots }
            : p
        )
      );
      setCurrentPresetId(null);
      getPhysicsEngine(selectedPuppetIdRef.current).reset();
    },
    [density, styleBias, getPhysicsEngine]
  );

  // Macro Density change handler
  const handleDensityChange = (newDensity: number) => {
    setDensity(newDensity);
    if (beatInfo) {
      const planned = audioChoreographer.planChoreography(beatInfo, newDensity, styleBias);
      setPuppets((prev) =>
        prev.map((p) =>
          p.id === selectedPuppetIdRef.current
            ? { ...p, matrix: planned.matrix, slots: planned.slots }
            : p
        )
      );
      setCurrentPresetId(null);
    }
  };

  // Macro StyleBias change handler
  const handleStyleBiasChange = (newBias: StyleBias) => {
    setStyleBias(newBias);
    if (beatInfo) {
      const planned = audioChoreographer.planChoreography(beatInfo, density, newBias);
      setPuppets((prev) =>
        prev.map((p) =>
          p.id === selectedPuppetIdRef.current
            ? { ...p, matrix: planned.matrix, slots: planned.slots }
            : p
        )
      );
      setCurrentPresetId(null);
    }
  };

  // Macro Regenerate handler (重新演绎)
  const handleRegenerate = () => {
    if (beatInfo) {
      const planned = audioChoreographer.planChoreography(beatInfo, density, styleBias);
      setPuppets((prev) =>
        prev.map((p) =>
          p.id === selectedPuppetIdRef.current
            ? { ...p, matrix: planned.matrix, slots: planned.slots }
            : p
        )
      );
      setCurrentPresetId(null);
    } else {
      const newSlots: PhraseSlot[] = [];
      const newMatrix: MatrixState = [
        Array(16).fill(0),
        Array(16).fill(0),
        Array(16).fill(0),
        Array(16).fill(0),
        Array(16).fill(0),
      ];

      for (let p = 0; p < 4; p++) {
        const randomClip = ATOMIC_CLIPS[Math.floor(Math.random() * ATOMIC_CLIPS.length)];
        newSlots.push({
          index: p,
          clipId: randomClip.id,
          clipName: randomClip.name,
          isCustomized: false,
        });
        const startCol = p * 4;
        for (let r = 0; r < 5; r++) {
          for (let c = 0; c < 4; c++) {
            newMatrix[r][startCol + c] = randomClip.pattern[r]?.[c] ?? 0;
          }
        }
      }

      setPuppets((prev) =>
        prev.map((p) =>
          p.id === selectedPuppetIdRef.current
            ? { ...p, matrix: newMatrix, slots: newSlots }
            : p
        )
      );
      setCurrentPresetId(null);
    }
    getPhysicsEngine(selectedPuppetIdRef.current).reset();
  };

  // Mid-layer Swap Atomic Clip Slot Handler
  const handleSelectClipForSlot = useCallback((slotIdx: number, clip: AtomicClip) => {
    setPuppets((prev) =>
      prev.map((puppet) => {
        if (puppet.id !== selectedPuppetIdRef.current) return puppet;

        const updatedSlots = puppet.slots.map((s, idx) =>
          idx === slotIdx
            ? { ...s, clipId: clip.id, clipName: clip.name, isCustomized: false }
            : s
        );

        const updatedMatrix = puppet.matrix.map((row) => [...row]);
        const startCol = slotIdx * 4;
        for (let r = 0; r < 5; r++) {
          for (let c = 0; c < 4; c++) {
            updatedMatrix[r][startCol + c] = clip.pattern[r]?.[c] ?? 0;
          }
        }

        return {
          ...puppet,
          slots: updatedSlots,
          matrix: updatedMatrix,
        };
      })
    );

    setCurrentPresetId(null);
    soundEngine.playInkDrop();
  }, []);

  // Micro-level Click Stud Handler (直接微调 16x5 矩阵的每个打孔)
  const handleToggleCell = useCallback((row: number, col: number) => {
    const curPuppet = puppetsRef.current.find((p) => p.id === selectedPuppetIdRef.current);
    if (!curPuppet) return;

    const isPlacing = curPuppet.matrix[row]?.[col] === 0;

    setPuppets((prev) =>
      prev.map((puppet) => {
        if (puppet.id !== selectedPuppetIdRef.current) return puppet;

        const updatedMatrix = puppet.matrix.map((r, rIdx) =>
          rIdx === row
            ? r.map((c, cIdx) => (cIdx === col ? (c === 1 ? 0 : 1) : c))
            : [...r]
        );

        const phraseIdx = Math.floor(col / 4);
        const updatedSlots = puppet.slots.map((slot, idx) =>
          idx === phraseIdx ? { ...slot, isCustomized: true } : slot
        );

        return {
          ...puppet,
          matrix: updatedMatrix,
          slots: updatedSlots,
        };
      })
    );
    setCurrentPresetId(null);

    if (isPlacing) {
      soundEngine.playTine(row, col, curPuppet.instrument);

      const rippleId = `${row}-${col}-${Date.now()}`;
      setRipples((prev) => [...prev, { id: rippleId, row, col }]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== rippleId));
      }, 850);

      // If all 5 notes on this column are active for the selected puppet, trigger spin!
      const willHaveFive = [0, 1, 2, 3, 4].every(
        (r) => r === row || curPuppet.matrix[r]?.[col] === 1
      );
      if (willHaveFive) {
        getPhysicsEngine(curPuppet.id).triggerSpin(1);
      }
    }
  }, [getPhysicsEngine]);

  // Frame trigger handler when the needle enters a column center
  const triggerColumnActions = useCallback(
    (colIdx: number) => {
      const allPuppets = puppetsRef.current;
      const now = Date.now();
      const hitsToAdd: HitFlash[] = [];
      const newActiveMap: Record<string, ActiveJoints> = {};

      allPuppets.forEach((puppet) => {
        const mat = puppet.matrix;
        const hasLeft = mat[0]?.[colIdx] === 1;
        const hasBody = mat[1]?.[colIdx] === 1;
        const hasRight = mat[2]?.[colIdx] === 1;
        const hasLeftLeg = mat[3]?.[colIdx] === 1;
        const hasRightLeg = mat[4]?.[colIdx] === 1;

        const isFive = hasLeft && hasBody && hasRight && hasLeftLeg && hasRightLeg;

        newActiveMap[puppet.id] = {
          leftArm: hasLeft,
          body: hasBody,
          rightArm: hasRight,
          leftLeg: hasLeftLeg,
          rightLeg: hasRightLeg,
          isFiveChord: isFive,
          isTripleChord: isFive,
        };

        if (isFive) {
          getPhysicsEngine(puppet.id).triggerSpin(1);
        }

        // Play individual instrument tones: Bell vs Drum
        if (hasLeft) {
          soundEngine.playTine(0, colIdx, puppet.instrument);
          if (puppet.id === selectedPuppetIdRef.current) {
            hitsToAdd.push({ row: 0, col: colIdx, timestamp: now });
          }
        }
        if (hasBody) {
          soundEngine.playTine(1, colIdx, puppet.instrument);
          if (puppet.id === selectedPuppetIdRef.current) {
            hitsToAdd.push({ row: 1, col: colIdx, timestamp: now });
          }
        }
        if (hasRight) {
          soundEngine.playTine(2, colIdx, puppet.instrument);
          if (puppet.id === selectedPuppetIdRef.current) {
            hitsToAdd.push({ row: 2, col: colIdx, timestamp: now });
          }
        }
        if (hasLeftLeg) {
          soundEngine.playTine(3, colIdx, puppet.instrument);
          if (puppet.id === selectedPuppetIdRef.current) {
            hitsToAdd.push({ row: 3, col: colIdx, timestamp: now });
          }
        }
        if (hasRightLeg) {
          soundEngine.playTine(4, colIdx, puppet.instrument);
          if (puppet.id === selectedPuppetIdRef.current) {
            hitsToAdd.push({ row: 4, col: colIdx, timestamp: now });
          }
        }
      });

      setPuppetActiveJoints(newActiveMap);

      if (hitsToAdd.length > 0) {
        setRecentHits((prev) => [
          ...prev.filter((h) => now - h.timestamp < 350),
          ...hitsToAdd,
        ]);

        if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
          try {
            window.navigator.vibrate(12);
          } catch {
            // ignore
          }
        }
      }
    },
    [getPhysicsEngine]
  );

  // Continuous animation and physics loop for all puppets
  useEffect(() => {
    const animate = (time: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = time;
      }
      const rawDelta = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      const delta = Math.min(rawDelta, 0.05);

      if (isPlayingRef.current) {
        const currentSpeed = playbackSpeedRef.current;
        const stepsPerSecond = ((bpmRef.current / 60) * 4) * currentSpeed;
        let newPos = needlePosRef.current + delta * stepsPerSecond;

        if (newPos >= 16) {
          newPos = newPos % 16;
        }
        needlePosRef.current = newPos;
        setNeedleColPos(newPos);

        const currentCol = Math.floor(newPos);
        setActiveCol(currentCol);

        if (currentCol !== prevTriggeredColRef.current) {
          prevTriggeredColRef.current = currentCol;
          triggerColumnActions(currentCol);
        }
      }

      // Step physics for EACH puppet independently
      const currentPuppets = puppetsRef.current;
      const newKinematicsMap: Record<string, JointKinematics> = {};

      currentPuppets.forEach((p) => {
        const engine = getPhysicsEngine(p.id);
        const targetKinematics = engine.computeTargetFromMatrix(
          p.matrix,
          needlePosRef.current
        );
        const updatedKinematics = engine.step(
          targetKinematics,
          delta,
          playbackSpeedRef.current
        );
        newKinematicsMap[p.id] = updatedKinematics;
      });

      setPuppetKinematics(newKinematicsMap);

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [triggerColumnActions, getPhysicsEngine]);

  // Clean old hit flashes periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setRecentHits((prev) => prev.filter((h) => now - h.timestamp < 350));
    }, 200);
    return () => clearInterval(interval);
  }, []);

  // Manual trigger on selected puppet
  const handleManualTrigger = (joint: keyof ActiveJoints) => {
    const curId = selectedPuppetIdRef.current;
    const curPuppet = puppetsRef.current.find((p) => p.id === curId);
    if (!curPuppet) return;

    setPuppetActiveJoints((prev) => {
      const currentActive = prev[curId] || {
        leftArm: false,
        body: false,
        rightArm: false,
        leftLeg: false,
        rightLeg: false,
      };
      const next = {
        ...currentActive,
        [joint]: !currentActive[joint],
      };
      const isFive = Boolean(
        next.leftArm && next.body && next.rightArm && next.leftLeg && next.rightLeg
      );
      next.isFiveChord = isFive;
      next.isTripleChord = isFive;
      if (isFive) {
        getPhysicsEngine(curId).triggerSpin(1);
      }
      return {
        ...prev,
        [curId]: next,
      };
    });

    const rowMap: Record<string, number> = {
      leftArm: 0,
      body: 1,
      rightArm: 2,
      leftLeg: 3,
      rightLeg: 4,
    };
    if (joint in rowMap) {
      soundEngine.playTine(
        rowMap[joint as string],
        Math.floor(needlePosRef.current),
        curPuppet.instrument
      );
    }
  };

  // Preset selection (applied to selected puppet)
  const handleSelectPreset = (preset: PresetPattern) => {
    setPuppets((prev) =>
      prev.map((p) =>
        p.id === selectedPuppetIdRef.current
          ? {
              ...p,
              matrix: preset.matrix.map((r) => [...r]),
              slots: [
                { index: 0, clipId: 'preset-0', clipName: `${preset.name}·起`, isCustomized: false },
                { index: 1, clipId: 'preset-1', clipName: `${preset.name}·承`, isCustomized: false },
                { index: 2, clipId: 'preset-2', clipName: `${preset.name}·转`, isCustomized: false },
                { index: 3, clipId: 'preset-3', clipName: `${preset.name}·合`, isCustomized: false },
              ],
            }
          : p
      )
    );
    setBpm(preset.bpm);
    setCurrentPresetId(preset.id);
    needlePosRef.current = 0;
    prevTriggeredColRef.current = -1;
    setNeedleColPos(0);
    setActiveCol(0);
    getPhysicsEngine(selectedPuppetIdRef.current).reset();
  };

  // Clear all (洗墨) for selected puppet
  const handleClear = () => {
    setPuppets((prev) =>
      prev.map((p) =>
        p.id === selectedPuppetIdRef.current
          ? {
              ...p,
              matrix: [
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
              ],
              slots: p.slots.map((s) => ({ ...s, clipName: '空穴留白', isCustomized: true })),
            }
          : p
      )
    );
    setCurrentPresetId(null);
    getPhysicsEngine(selectedPuppetIdRef.current).reset();
  };

  // Randomize (随机赋势) for selected puppet
  const handleRandomize = () => {
    handleRegenerate();
  };

  // Scrub playhead to specific column
  const handleScrub = (colIdx: number) => {
    needlePosRef.current = colIdx;
    setNeedleColPos(colIdx);
    setActiveCol(colIdx);
    prevTriggeredColRef.current = colIdx;
    triggerColumnActions(colIdx);
    if (beatInfo && beatInfo.duration > 0) {
      audioChoreographer.seek(colIdx / 16);
    }
  };

  // Compute needle percentage across 16 columns
  const needlePercent = ((needleColPos + 0.5) / 16) * 100;

  return (
    <div
      className={`paper-texture w-screen h-screen flex flex-col justify-between overflow-hidden text-neutral-800 ${
        isPlaying ? 'paper-wave-active' : ''
      }`}
      style={{
        '--beat-duration': `${(60 / bpm) / playbackSpeed}s`,
        '--bar-duration': `${((60 / bpm) * 4) / playbackSpeed}s`,
      } as React.CSSProperties}
    >
      {/* 
        Middle Workspace: Upper Stage Display + Draggable Resizer Axis + Lower Interactive Matrix
      */}
      <div
        ref={workspaceRef}
        className={`flex-1 min-h-0 flex flex-col overflow-hidden relative ${
          isResizing ? 'select-none cursor-row-resize' : ''
        }`}
      >
        {/* 
          Upper Split: Stage Area + Audio Intelligence Panel (adjustable height)
        */}
        <div
          style={{ height: `${splitPercent}%` }}
          className={`min-h-0 relative border-b border-neutral-300/80 flex flex-col lg:flex-row overflow-hidden shrink-0 ${
            isResizing ? 'pointer-events-none' : ''
          }`}
        >
          {/* Left: Puppet Stage (3D / 2D) */}
          <div className="flex-1 min-h-[160px] lg:min-h-0 relative border-b lg:border-b-0 lg:border-r border-neutral-300/80">
            <Stage
              puppets={puppets}
              selectedPuppetId={selectedPuppetId}
              onSelectPuppet={setSelectedPuppetId}
              onAddPuppet={handleOpenAddPuppet}
              onEditPuppet={handleOpenEditPuppet}
              onRemovePuppet={handleDeletePuppet}
              puppetKinematics={puppetKinematics}
              puppetActiveJoints={puppetActiveJoints}
              onManualTrigger={handleManualTrigger}
              currentFrame={activeCol}
              isPlaying={isPlaying}
            />
          </div>

          {/* Right: Audio Intelligence & AtomicDance Macro Controls */}
          <div className="w-full lg:w-[420px] xl:w-[480px] p-2 sm:p-3 bg-stone-50/40 backdrop-blur-xs flex flex-col justify-center overflow-y-auto">
            <AudioPanel
              onAudioLoaded={handleAudioLoaded}
              density={density}
              onDensityChange={handleDensityChange}
              styleBias={styleBias}
              onStyleBiasChange={handleStyleBiasChange}
              onRegenerate={handleRegenerate}
              activeCol={activeCol}
              isPlaying={isPlaying}
            />
          </div>
        </div>

        {/* 
          Draggable Splitter / Resizer Axis (可上下拖动的拉轴)
        */}
        <LayoutResizer
          splitPercent={splitPercent}
          onDrag={handleSplitDrag}
          onReset={handleResetSplit}
          onSetPreset={handleSplitDrag}
          containerRef={workspaceRef}
          isDragging={isResizing}
          setIsDragging={setIsResizing}
        />

        {/* 
          Lower Split: Programming Scroll / Matrix Area with Mid-layer Atomic Dance Clips
        */}
        <div
          className={`flex-1 min-h-0 relative bg-stone-50/60 backdrop-blur-xs flex flex-col justify-center overflow-y-auto ${
            isResizing ? 'pointer-events-none' : ''
          }`}
        >
          <ScrollMatrix
            matrix={selectedPuppet.matrix}
            slots={selectedPuppet.slots}
            onSelectClipForSlot={handleSelectClipForSlot}
            onToggleCell={handleToggleCell}
            onManualTrigger={handleManualTrigger}
            needlePercent={needlePercent}
            activeCol={activeCol}
            recentHits={recentHits}
            ripples={ripples}
            onScrub={handleScrub}
            isPlaying={isPlaying}
            puppets={puppets}
            selectedPuppetId={selectedPuppetId}
            onSelectPuppet={setSelectedPuppetId}
            onAddPuppet={handleOpenAddPuppet}
            onEditPuppet={handleOpenEditPuppet}
          />
        </div>
      </div>

      {/* Bottom Controls Bar */}
      <Controls
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        bpm={bpm}
        onBpmChange={setBpm}
        playbackSpeed={playbackSpeed}
        onSpeedChange={setPlaybackSpeed}
        currentPresetId={currentPresetId}
        onSelectPreset={handleSelectPreset}
        onClear={handleClear}
        onRandomize={handleRandomize}
        isMuted={isMuted}
        onToggleMute={() => setIsMuted((m) => !m)}
        activeCol={activeCol}
      />

      {/* Puppet Costume & Instrument Selection Modal */}
      <PuppetModal
        isOpen={isPuppetModalOpen}
        onClose={() => setIsPuppetModalOpen(false)}
        onSavePuppet={handleSavePuppet}
        onDeletePuppet={handleDeletePuppet}
        initialPuppet={puppetToEdit}
        mode={puppetModalMode}
        canDelete={puppets.length > 1}
      />
    </div>
  );
}
