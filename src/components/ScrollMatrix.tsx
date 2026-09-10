import React, { useRef } from 'react';
import { MatrixState, HitFlash, PhraseSlot, AtomicClip, PuppetData } from '../types';
import { AtomicClipSlots } from './AtomicClipSlots';
import { Music, Volume2, Plus, Sliders } from 'lucide-react';

interface ScrollMatrixProps {
  matrix: MatrixState;
  slots: PhraseSlot[];
  onSelectClipForSlot: (slotIndex: number, clip: AtomicClip) => void;
  onToggleCell: (row: number, col: number) => void;
  onManualTrigger?: (joint: 'leftArm' | 'body' | 'rightArm' | 'leftLeg' | 'rightLeg') => void;
  needlePercent: number; // 0 to 100% across the 16 columns
  activeCol: number; // -1 if not active
  recentHits: HitFlash[];
  ripples: { id: string; row: number; col: number }[];
  onScrub?: (colIndex: number) => void;
  isPlaying: boolean;
  puppets?: PuppetData[];
  selectedPuppetId?: string;
  onSelectPuppet?: (id: string) => void;
  onAddPuppet?: () => void;
  onEditPuppet?: (puppet: PuppetData) => void;
}

const BELL_ROW_CONFIG = [
  { id: 'leftArm', label: '左臂', note: '羽音 · 钟鸣', desc: '向上旋转 45° · A5 高音', tone: 'A5' },
  { id: 'body', label: '机芯', note: '徵音 · 齿轮', desc: '挺身拔背 +20px · G5 和鸣', tone: 'G5' },
  { id: 'rightArm', label: '右臂', note: '角音 · 敲击', desc: '击鼓奏乐 45° · E5 中音', tone: 'E5' },
  { id: 'leftLeg', label: '左脚', note: '商音 · 点地', desc: '踢步踏点 28° · D5 步韵', tone: 'D5' },
  { id: 'rightLeg', label: '右脚', note: '宫音 · 沉稳', desc: '踏跺归步 28° · C5 低音', tone: 'C5' },
];

const DRUM_ROW_CONFIG = [
  { id: 'leftArm', label: '左臂', note: '镲片 · 清脆', desc: '清脆金属镲片 (Cymbals/Hi-Hat)', tone: '镲片' },
  { id: 'body', label: '机芯', note: '通鼓 · 礼仪', desc: '浑厚中音通鼓 (Tenor Tom)', tone: '通鼓' },
  { id: 'rightArm', label: '右臂', note: '军鼓 · 响弦', desc: '机械军鼓重音 (Snare Drum)', tone: '军鼓' },
  { id: 'leftLeg', label: '左脚', note: '木梆 · 沉实', desc: '清响硬木梆子 (Woodblock)', tone: '木梆' },
  { id: 'rightLeg', label: '右脚', note: '底鼓 · 战鼓', desc: '沉雄浑重底鼓 (Bass Drum)', tone: '底鼓' },
];

const TRUMPET_ROW_CONFIG = [
  { id: 'leftArm', label: '左臂', note: '高音 · 号鸣', desc: '嘹亮高音 Bb5 · 冲锋破晓', tone: 'Bb5' },
  { id: 'body', label: '机芯', note: '泛音 · 吐气', desc: '泛音共鸣 F5 · 挺身昂扬', tone: 'F5' },
  { id: 'rightArm', label: '右臂', note: '主音 · 按键', desc: '旋律主音 D5 · 运指转调', tone: 'D5' },
  { id: 'leftLeg', label: '左脚', note: '进阶 · 踏步', desc: '进退踏点 Bb4 · 军列疾步', tone: 'Bb4' },
  { id: 'rightLeg', label: '右脚', note: '铜管 · 基音', desc: '深厚基音 F4 · 沉稳顿足', tone: 'F4' },
];

const TUBA_ROW_CONFIG = [
  { id: 'leftArm', label: '左臂', note: '次中 · 抱号', desc: '浑厚中音 F3 · 环抱铜管', tone: 'F3' },
  { id: 'body', label: '机芯', note: '宏鸣 · 沉响', desc: '雄浑和鸣 D3 · 气息喷薄', tone: 'D3' },
  { id: 'rightArm', label: '右臂', note: '低音 · 重键', desc: '沉雄低音 Bb2 · 活塞沉按', tone: 'Bb2' },
  { id: 'leftLeg', label: '左脚', note: '深音 · 步点', desc: '深邃重音 F2 · 沉步顿地', tone: 'F2' },
  { id: 'rightLeg', label: '右脚', note: '轰鸣 · 极低', desc: '极低震颤 Bb1 · 撼地沉雷', tone: 'Bb1' },
];

const CLARINET_ROW_CONFIG = [
  { id: 'leftArm', label: '左臂', note: '清亮 · 迎风', desc: '清亮木管 G5 · 舒臂迎风', tone: 'G5' },
  { id: 'body', label: '机芯', note: '柔和 · 吐音', desc: '温润吐音 E5 · 胸腔共鸣', tone: 'E5' },
  { id: 'rightArm', label: '右臂', note: '银键 · 律动', desc: '核心指法 C5 · 银键翻飞', tone: 'C5' },
  { id: 'leftLeg', label: '左脚', note: '悠扬 · 踢步', desc: '轻盈踢步 A4 · 优雅行进', tone: 'A4' },
  { id: 'rightLeg', label: '右脚', note: '醇厚 · 低韵', desc: '低音区 F4 · 稳重踏点', tone: 'F4' },
];

const OBOE_ROW_CONFIG = [
  { id: 'leftArm', label: '左臂', note: '穿透 · 簧鸣', desc: '穿透高音 A5 · 双簧振颤', tone: 'A5' },
  { id: 'body', label: '机芯', note: '雅韵 · 宫廷', desc: '挺拔华贵 F#5 · 宫廷雅韵', tone: 'F#5' },
  { id: 'rightArm', label: '右臂', note: '抒情 · 连音', desc: '抒情旋律 D5 · 密键转调', tone: 'D5' },
  { id: 'leftLeg', label: '左脚', note: '灵动 · 碎步', desc: '轻盈踏韵 B4 · 灵巧点地', tone: 'B4' },
  { id: 'rightLeg', label: '右脚', note: '基调 · 稳步', desc: '古典基音 G4 · 稳健归步', tone: 'G4' },
];

const HARP_ROW_CONFIG = [
  { id: 'leftArm', label: '左臂', note: '晶莹 · 掠弦', desc: '晶莹高音 C6 · 拂掠金弦', tone: 'C6' },
  { id: 'body', label: '机芯', note: '华丽 · 琶音', desc: '流光和弦 A5 · 舒胸展意', tone: 'A5' },
  { id: 'rightArm', label: '右臂', note: '金弦 · 拨奏', desc: '拨奏主音 F5 · 珠落玉盘', tone: 'F5' },
  { id: 'leftLeg', label: '左脚', note: '踏板 · 变音', desc: '踏板踏点 D5 · 悠然点地', tone: 'D5' },
  { id: 'rightLeg', label: '右脚', note: '沉静 · 低弦', desc: '深沉底弦 C4 · 渊渟岳峙', tone: 'C4' },
];

const INSTRUMENT_ROW_MAP: Record<string, typeof BELL_ROW_CONFIG> = {
  bell: BELL_ROW_CONFIG,
  drum: DRUM_ROW_CONFIG,
  trumpet: TRUMPET_ROW_CONFIG,
  tuba: TUBA_ROW_CONFIG,
  clarinet: CLARINET_ROW_CONFIG,
  oboe: OBOE_ROW_CONFIG,
  harp: HARP_ROW_CONFIG,
};

export const ScrollMatrix: React.FC<ScrollMatrixProps> = ({
  matrix,
  slots,
  onSelectClipForSlot,
  onToggleCell,
  onManualTrigger,
  needlePercent,
  activeCol,
  recentHits,
  ripples,
  onScrub,
  isPlaying,
  puppets = [],
  selectedPuppetId,
  onSelectPuppet,
  onAddPuppet,
  onEditPuppet,
}) => {
  const gridContainerRef = useRef<HTMLDivElement>(null);

  const selectedPuppet = puppets.find((p) => p.id === selectedPuppetId);
  const rowConfig = INSTRUMENT_ROW_MAP[selectedPuppet?.instrument || 'bell'] || BELL_ROW_CONFIG;
  const isDrum = selectedPuppet?.instrument === 'drum';

  const instIcons: Record<string, string> = {
    trumpet: '🎺',
    tuba: '📯',
    clarinet: '🎷',
    oboe: '🎶',
    harp: '🎼',
    drum: '🥁',
    bell: '🔔',
  };

  // Check if a specific cell was recently struck by the needle
  const isCellStruck = (row: number, col: number) => {
    return recentHits.some((h) => h.row === row && h.col === col);
  };

  const handleRulerClick = (colIdx: number) => {
    if (onScrub) {
      onScrub(colIdx);
    }
  };

  return (
    <div
      id="matrix-scroll-wrapper"
      className="relative w-full h-full flex flex-col justify-between py-2 px-3 sm:px-6 select-none"
    >
      {/* Scroll Title, Puppet Selector & Legend Header */}
      <div className="flex items-center justify-between pb-1.5 border-b border-neutral-300/80 mb-2 flex-wrap gap-2">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <span className="text-xs font-serif font-bold text-neutral-800 tracking-wider flex items-center gap-1.5">
            <span>机械织锦长卷 (5 × 16 孔带)</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-200/80 text-neutral-600 font-normal">
              动作槽独立控制
            </span>
          </span>

          {/* Multi-Puppet Selector Pills in Matrix Header */}
          {puppets.length > 0 && (
            <div className="flex items-center gap-1 bg-white/70 p-0.5 rounded-lg border border-neutral-300/70 shadow-xs flex-wrap">
              <span className="text-[10px] font-serif text-neutral-400 px-1 hidden md:inline">编辑木偶:</span>
              {puppets.map((p) => {
                const isSel = p.id === selectedPuppetId;
                const icon = instIcons[p.instrument] || '🔔';
                return (
                  <button
                    key={p.id}
                    onClick={() => onSelectPuppet?.(p.id)}
                    className={`px-2 py-0.5 rounded text-[11px] font-serif transition-all flex items-center gap-1 cursor-pointer ${
                      isSel
                        ? p.outfit === 'tuxedo'
                          ? 'bg-neutral-900 text-amber-200 font-semibold shadow-xs'
                          : p.instrument === 'drum'
                          ? 'bg-blue-900 text-blue-100 font-semibold shadow-xs'
                          : 'bg-amber-900 text-amber-100 font-semibold shadow-xs'
                        : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                    }`}
                  >
                    <span>{p.outfit === 'tuxedo' ? '🎩' : icon}</span>
                    <span>{p.name}</span>
                  </button>
                );
              })}

              {onEditPuppet && selectedPuppet && (
                <button
                  onClick={() => onEditPuppet(selectedPuppet)}
                  className="px-1.5 py-0.5 rounded text-[10px] font-serif text-amber-900 bg-amber-100/80 hover:bg-amber-200/80 transition-colors flex items-center gap-0.5 cursor-pointer border border-amber-300/60"
                  title="定制当前木偶外观服饰与乐器"
                >
                  <Sliders className="w-2.5 h-2.5 text-amber-800" />
                  <span>定制</span>
                </button>
              )}

              {onAddPuppet && (
                <button
                  onClick={onAddPuppet}
                  className="px-1.5 py-0.5 rounded text-[10px] font-serif text-amber-800 hover:bg-amber-100/60 transition-colors flex items-center gap-0.5 cursor-pointer"
                  title="增加伴舞/伴奏木偶"
                >
                  <Plus className="w-2.5 h-2.5" />
                  <span>添加</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Legend & Audio Tag */}
        <div className="flex items-center gap-2 sm:gap-3 text-[11px] text-neutral-500 flex-wrap">
          <div
            className={`px-2 py-0.5 rounded-md border text-[10px] font-serif flex items-center gap-1 ${
              isDrum
                ? 'bg-blue-50 border-blue-200 text-blue-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}
          >
            {isDrum ? <Volume2 className="w-3 h-3 text-blue-600" /> : <Music className="w-3 h-3 text-amber-600" />}
            <span className="font-semibold">{selectedPuppet?.instrumentLabel || '八音钟琴'}</span>
          </div>

          <span className="flex items-center gap-1 text-neutral-600">
            <span className="w-2 h-2 rounded-full border border-neutral-400 bg-neutral-200/50" />
            <span className="text-[10px]">空(0)</span>
          </span>
          <span className="flex items-center gap-1 text-neutral-600">
            <span
              className="w-2 h-2 rounded-full border"
              style={{ backgroundColor: selectedPuppet?.themeColor || '#141414', borderColor: selectedPuppet?.themeColor || '#141414' }}
            />
            <span className="text-[10px]">凸点(1)</span>
          </span>
          <span className="flex items-center gap-1 text-amber-800 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-amber-600 flex items-center justify-center text-[7px] text-amber-950 font-bold">↻</span>
            <span className="text-[10px]">五音同按 · 360°回旋</span>
          </span>
        </div>
      </div>

      {/* Main Grid Area: Labels on left + Atomic Clips & 5x16 Grid on right */}
      <div className="flex flex-1 items-stretch gap-2 md:gap-4 relative overflow-visible">
        {/* Row Header Labels with Interactive Test / Control Buttons */}
        <div className="flex flex-col justify-end w-20 sm:w-26 md:w-32 shrink-0 pr-2 border-r border-neutral-300/70">
          {/* Alignment spacer matching the AtomicClipSlots header */}
          <div className="pb-1 border-b border-neutral-200 mb-1 flex items-center justify-between">
            <span className="text-[10px] font-serif font-semibold text-neutral-500">
              {isDrum ? '打击声部 (5轨)' : '五音声部 (5阶)'}
            </span>
            <span className="text-[9px] text-neutral-400 font-serif hidden sm:inline">独立动作</span>
          </div>

          {/* Row labels */}
          <div className="flex flex-col justify-around flex-1">
            {rowConfig.map((row, rIdx) => {
              const isRowActive = activeCol >= 0 && matrix[rIdx]?.[activeCol] === 1 && isPlaying;

              return (
                <button
                  type="button"
                  key={row.id}
                  onClick={() => onManualTrigger?.(row.id as any)}
                  className={`group/rowbtn flex flex-col justify-center text-left py-1 px-1.5 rounded-md transition-all ${
                    isRowActive
                      ? isDrum
                        ? 'bg-blue-100/90 border border-blue-300 shadow-xs'
                        : 'bg-amber-100/80 border border-amber-300 shadow-xs'
                      : 'hover:bg-neutral-200/50'
                  }`}
                  title={`点击试动【${row.label}】(${row.desc})`}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${
                        isRowActive
                          ? isDrum
                            ? 'bg-blue-600 animate-ping'
                            : 'bg-[#C83C23] animate-ping'
                          : 'bg-neutral-800 group-hover/rowbtn:bg-[#C83C23]'
                      }`}
                    />
                    <span className="font-serif font-bold text-xs sm:text-sm text-neutral-800 tracking-wide group-hover/rowbtn:text-[#C83C23] transition-colors">
                      {row.label}
                    </span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-neutral-200/70 text-neutral-600 font-mono ml-auto">
                      {row.tone}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-neutral-500 font-serif mt-0.5">
                    <span>{row.note}</span>
                    <span className="opacity-0 group-hover/rowbtn:opacity-100 text-[9px] text-[#C83C23] font-mono transition-opacity">
                      试动
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 16-Column Matrix Container */}
        <div
          ref={gridContainerRef}
          className="relative flex-1 flex flex-col justify-between py-0.5 px-0.5"
        >
          {/* Mid-layer Atomic Dance Clip Slots (中层五排交互动作槽) */}
          <AtomicClipSlots
            slots={slots}
            matrix={matrix}
            onSelectClipForSlot={onSelectClipForSlot}
            onToggleCell={onToggleCell}
            onManualTrigger={onManualTrigger}
            activeCol={activeCol}
            isPlaying={isPlaying}
          />

          {/* Timeline Ruler at the Top */}
          <div
            className="grid gap-1 md:gap-2 mb-1"
            style={{ gridTemplateColumns: 'repeat(16, minmax(0, 1fr))' }}
          >
            {Array.from({ length: 16 }).map((_, colIdx) => {
              const isPhraseStart = colIdx % 4 === 0;
              const isActive = activeCol === colIdx;
              const isFiveChord = [0, 1, 2, 3, 4].every(
                (r) => matrix[r]?.[colIdx] === 1
              );

              return (
                <button
                  key={`ruler-${colIdx}`}
                  onClick={() => handleRulerClick(colIdx)}
                  className={`text-[9px] sm:text-[10px] md:text-xs font-mono py-0.5 text-center transition-colors rounded hover:bg-neutral-200/60 relative flex flex-col items-center justify-center ${
                    isFiveChord
                      ? isActive
                        ? 'text-amber-950 font-bold bg-amber-400/40 ring-1 ring-amber-500 shadow-xs'
                        : 'text-amber-800 font-semibold bg-amber-100/70 border border-amber-300/80'
                      : isActive
                      ? isDrum
                        ? 'text-blue-700 font-bold bg-blue-100'
                        : 'text-[#C83C23] font-bold bg-[#C83C23]/10'
                      : isPhraseStart
                      ? 'text-neutral-700 font-semibold'
                      : 'text-neutral-400'
                  }`}
                  title={`第 ${colIdx + 1} 拍${isFiveChord ? ' (五音齐鸣 · 举手旋舞 360°)' : ''}`}
                >
                  <span className="leading-tight">{colIdx + 1}</span>
                  {isFiveChord && (
                    <span className="text-[8px] leading-none text-amber-600 font-bold -mt-0.5">↻</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* 5-Row Grid of Stud Holes */}
          <div className="grid grid-rows-5 gap-1 sm:gap-1.5 md:gap-2 flex-1 relative">
            {/* Phrase dividing background columns */}
            <div className="absolute inset-0 grid grid-cols-4 pointer-events-none z-0">
              {[0, 1, 2, 3].map((pIdx) => (
                <div
                  key={pIdx}
                  className={`border-r border-neutral-300/40 ${
                    pIdx % 2 === 1 ? 'bg-black/[0.015]' : ''
                  }`}
                />
              ))}
            </div>

            {/* The Scanning Needle Line (朱砂红读取指针) */}
            {isPlaying && (
              <div
                id="cinnabar-needle"
                className="absolute top-0 bottom-0 pointer-events-none z-20 flex flex-col items-center"
                style={{
                  left: `${needlePercent}%`,
                  transform: 'translateX(-50%)',
                  transition: 'none',
                }}
              >
                {/* Needle top arrowhead */}
                <div
                  className={`w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[7px] ${
                    isDrum ? 'border-t-blue-600' : 'border-t-[#C83C23]'
                  }`}
                />
                {/* Needle shaft */}
                <div
                  className={`w-[2px] flex-1 shadow-xs opacity-90 ${
                    isDrum ? 'bg-blue-600' : 'bg-[#C83C23]'
                  }`}
                />
                {/* Needle bottom point */}
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    isDrum ? 'bg-blue-600' : 'bg-[#C83C23]'
                  }`}
                />
              </div>
            )}

            {/* Ripple Effects from User Clicks */}
            {ripples.map((rip) => {
              const colPercent = (rip.col + 0.5) * (100 / 16);
              const rowPercent = (rip.row + 0.5) * (100 / 5);
              return (
                <span
                  key={rip.id}
                  className="ink-ripple pointer-events-none"
                  style={{
                    left: `${colPercent}%`,
                    top: `${rowPercent}%`,
                  }}
                />
              );
            })}

            {/* Render 5 Rows x 16 Columns Holes */}
            {matrix.map((row, rowIdx) => (
              <div
                key={`matrix-row-${rowIdx}`}
                className="grid gap-1 md:gap-2 items-center z-10"
                style={{ gridTemplateColumns: 'repeat(16, minmax(0, 1fr))' }}
              >
                {row.map((val, colIdx) => {
                  const isActive = val === 1;
                  const isScanning = activeCol === colIdx && isPlaying;
                  const isStruck = isCellStruck(rowIdx, colIdx);
                  const isFiveChord = [0, 1, 2, 3, 4].every(
                    (r) => matrix[r]?.[colIdx] === 1
                  );

                  return (
                    <div
                      key={`cell-${rowIdx}-${colIdx}`}
                      className="flex items-center justify-center p-0.5"
                    >
                      <button
                        type="button"
                        onClick={() => onToggleCell(rowIdx, colIdx)}
                        className={`w-full aspect-[1/1] max-w-[28px] max-h-[28px] rounded-full transition-all duration-150 flex items-center justify-center relative cursor-pointer ${
                          isActive
                            ? isFiveChord
                              ? 'bg-amber-400 border-2 border-amber-600 shadow-md transform scale-110'
                              : isDrum
                              ? 'bg-blue-900 border border-blue-950 shadow-xs'
                              : 'bg-neutral-900 border border-neutral-950 shadow-xs'
                            : 'bg-neutral-100 hover:bg-neutral-200/80 border border-neutral-300/80 shadow-inner'
                        } ${
                          isScanning && isActive
                            ? isFiveChord
                              ? 'ring-4 ring-amber-400/80 scale-125'
                              : isDrum
                              ? 'ring-2 ring-blue-500 scale-110'
                              : 'ring-2 ring-[#C83C23] scale-110'
                            : ''
                        } ${
                          isStruck
                            ? isFiveChord
                              ? 'animate-ping'
                              : 'border-amber-400'
                            : ''
                        }`}
                        title={`${rowConfig[rowIdx].label} · 第 ${colIdx + 1} 拍 · ${
                          isActive ? '已置凸点 (点击移除)' : '空穴 (点击注入凸点)'
                        }${isFiveChord ? ' · 五音齐鸣' : ''}`}
                      >
                        {/* Center Embossed Stud Indicator */}
                        {isActive && (
                          <div
                            className={`rounded-full ${
                              isFiveChord
                                ? 'w-2 h-2 bg-amber-950'
                                : 'w-1.5 h-1.5 bg-neutral-200/70'
                            }`}
                          />
                        )}
                        {!isActive && (
                          <div className="w-1 h-1 rounded-full bg-neutral-300/60" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
