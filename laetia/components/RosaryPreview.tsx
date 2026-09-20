'use client';

/**
 * Prévia ilustrativa do terço, desenhada em SVG e atualizada a cada escolha.
 * Anatomia: laço com 5 dezenas (50 contas) + 5 entremeios, medalha, "rabicho" com
 * 1 entremeio + 3 contas, e crucifixo.
 */
export type Part = { color?: string | null; shape?: string | null; image?: string | null } | null;
export type RosaryProps = {
  stone?: string | null; spacer?: string | null; medal?: Part; crucifix?: Part; name?: string;
};

const NEUTRAL_STONE = '#D9DEE2';
const NEUTRAL_METAL = '#C3C8CD';
const CX = 200, CY = 190, R = 132, GAP = 14, TOTAL = 55;
const SPACER_AT = new Set([5, 16, 27, 38, 49]);

function parse(hex?: string | null) {
  const m = /^#([0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function shade(hex: string, amt: number) {
  const c = parse(hex); if (!c) return hex;
  const f = (v: number) => Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt);
  return '#' + c.map((v) => f(v).toString(16).padStart(2, '0')).join('');
}
const tr = { transition: 'fill .3s ease, stroke .3s ease' } as const;

function Bead({ cx, cy, r, color, dim }: { cx: number; cy: number; r: number; color: string; dim?: boolean }) {
  return (
    <g opacity={dim ? 0.6 : 1}>
      <circle cx={cx} cy={cy} r={r} fill={color} stroke={shade(color, -0.25)} strokeWidth={0.7} style={tr} />
      <ellipse cx={cx - r * 0.3} cy={cy - r * 0.35} rx={r * 0.38} ry={r * 0.22} fill="#fff" opacity={0.5} />
    </g>
  );
}

function Medal({ part, fallback }: { part: Part; fallback: string }) {
  const chosen = !!part;
  const color = part?.color || fallback;
  const stroke = shade(color, -0.3);
  const light = shade(color, 0.55);
  const cx = 200, cy = 340;
  if (part?.image) return <image href={part.image} x={cx - 24} y={cy - 30} width={48} height={60} preserveAspectRatio="xMidYMid meet" />;
  const shape = part?.shape || 'oval';
  return (
    <g opacity={chosen ? 1 : 0.6}>
      {shape === 'round' && <circle cx={cx} cy={cy} r={17} fill={color} stroke={stroke} strokeWidth={1} style={tr} />}
      {shape === 'heart' && <path transform={`translate(${cx} ${cy})`} d="M0,17 C-26,-2 -15,-20 0,-8 C15,-20 26,-2 0,17 Z" fill={color} stroke={stroke} strokeWidth={1} style={tr} />}
      {shape !== 'round' && shape !== 'heart' && <ellipse cx={cx} cy={cy} rx={14} ry={19} fill={color} stroke={stroke} strokeWidth={1} style={tr} />}
      <path d={`M${cx} ${cy - 9} v16 M${cx - 5} ${cy - 3} h10`} stroke={light} strokeWidth={2} strokeLinecap="round" fill="none" />
    </g>
  );
}

function Crucifix({ part, fallback }: { part: Part; fallback: string }) {
  const chosen = !!part;
  const color = part?.color || fallback;
  const stroke = shade(color, -0.3);
  const light = shade(color, 0.5);
  if (part?.image) return <image href={part.image} x={170} y={426} width={60} height={80} preserveAspectRatio="xMidYMid meet" />;
  const shape = part?.shape || 'simple';
  const w = shape === 'simple' ? 5 : 7;
  const ends: [number, number][] = [[200, 428], [200, 494], [181, 443], [219, 443]];
  return (
    <g opacity={chosen ? 1 : 0.6}>
      <rect x={200 - w / 2} y={428} width={w} height={66} rx={1.5} fill={color} stroke={stroke} strokeWidth={0.8} style={tr} />
      <rect x={181} y={443 - w / 2} width={38} height={w} rx={1.5} fill={color} stroke={stroke} strokeWidth={0.8} style={tr} />
      {shape !== 'simple' && ends.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={4.5} fill={color} stroke={stroke} strokeWidth={0.8} style={tr} />)}
      {shape === 'detail' && <>
        <circle cx={200} cy={443} r={5} fill={light} stroke={stroke} strokeWidth={0.8} />
        <path d="M200 432 v58 M185 443 h30" stroke={light} strokeWidth={1} opacity={0.9} />
      </>}
    </g>
  );
}

export default function RosaryPreview({ stone, spacer, medal, crucifix, name }: RosaryProps) {
  const stoneColor = stone || NEUTRAL_STONE;
  const spacerColor = spacer || NEUTRAL_METAL;
  const step = (360 - 2 * GAP) / (TOTAL - 1);
  const beads = Array.from({ length: TOTAL }, (_, i) => {
    const a = ((90 + GAP + i * step) * Math.PI) / 180;
    return { i, x: CX + R * Math.cos(a), y: CY + R * Math.sin(a), sp: SPACER_AT.has(i) };
  });
  const text = (name || '').slice(0, 24);
  const fs = Math.min(34, 170 / Math.max(text.length, 1) / 0.58);
  const cord = '#B9B2A8';

  return (
    <svg viewBox="0 0 400 520" role="img" aria-label="Prévia do terço montado com as opções escolhidas" style={{ width: '100%', height: '100%', display: 'block' }}>
      {/* cordão */}
      <circle cx={CX} cy={CY} r={R} fill="none" stroke={cord} strokeWidth={1.2} />
      <path d="M200 340 V428" stroke={cord} strokeWidth={1.2} />

      {/* laço: 5 dezenas */}
      {beads.map((b) => <Bead key={b.i} cx={b.x} cy={b.y} r={b.sp ? 8.2 : 6.3} color={b.sp ? spacerColor : stoneColor} dim={b.sp ? !spacer : !stone} />)}

      {/* nome no centro do laço */}
      {text && (
        <g>
          <text x={CX} y={CY + fs * 0.32} textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif" fontSize={fs} fill="#46627F" style={{ transition: 'opacity .3s' }}>{text}</text>
          <path d={`M${CX - 30} ${CY + fs * 0.32 + 12} h60`} stroke="#B8C6D6" strokeWidth={1} />
        </g>
      )}

      {/* medalha e rabicho */}
      <Medal part={medal || null} fallback={spacer || NEUTRAL_METAL} />
      {[372, 386, 400].map((y) => <Bead key={y} cx={CX} cy={y} r={6.3} color={stoneColor} dim={!stone} />)}
      <Bead cx={CX} cy={415} r={8.2} color={spacerColor} dim={!spacer} />

      {/* crucifixo */}
      <Crucifix part={crucifix || null} fallback={spacer || NEUTRAL_METAL} />
    </svg>
  );
}
