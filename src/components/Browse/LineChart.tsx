import React, { useMemo, useState, useEffect } from 'react';
import { API_BASE } from "@/components/utils/API_BASE";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TimeResolutionS, FourCellList } from '@/components/utils/usefulobject'
import { Checkbox } from "@/components/ui/checkbox";

const COLOR_PALETTE = [
  "#8884d8", "#82ca9d", "#ffc658", "#ff7c7c", "#ff7f50",
  "#6495ed", "#32cd32", "#ff1493", "#a0522d", "#20b2aa",
  "#ffd700", "#9370db", "#00ced1", "#ff6347", "#4682b4",
  "#adff2f", "#da70d6", "#f08080", "#90ee90", "#87ceeb",
];

const MEAN_KEY = "Mean";
const MEDIAN_KEY = "Median";
const Q25_KEY = "Q25";
const Q75_KEY = "Q75";
const Q25_LABEL = "25%";
const Q75_LABEL = "75%";

const MEAN_COLOR = "#64748b";
const MEDIAN_COLOR = "#94a3b8";
const Q25_COLOR = "#a78bfa";
const Q75_COLOR = "#c4b5fd";

function meanOf(vals: number[]): number {
  return vals.reduce((s, v) => s + v, 0) / vals.length;
}

function medianOf(sorted: number[]): number {
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 1) return sorted[0];
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

interface CellDataChartProps {
  CellName: string;
  LineList: string[];
  DataName?: "Volume" | "Surface";
  height?: number;
}

type LineDataType = {
  [sampleName: string]: number[];
};

type LineXDataType = {
  [sampleName: string]: number[][];
};

function cellsNearTime(
  sample: string,
  tpCells: number[][],
  t: number
): number[] {
  if (!tpCells.length) return [];
  const resolution = TimeResolutionS[sample as keyof typeof TimeResolutionS] ?? 1;
  const stepMin = resolution / 60;
  const i = Math.round(t / stepMin);
  if (i < 0 || i >= tpCells.length) return [];
  if (Math.abs(i * stepMin - t) > stepMin / 2 + 1e-9) return [];
  return tpCells[i].filter((v) => typeof v === "number" && Number.isFinite(v));
}

export const CellDataChart: React.FC<CellDataChartProps> = ({
  CellName,
  LineList,
  DataName = 'Volume',
  height = 400,
}) => {
  const [LineData, setLineData] = useState<LineDataType | null>(null);
  const [LineXData, setLineXData] = useState<LineXDataType | null>(null);
  const [monotone, setMonotone] = useState(false);
  const [showMean, setShowMean] = useState(false);
  const [showMedian, setShowMedian] = useState(false);
  const [showPercentiles, setShowPercentiles] = useState(false);
  const YAxisTitle = DataName === 'Volume' ? `Volume (µm³)` : `Surface area (µm²)`;
  const line_width = 2;
  const lineType = monotone ? "monotone" : "linear";
  const needLineX = showMean || showMedian || showPercentiles;

  useEffect(() => {
    if (!CellName) {
      setLineData(null);
      return;
    }
    const fetchData = async () => {
      try {
        const url = `${API_BASE}/ChartData/${DataName}Line?CellName=${CellName}`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const jsonData: LineDataType = await response.json();
        setLineData(jsonData);
      } catch (err) {
        setLineData(null);
      }
    };
    fetchData();
  }, [CellName, DataName]);

  // Only fetch all-cell LineX when Mean / Median / 25–75% is enabled
  useEffect(() => {
    if (!needLineX || !CellName || !DataName) {
      setLineXData(null);
      return;
    }
    let cancelled = false;
    setLineXData(null);
    const fetchLineX = async () => {
      try {
        const url = `${API_BASE}/Shape/LineX?CellName=${CellName}&DataName=${DataName}`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const jsonData: LineXDataType = await response.json();
        if (!cancelled) setLineXData(jsonData);
      } catch (err) {
        if (!cancelled) setLineXData(null);
      }
    };
    fetchLineX();
    return () => {
      cancelled = true;
    };
  }, [needLineX, CellName, DataName]);

  const ChartData = useMemo(() => {
    if (!LineData) return [];

    const filteredData = Object.fromEntries(
      Object.entries(LineData).filter(([key]) => LineList.includes(key))
    );

    if (Object.values(filteredData).length === 0) return [];

    const timeMap = new Map<number, Record<string, number>>();

    for (const [key, arr] of Object.entries(filteredData)) {
      const resolution = TimeResolutionS[key as keyof typeof TimeResolutionS] ?? 1;

      arr.forEach((val, i) => {
        const time = (i * resolution) / 60;
        if (!timeMap.has(time)) timeMap.set(time, { time });
        timeMap.get(time)![key] = val;
      });
    }

    if (needLineX && LineXData) {
      for (const row of timeMap.values()) {
        const t = row.time as number;
        const vals: number[] = [];
        for (const [sample, tpCells] of Object.entries(LineXData)) {
          if (!Array.isArray(tpCells) || tpCells.length === 0) continue;
          vals.push(...cellsNearTime(sample, tpCells, t));
        }
        if (vals.length === 0) continue;
        if (showMean) row[MEAN_KEY] = meanOf(vals);
        if (showMedian || showPercentiles) {
          vals.sort((a, b) => a - b);
          if (showMedian) row[MEDIAN_KEY] = medianOf(vals);
          if (showPercentiles) {
            row[Q25_KEY] = percentile(vals, 0.25);
            row[Q75_KEY] = percentile(vals, 0.75);
          }
        }
      }
    }

    return Array.from(timeMap.values()).sort(
      (a, b) => (a.time as number) - (b.time as number)
    );
  }, [LineData, LineList, needLineX, showMean, showMedian, showPercentiles, LineXData]);

  const hasMean =
    showMean && ChartData.some((row) => typeof row[MEAN_KEY] === "number");
  const hasMedian =
    showMedian && ChartData.some((row) => typeof row[MEDIAN_KEY] === "number");
  const hasPercentiles =
    showPercentiles &&
    ChartData.some(
      (row) =>
        typeof row[Q25_KEY] === "number" && typeof row[Q75_KEY] === "number"
    );

  const refLabel = (name: string) =>
    name === Q25_KEY ? Q25_LABEL : name === Q75_KEY ? Q75_LABEL : name;

  return (
    <>
      {ChartData.length > 0 ? (
        <div className="w-full">
          <div className="flex justify-end items-center gap-4 mb-1">
            <label
              htmlFor={`mean-${DataName}`}
              className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none"
            >
              <Checkbox
                id={`mean-${DataName}`}
                checked={showMean}
                onCheckedChange={(checked) => setShowMean(checked === true)}
              />
              Mean
            </label>
            <label
              htmlFor={`median-${DataName}`}
              className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none"
            >
              <Checkbox
                id={`median-${DataName}`}
                checked={showMedian}
                onCheckedChange={(checked) => setShowMedian(checked === true)}
              />
              Median
            </label>
            <label
              htmlFor={`percentiles-${DataName}`}
              className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none"
            >
              <Checkbox
                id={`percentiles-${DataName}`}
                checked={showPercentiles}
                onCheckedChange={(checked) => setShowPercentiles(checked === true)}
              />
              25–75%
            </label>
            <label
              htmlFor={`monotone-${DataName}`}
              className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none"
            >
              <Checkbox
                id={`monotone-${DataName}`}
                checked={monotone}
                onCheckedChange={(checked) => setMonotone(checked === true)}
              />
              Smooth
            </label>
          </div>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={ChartData} margin={{ top: 10, right: 20, left: 20, bottom: 36 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="time"
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={(v) => `${v.toFixed(0)}`}
              label={{ value: FourCellList.includes(CellName) ? 'Time after division (min)' : 'Time after division (min)', position: 'insideBottom', offset: -15 }}
            />
            <YAxis
              tickFormatter={(v) => v.toFixed(0)}
              label={{
                value: YAxisTitle,
                angle: -90,
                position: 'insideLeft',
                offset: -10,
                style: { textAnchor: 'middle' },
              }}
            />
            <Tooltip
              labelFormatter={(label) => (
                <span style={{ color: 'grey', fontWeight: 'bold' }}>
                  {`Time: ${(label as number).toFixed(1)} min`}
                </span>
              )}
              formatter={(value, name) => [
                (value as number).toFixed(2),
                refLabel(String(name)),
              ]}
            />
            {LineList.map((sampleKey, idx) => (
              <Line
                key={sampleKey}
                type={lineType}
                dataKey={sampleKey}
                stroke={COLOR_PALETTE[idx % COLOR_PALETTE.length]}
                dot={false}
                strokeWidth={line_width}
                connectNulls={true}
              />
            ))}
            {hasMean && (
              <Line
                type={lineType}
                dataKey={MEAN_KEY}
                name={MEAN_KEY}
                stroke={MEAN_COLOR}
                strokeDasharray="6 4"
                strokeWidth={2}
                dot={false}
                connectNulls
                legendType="plainline"
              />
            )}
            {hasMedian && (
              <Line
                type={lineType}
                dataKey={MEDIAN_KEY}
                name={MEDIAN_KEY}
                stroke={MEDIAN_COLOR}
                strokeDasharray="2 4"
                strokeWidth={2}
                dot={false}
                connectNulls
                legendType="plainline"
              />
            )}
            {hasPercentiles && (
              <>
                <Line
                  type={lineType}
                  dataKey={Q25_KEY}
                  name={Q25_KEY}
                  stroke={Q25_COLOR}
                  strokeDasharray="4 3"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                  legendType="plainline"
                />
                <Line
                  type={lineType}
                  dataKey={Q75_KEY}
                  name={Q75_KEY}
                  stroke={Q75_COLOR}
                  strokeDasharray="4 3"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                  legendType="plainline"
                />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-5 flex flex-wrap justify-center gap-x-3 gap-y-1 max-h-16 overflow-y-auto px-2">
          {LineList.map((sampleKey, idx) => (
            <div
              key={sampleKey}
              className="flex items-center gap-1 text-[10px] leading-tight text-muted-foreground"
            >
              <span
                className="inline-block h-0.5 w-3 shrink-0 rounded-sm"
                style={{ backgroundColor: COLOR_PALETTE[idx % COLOR_PALETTE.length] }}
              />
              {sampleKey}
            </div>
          ))}
          {hasMean && (
            <div className="flex items-center gap-1 text-[10px] leading-tight text-muted-foreground">
              <span
                className="inline-block h-0 w-3 shrink-0 border-t border-dashed"
                style={{ borderColor: MEAN_COLOR }}
              />
              Mean
            </div>
          )}
          {hasMedian && (
            <div className="flex items-center gap-1 text-[10px] leading-tight text-muted-foreground">
              <span
                className="inline-block h-0 w-3 shrink-0 border-t border-dotted"
                style={{ borderColor: MEDIAN_COLOR }}
              />
              Median
            </div>
          )}
          {hasPercentiles && (
            <>
              <div className="flex items-center gap-1 text-[10px] leading-tight text-muted-foreground">
                <span
                  className="inline-block h-0 w-3 shrink-0 border-t border-dashed"
                  style={{ borderColor: Q25_COLOR }}
                />
                {Q25_LABEL}
              </div>
              <div className="flex items-center gap-1 text-[10px] leading-tight text-muted-foreground">
                <span
                  className="inline-block h-0 w-3 shrink-0 border-t border-dashed"
                  style={{ borderColor: Q75_COLOR }}
                />
                {Q75_LABEL}
              </div>
            </>
          )}
        </div>
        </div>
      ) : (
        <div className="w-full h-64 flex items-center justify-center bg-muted/50 rounded-lg border border-dashed">
          <p className="text-muted-foreground">
            Empty (Select samples above to display their trends)
          </p>
        </div>
      )}
    </>
  );
};
