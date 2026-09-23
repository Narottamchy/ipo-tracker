'use client';

import { useState } from 'react';

export default function GmpChart({ history }) {
  const [activeIndex, setActiveIndex] = useState(null);

  if (!history?.length) {
    return (
      <div className="mt-4 grid h-56 place-items-center rounded-xl bg-ink-850 text-center text-xs text-ink-400 sm:h-64">
        GMP history has not started yet.
      </div>
    );
  }

  const width = 760;
  const height = 260;
  const left = 46;
  const right = 20;
  const top = 26;
  const bottom = 44;
  const values = history.map((item) => item.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = Math.max(max - min, 10);
  const x = (i) => left + (i * (width - left - right)) / Math.max(history.length - 1, 1);
  const y = (value) => top + ((max + spread * 0.15 - value) / (spread * 1.3)) * (height - top - bottom);
  const points = history.map((item, i) => `${x(i)},${y(item.value)}`).join(' ');
  const area = `${left},${height - bottom} ${points} ${x(history.length - 1)},${height - bottom}`;
  const grids = [0, 1, 2, 3].map((i) => {
    const gy = top + (i * (height - top - bottom)) / 3;
    const val = max + spread * 0.15 - (i * (spread * 1.3)) / 3;
    return (
      <g key={i}>
        <line className="chart-grid" x1={left} y1={gy} x2={width - right} y2={gy} />
        <text className="chart-text" x={2} y={gy + 4}>
          &#8377;{Math.round(val)}
        </text>
      </g>
    );
  });

  const active = activeIndex !== null ? history[activeIndex] : null;

  function nearestIndex(clientX, svgEl) {
    const rect = svgEl.getBoundingClientRect();
    const relX = ((clientX - rect.left) / rect.width) * width;
    let closest = 0;
    let closestDist = Infinity;
    history.forEach((_, i) => {
      const dist = Math.abs(x(i) - relX);
      if (dist < closestDist) {
        closestDist = dist;
        closest = i;
      }
    });
    return closest;
  }

  return (
    <div className="mt-4">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="GMP history line chart"
        className="block h-auto w-full touch-none"
        onMouseMove={(event) => setActiveIndex(nearestIndex(event.clientX, event.currentTarget))}
        onMouseLeave={() => setActiveIndex(null)}
        onTouchStart={(event) => setActiveIndex(nearestIndex(event.touches[0].clientX, event.currentTarget))}
        onTouchMove={(event) => setActiveIndex(nearestIndex(event.touches[0].clientX, event.currentTarget))}
        onTouchEnd={() => setActiveIndex(null)}
      >
        <defs>
          <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#58a878" stopOpacity="0.28" />
            <stop offset="1" stopColor="#58a878" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {grids}
        <polygon className="chart-area" points={area} />
        <polyline className="chart-line" points={points} />
        {active && (
          <line
            className="chart-grid"
            x1={x(activeIndex)}
            y1={top}
            x2={x(activeIndex)}
            y2={height - bottom}
            strokeDasharray="3 3"
          />
        )}
        {history.map((item, i) => (
          <g key={i}>
            <circle
              className="chart-dot"
              cx={x(i)}
              cy={y(item.value)}
              r={activeIndex === i ? 6 : 4}
            />
            {activeIndex === null && (
              <text className="chart-value hidden sm:block" textAnchor="middle" x={x(i)} y={y(item.value) - 11}>
                &#8377;{item.value}
              </text>
            )}
            {(i === 0 || i === history.length - 1 || history.length < 6) && (
              <text className="chart-text" textAnchor="middle" x={x(i)} y={height - 15}>
                {item.time.split(',')[0]}
              </text>
            )}
          </g>
        ))}
        {active && (
          <g transform={`translate(${Math.min(Math.max(x(activeIndex), left + 55), width - right - 55)}, ${Math.max(y(active.value) - 34, 22)})`}>
            <rect x={-52} y={-20} width={104} height={30} rx={6} className="fill-ink-800 stroke-ink-600" />
            <text textAnchor="middle" x={0} y={-6} className="chart-value" fill="currentColor">
              &#8377;{active.value} &middot; {active.time}
            </text>
          </g>
        )}
      </svg>
      <p className="mt-2 text-center text-[10px] text-ink-400">
        {active ? `${active.time} — ₹${active.value}` : `${history.length} recorded GMP updates · Oldest to latest`}
      </p>
    </div>
  );
}
