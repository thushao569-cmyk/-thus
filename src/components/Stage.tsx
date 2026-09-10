import React, { useState } from 'react';
import { ActiveJoints, JointKinematics, PuppetData } from '../types';
import { Nutcracker3DScene } from './Nutcracker3DScene';
import { Box, Layers, Plus, Music, Volume2, Users, Sliders } from 'lucide-react';

interface StageProps {
  puppets: PuppetData[];
  selectedPuppetId: string;
  onSelectPuppet: (puppetId: string) => void;
  onAddPuppet?: () => void;
  onEditPuppet?: (puppet: PuppetData) => void;
  onRemovePuppet?: (puppetId: string) => void;
  puppetKinematics: Record<string, JointKinematics>;
  puppetActiveJoints: Record<string, ActiveJoints>;
  onManualTrigger?: (joint: 'leftArm' | 'body' | 'rightArm' | 'leftLeg' | 'rightLeg') => void;
  currentFrame: number;
  isPlaying: boolean;
}

export const Stage: React.FC<StageProps> = ({
  puppets,
  selectedPuppetId,
  onSelectPuppet,
  onAddPuppet,
  onEditPuppet,
  onRemovePuppet,
  puppetKinematics,
  puppetActiveJoints,
  onManualTrigger,
  currentFrame,
  isPlaying,
}) => {
  // Toggle between 3D stereoscopic model (default) and 2D classic flat representation
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');

  const selectedPuppet = puppets.find((p) => p.id === selectedPuppetId) || puppets[0];
  const kinematics = puppetKinematics[selectedPuppetId];
  const activeJoints = puppetActiveJoints[selectedPuppetId] || {
    leftArm: false,
    body: false,
    rightArm: false,
    leftLeg: false,
    rightLeg: false,
  };

  // Determine if all 5 joints/notes are active on the current beat
  const isFiveManual = Boolean(
    activeJoints.leftArm &&
      activeJoints.body &&
      activeJoints.rightArm &&
      activeJoints.leftLeg &&
      activeJoints.rightLeg
  );
  const isFiveChord = Boolean(
    kinematics?.isFiveChord ?? (activeJoints.isFiveChord || isFiveManual)
  );

  // Use kinematics if available, else fallback to discrete activeJoints
  let leftArmAngle = kinematics ? kinematics.leftArmAngle : (activeJoints.leftArm ? -45 : 0);
  let bodyElevate = kinematics ? kinematics.bodyElevate : (activeJoints.body ? -20 : 0);
  let bodyTilt = kinematics ? kinematics.bodyTilt : 0;
  let rightArmAngle = kinematics ? kinematics.rightArmAngle : (activeJoints.rightArm ? 45 : 0);
  let leftLegAngle = kinematics ? (kinematics.leftLegAngle ?? 0) : (activeJoints.leftLeg ? -25 : 0);
  let rightLegAngle = kinematics ? (kinematics.rightLegAngle ?? 0) : (activeJoints.rightLeg ? -25 : 0);
  const spinAngle = kinematics?.spinAngle ?? 0;

  // Discrete fallback when all 5 joints are manually triggered without continuous physics
  if (!kinematics && isFiveManual) {
    rightArmAngle = -120; // 举起单手 (Right arm raised high overhead)
    leftArmAngle = -5;    // 垂手护腰 (Left arm tucked gracefully at waist)
    bodyElevate = -18;
    bodyTilt = 0;
    leftLegAngle = 0;
    rightLegAngle = 0;
  }

  // Jaw displacement for the Nutcracker mouth mechanism (drops when body elevates)
  const jawOffset = Math.min(8, Math.abs(bodyElevate) * 0.4);

  return (
    <div
      id="stage-container"
      className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden select-none"
    >
      {/* Subtle Background Ink Landscape & Swallow with Paper Wave */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-30 stage-paper-wave"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 1200 800"
      >
        <defs>
          <linearGradient id="mist-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#8A959E" stopOpacity="0.15" />
            <stop offset="45%" stopColor="#4A5863" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#F5F5F0" stopOpacity="0" />
          </linearGradient>

          <filter id="brush-turb" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="4" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="6" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>

        {/* Distant ink mountain silhouette */}
        <path
          d="M-50 480 Q 200 280 460 380 T 880 290 Q 1050 250 1250 420 L 1250 850 L -50 850 Z"
          fill="url(#mist-grad)"
          filter="url(#brush-turb)"
        />
        <path
          d="M 120 540 Q 380 390 620 460 T 1150 410 L 1250 850 L 80 850 Z"
          fill="#3B444B"
          fillOpacity="0.04"
          filter="url(#brush-turb)"
        />

        {/* Traditional soaring ink swallow (燕子) */}
        <g transform="translate(920, 110) scale(0.65) rotate(-15)" opacity="0.6">
          <path
            d="M 50 40 C 60 25, 75 22, 90 28 C 85 36, 75 42, 60 46 Z"
            fill="#1A1A1A"
          />
          <path
            d="M 50 40 C 35 55, 10 90, 0 130 C 12 95, 28 65, 46 45 C 38 65, 20 115, 12 155 C 28 115, 44 75, 52 42 Z"
            fill="#1A1A1A"
          />
          <path
            d="M 70 30 C 65 0, 45 -40, 15 -70 C 40 -35, 60 -10, 72 25 Z"
            fill="#262626"
          />
          <path
            d="M 78 33 C 95 10, 125 -20, 160 -50 C 130 -15, 105 15, 82 36 Z"
            fill="#1E1E1E"
          />
          <circle cx="86" cy="30" r="2.5" fill="#C83C23" opacity="0.85" />
        </g>
      </svg>

      {/* Top Header Watermark / Seal Info */}
      <div className="absolute top-4 left-6 flex items-center gap-3 z-30">
        <div className="seal-badge px-2 py-2 text-xs leading-tight font-serif select-none">
          八音木偶
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-semibold tracking-wider text-neutral-800 flex items-center gap-2">
              <span>八音盒胡桃夹子</span>
              <span className="text-xs text-neutral-500 font-normal tracking-normal border border-neutral-300 rounded px-1.5 py-0.5">
                多人偶连奏
              </span>
            </h1>

            {/* 3D Stereoscopic / 2D Classical Mode Switcher */}
            <div className="flex items-center bg-white/90 backdrop-blur-md p-0.5 rounded-lg border border-neutral-300 shadow-xs text-xs font-serif ml-1">
              <button
                onClick={() => setViewMode('3d')}
                className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                  viewMode === '3d'
                    ? 'bg-neutral-900 text-amber-200 shadow-xs font-medium'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
                title="开启 Three.js 3D 立体拟真木偶模型，支持多角度旋转与真实光影"
              >
                <Box className="w-3.5 h-3.5 text-amber-400" />
                <span>3D 立体</span>
              </button>
              <button
                onClick={() => setViewMode('2d')}
                className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                  viewMode === '2d'
                    ? 'bg-neutral-900 text-amber-200 shadow-xs font-medium'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
                title="切换为 2D 经典工笔平面视图"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>2D 工笔</span>
              </button>
            </div>

            {/* Multi-puppet selector tabs */}
            <div className="flex items-center gap-1.5 ml-2 flex-wrap">
              {puppets.map((p) => {
                const isSel = p.id === selectedPuppetId;
                const instIcons: Record<string, string> = {
                  trumpet: '🎺',
                  tuba: '📯',
                  clarinet: '🎷',
                  oboe: '🎶',
                  harp: '🎼',
                  drum: '🥁',
                  bell: '🔔',
                };
                const icon = instIcons[p.instrument] || '🔔';

                const outfitIcon =
                  p.outfit === 'tuxedo'
                    ? '🎩'
                    : p.outfit === 'princess'
                    ? '🩰'
                    : p.outfit === 'prince'
                    ? '👑'
                    : icon;

                return (
                  <button
                    key={p.id}
                    onClick={() => onSelectPuppet(p.id)}
                    className={`px-2.5 py-1 rounded-lg border text-xs font-serif transition-all flex items-center gap-1.5 cursor-pointer shadow-xs backdrop-blur-md ${
                      isSel
                        ? p.outfit === 'tuxedo'
                          ? 'bg-neutral-900 text-amber-200 border-amber-500 ring-1 ring-amber-400 font-semibold'
                          : p.outfit === 'princess'
                          ? 'bg-pink-900 text-pink-100 border-pink-400 ring-1 ring-pink-400 font-semibold'
                          : p.outfit === 'prince'
                          ? 'bg-blue-900 text-blue-100 border-blue-400 ring-1 ring-blue-300 font-semibold'
                          : p.instrument === 'drum'
                          ? 'bg-blue-900 text-blue-100 border-blue-600 ring-1 ring-blue-400 font-semibold'
                          : 'bg-amber-900 text-amber-100 border-amber-600 ring-1 ring-amber-400 font-semibold'
                        : 'bg-white/80 text-neutral-600 border-neutral-300 hover:bg-neutral-100'
                    }`}
                    title={`点击切换编辑【${p.name}】(${p.instrumentLabel})`}
                  >
                    <span>{outfitIcon}</span>
                    <span>{p.name}</span>
                  </button>
                );
              })}

              {onEditPuppet && selectedPuppet && (
                <button
                  onClick={() => onEditPuppet(selectedPuppet)}
                  className="px-2.5 py-1 rounded-lg border border-amber-600/40 bg-amber-50/90 hover:bg-amber-100 text-amber-900 text-xs font-serif transition-all flex items-center gap-1 shadow-xs cursor-pointer"
                  title="更改当前人偶的外观服饰(黑色燕尾服/军装)与手持乐器(小号/大号/单簧管/双簧管/竖琴/鼓)"
                >
                  <Sliders className="w-3 h-3 text-amber-700" />
                  <span>造型/乐器</span>
                </button>
              )}

              {onAddPuppet && (
                <button
                  onClick={onAddPuppet}
                  className="px-2.5 py-1 rounded-lg border border-dashed border-neutral-400 bg-white/70 hover:bg-amber-50 hover:border-amber-600 text-neutral-700 hover:text-amber-800 text-xs font-serif transition-all flex items-center gap-1 shadow-xs cursor-pointer"
                  title="增加新的木偶人偶：支持黑色燕尾服与小号、大号、单簧管、双簧管、竖琴、鼓等多种乐器"
                >
                  <Plus className="w-3 h-3 text-amber-700" />
                  <span>加人偶</span>
                </button>
              )}
            </div>
          </div>
          <p className="text-xs text-neutral-500 tracking-wide mt-0.5 font-light">
            机械八音盒凸点编程 · 多人偶独立动作编辑 · 钟鸣主舞与鼓点伴奏联动合奏
          </p>
        </div>
      </div>

      {viewMode === '3d' ? (
        /* Primary 3D Stereoscopic Nutcracker Model Scene */
        <div className="w-full h-full min-h-[440px] flex items-center justify-center relative z-10">
          <Nutcracker3DScene
            puppets={puppets}
            selectedPuppetId={selectedPuppetId}
            onSelectPuppet={onSelectPuppet}
            puppetKinematics={puppetKinematics}
            puppetActiveJoints={puppetActiveJoints}
            isPlaying={isPlaying}
            onManualTrigger={onManualTrigger}
          />
        </div>
      ) : (
        /* 2D Classical Paper/Wood Cut Puppet View */
        <>
          {/* Current Motion Badges */}
          <div className="absolute top-4 right-6 flex items-center gap-2 z-10 flex-wrap justify-end">
            {/* Five-note chord active indicator badge */}
            {(isFiveChord || Math.abs(spinAngle % 360) > 1.5) && (
              <div
                className="px-3 py-1 text-xs rounded-full border border-amber-500/80 bg-amber-950/90 text-amber-200 shadow-md flex items-center gap-1.5 animate-pulse"
                title="同一拍五个音阶同时确认按动：模型举起单手高举并完成 360° 华尔兹转圈"
              >
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span className="font-serif font-semibold tracking-wide">
                  五音齐鸣 · 举手旋舞 ({Math.round(((spinAngle % 360) + 360) % 360)}°)
                </span>
              </div>
            )}

            <div
              onClick={() => onManualTrigger && onManualTrigger('leftArm')}
              className={`cursor-pointer px-2.5 py-1 text-xs rounded-full border transition-all duration-200 flex items-center gap-1.5 ${
                isFiveChord
                  ? 'bg-amber-900/40 text-amber-200 border-amber-600/60'
                  : Math.abs(leftArmAngle) > 8
                  ? 'bg-neutral-900 text-amber-50 border-neutral-900 shadow-sm'
                  : 'bg-white/70 text-neutral-600 border-neutral-300 hover:border-neutral-500'
              }`}
              title="点击手动触发左臂动作"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isFiveChord ? 'bg-amber-400' : Math.abs(leftArmAngle) > 8 ? 'bg-[#C83C23]' : 'bg-neutral-400'}`} />
              <span>左臂：{isFiveChord ? '垂仪护腰 (-5°)' : Math.abs(leftArmAngle) > 5 ? `仪仗举杖 (${Math.round(leftArmAngle)}°)` : '垂仪待命'}</span>
            </div>

            <div
              onClick={() => onManualTrigger && onManualTrigger('body')}
              className={`cursor-pointer px-2.5 py-1 text-xs rounded-full border transition-all duration-200 flex items-center gap-1.5 ${
                isFiveChord
                  ? 'bg-amber-900/40 text-amber-200 border-amber-600/60'
                  : Math.abs(bodyElevate) > 4
                  ? 'bg-neutral-900 text-amber-50 border-neutral-900 shadow-sm'
                  : 'bg-white/70 text-neutral-600 border-neutral-300 hover:border-neutral-500'
              }`}
              title="点击手动触发下颌咬合与挺立"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isFiveChord ? 'bg-amber-400' : Math.abs(bodyElevate) > 4 ? 'bg-[#C83C23]' : 'bg-neutral-400'}`} />
              <span>机芯：{isFiveChord ? '提踵立姿 (-18px)' : Math.abs(bodyElevate) > 3 ? `颌齿咬合 (${Math.round(bodyElevate)}px)` : '肃立归位'}</span>
            </div>

            <div
              onClick={() => onManualTrigger && onManualTrigger('rightArm')}
              className={`cursor-pointer px-2.5 py-1 text-xs rounded-full border transition-all duration-200 flex items-center gap-1.5 ${
                isFiveChord || rightArmAngle < -60
                  ? 'bg-neutral-900 text-amber-300 border-amber-500 shadow-sm ring-1 ring-amber-400/50'
                  : Math.abs(rightArmAngle) > 8
                  ? 'bg-neutral-900 text-amber-50 border-neutral-900 shadow-sm'
                  : 'bg-white/70 text-neutral-600 border-neutral-300 hover:border-neutral-500'
              }`}
              title="点击手动触发右臂击打动作"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isFiveChord || rightArmAngle < -60 ? 'bg-amber-400' : Math.abs(rightArmAngle) > 8 ? 'bg-[#C83C23]' : 'bg-neutral-400'}`} />
              <span>右臂：{rightArmAngle < -60 ? `举起单手高擎 (${Math.round(rightArmAngle)}°)` : Math.abs(rightArmAngle) > 5 ? `击鼓奏乐 (${Math.round(rightArmAngle)}°)` : '握槌待命'}</span>
            </div>

            <div
              onClick={() => onManualTrigger && onManualTrigger('leftLeg')}
              className={`cursor-pointer px-2.5 py-1 text-xs rounded-full border transition-all duration-200 flex items-center gap-1.5 ${
                isFiveChord
                  ? 'bg-amber-900/40 text-amber-200 border-amber-600/60'
                  : Math.abs(leftLegAngle) > 8
                  ? 'bg-neutral-900 text-amber-50 border-neutral-900 shadow-sm'
                  : 'bg-white/70 text-neutral-600 border-neutral-300 hover:border-neutral-500'
              }`}
              title="点击手动触发左腿踏步动作"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isFiveChord ? 'bg-amber-400' : Math.abs(leftLegAngle) > 8 ? 'bg-[#C83C23]' : 'bg-neutral-400'}`} />
              <span>左腿：{Math.abs(leftLegAngle) > 5 ? `踏步跃步 (${Math.round(leftLegAngle)}°)` : '立定稳固'}</span>
            </div>

            <div
              onClick={() => onManualTrigger && onManualTrigger('rightLeg')}
              className={`cursor-pointer px-2.5 py-1 text-xs rounded-full border transition-all duration-200 flex items-center gap-1.5 ${
                isFiveChord
                  ? 'bg-amber-900/40 text-amber-200 border-amber-600/60'
                  : Math.abs(rightLegAngle) > 8
                  ? 'bg-neutral-900 text-amber-50 border-neutral-900 shadow-sm'
                  : 'bg-white/70 text-neutral-600 border-neutral-300 hover:border-neutral-500'
              }`}
              title="点击手动触发右腿踏步动作"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isFiveChord ? 'bg-amber-400' : Math.abs(rightLegAngle) > 8 ? 'bg-[#C83C23]' : 'bg-neutral-400'}`} />
              <span>右腿：{Math.abs(rightLegAngle) > 5 ? `踏步点地 (${Math.round(rightLegAngle)}°)` : '立定稳固'}</span>
            </div>
          </div>

      {/* Main SVG Figure Stage */}
      <div className="relative w-full max-w-[540px] aspect-[1/1] max-h-[55vh] flex items-center justify-center figure-breathe-container">
        <svg
          id="ink-puppet-svg"
          viewBox="0 0 600 600"
          className="w-full h-full overflow-visible filter drop-shadow-sm"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Organic ink bleeding filter */}
            <filter id="ink-bleed" x="-20%" y="-20%" width="140%" height="140%">
              <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
            </filter>

            {/* Brass / Gold Gradients for Music Box & Nutcracker Trim */}
            <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F7E2A0" />
              <stop offset="35%" stopColor="#D4AF37" />
              <stop offset="70%" stopColor="#B38B22" />
              <stop offset="100%" stopColor="#F5D77F" />
            </linearGradient>

            <linearGradient id="brass-plate" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#D4AF37" />
              <stop offset="50%" stopColor="#997A1E" />
              <stop offset="100%" stopColor="#5E4910" />
            </linearGradient>

            {/* Nutcracker Regal Cinnabar Tunic Gradient */}
            <linearGradient id="tunic-red" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#9C2714" />
              <stop offset="25%" stopColor="#C83C23" />
              <stop offset="50%" stopColor="#D8482F" />
              <stop offset="75%" stopColor="#C83C23" />
              <stop offset="100%" stopColor="#8A2010" />
            </linearGradient>

            {/* Black Shako Hat Lacquer Gradient */}
            <linearGradient id="shako-black" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#141414" />
              <stop offset="35%" stopColor="#2E2E2E" />
              <stop offset="50%" stopColor="#3D3D3D" />
              <stop offset="65%" stopColor="#222222" />
              <stop offset="100%" stopColor="#0F0F0F" />
            </linearGradient>

            {/* Wood Grain Pedestal Gradient */}
            <linearGradient id="pedestal-wood" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3D322A" />
              <stop offset="50%" stopColor="#261E19" />
              <stop offset="100%" stopColor="#181310" />
            </linearGradient>

            {/* Radial glow for gold ornaments */}
            <radialGradient id="gold-shimmer" cx="40%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#FFF2B8" />
              <stop offset="60%" stopColor="#D4AF37" />
              <stop offset="100%" stopColor="#8A6C18" />
            </radialGradient>
          </defs>

          {/* Grounding Shadow on Stage Floor (diameter doubled from 290 to 580) */}
          <ellipse
            cx="300"
            cy="540"
            rx="290"
            ry="24"
            fill="#1E1C1A"
            opacity="0.22"
            filter="url(#ink-bleed)"
          />

          {/* 
            ==================================================================
            MUSIC BOX PEDESTAL BASE (八音盒精致木质黄铜底座 - 舞台直径扩大为 2 倍)
            ==================================================================
          */}
          <g id="music-box-pedestal">
            {/* Bottom Tier Base Plate (diameter doubled from 260 to 520, rx=260) */}
            <ellipse cx="300" cy="528" rx="260" ry="24" fill="url(#pedestal-wood)" stroke="#5A4738" strokeWidth="1.5" />
            <path
              d="M 40 528 C 40 540, 560 540, 560 528 L 560 514 C 560 526, 40 526, 40 514 Z"
              fill="url(#pedestal-wood)"
            />
            {/* Brass Trim Base Ring (rx doubled from 128 to 256) */}
            <ellipse cx="300" cy="520" rx="256" ry="22" fill="none" stroke="url(#gold-grad)" strokeWidth="2.5" />

            {/* Middle Rotating Cylinder of Music Box (width doubled from 230 to 460) */}
            <path
              d="M 70 520 C 70 534, 530 534, 530 520 L 530 496 C 530 510, 70 510, 70 496 Z"
              fill="#2B221B"
            />
            {/* Decorative Brass Music Box Plate & Studs on Pedestal */}
            <path
              d="M 140 514 C 200 522, 400 522, 460 514"
              fill="none"
              stroke="url(#gold-grad)"
              strokeWidth="2"
              strokeDasharray="6 4"
            />
            <circle cx="130" cy="508" r="3" fill="url(#gold-shimmer)" />
            <circle cx="170" cy="510" r="3" fill="url(#gold-shimmer)" />
            <circle cx="220" cy="514" r="2.5" fill="url(#gold-shimmer)" />
            <circle cx="260" cy="516" r="2.5" fill="url(#gold-shimmer)" />
            <circle cx="300" cy="517" r="3.5" fill="url(#gold-shimmer)" />
            <circle cx="340" cy="516" r="2.5" fill="url(#gold-shimmer)" />
            <circle cx="380" cy="514" r="2.5" fill="url(#gold-shimmer)" />
            <circle cx="430" cy="510" r="3" fill="url(#gold-shimmer)" />
            <circle cx="470" cy="508" r="3" fill="url(#gold-shimmer)" />

            {/* Top Rotating Turntable Disc where Nutcracker Stands (diameter shrunk to 1/2 of original: rx=57, diameter=114) */}
            <ellipse cx="300" cy="495" rx="57" ry="9" fill="#3D3025" stroke="url(#gold-grad)" strokeWidth="2" />
            <ellipse cx="300" cy="493" rx="50" ry="7" fill="#1F1813" stroke="#4A3C30" strokeWidth="1" />

            {/* Turntable Perimeter Gold Studs that revolve in sync with spinAngle */}
            <g id="turntable-revolving-studs">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
                const baseRad = (i * Math.PI * 2) / 8;
                const rad = baseRad + (spinAngle * Math.PI) / 180;
                const studX = 300 + 52 * Math.cos(rad);
                const studY = 495 + 8 * Math.sin(rad);
                const depthFactor = (Math.sin(rad) + 1) / 2;
                const r = 1.2 + 0.8 * depthFactor;
                const opacity = 0.35 + 0.65 * depthFactor;
                return (
                  <circle
                    key={`turntable-stud-${i}`}
                    cx={studX}
                    cy={studY}
                    r={r}
                    fill="url(#gold-shimmer)"
                    stroke="#5E4910"
                    strokeWidth="0.6"
                    opacity={opacity}
                  />
                );
              })}
            </g>
          </g>

          {/* 
            ==================================================================
            MECHANICAL PUSHROD LINKAGES (八音盒推杆联动系统 - 保留并适配胡桃夹子)
            ==================================================================
          */}
          <g
            id="mechanical-pushrods"
            style={{
              opacity: Math.max(0.12, 0.55 * (1 - Math.min(1, Math.abs((((spinAngle % 360) + 360) % 360) - 180) / 90))),
              transition: 'opacity 0.2s ease',
            }}
          >
            {/* Guide Rail Base Plate */}
            <rect x="100" y="525" width="400" height="4" rx="2" fill="#2E2A24" stroke="#D4AF37" strokeWidth="1" />

            {/* Left Pushrod (连接左肩推杆 x=230) */}
            <line
              x1="230"
              y1="240"
              x2="230"
              y2={525 + (leftArmAngle / 48) * 12}
              stroke="#D4AF37"
              strokeWidth="2"
              strokeDasharray="4 2"
            />
            <circle cx="230" cy={525 + (leftArmAngle / 48) * 12} r="4" fill="#C83C23" stroke="#D4AF37" strokeWidth="1.5" />

            {/* Center Pushrod (连接胡桃夹子咬合机芯与脊柱 x=300) */}
            <line
              x1="300"
              y1={360 + bodyElevate}
              x2="300"
              y2={525 + (bodyElevate / 20) * 14}
              stroke="#8A6C18"
              strokeWidth="3"
            />
            <circle cx="300" cy={525 + (bodyElevate / 20) * 14} r="5" fill="#1A1A1A" stroke="#D4AF37" strokeWidth="2" />

            {/* Right Pushrod (连接右肩击鼓推杆 x=370) */}
            <line
              x1="370"
              y1="240"
              x2="370"
              y2={525 - (rightArmAngle / 48) * 12}
              stroke="#D4AF37"
              strokeWidth="2"
              strokeDasharray="4 2"
            />
            <circle cx="370" cy={525 - (rightArmAngle / 48) * 12} r="4" fill="#C83C23" stroke="#D4AF37" strokeWidth="1.5" />
          </g>

          {/* 
            ==================================================================
            NUTCRACKER PIROUETTE ASSEMBLY (三音齐鸣 · 举起单手 360° 华尔兹回旋转圈)
            ID: #nutcracker-figure
            Rotates gracefully around the music box center axis (300px, 380px)
            ==================================================================
          */}
          <g
            id="nutcracker-figure"
            style={{
              transformOrigin: '300px 380px',
              transform: `perspective(700px) rotateY(${spinAngle}deg)`,
              transformStyle: 'preserve-3d',
              willChange: 'transform',
            }}
          >
            {/* 
              ==================================================================
              LOWER BODY: NUTCRACKER BOOTS & LEGS (稳固站立在八音盒基座上的军靴)
              ==================================================================
            */}
            <g id="nutcracker-lower-body">
              {/* Left Leg Group (pivot at hip 278px 400px) */}
              <g
                id="left-leg"
                style={{
                  transformOrigin: '278px 400px',
                  transform: `rotate(${leftLegAngle}deg)`,
                  transition: kinematics ? 'none' : 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  willChange: 'transform',
                }}
              >
                {/* Crisp White Parade Breeches / Trousers */}
                <path d="M 268 400 L 260 450 L 294 450 L 298 400 Z" fill="#EAE7DE" stroke="#BFB8A9" strokeWidth="1" />
                {/* Left Boot */}
                <g id="left-boot">
                  <path
                    d="M 258 445 L 256 488 C 256 494, 246 498, 252 502 L 292 502 C 295 498, 296 492, 296 445 Z"
                    fill="#161616"
                  />
                  <rect x="256" y="445" width="40" height="7" rx="1" fill="#242424" stroke="url(#gold-grad)" strokeWidth="1.5" />
                  <circle cx="276" cy="495" r="3" fill="url(#gold-shimmer)" />
                  <rect x="254" y="498" width="40" height="4" rx="1" fill="#0D0D0D" />
                </g>
              </g>

              {/* Right Leg Group (pivot at hip 322px 400px) */}
              <g
                id="right-leg"
                style={{
                  transformOrigin: '322px 400px',
                  transform: `rotate(${rightLegAngle}deg)`,
                  transition: kinematics ? 'none' : 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  willChange: 'transform',
                }}
              >
                {/* Crisp White Parade Breeches / Trousers */}
                <path d="M 302 400 L 306 450 L 340 450 L 332 400 Z" fill="#EAE7DE" stroke="#BFB8A9" strokeWidth="1" />
                {/* Right Boot */}
                <g id="right-boot">
                  <path
                    d="M 304 445 L 304 492 C 304 498, 305 498, 308 502 L 348 502 C 354 498, 344 494, 344 488 L 342 445 Z"
                    fill="#161616"
                  />
                  <rect x="304" y="445" width="40" height="7" rx="1" fill="#242424" stroke="url(#gold-grad)" strokeWidth="1.5" />
                  <circle cx="324" cy="495" r="3" fill="url(#gold-shimmer)" />
                  <rect x="306" y="498" width="40" height="4" rx="1" fill="#0D0D0D" />
                </g>
              </g>
            </g>

          {/* 
            ==================================================================
            PART 1: BODY, HEAD & JAW (胡桃夹子躯干、面容与机械下颌)
            ID: #body
            Transform-origin: bottom center (300px 480px)
            Animated by: translateY(${bodyElevate}px) rotate(${bodyTilt}deg)
            ==================================================================
          */}
          <g
            id="body"
            className={activeJoints.body && !kinematics ? 'active-body' : ''}
            style={{
              transformOrigin: '300px 480px',
              transform: `translateY(${bodyElevate}px) rotate(${bodyTilt}deg)`,
              transition: kinematics ? 'none' : undefined,
            }}
          >
            {/* 
              Music Box Wind-up Key (八音盒背部金色发条蝶形把手) 
              Rotates continuously when isPlaying is active!
            */}
            <g id="winding-key-assembly" transform="translate(390, 335)">
              {/* Key stem / shaft entering back of jacket */}
              <rect x="-18" y="-3.5" width="20" height="7" rx="1.5" fill="url(#brass-plate)" stroke="#544010" strokeWidth="0.8" />
              
              {/* Rotating Butterfly Key Wing */}
              <g className={isPlaying ? 'winding-key-active' : ''} style={{ transformOrigin: '8px 0px' }}>
                {/* Brass Center Hub */}
                <circle cx="8" cy="0" r="7" fill="url(#gold-shimmer)" stroke="#785A14" strokeWidth="1.2" />
                <circle cx="8" cy="0" r="2.5" fill="#3D2E0B" />

                {/* Left Key Wing */}
                <path
                  d="M 8 -4 C 1 -18, -14 -16, -14 -2 C -14 10, 0 8, 8 4 Z"
                  fill="url(#gold-grad)"
                  stroke="#785A14"
                  strokeWidth="1.5"
                />
                <circle cx="-6" cy="-2" r="3" fill="#F5F5F0" opacity="0.8" />

                {/* Right Key Wing */}
                <path
                  d="M 8 -4 C 15 -18, 30 -16, 30 -2 C 30 10, 16 8, 8 4 Z"
                  fill="url(#gold-grad)"
                  stroke="#785A14"
                  strokeWidth="1.5"
                />
                <circle cx="22" cy="-2" r="3" fill="#F5F5F0" opacity="0.8" />
              </g>
            </g>

            {/* Nutcracker Wooden Lever on the Back (胡桃夹子背部开合手柄) */}
            <path
              d="M 292 245 L 290 395 L 310 395 L 308 245 Z"
              fill="#261C14"
              stroke="#4F3B2C"
              strokeWidth="1.5"
              opacity="0.8"
            />
            {/* Lever hinge knob */}
            <circle cx="300" cy="385" r="4.5" fill="url(#gold-shimmer)" stroke="#594212" strokeWidth="1" />

            {/* 
              Nutcracker Ceremonial Soldier Tunic (胡桃夹子经典朱砂红军服) 
              Shoulders taper from 230 to 370, waist at 300
            */}
            <g id="nutcracker-tunic">
              {/* Coat Base */}
              <path
                d="M 232 235 L 255 405 L 345 405 L 368 235 Z"
                fill="url(#tunic-red)"
                stroke="#6B190B"
                strokeWidth="1.5"
              />

              {/* White Ceremonial Cross-Belt Sash (X-Sash) */}
              <path d="M 248 235 L 338 405 L 348 405 L 258 235 Z" fill="#F0EDE4" opacity="0.9" />
              <path d="M 352 235 L 262 405 L 252 405 L 342 235 Z" fill="#E6E2D8" opacity="0.85" />
              {/* Center Cross Belt Medallion */}
              <circle cx="300" cy="320" r="7.5" fill="url(#gold-shimmer)" stroke="#7A5D18" strokeWidth="1.5" />
              <circle cx="300" cy="320" r="3" fill="#C83C23" />

              {/* Gold Braid Brandebourg Frog Cords (胸前双排金色盘扣花纹) */}
              <g stroke="url(#gold-grad)" strokeWidth="2.2" strokeLinecap="round" opacity="0.95">
                {/* Row 1 */}
                <line x1="264" y1="265" x2="290" y2="265" />
                <line x1="310" y1="265" x2="336" y2="265" />
                {/* Row 2 */}
                <line x1="266" y1="290" x2="290" y2="290" />
                <line x1="310" y1="290" x2="334" y2="290" />
                {/* Row 3 */}
                <line x1="268" y1="348" x2="290" y2="348" />
                <line x1="310" y1="348" x2="332" y2="348" />
                {/* Row 4 */}
                <line x1="270" y1="372" x2="290" y2="372" />
                <line x1="310" y1="372" x2="330" y2="372" />
              </g>

              {/* Twin Columns of Gleaming Golden Dome Buttons */}
              <g fill="url(#gold-shimmer)" stroke="#785A14" strokeWidth="0.8">
                <circle cx="264" cy="265" r="3.8" />
                <circle cx="336" cy="265" r="3.8" />
                <circle cx="266" cy="290" r="3.8" />
                <circle cx="334" cy="290" r="3.8" />
                <circle cx="268" cy="348" r="3.8" />
                <circle cx="332" cy="348" r="3.8" />
                <circle cx="270" cy="372" r="3.8" />
                <circle cx="330" cy="372" r="3.8" />
              </g>

              {/* Black Leather Waist Belt & Giant Gold Buckle */}
              <g id="officer-belt">
                <rect x="254" y="388" width="92" height="15" fill="#141414" stroke="#000" strokeWidth="1" />
                {/* Gold rectangular buckle */}
                <rect x="282" y="385" width="36" height="21" rx="2" fill="url(#gold-grad)" stroke="#6E5212" strokeWidth="1.5" />
                <rect x="290" y="389" width="20" height="13" rx="1" fill="#141414" />
                {/* Buckle pin */}
                <line x1="300" y1="388" x2="300" y2="403" stroke="url(#gold-grad)" strokeWidth="2.5" />
              </g>
            </g>

            {/* White Ruffled Lace Cravat / Jabot (宫廷花边领结) */}
            <g id="lace-cravat">
              <path
                d="M 285 210 C 275 220, 275 238, 288 245 C 294 248, 306 248, 312 245 C 325 238, 325 220, 315 210 Z"
                fill="#FAF8F2"
                stroke="#D6D1C4"
                strokeWidth="1.2"
              />
              <path d="M 292 215 Q 300 240 308 215" stroke="#BFB8A8" strokeWidth="1" fill="none" />
              {/* Gold collar broach */}
              <circle cx="300" cy="216" r="3" fill="url(#gold-shimmer)" stroke="#6E5212" strokeWidth="0.8" />
            </g>

            {/* 
              ================================================================
              NUTCRACKER HEAD, FACE, MOUSTACHE & JAW MECHANISM
              ================================================================
            */}
            <g id="nutcracker-head">
              {/* White Curly Hair Wigs on the Sides (经典胡桃夹子两侧卷发) */}
              <g id="side-curly-hair" fill="#F4F2EC" stroke="#CFCAC0" strokeWidth="1.2">
                {/* Left side locks */}
                <circle cx="254" cy="162" r="10" />
                <circle cx="250" cy="180" r="11" />
                <circle cx="254" cy="198" r="10" />
                <circle cx="260" cy="212" r="8" />

                {/* Right side locks */}
                <circle cx="346" cy="162" r="10" />
                <circle cx="350" cy="180" r="11" />
                <circle cx="346" cy="198" r="10" />
                <circle cx="340" cy="212" r="8" />
              </g>

              {/* Wooden Carved Head Base (warm porcelain ivory) */}
              <path
                d="M 264 140 L 336 140 C 340 165, 340 205, 334 225 C 324 235, 276 235, 266 225 C 260 205, 260 165, 264 140 Z"
                fill="#FAF3E6"
                stroke="#2B241E"
                strokeWidth="2"
              />

              {/* Rosy Round Cheeks (胡桃夹子标志性腮红) */}
              <circle cx="272" cy="185" r="9" fill="#DE5D4E" opacity="0.65" />
              <circle cx="328" cy="185" r="9" fill="#DE5D4E" opacity="0.65" />

              {/* Eyes & Regal Eyebrows */}
              <g id="eyes-and-brows">
                {/* Left Eyebrow */}
                <path d="M 270 156 Q 280 151 289 157" stroke="#161616" strokeWidth="3" strokeLinecap="round" fill="none" />
                {/* Right Eyebrow */}
                <path d="M 311 157 Q 320 151 330 156" stroke="#161616" strokeWidth="3" strokeLinecap="round" fill="none" />

                {/* Left Eye */}
                <ellipse cx="280" cy="166" rx="6" ry="6.5" fill="#FAF8F2" stroke="#1F1F1F" strokeWidth="1.5" />
                <circle cx="280" cy="166" r="4" fill="#1C2D42" />
                <circle cx="280" cy="166" r="2.2" fill="#0A0A0A" />
                <circle cx="278.5" cy="164.5" r="1.3" fill="#FFFFFF" />

                {/* Right Eye */}
                <ellipse cx="320" cy="166" rx="6" ry="6.5" fill="#FAF8F2" stroke="#1F1F1F" strokeWidth="1.5" />
                <circle cx="320" cy="166" r="4" fill="#1C2D42" />
                <circle cx="320" cy="166" r="2.2" fill="#0A0A0A" />
                <circle cx="318.5" cy="164.5" r="1.3" fill="#FFFFFF" />
              </g>

              {/* Carved Wooden Geometric Nose */}
              <polygon points="300,162 295,182 305,182" fill="#E8DEC8" stroke="#3D3228" strokeWidth="1.2" />

              {/* 
                THE ICONIC NUTCRACKER MOUTH & TEETH APERTURE
                Inside is a dark mechanical cavity revealing the upper teeth
              */}
              <g id="nutcracker-mouth-socket">
                {/* Dark mouth opening */}
                <rect x="282" y="190" width="36" height="15" rx="1.5" fill="#120D0A" stroke="#3D291D" strokeWidth="1.5" />

                {/* Upper row of 4 crisp white wooden teeth */}
                <g fill="#FFFFFF" stroke="#4A3B32" strokeWidth="0.8">
                  <rect x="284" y="190" width="7" height="6" rx="0.5" />
                  <rect x="292" y="190" width="7" height="6" rx="0.5" />
                  <rect x="301" y="190" width="7" height="6" rx="0.5" />
                  <rect x="309" y="190" width="7" height="6" rx="0.5" />
                </g>
              </g>

              {/* 
                ARTICULATED LOWER JAW & BEARD (可活动下颌与白胡须)
                Moves down dynamically by jawOffset when bodyElevate triggers!
              */}
              <g
                id="nutcracker-lower-jaw"
                style={{
                  transform: `translateY(${jawOffset}px)`,
                  transition: kinematics ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.9, 0.4, 1)',
                }}
              >
                {/* Lower row of 4 crisp white wooden teeth */}
                <g fill="#FFFFFF" stroke="#4A3B32" strokeWidth="0.8">
                  <rect x="284" y="198" width="7" height="6" rx="0.5" />
                  <rect x="292" y="198" width="7" height="6" rx="0.5" />
                  <rect x="301" y="198" width="7" height="6" rx="0.5" />
                  <rect x="309" y="198" width="7" height="6" rx="0.5" />
                </g>

                {/* Wooden Chin Bar */}
                <rect x="280" y="204" width="40" height="7" rx="1" fill="#FAF3E6" stroke="#2B241E" strokeWidth="1.5" />

                {/* Fluffy White Nutcracker Chin Beard (下巴白胡须) */}
                <path
                  d="M 280 209 C 275 228, 288 238, 300 240 C 312 238, 325 228, 320 209 Z"
                  fill="#F4F2EC"
                  stroke="#CFCAC0"
                  strokeWidth="1.2"
                />
              </g>

              {/* Iconic Sweeping Black Handlebar Moustache (上翘的浓黑八字胡) */}
              <g id="handlebar-moustache" fill="#181818" stroke="#0D0D0D" strokeWidth="1">
                {/* Left wing curling up */}
                <path d="M 300 186 C 290 183, 272 181, 260 193 C 270 196, 285 192, 300 189 Z" />
                {/* Right wing curling up */}
                <path d="M 300 186 C 310 183, 328 181, 340 193 C 330 196, 315 192, 300 189 Z" />
                <circle cx="300" cy="187.5" r="2" fill="#181818" />
              </g>
            </g>

            {/* 
              ================================================================
              TALL NUTCRACKER SHAKO MILITARY HAT / CROWN (高顶军官礼帽 / 皇冠)
              ================================================================
            */}
            <g id="nutcracker-shako">
              {/* Hat Visor / Brim */}
              <path
                d="M 252 144 C 252 152, 348 152, 348 144 L 344 138 C 344 145, 256 145, 256 138 Z"
                fill="#0D0D0D"
                stroke="url(#gold-grad)"
                strokeWidth="1.5"
              />

              {/* Tall Cylindrical Crown / Shako Body */}
              <path
                d="M 258 140 L 264 55 C 264 50, 336 50, 336 55 L 342 140 Z"
                fill="url(#shako-black)"
                stroke="#121212"
                strokeWidth="1.5"
              />

              {/* Crown Top Ellipse */}
              <ellipse cx="300" cy="55" rx="36" ry="7" fill="#1C1C1C" stroke="url(#gold-grad)" strokeWidth="2" />

              {/* Gold Decorative Bands on Hat */}
              <path d="M 258 135 C 275 141, 325 141, 342 135" fill="none" stroke="url(#gold-grad)" strokeWidth="3" />
              <path d="M 261 95 C 276 100, 324 100, 339 95" fill="none" stroke="url(#gold-grad)" strokeWidth="2" strokeDasharray="5 3" />
              <path d="M 263 65 C 276 70, 324 70, 337 65" fill="none" stroke="url(#gold-grad)" strokeWidth="3" />

              {/* Imperial Sunburst Cockade Medallion with Ruby Gem */}
              <g id="hat-cockade" transform="translate(300, 100)">
                <circle cx="0" cy="0" r="14" fill="url(#gold-shimmer)" stroke="#7A5D18" strokeWidth="1.5" />
                {/* Sunburst rays */}
                <line x1="0" y1="-14" x2="0" y2="14" stroke="#5E450E" strokeWidth="1.5" />
                <line x1="-14" y1="0" x2="14" y2="0" stroke="#5E450E" strokeWidth="1.5" />
                <line x1="-10" y1="-10" x2="10" y2="10" stroke="#5E450E" strokeWidth="1.2" />
                <line x1="-10" y1="10" x2="10" y2="-10" stroke="#5E450E" strokeWidth="1.2" />
                {/* Center Ruby Cinnabar Gem */}
                <circle cx="0" cy="0" r="6" fill="#C83C23" stroke="#FFF" strokeWidth="0.8" />
              </g>

              {/* Gold Curb Chain / Chin Strap draping down from shako sides */}
              <path
                d="M 260 138 Q 262 170 270 198"
                fill="none"
                stroke="url(#gold-grad)"
                strokeWidth="2"
                strokeDasharray="4 2"
              />
              <path
                d="M 340 138 Q 338 170 330 198"
                fill="none"
                stroke="url(#gold-grad)"
                strokeWidth="2"
                strokeDasharray="4 2"
              />

              {/* Regal Feather Cockade Plume (羽翎) at Top of Hat */}
              <g id="hat-plume">
                <path
                  d="M 300 55 C 290 35, 292 20, 300 12 C 308 20, 310 35, 300 55 Z"
                  fill="#C83C23"
                />
                <path
                  d="M 300 55 C 294 40, 296 28, 300 20 C 304 28, 306 40, 300 55 Z"
                  fill="url(#gold-shimmer)"
                />
                <circle cx="300" cy="55" r="4.5" fill="url(#gold-shimmer)" stroke="#6B4F10" strokeWidth="1" />
              </g>
            </g>

            {/* 
              LEFT & RIGHT SHOULDER MOUNTING EPAULETS (肩章底座)
              Anchored at (230, 240) and (370, 240)
            */}
            <g id="left-epaulet-base">
              {/* Crescent Gold Epaulet with Tassels */}
              <ellipse cx="230" cy="236" rx="14" ry="7" fill="url(#gold-shimmer)" stroke="#6E5010" strokeWidth="1.5" />
              <circle cx="230" cy="236" r="3" fill="#C83C23" />
              {/* Epaulet Fringe Tassels hanging down */}
              <g stroke="url(#gold-grad)" strokeWidth="1.5" strokeLinecap="round">
                <line x1="220" y1="239" x2="218" y2="252" />
                <line x1="225" y1="240" x2="224" y2="254" />
                <line x1="230" y1="240" x2="230" y2="255" />
                <line x1="235" y1="240" x2="236" y2="254" />
                <line x1="240" y1="239" x2="242" y2="252" />
              </g>
            </g>

            <g id="right-epaulet-base">
              <ellipse cx="370" cy="236" rx="14" ry="7" fill="url(#gold-shimmer)" stroke="#6E5010" strokeWidth="1.5" />
              <circle cx="370" cy="236" r="3" fill="#C83C23" />
              {/* Epaulet Fringe Tassels */}
              <g stroke="url(#gold-grad)" strokeWidth="1.5" strokeLinecap="round">
                <line x1="360" y1="239" x2="358" y2="252" />
                <line x1="365" y1="240" x2="364" y2="254" />
                <line x1="370" y1="240" x2="370" y2="255" />
                <line x1="375" y1="240" x2="376" y2="254" />
                <line x1="380" y1="239" x2="382" y2="252" />
              </g>
            </g>
          </g>

          {/* 
            ==================================================================
            PART 2: LEFT ARM (左臂 - 仪仗礼仪与金权杖)
            ID: #left-arm
            Transform-origin: shoulder pivot (230px 240px)
            Animated by: rotate(${leftArmAngle}deg)
            ==================================================================
          */}
          <g
            id="left-arm"
            className={activeJoints.leftArm && !kinematics ? 'active-left' : ''}
            style={{
              transformOrigin: '230px 240px',
              transform: `rotate(${leftArmAngle}deg)`,
              transition: kinematics ? 'none' : undefined,
            }}
          >
            {/* Shoulder Joint Pivot Cap */}
            <circle cx="230" cy="240" r="10" fill="url(#gold-shimmer)" stroke="#2B2012" strokeWidth="1.5" />
            <circle cx="230" cy="240" r="3" fill="#C83C23" />

            {/* Upper Arm: Vermilion Sleeve with Gold Military Rank Chevron */}
            <path
              d="M 230 240 L 195 320 L 168 310 L 220 234 Z"
              fill="url(#tunic-red)"
              stroke="#6B190B"
              strokeWidth="1.5"
            />
            {/* Gold braid on upper sleeve */}
            <path d="M 205 275 L 195 285 L 185 278" fill="none" stroke="url(#gold-grad)" strokeWidth="2" strokeLinecap="round" />

            {/* Elbow Brass Pivot Rivet */}
            <circle cx="182" cy="315" r="7" fill="url(#gold-shimmer)" stroke="#2B2012" strokeWidth="1.5" />
            <circle cx="182" cy="315" r="2.5" fill="#141414" />

            {/* Forearm & White Gauntlet Glove */}
            <path
              d="M 182 315 L 140 405 L 122 396 L 175 308 Z"
              fill="url(#tunic-red)"
              stroke="#6B190B"
              strokeWidth="1.2"
            />
            {/* White Gauntlet Glove Cuff with Gold Piping */}
            <rect x="122" y="386" width="22" height="8" rx="1.5" transform="rotate(24 133 390)" fill="#FAF8F2" stroke="url(#gold-grad)" strokeWidth="1.5" />

            {/* White Gloved Hand firmly clasping scepter */}
            <circle cx="130" cy="406" r="7" fill="#FAF8F2" stroke="#4A3F33" strokeWidth="1.5" />
            <ellipse cx="126" cy="408" rx="4" ry="2.5" transform="rotate(-30 126 408)" fill="#FAF8F2" stroke="#4A3F33" strokeWidth="1" />

            {/* 
              CEREMONIAL NUTCRACKER GOLDEN SCEPTER / SWORD (仪仗金权杖)
              Brandishes gracefully as left arm lifts!
            */}
            <g id="nutcracker-scepter">
              {/* Scepter Gold Shaft */}
              <line
                x1="145"
                y1="370"
                x2="105"
                y2="475"
                stroke="url(#gold-grad)"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <line
                x1="145"
                y1="370"
                x2="105"
                y2="475"
                stroke="#6B5010"
                strokeWidth="1"
                strokeDasharray="8 4"
              />

              {/* Scepter Crown / Finial at Top */}
              <circle cx="147" cy="365" r="8" fill="url(#gold-shimmer)" stroke="#6B5010" strokeWidth="1.5" />
              {/* Ruby Gem in Scepter Crown */}
              <circle cx="147" cy="365" r="4" fill="#C83C23" stroke="#FFF" strokeWidth="0.8" />
              <polygon points="147,352 143,358 151,358" fill="url(#gold-shimmer)" />

              {/* Scepter Bottom Pommel */}
              <circle cx="104" cy="478" r="4.5" fill="url(#gold-shimmer)" stroke="#6B5010" strokeWidth="1" />
            </g>
          </g>

          {/* 
            ==================================================================
            PART 3: RIGHT ARM (右臂 - 奏乐击鼓槌)
            ID: #right-arm
            Transform-origin: shoulder pivot (370px 240px)
            Animated by: rotate(${rightArmAngle}deg)
            ==================================================================
          */}
          <g
            id="right-arm"
            className={activeJoints.rightArm && !kinematics ? 'active-right' : ''}
            style={{
              transformOrigin: '370px 240px',
              transform: `rotate(${rightArmAngle}deg)`,
              transition: kinematics ? 'none' : undefined,
            }}
          >
            {/* Shoulder Joint Pivot Cap */}
            <circle cx="370" cy="240" r="10" fill="url(#gold-shimmer)" stroke="#2B2012" strokeWidth="1.5" />
            <circle cx="370" cy="240" r="3" fill="#C83C23" />

            {/* Upper Arm: Vermilion Sleeve with Gold Military Rank Chevron */}
            <path
              d="M 370 240 L 405 320 L 432 310 L 380 234 Z"
              fill="url(#tunic-red)"
              stroke="#6B190B"
              strokeWidth="1.5"
            />
            {/* Gold braid on upper sleeve */}
            <path d="M 395 275 L 405 285 L 415 278" fill="none" stroke="url(#gold-grad)" strokeWidth="2" strokeLinecap="round" />

            {/* Elbow Brass Pivot Rivet */}
            <circle cx="418" cy="315" r="7" fill="url(#gold-shimmer)" stroke="#2B2012" strokeWidth="1.5" />
            <circle cx="418" cy="315" r="2.5" fill="#141414" />

            {/* Forearm & White Gauntlet Glove */}
            <path
              d="M 418 315 L 460 405 L 478 396 L 425 308 Z"
              fill="url(#tunic-red)"
              stroke="#6B190B"
              strokeWidth="1.2"
            />
            {/* White Gauntlet Glove Cuff with Gold Piping */}
            <rect x="456" y="386" width="22" height="8" rx="1.5" transform="rotate(-24 467 390)" fill="#FAF8F2" stroke="url(#gold-grad)" strokeWidth="1.5" />

            {/* White Gloved Hand firmly holding drum mallet */}
            <circle cx="470" cy="406" r="7" fill="#FAF8F2" stroke="#4A3F33" strokeWidth="1.5" />
            <ellipse cx="474" cy="408" rx="4" ry="2.5" transform="rotate(30 474 408)" fill="#FAF8F2" stroke="#4A3F33" strokeWidth="1" />

            {/* 
              MUSIC BOX DRUM MALLET / BELL STRIKER (八音盒击鼓槌)
              Strikes down rhythmically as right arm rotates!
            */}
            <g id="nutcracker-drumstick">
              {/* Turned Wooden Shaft */}
              <line
                x1="455"
                y1="370"
                x2="495"
                y2="475"
                stroke="#543D2B"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              {/* Brass Ferrules on Mallet Shaft */}
              <line x1="465" y1="396" x2="467" y2="402" stroke="url(#gold-grad)" strokeWidth="4.5" />
              <line x1="486" y1="452" x2="488" y2="458" stroke="url(#gold-grad)" strokeWidth="4.5" />

              {/* Striker Head: Polished Gold & Cinnabar Mallet Ball */}
              <circle cx="497" cy="482" r="8" fill="url(#gold-shimmer)" stroke="#6B5010" strokeWidth="1.5" />
              <circle cx="497" cy="482" r="4" fill="#C83C23" />

              {/* Mallet Pommel at Hand End */}
              <circle cx="453" cy="366" r="3.5" fill="url(#gold-shimmer)" stroke="#6B5010" strokeWidth="1" />
            </g>
          </g>
          {/* End Nutcracker Figure Pirouette Assembly */}
          </g>
        </svg>
      </div>
    </>
  )}

  {/* Playback Frame / Dynamic Rhythm Indicator */}
  <div className="absolute bottom-2 flex items-center gap-3 text-xs text-neutral-500 font-mono z-30 pointer-events-none">
        <span className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-[#C83C23] animate-ping' : 'bg-neutral-300'}`} />
          <span>{isPlaying ? '发条运转中' : '静止待命'}</span>
        </span>
        <span className="text-neutral-300">|</span>
        <span>拍位: {currentFrame + 1} / 16</span>
        <span className="text-neutral-300">|</span>
        <span className="font-serif text-neutral-600">
          {activeJoints.leftArm || activeJoints.body || activeJoints.rightArm
            ? '机芯齿轮咬合'
            : '静候发条'}
        </span>
      </div>
    </div>
  );
};

