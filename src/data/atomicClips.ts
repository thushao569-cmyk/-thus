import { AtomicClip } from '../types';

export const ATOMIC_CLIPS: AtomicClip[] = [
  {
    id: 'shubi_tanyun',
    name: '舒臂探云',
    category: 'sleeves',
    categoryLabel: '水袖舒展',
    description: '双袖如轻烟徐徐探出，含胸内蓄，意在云天',
    tags: ['舒展', '上肢', '行云'],
    pattern: [
      [1, 0, 1, 0], // 左臂水袖
      [0, 1, 0, 0], // 躯干机芯
      [0, 1, 0, 1], // 右臂玉手
      [0, 0, 1, 0], // 左腿踢步
      [0, 0, 0, 1], // 右腿落点
    ],
  },
  {
    id: 'zuoyi_shoushi',
    name: '作揖收势',
    category: 'body',
    categoryLabel: '腰身含蓄',
    description: '敛气凝神，躯干徐徐沉降，以礼收势',
    tags: ['沉降', '行礼', '蓄势'],
    pattern: [
      [0, 1, 0, 0],
      [1, 0, 1, 0],
      [0, 1, 0, 0],
      [1, 0, 0, 0],
      [0, 0, 1, 0],
    ],
  },
  {
    id: 'fanxiu_huimou',
    name: '翻袖回眸',
    category: 'sleeves',
    categoryLabel: '水袖转折',
    description: '左袖骤扬遮面，右臂翩然回环，顾盼生姿',
    tags: ['回环', '顾盼', '灵动'],
    pattern: [
      [1, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 1, 1],
      [0, 1, 0, 0],
      [1, 0, 0, 1],
    ],
  },
  {
    id: 'chenshen_jingli',
    name: '沉身静立',
    category: 'calm',
    categoryLabel: '留白凝神',
    description: '大巧若拙，极简留白，如老僧入定，静水流深',
    tags: ['留白', '静止', '禅意'],
    pattern: [
      [0, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
  },
  {
    id: 'jifeng_zhenbi',
    name: '疾风振臂',
    category: 'dynamic',
    categoryLabel: '激越鼓点',
    description: '金戈铁马，双臂交替击浪，节拍铿锵有力',
    tags: ['高潮', '强节拍', '刚劲'],
    pattern: [
      [1, 0, 1, 1],
      [0, 1, 0, 0],
      [1, 1, 0, 1],
      [1, 0, 1, 0],
      [0, 1, 0, 1],
    ],
  },
  {
    id: 'jinghong_zheshen',
    name: '惊鸿折身',
    category: 'body',
    categoryLabel: '腰身折转',
    description: '翩若惊鸿，婉若游龙，躯干大幅度倾仰折转',
    tags: ['折腰', '游龙', '转折'],
    pattern: [
      [0, 1, 1, 0],
      [1, 1, 0, 1],
      [0, 0, 1, 1],
      [1, 0, 0, 1],
      [0, 1, 1, 0],
    ],
  },
  {
    id: 'xingyun_liushui',
    name: '行云流水',
    category: 'balanced',
    categoryLabel: '阴阳调和',
    description: '左臂引路，躯干承转，右臂挥洒，一气呵成',
    tags: ['波浪', '顺畅', '连贯'],
    pattern: [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
      [1, 0, 0, 0],
    ],
  },
  {
    id: 'fuxiu_chenyuan',
    name: '拂袖沉渊',
    category: 'sleeves',
    categoryLabel: '水袖下抚',
    description: '双袖由高天拂落，如瀑流下坠，归于沉静',
    tags: ['下坠', '沉淀', '平复'],
    pattern: [
      [1, 1, 0, 0],
      [0, 1, 1, 0],
      [1, 0, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ],
  },
  {
    id: 'tanhai_wangyue',
    name: '探海望月',
    category: 'balanced',
    categoryLabel: '姿态造境',
    description: '一臂探海，一臂望月，身姿如松，虚实相生',
    tags: ['定格', '雕塑', '对影'],
    pattern: [
      [1, 0, 1, 0],
      [1, 0, 0, 1],
      [0, 1, 0, 0],
      [0, 1, 0, 1],
      [1, 0, 1, 0],
    ],
  },
  {
    id: 'jiqing_mingjin',
    name: '击磬鸣金',
    category: 'dynamic',
    categoryLabel: '律动敲击',
    description: '右臂推杆高频鸣金，左臂定身蓄力，如击金石',
    tags: ['清脆', '钟磬', '定点'],
    pattern: [
      [0, 0, 1, 0],
      [0, 0, 0, 0],
      [1, 0, 1, 1],
      [0, 1, 0, 0],
      [1, 0, 0, 1],
    ],
  },
  {
    id: 'lingkong_zhanchi',
    name: '凌空展翅',
    category: 'dynamic',
    categoryLabel: '双臂凌云',
    description: '双翼振起，展翅高翔，躯干昂然拔背',
    tags: ['起势', '昂扬', '双翼'],
    pattern: [
      [1, 1, 0, 1],
      [1, 0, 1, 0],
      [1, 1, 0, 1],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
    ],
  },
  {
    id: 'xuhuai_ruogu',
    name: '虚怀若谷',
    category: 'calm',
    categoryLabel: '自然呼吸',
    description: '恬淡无为，形神合一，仅以细微呼吸带动推杆',
    tags: ['恬淡', '呼吸', '微澜'],
    pattern: [
      [0, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 1],
    ],
  },
];

export const CLIP_MAP = new Map<string, AtomicClip>(
  ATOMIC_CLIPS.map((clip) => [clip.id, clip])
);

export function getClipById(id: string): AtomicClip {
  return CLIP_MAP.get(id) || ATOMIC_CLIPS[0];
}
