import type { MilestoneView } from '../../core/model';
import { EiffelTower, Facet, Island, LANDMARKS, LP, Mountain, Pine, PolyBird, PolyCloud, Sun, Tent } from './art';

type Pt = [number, number];

/** A faceted ridge: triangles between a jagged top line and a lower baseline. */
function Ridge({ top, base, colors }: { top: Pt[]; base: number; colors: string[] }) {
  return (
    <g>
      {top.slice(0, -1).map((p, i) => {
        const q = top[i + 1];
        const b1: Pt = [p[0] + 10, base];
        const b2: Pt = [q[0] + 10, base];
        return (
          <g key={i}>
            <Facet p={[p, q, b1]} f={colors[i % colors.length]} />
            <Facet p={[q, b2, b1]} f={colors[(i + 2) % colors.length]} />
          </g>
        );
      })}
    </g>
  );
}

export function HeroScene({ stopsToParis, cheer = false, label = true }: { stopsToParis: number; cheer?: boolean; label?: boolean }) {
  return (
    <svg className="lp-scene__art" viewBox="0 0 390 300" preserveAspectRatio="xMidYMax slice" aria-hidden>
      <Sun cx={360} cy={72} r={16} />
      <PolyCloud className="lp-drift" x={22} y={58} s={1.1} />
      <PolyCloud className="lp-drift lp-drift--slow" x={214} y={34} s={0.8} />

      <Mountain x={-40} y={214} w={180} h={116} light="#b3c8da" dark="#93adc5" snow />
      <Mountain x={196} y={216} w={220} h={128} peak={0.42} light="#b3c8da" dark="#93adc5" snow />
      <Mountain x={84} y={218} w={200} h={150} light="#9db7d0" dark="#7c99b5" snow />
      <Ridge
        top={[
          [-10, 214],
          [40, 202],
          [90, 212],
          [140, 198],
          [190, 212],
          [240, 204],
          [290, 214],
          [340, 202],
          [400, 212],
        ]}
        base={260}
        colors={['#6f9e8a', '#5f8f7b', '#7aa994', '#55836f']}
      />
      <Ridge
        top={[
          [-10, 250],
          [50, 238],
          [110, 248],
          [170, 236],
          [230, 250],
          [290, 240],
          [350, 252],
          [400, 244],
        ]}
        base={300}
        colors={['#4f8a5f', '#437d53', '#5b9868', '#3b704a']}
      />

      {/* Paris, the destination, floating far right */}
      <g className="lp-float lp-float--slow">
        <Island cx={292} y={150} w={92} d={46}>
          <EiffelTower x={298} y={148} s={0.92} />
          <Pine x={262} y={152} s={0.55} tone={1} />
        </Island>
        {label && (
          <g transform="translate(250 66)">
            <Facet p={[[6, 0], [92, 0], [92, 16], [86, 22], [0, 22], [0, 6]]} f={LP.slate} />
            <text x="46" y="15" textAnchor="middle" className="lp-svg-label" fill="#fff">
              PARIS · {stopsToParis} {stopsToParis === 1 ? 'STOP' : 'STOPS'}
            </text>
          </g>
        )}
      </g>
      <Island cx={214} y={198} w={30} d={16} />
      <Island cx={246} y={180} w={22} d={12} />

      {/* Foreground island: today's stop, Le Marché */}
      <g className="lp-float">
        <Island cx={112} y={238} w={210} d={70}>
          <Pine x={34} y={236} s={1} />
          <Pine x={52} y={242} s={0.75} tone={1} />
          <Tent x={168} y={236} s={1.15} />
          <PolyBird size={104} x={62} y={152} cheer={cheer} />
        </Island>
      </g>
    </svg>
  );
}

/* --------------------------------------------------------------------------
 * Route map: six floating stops climbing from the harbour (bottom left) to
 * Paris (top right). Landmarks come from the kit; buttons sit on top in %.
 * ------------------------------------------------------------------------ */

export const ROUTE_W = 358;
export const ROUTE_H = 432;
export const ROUTE_POS: Pt[] = [
  [80, 392],
  [262, 338],
  [96, 268],
  [266, 202],
  [100, 136],
  [258, 68],
];

export function RouteArt({ milestones }: { milestones: MilestoneView[] }) {
  const reached = milestones.findIndex((m) => m.status === 'current');
  return (
    <svg className="lp-route__art" viewBox={`0 0 ${ROUTE_W} ${ROUTE_H}`} aria-hidden>
      {ROUTE_POS.slice(0, -1).map(([x1, y1], i) => {
        const [x2, y2] = ROUTE_POS[i + 1];
        const traveled = i + 1 <= reached;
        return (
          <g key={i}>
            <line x1={x1} y1={y1 + 6} x2={x2} y2={y2 + 6} stroke={traveled ? '#8a5535' : '#b8b0a0'} strokeWidth={traveled ? 9 : 3} />
            {traveled && <line x1={x1} y1={y1 + 6} x2={x2} y2={y2 + 6} stroke="#d6a26f" strokeWidth={5} strokeDasharray="7 4" />}
            {!traveled && <line x1={x1} y1={y1 + 6} x2={x2} y2={y2 + 6} stroke="#f3ecdc" strokeWidth={3} strokeDasharray="2 7" />}
          </g>
        );
      })}
      {milestones.map((m, i) => {
        const [x, y] = ROUTE_POS[i];
        const Landmark = LANDMARKS[i];
        const dim = m.status === 'locked';
        return (
          <g key={m.id}>
            {m.selected && <ellipse className="lp-beacon" cx={x} cy={y + 2} rx={60} ry={18} />}
            <Island cx={x} y={y} w={96} d={36} dim={dim}>
              <Landmark x={x + 10} y={y - 1} s={i === 5 ? 0.78 : 1} />
            </Island>
            {m.status === 'current' && <PolyBird size={48} x={x - 40} y={y - 41} />}
          </g>
        );
      })}
    </svg>
  );
}
