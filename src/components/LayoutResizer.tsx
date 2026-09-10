import React, { useEffect, useRef } from 'react';
import { GripHorizontal, ChevronsUpDown, RotateCcw, Monitor, Sliders } from 'lucide-react';

interface LayoutResizerProps {
  splitPercent: number; // 18 to 82
  onDrag: (newPercent: number) => void;
  onReset: () => void;
  onSetPreset: (percent: number) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
}

export const LayoutResizer: React.FC<LayoutResizerProps> = ({
  splitPercent,
  onDrag,
  onReset,
  onSetPreset,
  containerRef,
  isDragging,
  setIsDragging,
}) => {
  const barRef = useRef<HTMLDivElement>(null);

  // Pointer drag start
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only respond to left click / primary touch
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    setIsDragging(true);
  };

  // Pointer drag move
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relativeY = e.clientY - rect.top;
    const rawPercent = (relativeY / rect.height) * 100;
    // Bound between 18% and 82% to keep both views usable
    const clampedPercent = Math.min(82, Math.max(18, rawPercent));
    onDrag(Math.round(clampedPercent * 10) / 10);
  };

  // Pointer drag end
  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      setIsDragging(false);
    }
  };

  // Global window fallback listener in case pointer capture drops
  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalEnd = () => {
      setIsDragging(false);
    };

    window.addEventListener('pointerup', handleGlobalEnd);
    window.addEventListener('pointercancel', handleGlobalEnd);
    return () => {
      window.removeEventListener('pointerup', handleGlobalEnd);
      window.removeEventListener('pointercancel', handleGlobalEnd);
    };
  }, [isDragging, setIsDragging]);

  // Keyboard accessibility: Up/Down arrow keys when focused
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      onDrag(Math.max(18, splitPercent - 2));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      onDrag(Math.min(82, splitPercent + 2));
    } else if (e.key === 'Home' || e.key === 'Enter') {
      e.preventDefault();
      onReset();
    }
  };

  return (
    <div
      ref={barRef}
      role="separator"
      aria-orientation="horizontal"
      aria-valuenow={Math.round(splitPercent)}
      aria-valuemin={18}
      aria-valuemax={82}
      tabIndex={0}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onDoubleClick={onReset}
      onKeyDown={handleKeyDown}
      className={`relative w-full h-5 sm:h-5.5 select-none shrink-0 z-30 flex items-center justify-between px-3 sm:px-6 transition-colors border-y border-neutral-300/80 cursor-row-resize ${
        isDragging
          ? 'bg-amber-100/90 border-[#C83C23]/60 shadow-xs ring-1 ring-[#C83C23]/30'
          : 'bg-stone-100/90 hover:bg-neutral-200/90'
      }`}
      title="上下拖动拉轴调节展示与交互比例 · 双击重置为50%"
    >
      {/* Left: Scroll Axis Seal & Proportion Badge */}
      <div className="flex items-center gap-2 pointer-events-none">
        <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-serif text-neutral-600">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C83C23]/80" />
          <span className="font-semibold text-neutral-700">画轴分屏</span>
        </div>
        <span className="text-[10px] font-mono text-neutral-500 hidden sm:inline">
          上方展示 {Math.round(splitPercent)}% · 下方交互 {Math.round(100 - splitPercent)}%
        </span>
      </div>

      {/* Center: Tactile Drag Grip (卷轴拉杆) */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/90 border border-neutral-300/90 shadow-2xs group-hover:border-neutral-400 group-hover:shadow-xs transition-all pointer-events-auto">
        <ChevronsUpDown className="w-3 h-3 text-neutral-400 group-hover:text-neutral-700" />
        <GripHorizontal className="w-3.5 h-3.5 text-neutral-500" />
        <span className="text-[10px] font-serif font-medium text-neutral-700 hidden md:inline">
          上下拖动拉轴
        </span>
        <ChevronsUpDown className="w-3 h-3 text-neutral-400 group-hover:text-neutral-700" />
      </div>

      {/* Right: Quick Preset Buttons */}
      <div className="flex items-center gap-1 sm:gap-1.5 pointer-events-auto">
        {/* Preset: Stage 70% */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSetPreset(70);
          }}
          className={`px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-serif transition-colors flex items-center gap-0.5 ${
            Math.abs(splitPercent - 70) < 3
              ? 'bg-neutral-800 text-amber-200 font-medium'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/70 border border-neutral-300/60'
          }`}
          title="以舞台预览为主 (上 70% : 下 30%)"
        >
          <Monitor className="w-2.5 h-2.5 hidden sm:inline" />
          <span>展示优先</span>
        </button>

        {/* Preset: 50% Balanced */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onReset();
          }}
          className={`px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-serif transition-colors flex items-center gap-0.5 ${
            Math.abs(splitPercent - 50) < 3
              ? 'bg-neutral-800 text-amber-200 font-medium'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/70 border border-neutral-300/60'
          }`}
          title="均等分屏 (上 50% : 下 50%)"
        >
          <RotateCcw className="w-2.5 h-2.5 hidden sm:inline" />
          <span>均等</span>
        </button>

        {/* Preset: Matrix 70% */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSetPreset(30);
          }}
          className={`px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-serif transition-colors flex items-center gap-0.5 ${
            Math.abs(splitPercent - 30) < 3
              ? 'bg-neutral-800 text-amber-200 font-medium'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/70 border border-neutral-300/60'
          }`}
          title="以动作长卷与矩阵编排为主 (上 30% : 下 70%)"
        >
          <Sliders className="w-2.5 h-2.5 hidden sm:inline" />
          <span>交互优先</span>
        </button>
      </div>
    </div>
  );
};
