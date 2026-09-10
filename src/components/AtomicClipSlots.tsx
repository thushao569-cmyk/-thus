import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Sparkles, X, Check, Volume2, RotateCcw } from 'lucide-react';
import { AtomicClip, PhraseSlot, MatrixState } from '../types';
import { ATOMIC_CLIPS } from '../data/atomicClips';

interface AtomicClipSlotsProps {
  slots: PhraseSlot[];
  matrix: MatrixState;
  onSelectClipForSlot: (slotIndex: number, clip: AtomicClip) => void;
  onToggleCell: (row: number, col: number) => void;
  onManualTrigger?: (joint: 'leftArm' | 'body' | 'rightArm' | 'leftLeg' | 'rightLeg') => void;
  activeCol: number;
  isPlaying: boolean;
}

const SLOT_RANGES = [
  { label: '01-04 拍', startCol: 0, endCol: 3 },
  { label: '05-08 拍', startCol: 4, endCol: 7 },
  { label: '09-12 拍', startCol: 8, endCol: 11 },
  { label: '13-16 拍', startCol: 12, endCol: 15 },
];

export const ACTION_ROWS = [
  { id: 'leftArm', label: '左臂', shortLabel: '左臂', note: '羽音', desc: '水袖举剑' },
  { id: 'body', label: '机芯', shortLabel: '机芯', note: '徵音', desc: '挺立咬合' },
  { id: 'rightArm', label: '右臂', shortLabel: '右臂', note: '角音', desc: '击鼓奏乐' },
  { id: 'leftLeg', label: '左脚', shortLabel: '左脚', note: '商音', desc: '踏步跃动' },
  { id: 'rightLeg', label: '右脚', shortLabel: '右脚', note: '宫音', desc: '点地踏跺' },
] as const;

export const AtomicClipSlots: React.FC<AtomicClipSlotsProps> = ({
  slots,
  matrix,
  onSelectClipForSlot,
  onToggleCell,
  onManualTrigger,
  activeCol,
  isPlaying,
}) => {
  const [openSlotIdx, setOpenSlotIdx] = useState<number | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpenSlotIdx(null);
      }
    };
    if (openSlotIdx !== null) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [openSlotIdx]);

  // Quick slot batch utility (e.g. clear, invert, feet only, arms only)
  const handleQuickSlotAction = (
    slotIdx: number,
    action: 'clear' | 'fill' | 'invert' | 'armsOnly' | 'feetOnly'
  ) => {
    const range = SLOT_RANGES[slotIdx];
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 4; c++) {
        const col = range.startCol + c;
        const currentVal = matrix[r]?.[col] ?? 0;
        let targetVal = currentVal;

        if (action === 'clear') {
          targetVal = 0;
        } else if (action === 'fill') {
          targetVal = 1;
        } else if (action === 'invert') {
          targetVal = currentVal === 1 ? 0 : 1;
        } else if (action === 'armsOnly') {
          targetVal = (r === 0 || r === 2) ? 1 : 0;
        } else if (action === 'feetOnly') {
          targetVal = (r === 3 || r === 4) ? 1 : 0;
        }

        if (targetVal !== currentVal) {
          onToggleCell(r, col);
        }
      }
    }
  };

  return (
    <div className="relative w-full mb-1 sm:mb-1.5">
      {/* 4 Block Cards Grid (Atomic Dance Clip Slots with 5-Row Interactive Points) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 sm:gap-2">
        {slots.map((slot, idx) => {
          const range = SLOT_RANGES[idx];
          const isSlotActive = activeCol >= range.startCol && activeCol <= range.endCol && isPlaying;
          const isSelectedForMenu = openSlotIdx === idx;

          return (
            <div
              key={idx}
              className={`relative rounded-lg border p-1.5 sm:p-2 transition-all flex flex-col justify-between ${
                isSlotActive
                  ? 'bg-amber-50/90 border-[#C83C23] shadow-xs ring-1 ring-[#C83C23]/30'
                  : isSelectedForMenu
                  ? 'bg-neutral-100 border-neutral-600 shadow-xs'
                  : 'bg-white/85 border-neutral-300 hover:border-neutral-400'
              }`}
            >
              {/* Slot Header: Range, Name & Menu Trigger */}
              <div className="flex items-center justify-between pb-1 border-b border-neutral-200/80 mb-1">
                <div className="flex items-center gap-1 min-w-0">
                  <span
                    className={`text-[9px] sm:text-[10px] font-mono font-bold tracking-tight ${
                      isSlotActive ? 'text-[#C83C23]' : 'text-neutral-500'
                    }`}
                  >
                    {range.label}
                  </span>
                  <span className="text-[10px] sm:text-xs font-serif font-semibold text-neutral-800 truncate">
                    {slot.clipName}
                  </span>
                  {slot.isCustomized && (
                    <span
                      className="text-[9px] text-[#C83C23] font-mono font-bold shrink-0"
                      title="已进行单独控制微调"
                    >
                      *
                    </span>
                  )}
                </div>

                {/* Dropdown open trigger */}
                <button
                  type="button"
                  onClick={() => setOpenSlotIdx(openSlotIdx === idx ? null : idx)}
                  className="px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-serif text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60 transition-colors flex items-center gap-0.5 shrink-0"
                  title="更换预设或快捷动作"
                >
                  <span>预设</span>
                  <ChevronDown
                    className={`w-2.5 h-2.5 transition-transform ${
                      isSelectedForMenu ? 'rotate-180 text-neutral-900' : 'text-neutral-400'
                    }`}
                  />
                </button>
              </div>

              {/* 
                Five Rows of Interactive Points (五排交互点)
                Allows direct individual control of Left Arm, Torso/Jaw, Right Arm, Left Foot, Right Foot
              */}
              <div className="flex flex-col gap-0.5 sm:gap-1">
                {ACTION_ROWS.map((row, rIdx) => {
                  return (
                    <div
                      key={row.id}
                      className="flex items-center justify-between py-0.2 group/row hover:bg-black/[0.02] rounded px-0.5"
                    >
                      {/* Left: Interactive action label & solo audition trigger */}
                      <button
                        type="button"
                        onClick={() => onManualTrigger?.(row.id as any)}
                        className="text-[9px] sm:text-[10px] font-serif font-medium text-neutral-600 hover:text-[#C83C23] flex items-center gap-1 transition-colors text-left"
                        title={`点击试动【${row.label}】(${row.desc}) 并聆听${row.note}`}
                      >
                        <span className="w-1 h-1 rounded-full bg-neutral-400 group-hover/row:bg-[#C83C23]" />
                        <span>{row.shortLabel}</span>
                      </button>

                      {/* Right: 4 interactive dots for this row across the 4 beats */}
                      <div className="flex items-center gap-1 sm:gap-1.5">
                        {[0, 1, 2, 3].map((cIdx) => {
                          const globalCol = range.startCol + cIdx;
                          const isCellActive = matrix[rIdx]?.[globalCol] === 1;
                          const isScanning = activeCol === globalCol && isPlaying;
                          const isFiveChord = [0, 1, 2, 3, 4].every(
                            (r) => matrix[r]?.[globalCol] === 1
                          );

                          return (
                            <button
                              key={`dot-${rIdx}-${cIdx}`}
                              type="button"
                              onClick={() => onToggleCell(rIdx, globalCol)}
                              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border flex items-center justify-center transition-all relative ${
                                isScanning
                                  ? 'ring-1.5 ring-[#C83C23] ring-offset-0.5'
                                  : ''
                              } ${
                                isCellActive
                                  ? isFiveChord
                                    ? 'bg-amber-700 border-amber-800 shadow-xs text-amber-200'
                                    : 'bg-neutral-900 border-neutral-900 shadow-xs text-white'
                                  : 'bg-neutral-100/90 border-neutral-300 hover:border-neutral-500 hover:bg-neutral-200/70'
                              }`}
                              title={`${row.label} · 第 ${globalCol + 1} 拍 (${
                                isCellActive ? '已激活按动' : '未激活'
                              })${isFiveChord ? ' · 五音同按' : ''}`}
                            >
                              {isCellActive && (
                                <span
                                  className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${
                                    isFiveChord ? 'bg-amber-300' : 'bg-neutral-200'
                                  }`}
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Beat Number Indicator at bottom of slot */}
              <div className="mt-1 pt-0.5 border-t border-neutral-200/50 flex items-center justify-between text-[8px] sm:text-[9px] text-neutral-400 font-mono">
                <span className="font-serif text-neutral-400">拍位</span>
                <div className="flex items-center gap-1 sm:gap-1.5 pr-0.5">
                  {[0, 1, 2, 3].map((cIdx) => {
                    const globalCol = range.startCol + cIdx;
                    const isScanning = activeCol === globalCol && isPlaying;
                    return (
                      <span
                        key={cIdx}
                        className={`w-3.5 sm:w-4 text-center ${
                          isScanning ? 'text-[#C83C23] font-bold' : ''
                        }`}
                      >
                        {cIdx + 1}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dropdown Popover Modal for selecting atomic clips or quick batch presets */}
      {openSlotIdx !== null && (
        <div
          ref={popoverRef}
          className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white/95 backdrop-blur-md rounded-xl border border-neutral-300 shadow-xl p-3 max-h-[350px] overflow-y-auto animate-ink-pop"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-neutral-200 mb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#C83C23]" />
              <span className="text-xs sm:text-sm font-serif font-semibold text-neutral-800">
                动作槽调控 · 第 {openSlotIdx + 1} 乐句 ({SLOT_RANGES[openSlotIdx].label})
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* Quick Batch Buttons */}
              <button
                onClick={() => handleQuickSlotAction(openSlotIdx, 'clear')}
                className="px-2 py-0.5 text-[10px] rounded border border-neutral-300 hover:bg-neutral-100 text-neutral-600 transition-colors"
                title="清空本槽所有动作"
              >
                清空槽位
              </button>
              <button
                onClick={() => handleQuickSlotAction(openSlotIdx, 'feetOnly')}
                className="px-2 py-0.5 text-[10px] rounded border border-neutral-300 hover:bg-neutral-100 text-neutral-600 transition-colors"
                title="只激活左右脚动作"
              >
                仅脚部踏动
              </button>
              <button
                onClick={() => handleQuickSlotAction(openSlotIdx, 'armsOnly')}
                className="px-2 py-0.5 text-[10px] rounded border border-neutral-300 hover:bg-neutral-100 text-neutral-600 transition-colors"
                title="只激活双臂动作"
              >
                仅上肢舒展
              </button>
              <button
                onClick={() => setOpenSlotIdx(null)}
                className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Grid of Available Clips */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {ATOMIC_CLIPS.map((clip) => {
              const isCurrent =
                slots[openSlotIdx]?.clipId === clip.id && !slots[openSlotIdx]?.isCustomized;

              return (
                <div
                  key={clip.id}
                  onClick={() => {
                    onSelectClipForSlot(openSlotIdx, clip);
                    setOpenSlotIdx(null);
                  }}
                  className={`cursor-pointer p-2.5 rounded-lg border transition-all flex flex-col justify-between group ${
                    isCurrent
                      ? 'bg-amber-50 border-[#C83C23] shadow-xs'
                      : 'bg-neutral-50/70 border-neutral-200 hover:border-neutral-400 hover:bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-serif font-semibold text-neutral-800 group-hover:text-[#C83C23] transition-colors">
                          {clip.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-neutral-200/70 text-neutral-600">
                          {clip.categoryLabel}
                        </span>
                      </div>
                      <p className="text-[10px] text-neutral-500 font-light mt-0.5 line-clamp-1">
                        {clip.description}
                      </p>
                    </div>

                    {isCurrent && <Check className="w-3.5 h-3.5 text-[#C83C23] shrink-0 mt-0.5" />}
                  </div>

                  {/* 5x4 mini matrix pattern preview dots with 5 row labels */}
                  <div className="mt-2.5 pt-1.5 border-t border-neutral-200/60 flex items-center justify-between">
                    <div className="flex flex-col gap-0.5">
                      {clip.pattern.map((row, rIdx) => (
                        <div key={`row-${rIdx}`} className="flex items-center gap-1">
                          <span className="text-[8px] font-serif text-neutral-400 w-5">
                            {ACTION_ROWS[rIdx]?.shortLabel}
                          </span>
                          <div className="flex gap-0.5">
                            {row.map((val, cIdx) => (
                              <span
                                key={`${rIdx}-${cIdx}`}
                                className={`w-1.5 h-1.5 rounded-full ${
                                  val === 1 ? 'bg-neutral-900' : 'bg-neutral-200'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <span className="text-[9px] text-neutral-400 font-serif">
                      {clip.tags.join(' · ')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

