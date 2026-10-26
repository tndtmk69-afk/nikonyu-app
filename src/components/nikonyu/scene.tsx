import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import type { SceneName } from '@/data/articles';

// 記事の仮の挿絵。本番では実写のイメージ写真に置き換える（企画書「写真の方針」）。
const HEART = 'M0 5C-6 1-7-3-4.5-5C-2.5-6.5-.5-5.5 0-3.5C.5-5.5 2.5-6.5 4.5-5C7-3 6 1 0 5Z';

type Props = { name: SceneName; width: number | `${number}%`; height: number };

export function Scene({ name, width, height }: Props) {
  return (
    <Svg width={width} height={height} viewBox="0 0 360 200" preserveAspectRatio="xMidYMid slice">
      {SCENES[name]}
    </Svg>
  );
}

const SCENES: Record<SceneName, React.ReactNode> = {
  dog: (
    <G>
      <Rect width="360" height="200" fill="#DDE5FF" />
      <Circle cx="296" cy="48" r="24" fill="#FFE49A" />
      <Ellipse cx="78" cy="46" rx="28" ry="10" fill="#FFFFFF" />
      <Ellipse cx="100" cy="39" rx="18" ry="10" fill="#FFFFFF" />
      <Path d="M0 150Q90 112 180 140T360 132V200H0z" fill="#BFE0B4" />
      <Path d="M0 174Q120 152 240 172T360 168V200H0z" fill="#A6D49B" />
      <Rect x="44" y="104" width="54" height="44" rx="4" fill="#FFFFFF" />
      <Path d="M38 108L71 80 104 108z" fill="#F4A99B" />
      <Rect x="63" y="124" width="16" height="24" rx="3" fill="#F4C27A" />
      <Path d="M232 136q18-10 14-26" fill="none" stroke="#D99A5B" strokeWidth="7" strokeLinecap="round" />
      <Ellipse cx="208" cy="146" rx="30" ry="20" fill="#EDB97C" />
      <Rect x="186" y="152" width="9" height="20" rx="4.5" fill="#EDB97C" />
      <Rect x="220" y="152" width="9" height="20" rx="4.5" fill="#EDB97C" />
      <Circle cx="180" cy="122" r="22" fill="#EDB97C" />
      <Ellipse cx="163" cy="112" rx="8" ry="14" fill="#C98B55" transform="rotate(20 163 112)" />
      <Ellipse cx="197" cy="112" rx="8" ry="14" fill="#C98B55" transform="rotate(-20 197 112)" />
      <Ellipse cx="180" cy="131" rx="11" ry="8" fill="#FBE3C4" />
      <Circle cx="172" cy="119" r="2.6" fill="#3A3550" />
      <Circle cx="188" cy="119" r="2.6" fill="#3A3550" />
      <Ellipse cx="180" cy="127" rx="3.4" ry="2.6" fill="#3A3550" />
      <Ellipse cx="166" cy="129" rx="4" ry="2.5" fill="#FF9FB0" />
      <Ellipse cx="194" cy="129" rx="4" ry="2.5" fill="#FF9FB0" />
      <Path d="M164 140q16 8 32 0" stroke="#FF7F96" strokeWidth="5" fill="none" strokeLinecap="round" />
      <Path transform="translate(232 86) scale(1.8)" d={HEART} fill="#FF8FA3" />
      <Path transform="translate(256 66) scale(1.1)" d={HEART} fill="#FFB3C1" />
    </G>
  ),
  grad: (
    <G>
      <Rect width="360" height="200" fill="#FFE8D4" />
      <Circle cx="70" cy="50" r="6" fill="#FFC83D" />
      <Circle cx="96" cy="150" r="5" fill="#FF8FA3" />
      <Circle cx="290" cy="140" r="6" fill="#8FB8FF" />
      <Circle cx="268" cy="40" r="4" fill="#7FD1A8" />
      <Path d="M180 52L252 82 180 112 108 82z" fill="#3A3550" />
      <Path d="M144 96v24q36 20 72 0V96l-36 15z" fill="#4E4870" />
      <Circle cx="180" cy="82" r="5" fill="#FFC83D" />
      <Path d="M252 82v38" stroke="#FFC83D" strokeWidth="4" />
      <Circle cx="252" cy="124" r="6" fill="#FFC83D" />
      <Rect x="120" y="148" width="120" height="26" rx="13" fill="#FFFFFF" />
      <Rect x="172" y="145" width="16" height="32" rx="2" fill="#FF8F7A" />
    </G>
  ),
  bus: (
    <G>
      <Rect width="360" height="200" fill="#FFE4EA" />
      <Rect y="160" width="360" height="40" fill="#F5CDD6" />
      <Rect x="70" y="82" width="150" height="76" rx="16" fill="#FFC83D" />
      <Rect x="82" y="94" width="30" height="26" rx="6" fill="#FFFFFF" />
      <Rect x="120" y="94" width="30" height="26" rx="6" fill="#FFFFFF" />
      <Rect x="158" y="94" width="30" height="26" rx="6" fill="#FFFFFF" />
      <Rect x="196" y="94" width="16" height="36" rx="5" fill="#FFFFFF" />
      <Rect x="70" y="134" width="150" height="6" fill="#FF9F68" />
      <Circle cx="104" cy="160" r="12" fill="#3A3550" />
      <Circle cx="188" cy="160" r="12" fill="#3A3550" />
      <Circle cx="250" cy="112" r="12" fill="#F9D3B4" />
      <Path d="M238 110a12 12 0 0 1 24 0z" fill="#5A4636" />
      <Rect x="240" y="124" width="20" height="26" rx="8" fill="#8FB8FF" />
      <Rect x="256" y="126" width="9" height="18" rx="4" fill="#FF8F7A" />
      <Path d="M242 130l-10-14" stroke="#F9D3B4" strokeWidth="5" strokeLinecap="round" />
      <Path transform="translate(232 76) scale(1.4)" d={HEART} fill="#FF6F8E" />
    </G>
  ),
  cat: (
    <G>
      <Rect width="360" height="200" fill="#FFF2C2" />
      <Rect y="150" width="360" height="50" fill="#F2DE9B" />
      <Rect x="118" y="26" width="124" height="34" rx="10" fill="#FFFFFF" />
      <Rect x="132" y="38" width="96" height="10" rx="5" fill="#FFD27A" />
      <Path d="M208 140q26 4 22-24" stroke="#F2A65A" strokeWidth="9" fill="none" strokeLinecap="round" />
      <Ellipse cx="180" cy="128" rx="30" ry="26" fill="#F2A65A" />
      <Path d="M160 84L163 62 179 74zM200 84L197 62 181 74z" fill="#F2A65A" />
      <Circle cx="180" cy="94" r="24" fill="#F2A65A" />
      <Path d="M174 74v8M180 72v10M186 74v8" stroke="#D9853A" strokeWidth="3" strokeLinecap="round" />
      <Path d="M167 94q4-4.5 8 0M185 94q4-4.5 8 0" stroke="#3A3550" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <Path d="M177 101h6l-3 3z" fill="#FF8FA3" />
      <Ellipse cx="164" cy="102" rx="4" ry="2.5" fill="#FF9FB0" />
      <Ellipse cx="196" cy="102" rx="4" ry="2.5" fill="#FF9FB0" />
      <Ellipse cx="168" cy="152" rx="8" ry="5" fill="#F8C38E" />
      <Ellipse cx="192" cy="152" rx="8" ry="5" fill="#F8C38E" />
    </G>
  ),
  aurora: (
    <G>
      <Rect width="360" height="200" fill="#233160" />
      <Circle cx="40" cy="30" r="1.6" fill="#FFFFFF" />
      <Circle cx="120" cy="22" r="1.4" fill="#FFFFFF" />
      <Circle cx="160" cy="40" r="1.8" fill="#FFFFFF" />
      <Circle cx="232" cy="20" r="1.4" fill="#FFFFFF" />
      <Circle cx="300" cy="34" r="1.8" fill="#FFFFFF" />
      <Path d="M-10 70C80 30 140 80 210 40S330 30 370 50V76C300 60 230 100 160 72S40 90-10 96z" fill="#8FD0FF" opacity={0.45} />
      <Path d="M-10 92C60 46 120 112 190 64S320 54 370 82V120C300 92 240 140 170 102S50 122-10 132z" fill="#7FE3B5" opacity={0.6} />
      <Path d="M0 200V150L60 112 110 146 170 102 240 150 290 122 360 160V200z" fill="#1A2448" />
      <Path d="M170 102l-14 10 8 2 6-5 6 5 8-2z" fill="#E8EEFF" />
    </G>
  ),
  letters: (
    <G>
      <Rect width="360" height="200" fill="#FFE4EA" />
      <Rect x="128" y="78" width="112" height="74" rx="10" fill="#FFFFFF" transform="rotate(-8 184 115)" />
      <Rect x="112" y="66" width="136" height="88" rx="10" fill="#FFFFFF" />
      <Path d="M112 72l68 46 68-46" stroke="#F4A9B8" strokeWidth="5" fill="none" strokeLinejoin="round" />
      <Path transform="translate(180 120) scale(1.9)" d={HEART} fill="#FF6F8E" />
      <Path transform="translate(262 58) scale(1.2)" d={HEART} fill="#FFB3C1" />
    </G>
  ),
  otter: (
    <G>
      <Rect width="360" height="200" fill="#CFE6FF" />
      <Path d="M0 118q30-10 60 0t60 0 60 0 60 0 60 0 60 0V200H0z" fill="#9CCBF2" />
      <Ellipse cx="190" cy="128" rx="46" ry="16" fill="#9B7458" />
      <Circle cx="146" cy="112" r="20" fill="#9B7458" />
      <Ellipse cx="144" cy="117" rx="12" ry="9" fill="#E8D3BF" />
      <Circle cx="138" cy="108" r="2.4" fill="#3A3550" />
      <Circle cx="152" cy="108" r="2.4" fill="#3A3550" />
      <Ellipse cx="145" cy="115" rx="3" ry="2.2" fill="#3A3550" />
      <Circle cx="196" cy="110" r="12" fill="#C9A98A" />
      <Circle cx="192" cy="108" r="1.8" fill="#3A3550" />
      <Circle cx="200" cy="108" r="1.8" fill="#3A3550" />
      <Path d="M0 136q30-8 60 0t60 0 60 0 60 0 60 0 60 0V200H0z" fill="#7FB8E8" />
    </G>
  ),
  fuji: (
    <G>
      <Rect width="360" height="200" fill="#DCEBFF" />
      <Circle cx="282" cy="54" r="22" fill="#FF8F7A" />
      <Ellipse cx="86" cy="52" rx="30" ry="10" fill="#FFFFFF" />
      <Path d="M70 170L160 64h40l90 106z" fill="#6E86C8" />
      <Path d="M160 64h40l20 24-14-6-12 10-14-10-12 10-12-10-14 6z" fill="#FFFFFF" />
      <Path d="M0 170Q180 150 360 170V200H0z" fill="#9FD3A6" />
      <Path d="M0 184Q180 168 360 184V200H0z" fill="#86C48F" />
    </G>
  ),
};
