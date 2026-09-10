import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  Sliders,
  Gauge,
} from 'lucide-react';
import { PRESETS } from '../data/presets';
import { PresetPattern } from '../types';

interface ControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  bpm: number;
  onBpmChange: (newBpm: number) => void;
  playbackSpeed: number;
  onSpeedChange: (newSpeed: number) => void;
  currentPresetId: string | null;
  onSelectPreset: (preset: PresetPattern) => void;
  onClear: () => void;
  onRandomize: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  activeCol?: number;
}

export const Controls: React.FC<ControlsProps> = ({
  isPlaying,
  onTogglePlay,
  bpm,
  onBpmChange,
  playbackSpeed,
  onSpeedChange,
  currentPresetId,
  onSelectPreset,
  onClear,
  onRandomize,
  isMuted,
  onToggleMute,
  activeCol = 0,
}) => {
  const currentBeat = Math.floor(activeCol / 4); // 0, 1, 2, 3
  const isDownbeat = activeCol % 4 === 0;

  return (
    <div
      id="controls-panel"
      className="w-full flex flex-wrap items-center justify-between gap-2.5 px-3 sm:px-6 py-2 bg-neutral-100/80 border-t border-neutral-300/80 backdrop-blur-sm select-none"
    >
      {/* Left: Play / Pause Seal Button + 节奏呼吸指示器 + 慢速/正常播放倍率 */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
        <button
          id="play-pause-btn"
          onClick={onTogglePlay}
          className={`px-3.5 py-1.5 rounded-lg font-serif text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all duration-200 shadow-sm shrink-0 ${
            isPlaying
              ? 'bg-[#C83C23] text-amber-50 hover:bg-[#B3321B] shadow-[#C83C23]/25'
              : 'bg-neutral-900 text-amber-50 hover:bg-neutral-800'
          }`}
          title={isPlaying ? '暂停卷轴' : '启动八音盒'}
        >
          {isPlaying ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>凝神 (暂停)</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>抚琴 (播放)</span>
            </>
          )}
        </button>

        {/* 动作速率 / 播放倍率 (0.5x / 0.75x / 1.0x / 1.25x / 1.5x) */}
        <div
          className="inline-flex items-center rounded-lg border border-neutral-300 p-0.5 bg-white/70 text-xs shrink-0"
          title="动作速率控制：精细调控动作频率 (0.5x / 0.75x / 1.0x / 1.25x / 1.5x)"
        >
          <div className="flex items-center gap-1 px-1 text-neutral-500 hidden xl:flex">
            <Gauge className="w-3 h-3 text-neutral-400" />
            <span className="text-[10px] font-serif">速率</span>
          </div>
          {[
            { value: 0.5, label: '0.5x', desc: '半速慢放' },
            { value: 0.75, label: '0.75x', desc: '舒缓微调' },
            { value: 1.0, label: '1.0x', desc: '基准常速' },
            { value: 1.25, label: '1.25x', desc: '轻快进阶' },
            { value: 1.5, label: '1.5x', desc: '疾奏急舞' },
          ].map((item) => {
            const isSelected = playbackSpeed === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => onSpeedChange(item.value)}
                className={`px-1.5 sm:px-2 py-0.5 rounded-md transition-all font-mono text-[10px] sm:text-[11px] ${
                  isSelected
                    ? 'bg-[#C83C23] text-white font-bold shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/50'
                }`}
                title={`切换至 ${item.label} 速率 (${item.desc})`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* 节奏呼吸指示器 (Rhythm Breathing Indicator) */}
        <div
          id="rhythm-breathing-indicator"
          className={`relative hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg border transition-all duration-300 rhythm-paper-wave select-none shrink-0 ${
            isPlaying
              ? 'bg-[#F9F8F3] border-neutral-400/80 shadow-xs text-neutral-800'
              : 'bg-white/50 border-neutral-300/60 text-neutral-400 opacity-75'
          }`}
          style={{
            '--bar-duration': `${((60 / bpm) * 4) / playbackSpeed}s`,
            '--beat-duration': `${(60 / bpm) / playbackSpeed}s`,
            animationPlayState: isPlaying ? 'running' : 'paused',
          } as React.CSSProperties}
          title="节奏呼吸：微小SVG圆圈同步节拍跳动"
        >
          {/* Micro SVG circle synced with beats */}
          <div className="relative w-4 h-4 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 28 28" className="w-full h-full overflow-visible">
              <circle
                cx="14"
                cy="14"
                r="12"
                fill="none"
                stroke={isPlaying ? '#C83C23' : '#A3A3A3'}
                strokeWidth="1"
                strokeDasharray="2 2"
                className={isPlaying ? 'rhythm-svg-ring' : ''}
                style={{
                  transformOrigin: '14px 14px',
                  animationDuration: `${((60 / bpm) * 4) / playbackSpeed}s`,
                }}
                opacity={isPlaying ? 0.55 : 0.25}
              />
              <circle
                cx="14"
                cy="14"
                r={isDownbeat && isPlaying ? 3 : 2}
                fill="#C83C23"
                className="transition-all duration-100"
              />
            </svg>
          </div>

          <div className="flex flex-col pr-0.5 leading-tight">
            <span className="text-[10px] font-serif font-bold text-neutral-800">
              节奏呼吸
            </span>
            <span className="text-[9px] font-mono text-neutral-500">
              {isPlaying ? `${currentBeat + 1}/4 拍` : '待机'}
            </span>
          </div>
        </div>

        {/* Mute Toggle */}
        <button
          onClick={onToggleMute}
          className={`p-1.5 rounded-lg border transition-colors shrink-0 ${
            isMuted
              ? 'border-neutral-300 text-neutral-400 hover:text-neutral-600'
              : 'border-neutral-400 bg-white text-neutral-800 shadow-xs'
          }`}
          title={isMuted ? '开启五音音效' : '静音'}
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>

        {/* BPM Control */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/80 rounded-lg border border-neutral-300 text-xs shrink-0">
          <Sliders className="w-3 h-3 text-neutral-500" />
          <span className="text-neutral-500 font-serif text-[11px]">BPM:</span>
          <span className="font-mono font-bold text-neutral-800 w-6 text-center text-xs">{bpm}</span>
          <input
            type="range"
            min="60"
            max="160"
            step="4"
            value={bpm}
            onChange={(e) => onBpmChange(Number(e.target.value))}
            className="w-14 sm:w-20 accent-[#C83C23] cursor-pointer"
          />
        </div>
      </div>

      {/* Middle: Presets Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto py-0.5 max-w-full">
        <span className="text-[11px] text-neutral-500 font-serif mr-0.5 shrink-0 hidden md:inline">
          经典墨势:
        </span>
        {PRESETS.map((p) => {
          const isSelected = currentPresetId === p.id;
          return (
            <button
              key={p.id}
              onClick={() => onSelectPreset(p)}
              className={`px-2 py-0.5 rounded text-xs font-serif shrink-0 transition-all ${
                isSelected
                  ? 'bg-neutral-900 text-neutral-100 font-semibold shadow-xs'
                  : 'bg-white/60 text-neutral-600 hover:bg-white border border-neutral-200/80'
              }`}
              title={p.description}
            >
              {p.name}
            </button>
          );
        })}
      </div>

      {/* Right: Utility actions */}
      <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
        <button
          onClick={onRandomize}
          className="px-2.5 py-1 rounded-lg border border-neutral-300 bg-white/60 hover:bg-white text-xs text-neutral-700 flex items-center gap-1 transition-colors font-serif"
          title="随机生成水墨律动"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-700" />
          <span className="hidden sm:inline">随机赋势</span>
        </button>

        <button
          onClick={onClear}
          className="px-2 py-1 rounded-lg border border-neutral-300 bg-white/60 hover:bg-red-50 hover:text-red-700 hover:border-red-300 text-xs text-neutral-700 flex items-center gap-1 transition-colors font-serif"
          title="清空所有墨点"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>洗墨</span>
        </button>
      </div>
    </div>
  );
};
