import { Platform } from 'react-native';

export const C = {
  ink: '#2A2730',
  sub: '#6B6670',
  bg: '#FFFDF9',
  page: '#F3EEE4',
  card: '#FFFFFF',
  soft: '#F7F4EE',
  line: '#F0EADF',
  sun: '#FFC83D',
  sunDeep: '#FFB21E',
  sunTint: '#FFF3D1',
  sunInk: '#6E4100',
  brownInk: '#5A4A2A',
  good: '#2F7A47',
  goodTint: '#DDF3E4',
  lineGreen: '#06C755',
  danger: '#A12B1F',
  pinkRing: '#FF8FA3',
} as const;

// Web版ではGoogle Fonts（src/app/+html.tsx で読み込み）、スマホでは端末の標準フォント
export const fonts = {
  rounded: Platform.select({ web: '"M PLUS Rounded 1c", sans-serif', default: undefined }),
  body: Platform.select({ web: '"Noto Sans JP", sans-serif', default: undefined }),
};

export type CategoryId = 'sugoi' | 'hokkori' | 'kusu' | 'iyashi' | 'mofu' | 'nippon';

export const CATEGORIES: Record<CategoryId, { label: string; bg: string; fg: string }> = {
  sugoi: { label: 'すごい', bg: '#FFE3CC', fg: '#8A3B00' },
  hokkori: { label: 'ほっこり', bg: '#FFE0E6', fg: '#8F2343' },
  kusu: { label: 'くすっ', bg: '#FFF1B8', fg: '#6E5400' },
  iyashi: { label: 'いやし', bg: '#DDF3E4', fg: '#1F6B3A' },
  mofu: { label: 'もふもふ', bg: '#E3E8FF', fg: '#2F3F99' },
  nippon: { label: 'にっぽん', bg: '#FFE1DC', fg: '#9B2C1F' },
};

export const CATEGORY_ORDER: CategoryId[] = ['sugoi', 'hokkori', 'kusu', 'iyashi', 'mofu', 'nippon'];

export type StampKind = 'hokko' | 'sugoi' | 'kusu' | 'jin';

export const STAMPS: { kind: StampKind; label: string; tint: string; ring: string }[] = [
  { kind: 'hokko', label: 'ほっこり', tint: '#FFF0F3', ring: '#FF8FA3' },
  { kind: 'sugoi', label: 'すごい', tint: '#FFF1E3', ring: '#FFB547' },
  { kind: 'kusu', label: 'くすっ', tint: '#FFF8D6', ring: '#E8C040' },
  { kind: 'jin', label: 'じーん', tint: '#EEF2FF', ring: '#8FA8FF' },
];
