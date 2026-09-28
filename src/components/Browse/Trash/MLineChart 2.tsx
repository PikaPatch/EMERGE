import React, { useMemo, useState, useEffect } from 'react';
import { Shapefac,TimeResolutionS,FourCellList } from "@/components/utils/usefulobject";
import { API_BASE } from "@/components/utils/API_BASE";
import { Checkbox } from "@/components/ui/checkbox";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLOR_PALETTE = [
  "#8884d8", "#82ca9d", "#ffc658", "#ff7c7c", "#ff7f50",
  "#6495ed", "#32cd32", "#ff1493", "#a0522d", "#20b2aa",
  "#ffd700", "#9370db", "#00ced1", "#ff6347", "#4682b4",
  "#adff2f", "#da70d6", "#f08080", "#90ee90", "#87ceeb",
];

const Q25_KEY = "Q25";
const Q75_KEY = "Q75";
const Q25_LABEL = "25%";
const Q75_LABEL = "75%";

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 1) return sorted[0];
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

interface MLineChartProps {
  CellName?: string;
  MLineList: string[];
  DataName?: keyof typeof Shapefac;
  height?: number;
}

type LineDataType = {
  [sampleName: string]: number[];
};

/** Per sample: one array of all-cell values per TP in CellName lifespan. */
type LineXDataType = {
  [sampleName: string]: number[][];
};

/** All-cell values from a sample at the TP nearest to time t (minutes). */
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

export const MLineChart: React.FC<MLineChartProps> = ({
  CellName,
  MLineList,
  DataName,
  height = 400,
}) => {
  const [LineData, setLineData] = useState<LineDataType | null>(null);
  const [LineXData, setLineXData] = useState<LineXDataType | null>(null);
  const [monotone, setMonotone] = useState(false);
  const [showPercentiles, setShowPercentiles] = useState(false);
  const YAxisTitle = Shapefac[DataName];
  const line_width = 2;
  const lineType = monotone ? "monotone" : "linear";

  useEffect(() => {
    if (!CellName) {
      setLineData(null);
      return;
    }
    const fetchData = async () => {
      try {
        const url = `${API_BASE}/Shape/Line?CellName=${CellName}&DataName=${DataName}`;
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

  // Only fetch all-cell LineX when user opts to show 25%/75%
  useEffect(() => {
    if (!showPercentiles || !CellName || !DataName) {
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
  }, [showPercentiles, CellName, DataName]);

  const ChartData = useMemo(() => {
    if (!LineData) return [];

    const filteredData = Object.fromEntries(
      Object.entries(LineData).filter(
        ([key, val]) => MLineList.includes(key) && Array.isArray(val) && val.length > 0
      )
    ) as Record<string, number[]>;

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

    // 25%/75% from all cells (LineX), pooled across samples at each chart time
    if (showPercentiles && LineXData) {
      for (const row of timeMap.values()) {
        const t = row.time as number;
        const vals: number[] = [];
        for (const [sample, tpCells] of Object.entries(LineXData)) {
          if (!Array.isArray(tpCells) || tpCells.length === 0) continue;
          vals.push(...cellsNearTime(sample, tpCells, t));
        }
        if (vals.length === 0) continue;
        vals.sort((a, b) => a - b);
        row[Q25_KEY] = percentile(vals, 0.25);
        row[Q75_KEY] = percentile(vals, 0.75);
      }
    }

    return Array.from(timeMap.values()).sort(
      (a, b) => (a.time as number) - (b.time as number)
    );
  }, [LineData, MLineList, showPercentiles, LineXData]);

  const hasPercentiles =
    showPercentiles &&
    ChartData.some(
      (row) =>
        typeof row[Q25_KEY] === "number" && typeof row[Q75_KEY] === "number"
    );

  const refLabel = (name: string) =>
    name === Q25_KEY ? Q25_LABEL : name === Q75_KEY ? Q75_LABEL : name;

  const YRange = useMemo<[number, number] | ["auto", "auto"]>(() => {
    if (!LineData) return ["auto", "auto"];

    const filteredData = Object.fromEntries(
      Object.entries(LineData).filter(
        ([key, val]) => MLineList.includes(key) && Array.isArray(val)
      )
    ) as Record<string, number[]>;

    const allValues = Object.values(filteredData)
      .flat()
      .filter((v) => typeof v === "number" && Number.isFinite(v));

    if (hasPercentiles) {
      for (const row of ChartData) {
        if (typeof row[Q25_KEY] === "number") allValues.push(row[Q25_KEY]);
        if (typeof row[Q75_KEY] === "number") allValues.push(row[Q75_KEY]);
      }
    }

    if (allValues.length === 0) return ["auto", "auto"];

    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const padding = (max - min) * 0.1 || 0.05;

    return [min - padding, max + padding];
  }, [LineData, MLineList, ChartData, hasPercentiles]);

  return (
    <>
      {ChartData.length > 0 ? (
        <div className="w-full">
          <div className="flex justify-end items-center gap-4 mb-1">
            <label
              htmlFor="percentiles-shape"
              className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none"
            >
              <Checkbox
                id="percentiles-shape"
                checked={showPercentiles}
                onCheckedChange={(checked) => setShowPercentiles(checked === true)}
              />
              25–75%
            </label>
            <label
              htmlFor="monotone-shape"
              className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none"
            >
              <Checkbox
                id="monotone-shape"
                checked={monotone}
                onCheckedChange={(checked) => setMonotone(checked === true)}
              />
              Smooth
            </label>
          </div>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={ChartData} margin={{ top: 10, right: 30, left: 20, bottom: 50 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="time"
              type="number"
              domain={["dataMin", "dataMax"]}
              tickFormatter={(v) => `${v.toFixed(0)}`}
              label={{
                value: FourCellList.includes(CellName)
                  ? "Time after division (min)"
                  : "Time after division (min)",
                position: "insideBottom",
                offset: -15,
              }}
            />
            <YAxis
              domain={YRange}
              tickFormatter={(v) => v.toFixed(2)}
              label={{
                value: YAxisTitle,
                angle: -90,
                position: "insideLeft",
                offset: -0,
                style: { textAnchor: "middle" },
              }}
            />
            <Tooltip
              labelFormatter={(label) => (
                <span style={{ color: "#ffc658", fontWeight: "bold" }}>
                  {`Time: ${(label as number).toFixed(1)} min`}
                </span>
              )}
              formatter={(value, name) => [
                (value as number).toFixed(2),
                refLabel(String(name)),
              ]}
            />
            <Legend
              layout="vertical"
              verticalAlign="middle"
              align="right"
              wrapperStyle={{ paddingLeft: 20 }}
              formatter={(value) => refLabel(String(value))}
            />
            {MLineList.map((sampleKey, idx) => (
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
            {hasPercentiles && (
              <>
                <Line
                  type={lineType}
                  dataKey={Q25_KEY}
                  name={Q25_KEY}
                  stroke="#64748b"
                  strokeDasharray="6 4"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                  legendType="plainline"
                />
                <Line
                  type={lineType}
                  dataKey={Q75_KEY}
                  name={Q75_KEY}
                  stroke="#94a3b8"
                  strokeDasharray="2 4"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                  legendType="plainline"
                />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
        </div>
      ) : null}
    </>
  );
};
