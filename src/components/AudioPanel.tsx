import React, { useRef, useEffect, useState } from 'react';
import { Upload, Music, RotateCcw, Sliders, Volume2, Sparkles, Wand2 } from 'lucide-react';
import { AudioBeatInfo, StyleBias } from '../types';
import { audioChoreographer } from '../utils/audioAnalysis';

interface AudioPanelProps {
  onAudioLoaded: (beatInfo: AudioBeatInfo) => void;
  density: number;
  onDensityChange: (newDensity: number) => void;
  styleBias: StyleBias;
  onStyleBiasChange: (newBias: StyleBias) => void;
  onRegenerate: () => void;
  activeCol: number;
  isPlaying: boolean;
}

export const AudioPanel: React.FC<AudioPanelProps> = ({
  onAudioLoaded,
  density,
  onDensityChange,
  styleBias,
  onStyleBiasChange,
  onRegenerate,
  activeCol,
  isPlaying,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [audioName, setAudioName] = useState<string>('古典笛箫律动 (内置雅乐)');
  const [beatInfo, setBeatInfo] = useState<AudioBeatInfo | null>(null);

  // Initialize with built-in classical demo on mount
  useEffect(() => {
    let isCancelled = false;
    const initDemo = async () => {
      try {
        setIsAnalyzing(true);
        await audioChoreographer.generateClassicalDemo();
        const info = audioChoreographer.getBeatInfo();
        if (!isCancelled && info) {
          setBeatInfo(info);
          onAudioLoaded(info);
        }
      } catch (err) {
        console.error('Failed to init classical demo audio:', err);
      } finally {
        if (!isCancelled) setIsAnalyzing(false);
      }
    };
    initDemo();
    return () => {
      isCancelled = true;
    };
  }, []);

  // Handle local audio file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsAnalyzing(true);
      setAudioName(file.name.replace(/\.[^/.]+$/, ''));
      const info = await audioChoreographer.loadAudioFile(file);
      setBeatInfo(info);
      onAudioLoaded(info);
    } catch (err) {
      console.error('Failed to parse audio file:', err);
    } finally {
      setIsAnalyzing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Reload built-in demo
  const handleLoadDemo = async () => {
    try {
      setIsAnalyzing(true);
      setAudioName('古典笛箫律动 (内置雅乐)');
      await audioChoreographer.generateClassicalDemo();
      const info = audioChoreographer.getBeatInfo();
      if (info) {
        setBeatInfo(info);
        onAudioLoaded(info);
      }
    } catch (err) {
      console.error('Failed to reload demo:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Draw Stone-Blue & Cinnabar waveform with 16 beat markers and 4 phrase brackets
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Background paper wash
    ctx.fillStyle = '#F4F2EB';
    ctx.fillRect(0, 0, width, height);

    const peaks = beatInfo?.peaks || [];
    const peakCount = peaks.length;

    // Draw 4 Phrase background bands
    for (let p = 0; p < 4; p++) {
      const pStart = (p / 4) * width;
      const pWidth = width / 4;
      const isActivePhrase = Math.floor(activeCol / 4) === p;

      if (isActivePhrase && isPlaying) {
        ctx.fillStyle = 'rgba(200, 60, 35, 0.08)';
        ctx.fillRect(pStart, 0, pWidth, height);
      } else if (p % 2 === 1) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.02)';
        ctx.fillRect(pStart, 0, pWidth, height);
      }

      // Phrase dividing subtle dashed line
      if (p > 0) {
        ctx.beginPath();
        ctx.strokeStyle = '#D1CEC7';
        ctx.setLineDash([3, 3]);
        ctx.moveTo(pStart, 0);
        ctx.lineTo(pStart, height);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Draw Waveform Bars (Mineral Stone-Blue gradient)
    if (peakCount > 0) {
      const barWidth = width / peakCount;
      const centerY = height / 2;

      for (let i = 0; i < peakCount; i++) {
        const x = i * barWidth;
        const rawAmp = peaks[i] || 0.1;
        const barHeight = Math.max(3, rawAmp * (height * 0.78));

        // Stone blue gradient with cinnabar highlight around active frame
        const progressFrac = i / peakCount;
        const currentActiveFrac = (activeCol + 0.5) / 16;
        const distToNeedle = Math.abs(progressFrac - currentActiveFrac);

        if (distToNeedle < 0.04 && isPlaying) {
          ctx.fillStyle = '#C83C23'; // Cinnabar needle resonance
        } else {
          ctx.fillStyle = i % 2 === 0 ? '#1E606D' : '#2A7A89'; // Mineral Celadon Blue
        }

        ctx.fillRect(x + 0.5, centerY - barHeight / 2, Math.max(1.2, barWidth - 1), barHeight);
      }
    } else {
      // Idle wave placeholder
      ctx.beginPath();
      ctx.strokeStyle = '#9AA5A8';
      ctx.lineWidth = 1.5;
      const centerY = height / 2;
      for (let x = 0; x < width; x++) {
        const y = centerY + Math.sin(x * 0.08) * 8 * Math.cos(x * 0.02);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Draw 16 Beat points on the bottom edge
    for (let b = 0; b < 16; b++) {
      const bx = ((b + 0.5) / 16) * width;
      const isDownbeat = b % 4 === 0;
      const isCurrent = b === activeCol;

      ctx.beginPath();
      ctx.arc(bx, height - 6, isCurrent ? 3.5 : isDownbeat ? 2.5 : 1.5, 0, Math.PI * 2);
      ctx.fillStyle = isCurrent ? '#C83C23' : isDownbeat ? '#1A1A1A' : '#8C8C84';
      ctx.fill();
    }

    // Active Needle Playhead cursor
    const needleX = ((activeCol + 0.5) / 16) * width;
    ctx.beginPath();
    ctx.strokeStyle = '#C83C23';
    ctx.lineWidth = 1.8;
    ctx.moveTo(needleX, 0);
    ctx.lineTo(needleX, height);
    ctx.stroke();

    // Small cinnabar diamond pinhead at top of playhead
    ctx.fillStyle = '#C83C23';
    ctx.beginPath();
    ctx.moveTo(needleX, 0);
    ctx.lineTo(needleX - 3, 5);
    ctx.lineTo(needleX + 3, 5);
    ctx.closePath();
    ctx.fill();
  }, [beatInfo, activeCol, isPlaying]);

  return (
    <div
      id="audio-analysis-panel"
      className="w-full bg-white/75 backdrop-blur-sm rounded-xl border border-neutral-300/80 p-2.5 sm:p-3 shadow-xs flex flex-col gap-2.5 select-none"
    >
      {/* 1. Header: Upload & Audio Source Info */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#1E606D]" />
          <h2 className="text-xs font-serif font-semibold text-neutral-800 tracking-wider">
            听音辨律 · 乐理转译 (AtomicDance)
          </h2>
          <span className="text-[11px] text-neutral-500 font-light truncate max-w-[180px] sm:max-w-[260px]">
            {audioName}
          </span>
          {isAnalyzing && (
            <span className="text-[10px] text-[#C83C23] animate-pulse flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C83C23] animate-ping" />
              <span>谱析小节中...</span>
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1 text-xs rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-300 flex items-center gap-1.5 transition-colors"
            title="导入本地 MP3 / WAV 音频文件"
          >
            <Upload className="w-3.5 h-3.5 text-neutral-600" />
            <span>导入音频</span>
          </button>

          <button
            onClick={handleLoadDemo}
            className="px-2.5 py-1 text-xs rounded-md bg-white hover:bg-neutral-50 text-neutral-600 border border-neutral-300 flex items-center gap-1.5 transition-colors"
            title="重载内置经典笛箫鼓点短音频"
          >
            <Music className="w-3.5 h-3.5 text-[#1E606D]" />
            <span>经典雅乐</span>
          </button>
        </div>
      </div>

      {/* 2. Audio Waveform & Beat Canvas (石青水墨波形图) */}
      <div className="relative w-full h-[52px] sm:h-[58px] rounded-lg overflow-hidden border border-neutral-300/80 shadow-inner">
        <canvas
          ref={canvasRef}
          width={640}
          height={64}
          className="w-full h-full block"
        />
        {/* Phrase range badges floating on canvas */}
        <div className="absolute top-1 left-0 right-0 px-2 flex justify-between text-[9px] font-serif text-neutral-500 pointer-events-none">
          <span>乐句一 (01-04拍)</span>
          <span>乐句二 (05-08拍)</span>
          <span>乐句三 (09-12拍)</span>
          <span>乐句四 (13-16拍)</span>
        </div>
      </div>

      {/* 3. Top Macro Controls (顶层全局双层调控) */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-neutral-200/80">
        {/* Macro: Density Slider (动作密度滑块 10% ~ 100%) */}
        <div className="flex items-center gap-2 min-w-[170px] sm:min-w-[200px]">
          <span className="text-[11px] font-serif text-neutral-700 whitespace-nowrap">
            动作密度：
          </span>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.05"
            value={density}
            onChange={(e) => onDensityChange(parseFloat(e.target.value))}
            className="w-24 sm:w-28 accent-[#C83C23] cursor-pointer"
            title="低密度留白静远，高密度紧凑连击"
          />
          <span className="text-[11px] font-mono text-neutral-600 w-8 text-right">
            {Math.round(density * 100)}%
          </span>
          <span className="text-[10px] text-neutral-400 font-light hidden md:inline">
            {density < 0.35 ? '(简淡留白)' : density > 0.75 ? '(铿锵密集)' : '(舒朗相间)'}
          </span>
        </div>

        {/* Macro: Style Bias (舞姿倾向选择器) */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-serif text-neutral-700 whitespace-nowrap">
            姿态倾向：
          </span>
          <div className="inline-flex rounded-lg border border-neutral-300 p-0.5 bg-neutral-100/80 text-[11px]">
            <button
              onClick={() => onStyleBiasChange('sleeves')}
              className={`px-2 py-0.5 rounded-md transition-all ${
                styleBias === 'sleeves'
                  ? 'bg-neutral-900 text-amber-50 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              水袖手臂
            </button>
            <button
              onClick={() => onStyleBiasChange('body')}
              className={`px-2 py-0.5 rounded-md transition-all ${
                styleBias === 'body'
                  ? 'bg-neutral-900 text-amber-50 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              腰身摇曳
            </button>
            <button
              onClick={() => onStyleBiasChange('balanced')}
              className={`px-2 py-0.5 rounded-md transition-all ${
                styleBias === 'balanced'
                  ? 'bg-neutral-900 text-amber-50 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              阴阳均衡
            </button>
          </div>
        </div>

        {/* Macro: Regenerate Button (重新演绎) */}
        <button
          onClick={onRegenerate}
          className="px-3 py-1 rounded-md text-xs font-serif bg-neutral-900 hover:bg-neutral-800 text-amber-50 flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 ml-auto sm:ml-0"
          title="基于当前旋律与音高起伏，随机生成另一种符合乐理的动作编排方案"
        >
          <Wand2 className="w-3.5 h-3.5 text-amber-400" />
          <span>重新演绎</span>
        </button>
      </div>
    </div>
  );
};
