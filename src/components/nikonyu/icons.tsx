import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import type { CategoryId, StampKind } from '@/constants/nikonyu';
import type { AvatarKind } from '@/data/articles';

const HEART = 'M0 5C-6 1-7-3-4.5-5C-2.5-6.5-.5-5.5 0-3.5C.5-5.5 2.5-6.5 4.5-5C7-3 6 1 0 5Z';
const INK = '#3A3550';

export function CategoryIcon({ id, color, bg, size = 12 }: { id: CategoryId | 'all'; color: string; bg: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16">
      {id === 'all' ? (
        <G fill={color}>
          <Rect x="2" y="2" width="5" height="5" rx="1.6" />
          <Rect x="9" y="2" width="5" height="5" rx="1.6" />
          <Rect x="2" y="9" width="5" height="5" rx="1.6" />
          <Rect x="9" y="9" width="5" height="5" rx="1.6" />
        </G>
      ) : null}
      {id === 'sugoi' ? <Path d="M8 1.5l1.9 4 4.3.5-3.2 3 .9 4.3L8 11.1 4.1 13.3l.9-4.3-3.2-3 4.3-.5z" fill={color} /> : null}
      {id === 'hokkori' ? <Path d="M8 14s-6-3.7-6-8.2A3.3 3.3 0 0 1 8 4a3.3 3.3 0 0 1 6 1.8C14 10.3 8 14 8 14z" fill={color} /> : null}
      {id === 'kusu' ? (
        <G>
          <Circle cx="8" cy="8" r="7" fill={color} />
          <Path d="M4.6 9h6.8c-.5 2-1.8 3-3.4 3S5.1 11 4.6 9z" fill={bg} />
          <Path d="M4.6 6.2l1.6 1-1.6 1M11.4 6.2l-1.6 1 1.6 1" stroke={bg} strokeWidth="1.2" fill="none" strokeLinecap="round" />
        </G>
      ) : null}
      {id === 'iyashi' ? (
        <Path d="M13.5 2.5C6 2.5 2.5 6 2.5 11c0 1 .2 1.8.5 2.5 1-3 3-5.5 6-7-2.5 2-4 4.3-4.8 7.2.8.3 1.6.3 2.3.3 5 0 7-4 7-11.5z" fill={color} />
      ) : null}
      {id === 'mofu' ? (
        <G fill={color}>
          <Ellipse cx="8" cy="10.8" rx="3.6" ry="3" />
          <Circle cx="3.4" cy="7.2" r="1.6" />
          <Circle cx="6.2" cy="4.2" r="1.6" />
          <Circle cx="9.8" cy="4.2" r="1.6" />
          <Circle cx="12.6" cy="7.2" r="1.6" />
        </G>
      ) : null}
      {id === 'nippon' ? (
        <G>
          <Path d="M1 14L6 4.5h4L15 14z" fill={color} stroke={color} strokeWidth="1" strokeLinejoin="round" />
          <Path d="M6 4.5h4l1.3 2.5-1.7-.9-1.6 1.1-1.6-1.1-1.7.9z" fill={bg} />
        </G>
      ) : null}
    </Svg>
  );
}

export function StampFace({ kind, size = 42 }: { kind: StampKind; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      {kind === 'hokko' ? (
        <G>
          <Circle cx="24" cy="24" r="20" fill="#FFC9D4" />
          <Path d="M14 22q3.5-4 7 0M27 22q3.5-4 7 0" stroke={INK} strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <Ellipse cx="13.5" cy="28" rx="4" ry="2.6" fill="#FF8FA3" />
          <Ellipse cx="34.5" cy="28" rx="4" ry="2.6" fill="#FF8FA3" />
          <Path d="M20 29q4 4 8 0" stroke={INK} strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <Path transform="translate(39 9) scale(0.85)" d={HEART} fill="#FF6F8E" />
        </G>
      ) : null}
      {kind === 'sugoi' ? (
        <G>
          <Path d="M24 5l5.4 11 12.1 1.8-8.8 8.5 2.1 12.1L24 32.7l-10.8 5.7 2.1-12.1-8.8-8.5 12.1-1.8z" fill="#FFB547" stroke="#FFB547" strokeWidth="4" strokeLinejoin="round" />
          <Circle cx="20" cy="22" r="2" fill={INK} />
          <Circle cx="28" cy="22" r="2" fill={INK} />
          <Path d="M20.5 26.5h7a3.5 3.5 0 0 1-7 0z" fill={INK} />
          <Ellipse cx="16.5" cy="27" rx="2.4" ry="1.6" fill="#FF8F7A" />
          <Ellipse cx="31.5" cy="27" rx="2.4" ry="1.6" fill="#FF8F7A" />
          <Path d="M42 33l1.2 2.8 2.8 1.2-2.8 1.2-1.2 2.8-1.2-2.8-2.8-1.2 2.8-1.2z" fill="#FFD27A" />
        </G>
      ) : null}
      {kind === 'kusu' ? (
        <G>
          <Circle cx="24" cy="24" r="20" fill="#FFE07A" />
          <Path d="M13 18l6 3-6 3M35 18l-6 3 6 3" stroke={INK} strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M15 28h18c-1 6-5 9-9 9s-8-3-9-9z" fill={INK} />
          <Path d="M19.5 34c1.4-1.5 3-2.3 4.5-2.3s3.1.8 4.5 2.3c-1.3 1.5-2.8 2.4-4.5 2.4s-3.2-.9-4.5-2.4z" fill="#FF8FA3" />
        </G>
      ) : null}
      {kind === 'jin' ? (
        <G>
          <Circle cx="24" cy="24" r="20" fill="#C4D3FF" />
          <Path d="M14 21q3.5 3 7 0M27 21q3.5 3 7 0" stroke={INK} strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <Path d="M33.5 24.5c1.7 2.5 2.7 4.1 2.7 5.4a2.7 2.7 0 0 1-5.4 0c0-1.3 1-2.9 2.7-5.4z" fill="#4D9BFF" />
          <Path d="M20 31q4 2.6 8 0" stroke={INK} strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <Ellipse cx="13.5" cy="27" rx="3.4" ry="2.2" fill="#FFB3C1" />
        </G>
      ) : null}
    </Svg>
  );
}

export function Avatar({ kind, size = 40 }: { kind: AvatarKind; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      {kind === 'cat' ? (
        <G>
          <Circle cx="20" cy="20" r="20" fill="#FFE0E6" />
          <Path d="M10 17L11 6l8 6zM30 17L29 6l-8 6z" fill="#F2A65A" />
          <Circle cx="20" cy="22" r="11" fill="#F2A65A" />
          <Path d="M15 21q1.5-1.8 3 0M22 21q1.5-1.8 3 0" stroke={INK} strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <Path d="M19 24.5h2l-1 1.2z" fill="#FF8FA3" />
        </G>
      ) : null}
      {kind === 'bear' ? (
        <G>
          <Circle cx="20" cy="20" r="20" fill="#DDF3E4" />
          <Circle cx="12" cy="13" r="4.5" fill="#B58863" />
          <Circle cx="28" cy="13" r="4.5" fill="#B58863" />
          <Circle cx="20" cy="22" r="11" fill="#B58863" />
          <Ellipse cx="20" cy="25.5" rx="5" ry="3.8" fill="#EAD2B8" />
          <Circle cx="16" cy="20" r="1.4" fill={INK} />
          <Circle cx="24" cy="20" r="1.4" fill={INK} />
          <Ellipse cx="20" cy="24.2" rx="1.7" ry="1.2" fill={INK} />
        </G>
      ) : null}
      {kind === 'rabbit' ? (
        <G>
          <Circle cx="20" cy="20" r="20" fill="#E3E8FF" />
          <Ellipse cx="15" cy="11" rx="3.4" ry="8" fill="#FFFFFF" />
          <Ellipse cx="25" cy="11" rx="3.4" ry="8" fill="#FFFFFF" />
          <Ellipse cx="15" cy="11" rx="1.5" ry="5.5" fill="#FFC9D4" />
          <Ellipse cx="25" cy="11" rx="1.5" ry="5.5" fill="#FFC9D4" />
          <Circle cx="20" cy="24" r="10" fill="#FFFFFF" />
          <Circle cx="16.5" cy="23" r="1.4" fill={INK} />
          <Circle cx="23.5" cy="23" r="1.4" fill={INK} />
          <Path d="M19 26h2l-1 1.1z" fill="#FF8FA3" />
        </G>
      ) : null}
      {kind === 'chick' ? (
        <G>
          <Circle cx="20" cy="20" r="20" fill="#FFF1B8" />
          <Path d="M17.5 11.5q2.5-5 5 0" stroke="#FFC21A" strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <Circle cx="20" cy="22" r="11" fill="#FFD84D" />
          <Circle cx="16" cy="20.5" r="1.4" fill={INK} />
          <Circle cx="24" cy="20.5" r="1.4" fill={INK} />
          <Path d="M17.8 23.4l2.2 2.6 2.2-2.6z" fill="#FF9F68" />
        </G>
      ) : null}
      {kind === 'fox' ? (
        <G>
          <Circle cx="20" cy="20" r="20" fill="#FFE3CC" />
          <Path d="M9 18L10 7l8 6zM31 18L30 7l-8 6z" fill="#F28C4B" />
          <Circle cx="20" cy="22" r="11" fill="#F28C4B" />
          <Path d="M9.5 23q5 6 10.5 3.5q5.5 2.5 10.5-3.5q-3 9-10.5 9t-10.5-9z" fill="#FFFFFF" />
          <Circle cx="16" cy="20.5" r="1.4" fill={INK} />
          <Circle cx="24" cy="20.5" r="1.4" fill={INK} />
          <Ellipse cx="20" cy="25.5" rx="1.7" ry="1.2" fill={INK} />
        </G>
      ) : null}
      {kind === 'you' ? (
        <G>
          <Circle cx="20" cy="20" r="20" fill="#FFF3D1" />
          <Circle cx="20" cy="20" r="12" fill="#FFC83D" />
          <Path d="M14.5 19q1.8-2 3.6 0M21.9 19q1.8-2 3.6 0" stroke={INK} strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <Path d="M17 23q3 2.8 6 0" stroke={INK} strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </G>
      ) : null}
    </Svg>
  );
}

// マスコット「ふくまる」：もちもちの配達ことり
export function Fukumaru({ pose = 'basic', size = 96 }: { pose?: 'basic' | 'oops' | 'jin'; size?: number }) {
  const body = { fill: '#FFF8EC', stroke: '#E8CFA6', strokeWidth: 2 };
  if (pose === 'oops') {
    return (
      <Svg width={size} height={size} viewBox="276 58 132 128">
        <Path d="M328 172v9M352 172v9" stroke="#FFB547" strokeWidth="4" strokeLinecap="round" />
        <Ellipse cx="340" cy="132" rx="54" ry="42" {...body} />
        <G transform="rotate(-14 340 82)">
          <Rect x="316" y="68" width="48" height="30" rx="4" fill="#FFFFFF" stroke="#F4A9B8" strokeWidth="2" />
          <Path d="M316 71l24 15 24-15" stroke="#F4A9B8" strokeWidth="2" fill="none" />
        </G>
        <Circle cx="324" cy="124" r="5" fill="none" stroke={INK} strokeWidth="2.5" />
        <Circle cx="356" cy="124" r="5" fill="none" stroke={INK} strokeWidth="2.5" />
        <Path d="M335 132L340 139L345 132Z" fill="#FFB547" />
        <Ellipse cx="340" cy="148" rx="4" ry="3.5" fill={INK} />
        <Ellipse cx="314" cy="138" rx="7" ry="4.5" fill="#FFB3C1" />
        <Ellipse cx="366" cy="138" rx="7" ry="4.5" fill="#FFB3C1" />
        <Path d="M398 100c3 5 5 8 5 10a5 5 0 0 1-10 0c0-2 2-5 5-10z" fill="#8FC7FF" />
      </Svg>
    );
  }
  if (pose === 'jin') {
    return (
      <Svg width={size} height={size} viewBox="500 66 120 120">
        <Path d="M558 88q2-16 12-12" stroke="#D9B98A" strokeWidth="3" fill="none" strokeLinecap="round" />
        <Path d="M548 172v9M572 172v9" stroke="#FFB547" strokeWidth="4" strokeLinecap="round" />
        <Ellipse cx="560" cy="130" rx="54" ry="44" {...body} />
        <Path d="M538 117q6 5 12 0M570 117q6 5 12 0" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />
        <Path d="M586 124c3 4 4.5 6.5 4.5 8.5a4.5 4.5 0 0 1-9 0c0-2 1.5-4.5 4.5-8.5z" fill="#4D9BFF" />
        <Path d="M555 124L560 131L565 124Z" fill="#FFB547" />
        <Rect x="532" y="136" width="56" height="34" rx="4" fill="#FFFFFF" stroke="#E8CFA6" strokeWidth="2" />
        <Path d="M542 147h36M542 155h28" stroke="#E8CFA6" strokeWidth="2" strokeLinecap="round" />
        <Ellipse cx="530" cy="152" rx="9" ry="7" fill="#FFF1D6" stroke="#E8CFA6" strokeWidth="2" />
        <Ellipse cx="590" cy="152" rx="9" ry="7" fill="#FFF1D6" stroke="#E8CFA6" strokeWidth="2" />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="60 66 126 120">
      <Path d="M118 86q2-16 12-12" stroke="#D9B98A" strokeWidth="3" fill="none" strokeLinecap="round" />
      <Path d="M108 172v9M132 172v9" stroke="#FFB547" strokeWidth="4" strokeLinecap="round" />
      <Ellipse cx="120" cy="130" rx="54" ry="44" {...body} />
      <Ellipse cx="170" cy="134" rx="12" ry="9" fill="#FFF1D6" stroke="#E8CFA6" strokeWidth="2" transform="rotate(-25 170 134)" />
      <Circle cx="104" cy="122" r="4" fill={INK} />
      <Circle cx="136" cy="122" r="4" fill={INK} />
      <Path d="M115 130L120 137L125 130Z" fill="#FFB547" />
      <Ellipse cx="94" cy="135" rx="7" ry="4.5" fill="#FFB3C1" />
      <Ellipse cx="146" cy="135" rx="7" ry="4.5" fill="#FFB3C1" />
      <Path d="M90 146L150 100" stroke="#D9A21B" strokeWidth="3" strokeLinecap="round" />
      <Rect x="66" y="142" width="40" height="30" rx="7" fill="#FFC83D" />
      <Path transform="translate(86 158) scale(0.9)" d={HEART} fill="#FF6F8E" />
    </Svg>
  );
}

type IconProps = { size?: number; color?: string };

export function BackIcon({ size = 24, color = '#2A2730' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M15 5l-7 7 7 7" stroke={color} strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ChevronIcon({ size = 18, color = '#6B6670' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M9 5l7 7-7 7" stroke={color} strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function CheckCircleIcon({ size = 15, color = '#2F7A47' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16">
      <Circle cx="8" cy="8" r="7" fill={color} />
      <Path d="M4.8 8.2l2.2 2.2 4.2-4.4" stroke="#FFFFFF" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ChatIcon({ size = 18, color = '#FFC83D' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4 3.5V17h0.5A2.5 2.5 0 0 1 4 14.5z" fill={color} />
    </Svg>
  );
}

export function HeartIcon({ size = 18, color = '#FFC9D4' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 20.5s-8-4.7-8-10.4A4.4 4.4 0 0 1 12 7.6a4.4 4.4 0 0 1 8 2.5c0 5.7-8 10.4-8 10.4z" fill={color} />
    </Svg>
  );
}

export function SendIcon({ size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4 11.5L19.5 4.5 15 20l-3.2-6.3z" fill="#2A2730" />
      <Path d="M11.8 13.7L19.5 4.5" stroke="#FFC83D" strokeWidth="1.6" strokeLinecap="round" />
    </Svg>
  );
}
