import React, { useState } from 'react';
import { PuppetData, PuppetInstrument, PuppetOutfit } from '../types';
import { X, Check, Music, Sparkles, Trash2 } from 'lucide-react';

interface PuppetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavePuppet: (puppet: PuppetData) => void;
  onDeletePuppet?: (puppetId: string) => void;
  initialPuppet?: PuppetData | null;
  mode: 'add' | 'edit';
  canDelete?: boolean;
}

interface InstrumentOption {
  id: PuppetInstrument;
  name: string;
  enName: string;
  icon: string;
  range: string;
  desc: string;
  defaultColor: string;
}

const INSTRUMENT_OPTIONS: InstrumentOption[] = [
  {
    id: 'trumpet',
    name: '小号 (吹奏按键)',
    enName: 'Trumpet',
    icon: '🎺',
    range: 'Bb5 · F5 · D5 · Bb4 · F4',
    desc: '端举胸前含嘴吹奏，双手按动三联活塞活塞杆，号口声浪律动发光',
    defaultColor: '#D97706',
  },
  {
    id: 'tuba',
    name: '大号 (吹奏低音)',
    enName: 'Tuba',
    icon: '📯',
    range: 'F3 · D3 · Bb2 · F2 · Bb1',
    desc: '环抱巨大黄铜盘管贴唇吹奏，四活塞连动起伏，浑厚低音摇摆沉吟',
    defaultColor: '#B45309',
  },
  {
    id: 'clarinet',
    name: '单簧管 (吹奏指法)',
    enName: 'Clarinet',
    icon: '🎷',
    range: 'G5 · E5 · C5 · A4 · F4',
    desc: '双唇含乌木吹嘴，双手在音孔六组银键间灵活按压，悠扬木管旋律',
    defaultColor: '#0F766E',
  },
  {
    id: 'oboe',
    name: '双簧管 (吹奏双簧)',
    enName: 'Oboe',
    icon: '🎶',
    range: 'A5 · F#5 · D5 · B4 · G4',
    desc: '双唇夹含麦秆双簧片，双手七键交替起落，宫廷华贵穿透声色',
    defaultColor: '#4338CA',
  },
  {
    id: 'harp',
    name: '竖琴 (双手弹拨)',
    enName: 'Harp',
    icon: '🎼',
    range: 'C6 · A5 · F5 · D5 · C4',
    desc: '侧身抚琴，双手在十根金弦间流畅拂掠与琶音拨动，琴弦颤动闪烁',
    defaultColor: '#CA8A04',
  },
  {
    id: 'drum',
    name: '鼓 (双槌击打)',
    enName: 'Drum',
    icon: '🥁',
    range: '镲片 · 通鼓 · 军鼓 · 木梆 · 底鼓',
    desc: '左右金槌交替下击鼓面，鼓膜共振光环扩散，身体随节奏律动弹跳',
    defaultColor: '#1D4E89',
  },
  {
    id: 'bell',
    name: '八音钟琴 (剑与击槌)',
    enName: 'Chime Bell',
    icon: '🔔',
    range: 'A5 · G5 · E5 · D5 · C5',
    desc: '左手佩指挥宝剑，右手挥动金槌敲击八音钟琴，清脆悦耳',
    defaultColor: '#C82320',
  },
];

interface OutfitOption {
  id: PuppetOutfit;
  name: string;
  tag: string;
  isBlackNutcracker: boolean;
  desc: string;
  color: string;
}

const OUTFIT_OPTIONS: OutfitOption[] = [
  {
    id: 'princess',
    name: '糖果芭蕾公主 · 仙子舞裙',
    tag: '芭蕾仙子',
    isBlackNutcracker: false,
    desc: '粉金刺绣束腰胸衣、多层晶莹芭蕾蓬蓬裙 (Tutu)、丝带系带足尖芭蕾舞鞋与闪耀珍珠水晶皇冠',
    color: '#EC4899',
  },
  {
    id: 'prince',
    name: '胡桃夹子王子 · 皇家舞服',
    tag: '皇家贵胄',
    isBlackNutcracker: false,
    desc: '皇家天蓝金线盘扣礼服外袍、贵族绶带肩章、纯白芭蕾裤袜与红蓝宝石王冠',
    color: '#2563EB',
  },
  {
    id: 'tuxedo',
    name: '黑色燕尾服 · 绅士胡桃夹子',
    tag: '礼服专场',
    isBlackNutcracker: true,
    desc: '身穿剪裁考究的黑色燕尾服、白褶衬衫与黑领结，头戴黑色大礼帽，经典白桦木雕刻面容',
    color: '#18181B',
  },
  {
    id: 'scarlet',
    name: '皇家朱红礼仪军装',
    tag: '经典仪仗',
    isBlackNutcracker: false,
    desc: '经典红金军装外袍，白织十字绶带，佩戴金羽毛高筒筒帽',
    color: '#C82320',
  },
  {
    id: 'navy',
    name: '皇家深蓝典雅军装',
    tag: '海军仪卫',
    isBlackNutcracker: false,
    desc: '沉稳深蓝上装配纯金肩章，蓝色顶羽与金环腰带',
    color: '#1D4E89',
  },
];

export const PuppetModal: React.FC<PuppetModalProps> = ({
  isOpen,
  onClose,
  onSavePuppet,
  onDeletePuppet,
  initialPuppet,
  mode,
  canDelete = false,
}) => {
  // Current selection states
  const [selectedInstrument, setSelectedInstrument] = useState<PuppetInstrument>(
    initialPuppet?.instrument || 'harp'
  );
  const [selectedOutfit, setSelectedOutfit] = useState<PuppetOutfit>(
    initialPuppet?.outfit || 'princess'
  );
  const [puppetName, setPuppetName] = useState<string>(() => {
    if (initialPuppet?.name) return initialPuppet.name;
    return '糖果芭蕾公主 · 仙子舞者';
  });

  if (!isOpen) return null;

  const currentInst = INSTRUMENT_OPTIONS.find((i) => i.id === selectedInstrument) || INSTRUMENT_OPTIONS[0];
  const currentOutfit = OUTFIT_OPTIONS.find((o) => o.id === selectedOutfit) || OUTFIT_OPTIONS[0];

  const getOutfitPrefix = (outfitId: PuppetOutfit) => {
    if (outfitId === 'princess') return '芭蕾公主';
    if (outfitId === 'prince') return '芭蕾王子';
    if (outfitId === 'tuxedo') return '黑礼服';
    if (outfitId === 'navy') return '深蓝卫兵';
    return '红袍卫兵';
  };

  const handleSelectInstrument = (inst: InstrumentOption) => {
    setSelectedInstrument(inst.id);
    if (!initialPuppet || puppetName.includes('胡桃夹子') || puppetName.includes('木偶') || puppetName.includes('手') || puppetName.includes('舞者') || puppetName.includes('小人')) {
      const outfitPrefix = getOutfitPrefix(selectedOutfit);
      setPuppetName(`${outfitPrefix} · ${inst.name}小人`);
    }
  };

  const handleSelectOutfit = (outfit: OutfitOption) => {
    setSelectedOutfit(outfit.id);
    if (!initialPuppet || puppetName.includes('胡桃夹子') || puppetName.includes('木偶') || puppetName.includes('手') || puppetName.includes('舞者') || puppetName.includes('小人')) {
      const outfitPrefix = getOutfitPrefix(outfit.id);
      setPuppetName(`${outfitPrefix} · ${currentInst.name}小人`);
    }
  };

  const handleQuickPreset = (instId: PuppetInstrument, outfitId: PuppetOutfit = 'tuxedo') => {
    setSelectedInstrument(instId);
    setSelectedOutfit(outfitId);
    const targetInst = INSTRUMENT_OPTIONS.find((i) => i.id === instId);
    if (outfitId === 'princess') {
      setPuppetName(`糖果芭蕾公主 · ${targetInst?.name || '仙子'}舞者`);
    } else if (outfitId === 'prince') {
      setPuppetName(`胡桃夹子王子 · ${targetInst?.name || '皇家'}舞者`);
    } else if (targetInst) {
      setPuppetName(`黑色礼服 · ${targetInst.name}胡桃夹子`);
    }
  };

  const handleConfirm = () => {
    const isTux = selectedOutfit === 'tuxedo';
    const themeColor =
      selectedOutfit === 'princess'
        ? '#EC4899'
        : selectedOutfit === 'prince'
        ? '#2563EB'
        : isTux
        ? '#18181B'
        : currentInst.defaultColor;

    const basePuppet: PuppetData = initialPuppet
      ? {
          ...initialPuppet,
          name: puppetName.trim() || `木偶 · ${currentInst.name}`,
          instrument: selectedInstrument,
          instrumentLabel: `${currentInst.name} (${currentInst.range})`,
          outfit: selectedOutfit,
          isBlackNutcracker: isTux,
          themeColor: themeColor,
        }
      : {
          id: `puppet-${Date.now()}`,
          name: puppetName.trim() || `木偶 · ${currentInst.name}`,
          instrument: selectedInstrument,
          instrumentLabel: `${currentInst.name} (${currentInst.range})`,
          outfit: selectedOutfit,
          isBlackNutcracker: isTux,
          themeColor: themeColor,
          matrix: [
            // Default tasteful 16-step rhythmic pattern suited for the instrument
            selectedInstrument === 'drum'
              ? [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1]
              : [1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 1],
            [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
            [0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1],
            [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0],
            [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 1],
          ],
          slots: [
            { index: 0, clipId: 'custom-1', clipName: `${currentInst.name}·起势`, isCustomized: false },
            { index: 1, clipId: 'custom-2', clipName: `${currentInst.name}·和鸣`, isCustomized: false },
            { index: 2, clipId: 'custom-3', clipName: `${currentInst.name}·疾奏`, isCustomized: false },
            { index: 3, clipId: 'custom-4', clipName: `${currentInst.name}·合璧`, isCustomized: false },
          ],
        };

    onSavePuppet(basePuppet);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-[#FCFAF6] border border-amber-900/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-neutral-800"
        style={{
          boxShadow: '0 25px 50px -12px rgba(20, 10, 5, 0.45), 0 0 0 1px rgba(180, 83, 9, 0.2)',
        }}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-amber-900/15 bg-gradient-to-r from-amber-50 to-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 text-amber-300 flex items-center justify-center text-base shadow-xs">
              {currentOutfit.isBlackNutcracker ? '🎩' : '💂'}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-serif font-bold text-neutral-900 flex items-center gap-2">
                <span>{mode === 'add' ? '添加舞台木偶人偶' : '定制木偶与乐器造型'}</span>
                {currentOutfit.isBlackNutcracker && (
                  <span className="text-[11px] font-sans px-2 py-0.5 rounded-full bg-neutral-900 text-amber-200 border border-amber-500/40 font-medium">
                    黑色燕尾服
                  </span>
                )}
              </h2>
              <p className="text-xs text-neutral-500 font-serif">
                可选择身穿黑色燕尾服的黑木胡桃夹子，手持小号、大号、单簧管、双簧管、竖琴、鼓等六大乐器
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Quick Hero Presets: Princess, Prince & Tuxedo */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickPreset('harp', 'princess')}
              className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all shadow-xs ${
                selectedOutfit === 'princess'
                  ? 'bg-pink-950 text-pink-100 border-pink-400 ring-2 ring-pink-400/40'
                  : 'bg-pink-950/60 border-pink-800/60 text-pink-200 hover:bg-pink-900/80'
              }`}
            >
              <span className="text-xl">🩰</span>
              <div className="text-left">
                <div className="text-xs font-bold text-pink-100">一键：糖果芭蕾公主</div>
                <div className="text-[10px] text-pink-300">粉金Tutu裙 · 竖琴金弦</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickPreset('bell', 'prince')}
              className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all shadow-xs ${
                selectedOutfit === 'prince'
                  ? 'bg-blue-950 text-blue-100 border-blue-400 ring-2 ring-blue-400/40'
                  : 'bg-blue-950/60 border-blue-800/60 text-blue-200 hover:bg-blue-900/80'
              }`}
            >
              <span className="text-xl">👑</span>
              <div className="text-left">
                <div className="text-xs font-bold text-blue-100">一键：胡桃夹子王子</div>
                <div className="text-[10px] text-blue-300">皇家舞服 · 钟琴利剑</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickPreset('trumpet', 'tuxedo')}
              className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all shadow-xs ${
                selectedOutfit === 'tuxedo'
                  ? 'bg-neutral-900 text-amber-100 border-amber-400 ring-2 ring-amber-400/40'
                  : 'bg-neutral-900/80 border-neutral-700 text-amber-200 hover:bg-neutral-800'
              }`}
            >
              <span className="text-xl">🎩</span>
              <div className="text-left">
                <div className="text-xs font-bold text-amber-100">一键：黑色礼服绅士</div>
                <div className="text-[10px] text-amber-300">黑大礼帽 · 吹奏小号</div>
              </div>
            </button>
          </div>

          {/* Quick Preset Buttons for Black Tuxedo Nutcrackers */}
          <div className="bg-neutral-900 text-amber-100 p-3.5 rounded-xl border border-neutral-700 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-serif font-semibold text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>乐器快速切换 (为当前所选造型更换演奏乐器)</span>
              </span>
              <span className="text-[10px] text-neutral-400">点击下方快速生效</span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {(['trumpet', 'tuba', 'clarinet', 'oboe', 'harp', 'drum'] as PuppetInstrument[]).map((instId) => {
                const opt = INSTRUMENT_OPTIONS.find((i) => i.id === instId)!;
                const isCurrent = selectedInstrument === instId;
                return (
                  <button
                    key={instId}
                    onClick={() => handleSelectInstrument(opt)}
                    className={`px-2 py-1.5 rounded-lg text-xs font-serif transition-all flex flex-col items-center gap-0.5 cursor-pointer border ${
                      isCurrent
                        ? 'bg-amber-400 text-neutral-950 font-bold border-amber-300 shadow-sm'
                        : 'bg-neutral-800/90 text-neutral-300 border-neutral-700 hover:bg-neutral-700 hover:text-white'
                    }`}
                  >
                    <span className="text-sm">{opt.icon}</span>
                    <span className="text-[11px] whitespace-nowrap">{opt.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 1: Puppet Name Input */}
          <div>
            <label className="block text-xs font-serif font-bold text-neutral-700 mb-1.5">
              人偶名称
            </label>
            <input
              type="text"
              value={puppetName}
              onChange={(e) => setPuppetName(e.target.value)}
              placeholder="输入人偶名称..."
              className="w-full px-3.5 py-2 text-sm font-serif bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600/30 focus:border-amber-600 shadow-xs"
            />
          </div>

          {/* Section 2: Costume / Outfit Selection */}
          <div>
            <label className="block text-xs font-serif font-bold text-neutral-700 mb-2 flex items-center justify-between">
              <span>选择人偶服饰与外观造型</span>
              <span className="text-[11px] font-normal text-amber-800">
                当前服饰: {currentOutfit.name}
              </span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {OUTFIT_OPTIONS.map((outfit) => {
                const isSelected = selectedOutfit === outfit.id;
                return (
                  <button
                    key={outfit.id}
                    onClick={() => handleSelectOutfit(outfit)}
                    className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? outfit.id === 'princess'
                          ? 'bg-pink-950 text-pink-50 border-pink-400 shadow-md ring-2 ring-pink-400/50'
                          : outfit.id === 'prince'
                          ? 'bg-blue-950 text-blue-50 border-blue-400 shadow-md ring-2 ring-blue-400/50'
                          : outfit.isBlackNutcracker
                          ? 'bg-neutral-900 text-white border-amber-500 shadow-md ring-2 ring-amber-500/50'
                          : 'bg-amber-900 text-amber-50 border-amber-600 shadow-md ring-2 ring-amber-600/50'
                        : 'bg-white text-neutral-800 border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                          isSelected
                            ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                            : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {outfit.tag}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-amber-400" />}
                    </div>

                    <div className="font-serif font-bold text-xs sm:text-sm mb-1">
                      {outfit.name}
                    </div>
                    <p
                      className={`text-[11px] line-clamp-2 leading-relaxed ${
                        isSelected ? 'text-neutral-300' : 'text-neutral-500'
                      }`}
                    >
                      {outfit.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Instrument Selection (小号, 大号, 单簧管, 双簧管, 竖琴, 鼓, 钟琴) */}
          <div>
            <label className="block text-xs font-serif font-bold text-neutral-700 mb-2 flex items-center justify-between">
              <span>手持乐器选择 (6大交响乐器 + 八音钟琴)</span>
              <span className="text-[11px] font-normal text-amber-800">
                当前乐器: {currentInst.name}
              </span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {INSTRUMENT_OPTIONS.map((inst) => {
                const isSelected = selectedInstrument === inst.id;
                return (
                  <button
                    key={inst.id}
                    onClick={() => handleSelectInstrument(inst)}
                    className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2.5 cursor-pointer ${
                      isSelected
                        ? 'bg-amber-50/90 border-amber-600 ring-1 ring-amber-600/40 shadow-xs'
                        : 'bg-white border-neutral-300 hover:bg-neutral-50 hover:border-neutral-400'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0 ${
                        isSelected ? 'bg-amber-600 text-white' : 'bg-neutral-100 text-neutral-700'
                      }`}
                    >
                      {inst.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-serif font-bold text-xs text-neutral-900">
                          {inst.name}
                        </span>
                        <span className="text-[10px] text-neutral-400 font-mono">
                          {inst.enName}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500 leading-snug line-clamp-1 mt-0.5">
                        {inst.desc}
                      </p>
                      <span className="text-[9px] text-amber-900 font-mono font-medium block mt-1">
                        音域: {inst.range}
                      </span>
                    </div>

                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-amber-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-amber-900/15 bg-neutral-50 flex items-center justify-between">
          <div>
            {canDelete && onDeletePuppet && initialPuppet && (
              <button
                onClick={() => {
                  if (confirm(`确定要移除人偶【${initialPuppet.name}】吗？`)) {
                    onDeletePuppet(initialPuppet.id);
                    onClose();
                  }
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-serif text-red-700 hover:bg-red-100/70 border border-red-300 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>移除此人偶</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-100 text-xs font-serif text-neutral-700 transition-colors cursor-pointer"
            >
              取消
            </button>
            <button
              onClick={handleConfirm}
              className="px-5 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-amber-200 border border-neutral-800 text-xs font-serif font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 text-amber-400" />
              <span>{mode === 'add' ? '添加到舞台' : '保存设置'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
