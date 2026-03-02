import { useMemo, useState } from 'react';
import { OFPNavlogFix } from '@/hooks/useSimBriefOFP';

interface EnrouteWindsProfileProps {
  navlog: OFPNavlogFix[];
  cruiseAltitude?: number;
}

interface WaypointData {
  ident: string;
  distance: number;
  altitude: number;
  windDir: number;
  windSpeed: number;
  track: number;
}

interface TooltipData {
  ident: string;
  altitude: number;
  windDir: number;
  windSpeed: number;
  component: number;
  componentType: 'headwind' | 'tailwind' | 'crosswind';
  crosswind: number;
  x: number;
  y: number;
}

export function EnrouteWindsProfile({ navlog, cruiseAltitude = 350 }: EnrouteWindsProfileProps) {
  const [hoveredWaypoint, setHoveredWaypoint] = useState<TooltipData | null>(null);

  const totalDistance = useMemo(() => {
    const lastFix = navlog[navlog.length - 1];
    return lastFix ? parseFloat(lastFix.distance) || 0 : 0;
  }, [navlog]);

  const waypoints = useMemo<WaypointData[]>(() => {
    return navlog
      .filter(fix => {
        const alt = parseInt(fix.altitude_feet) || 0;
        return alt >= 1000; // Filter out taxi/ground waypoints
      })
      .map(fix => ({
        ident: fix.ident,
        distance: parseFloat(fix.distance) || 0,
        altitude: Math.round((parseInt(fix.altitude_feet) || 0) / 100) * 100,
        windDir: parseInt(fix.wind_dir) || 0,
        windSpeed: parseInt(fix.wind_spd) || 0,
        track: parseFloat(fix.track_true) || parseFloat(fix.track_mag) || 0,
      }));
  }, [navlog]);

  const flightPath = useMemo(() => {
    if (waypoints.length === 0) return [];

    // Create smooth flight path points
    const points: { x: number; y: number; altitude: number }[] = [];
    
    // Add ground point
    points.push({ x: 0, y: 100, altitude: 0 });

    // Group waypoints by altitude segments
    const climbEnd = waypoints.find(w => w.altitude >= cruiseAltitude - 1000);
    const descentStartIndex = [...waypoints].reverse().findIndex(w => w.altitude < cruiseAltitude - 2000);

    waypoints.forEach((wp, idx) => {
      const x = (wp.distance / totalDistance) * 100;
      const y = 100 - (wp.altitude / 400) * 80;
      points.push({ x, y, altitude: wp.altitude });
    });

    // Add destination
    const lastWp = waypoints[waypoints.length - 1];
    if (lastWp) {
      points.push({ x: 100, y: 100, altitude: 0 });
    }

    return points;
  }, [waypoints, totalDistance, cruiseAltitude]);

  const calculateWindComponent = (windDir: number, windSpeed: number, track: number): { headwind: number; crosswind: number } => {
    if (windSpeed === 0) return { headwind: 0, crosswind: 0 };
    
    let relativeAngle = windDir - track;
    while (relativeAngle > 180) relativeAngle -= 360;
    while (relativeAngle < -180) relativeAngle += 360;
    
    const radians = (relativeAngle * Math.PI) / 180;
    const headwind = Math.round(windSpeed * Math.cos(radians));
    const crosswind = Math.round(windSpeed * Math.sin(radians));
    
    return { headwind, crosswind };
  };

  const getWindArrowColor = (headwind: number, crosswind: number): string => {
    const absCrosswind = Math.abs(crosswind);
    if (absCrosswind > Math.abs(headwind) * 0.7) return 'yellow';
    return headwind >= 0 ? 'green' : 'red';
  };

  const cruiseWaypoints = waypoints.filter(w => w.altitude >= cruiseAltitude - 5000 && w.altitude <= cruiseAltitude + 2000);

  // Chart dimensions
  const width = 900;
  const height = 320;
  const padding = { top: 50, right: 30, bottom: 50, left: 70 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const scaleX = (dist: number) => padding.left + (dist / totalDistance) * chartWidth;
  const scaleY = (alt: number) => padding.top + chartHeight - (alt / 400) * chartHeight;

  // Generate path for flight profile
  const flightPathD = flightPath.length > 0
    ? `M ${flightPath.map(p => `${scaleX(p.x * totalDistance / 100)},${scaleY(p.altitude)}`).join(' L ')}`
    : '';

  return (
    <div className="relative overflow-hidden rounded-xl" style={{
      background: 'linear-gradient(135deg, #0a1628 0%, #0f2744 50%, #0d2137 100%)',
      boxShadow: '0 0 40px rgba(6, 182, 212, 0.1), inset 0 1px 0 rgba(255,255,255,0.05)'
    }}>
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 px-4 py-3 border-b border-cyan-500/20" style={{
        background: 'linear-gradient(90deg, rgba(6, 182, 212, 0.15) 0%, transparent 100%)'
      }}>
        <h3 className="text-sm font-bold tracking-wider text-cyan-400 uppercase" style={{
          textShadow: '0 0 10px rgba(6, 182, 212, 0.5)'
        }}>
          EN-ROUTE WINDS PROFILE
        </h3>
      </div>

      <svg width={width} height={height} className="mt-10">
        <defs>
          <linearGradient id="flightPathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#06b6d4" stopOpacity="1" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.3" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="tooltipGlow">
            <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Grid lines - horizontal */}
        {[0, 100, 200, 300, 400].map(alt => (
          <g key={`h-grid-${alt}`}>
            <line
              x1={padding.left}
              y1={scaleY(alt)}
              x2={width - padding.right}
              y2={scaleY(alt)}
              stroke="rgba(100, 200, 255, 0.08)"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          </g>
        ))}

        {/* Y-axis labels */}
        {[
          { label: 'GND', alt: 0 },
          { label: 'FL100', alt: 10000 },
          { label: 'FL200', alt: 20000 },
          { label: 'FL300', alt: 30000 },
          { label: 'FL400', alt: 40000 }
        ].map(item => (
          <text
            key={`y-label-${item.alt}`}
            x={padding.left - 10}
            y={scaleY(item.alt / 100)}
            textAnchor="end"
            dominantBaseline="middle"
            className="text-[10px] fill-slate-400 font-mono"
          >
            {item.label}
          </text>
        ))}

        {/* X-axis labels */}
        {[0, 500, 1000, 1500, 2000, 2500].filter(d => d <= totalDistance + 100).map(dist => (
          <text
            key={`x-label-${dist}`}
            x={scaleX(dist)}
            y={height - padding.bottom + 20}
            textAnchor="middle"
            className="text-[10px] fill-slate-400 font-mono"
          >
            {dist} NM
          </text>
        ))}

        {/* Flight path line */}
        {flightPathD && (
          <path
            d={flightPathD}
            fill="none"
            stroke="url(#flightPathGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            filter="url(#glow)"
            className="opacity-90"
          />
        )}

        {/* Wind arrows along cruise segment */}
        {cruiseWaypoints.slice(1, -1).map((wp, idx) => {
          const x = scaleX(wp.distance);
          const y = scaleY(wp.altitude / 100);
          const { headwind, crosswind } = calculateWindComponent(wp.windDir, wp.windSpeed, wp.track);
          const color = getWindArrowColor(headwind, crosswind);
          const colorMap: Record<string, string> = {
            green: '#22c55e',
            red: '#ef4444',
            yellow: '#eab308'
          };

          return (
            <g 
              key={`wind-${idx}`} 
              className="cursor-pointer"
              onMouseEnter={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setHoveredWaypoint({
                  ident: wp.ident,
                  altitude: wp.altitude,
                  windDir: wp.windDir,
                  windSpeed: wp.windSpeed,
                  component: Math.abs(headwind) > Math.abs(crosswind) ? headwind : crosswind,
                  componentType: Math.abs(crosswind) > Math.abs(headwind) * 0.7 ? 'crosswind' : (headwind >= 0 ? 'headwind' : 'tailwind'),
                  crosswind,
                  x: rect.left + rect.width / 2,
                  y: rect.top
                });
              }}
              onMouseLeave={() => setHoveredWaypoint(null)}
            >
              {/* Wind arrow */}
              <line
                x1={x - 12}
                y1={y - 25}
                x2={x + 12}
                y2={y - 25}
                stroke={colorMap[color]}
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.9"
              />
              <polygon
                points={`${x + 12},${y - 25} ${x + 6},${y - 29} ${x + 6},${y - 21}`}
                fill={colorMap[color]}
                opacity="0.9"
              />
              {/* Wind speed label */}
              <text
                x={x}
                y={y - 35}
                textAnchor="middle"
                className="text-[9px] font-bold font-mono"
                fill={colorMap[color]}
                style={{ textShadow: `0 0 4px ${colorMap[color]}` }}
              >
                {wp.windSpeed}
              </text>
            </g>
          );
        })}

        {/* Waypoint nodes */}
        {waypoints.map((wp, idx) => {
          const x = scaleX(wp.distance);
          const y = scaleY(wp.altitude / 100);
          const isMajor = idx % 5 === 0 || idx === waypoints.length - 1 || idx === 0;

          return (
            <g 
              key={`wp-${idx}`}
              className="cursor-pointer"
              onMouseEnter={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const { headwind, crosswind } = calculateWindComponent(wp.windDir, wp.windSpeed, wp.track);
                setHoveredWaypoint({
                  ident: wp.ident,
                  altitude: wp.altitude,
                  windDir: wp.windDir,
                  windSpeed: wp.windSpeed,
                  component: Math.abs(headwind) > Math.abs(crosswind) ? headwind : crosswind,
                  componentType: Math.abs(crosswind) > Math.abs(headwind) * 0.7 ? 'crosswind' : (headwind >= 0 ? 'headwind' : 'tailwind'),
                  crosswind,
                  x: rect.left + rect.width / 2,
                  y: rect.top
                });
              }}
              onMouseLeave={() => setHoveredWaypoint(null)}
            >
              <circle
                cx={x}
                cy={y}
                r={isMajor ? 5 : 3}
                fill={isMajor ? '#06b6d4' : 'rgba(6, 182, 212, 0.5)'}
                stroke={isMajor ? '#0891b2' : 'rgba(6, 182, 212, 0.3)'}
                strokeWidth="1"
              />
              {/* Waypoint label for major waypoints */}
              {isMajor && (
                <text
                  x={x}
                  y={y + 16}
                  textAnchor="middle"
                  className="text-[8px] fill-slate-300 font-mono"
                >
                  {wp.ident}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-4 px-4 py-2 rounded-full" style={{
        background: 'rgba(0, 20, 40, 0.8)',
        border: '1px solid rgba(100, 200, 255, 0.15)'
      }}>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-green-500" />
          <span className="text-[10px] text-slate-300 font-medium">HEADWIND</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-red-500" />
          <span className="text-[10px] text-slate-300 font-medium">TAILWIND</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-yellow-500" />
          <span className="text-[10px] text-slate-300 font-medium">CROSSWIND</span>
        </div>
      </div>

      {/* Interactive Tooltip */}
      {hoveredWaypoint && (
        <div
          className="fixed z-50 px-4 py-3 rounded-lg border"
          style={{
            left: hoveredWaypoint.x,
            top: hoveredWaypoint.y - 10,
            transform: 'translate(-50%, -100%)',
            background: 'linear-gradient(135deg, #0f2744 0%, #0a1628 100%)',
            borderColor: 'rgba(6, 182, 212, 0.4)',
            boxShadow: '0 0 20px rgba(6, 182, 212, 0.2), 0 4px 20px rgba(0,0,0,0.4)',
            backdropFilter: 'blur(10px)'
          }}
          onMouseEnter={() => setHoveredWaypoint(hoveredWaypoint)}
          onMouseLeave={() => setHoveredWaypoint(null)}
        >
          <div className="text-xs font-bold text-cyan-400 mb-2 border-b border-cyan-500/30 pb-1">
            {hoveredWaypoint.ident}
          </div>
          <div className="space-y-1 text-[10px]">
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Altitude:</span>
              <span className="text-slate-100 font-mono">FL{Math.round(hoveredWaypoint.altitude / 100)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Wind:</span>
              <span className="text-slate-100 font-mono">{hoveredWaypoint.windDir}° / {hoveredWaypoint.windSpeed}kt</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Component:</span>
              <span className={`font-mono font-bold ${
                hoveredWaypoint.componentType === 'headwind' ? 'text-green-400' :
                hoveredWaypoint.componentType === 'tailwind' ? 'text-red-400' :
                'text-yellow-400'
              }`}>
                {hoveredWaypoint.componentType === 'crosswind' ? `Crosswind ${Math.abs(hoveredWaypoint.component)}kt` : 
                 `${hoveredWaypoint.component > 0 ? '' : '-'}${Math.abs(hoveredWaypoint.component)}kt ${hoveredWaypoint.componentType === 'headwind' ? 'headwind' : 'tailwind'}`}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Crosswind:</span>
              <span className="text-yellow-400 font-mono">{hoveredWaypoint.crosswind}kt</span>
            </div>
          </div>
          {/* Arrow */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-0 -mb-1.5 w-3 h-3 rotate-45" style={{
            background: '#0f2744',
            borderRight: '1px solid rgba(6, 182, 212, 0.4)',
            borderBottom: '1px solid rgba(6, 182, 212, 0.4)'
          }} />
        </div>
      )}
    </div>
  );
}
