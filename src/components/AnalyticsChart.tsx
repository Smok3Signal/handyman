"use client";

import { useEffect, useRef, useState } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

interface AnalyticsChartProps {
  type: "line" | "bar";
  data: any[];
  dataKey: string;
  xKey: string;
  color?: string;
  title?: string;
  prefix?: string;
  secondaryDataKey?: string;
  secondaryColor?: string;
}

// ── Custom bar shape with per-bar opacity fade ───────────────────────────────
function FadedBar(props: any) {
  const { x, y, width, height, index, total, fill } = props;
  if (!height || height <= 0) return null;
  const opacity = total > 1 ? 0.45 + 0.55 * (index / (total - 1)) : 1;
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      rx={6}
      ry={6}
      fill={fill}
      opacity={opacity}
    />
  );
}

// ── Custom tooltip ────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label, prefix }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-stone-900 text-white text-xs rounded-xl px-3 py-2 shadow-xl pointer-events-none">
      <p className="text-stone-400 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="font-semibold" style={{ color: p.color }}>
          {prefix}{Number(p.value).toLocaleString()}
        </p>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AnalyticsChart({
  type,
  data,
  dataKey,
  xKey,
  color = "#f97316",
  title,
  prefix = "",
  secondaryDataKey,
  secondaryColor = "#0ea5e9",
}: AnalyticsChartProps) {
  // Animate bars in on mount by growing from 0
  const [animData, setAnimData] = useState<any[]>([]);
  const mounted = useRef(false);

  useEffect(() => {
    if (!data?.length) return;
    if (mounted.current) {
      setAnimData(data);
      return;
    }
    // First mount: start at 0, animate to real values
    setAnimData(data.map((d) => ({ ...d, [dataKey]: 0, ...(secondaryDataKey ? { [secondaryDataKey]: 0 } : {}) })));
    const t = setTimeout(() => {
      setAnimData(data);
      mounted.current = true;
    }, 50);
    return () => clearTimeout(t);
  }, [data]);

  const gradId = `grad-${dataKey}`;
  const grad2Id = `grad2-${secondaryDataKey}`;

  const empty = !data || data.length === 0;

  return (
    <div>
      {/* SVG gradient defs — referenced by id inside Recharts charts */}
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={1} />
            <stop offset="100%" stopColor={color} stopOpacity={0.55} />
          </linearGradient>
          {secondaryDataKey && (
            <linearGradient id={grad2Id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={secondaryColor} stopOpacity={1} />
              <stop offset="100%" stopColor={secondaryColor} stopOpacity={0.55} />
            </linearGradient>
          )}
          <linearGradient id={`${gradId}-line`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.15} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
      </svg>

      {title && (
        <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-4">
          {title}
        </p>
      )}

      {empty ? (
        <div className="h-48 flex flex-col items-center justify-center text-stone-300 select-none">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="mb-2 opacity-40">
            <rect x="4" y="24" width="8" height="12" rx="2" fill="currentColor" opacity="0.5" />
            <rect x="16" y="16" width="8" height="20" rx="2" fill="currentColor" opacity="0.7" />
            <rect x="28" y="8" width="8" height="28" rx="2" fill="currentColor" />
          </svg>
          <p className="text-sm text-stone-400">No data yet</p>
        </div>
      ) : type === "bar" ? (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={animData} barSize={28} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#f5f5f4" strokeDasharray="0" />
            <XAxis
              dataKey={xKey}
              tick={{ fontSize: 11, fill: "#a8a29e" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#a8a29e" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => prefix ? `${prefix}${(v / 1000).toFixed(0)}k` : String(v)}
            />
            <Tooltip
              content={<CustomTooltip prefix={prefix} />}
              cursor={{ fill: "#f5f5f4", radius: 6 } as any}
            />
            <Bar
              dataKey={dataKey}
              fill={`url(#${gradId})`}
              radius={[6, 6, 2, 2]}
              isAnimationActive
              animationDuration={700}
              animationEasing="ease-out"
            />
            {secondaryDataKey && (
              <Bar
                dataKey={secondaryDataKey}
                fill={`url(#${grad2Id})`}
                radius={[6, 6, 2, 2]}
                isAnimationActive
                animationDuration={700}
                animationEasing="ease-out"
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={animData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#f5f5f4" strokeDasharray="0" />
            <XAxis
              dataKey={xKey}
              tick={{ fontSize: 11, fill: "#a8a29e" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#a8a29e" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => prefix ? `${prefix}${(v / 1000).toFixed(0)}k` : String(v)}
            />
            <Tooltip
              content={<CustomTooltip prefix={prefix} />}
              cursor={{ stroke: "#e7e5e4", strokeWidth: 1 }}
            />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: color, strokeWidth: 0 }}
              isAnimationActive
              animationDuration={900}
              animationEasing="ease-out"
            />
            {secondaryDataKey && (
              <Line
                type="monotone"
                dataKey={secondaryDataKey}
                stroke={secondaryColor}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: secondaryColor, strokeWidth: 0 }}
                isAnimationActive
                animationDuration={900}
                animationEasing="ease-out"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}