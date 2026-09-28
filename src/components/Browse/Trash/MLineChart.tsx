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

const REFERENCE_KEY = "Reference";
const REFERENCE_LABEL = "Mean";

interface MLineChartProps {
  CellName?: string;
  MLineList: string[];
  DataName?: keyof typeof Shapefac;
  height?: number;
}

type LineDataType = {
  [sampleName: string]: number[];
};

type SeriesPoint = { x: number; y: number };

function lerp(x0: number, y0: number, x1: number, y1: number, x: number): number {
  if (x1 === x0) return y0;
  return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
}

/** Linear interpolate y at x from sorted points; null if outside span. */
function interpAt(points: SeriesPoint[], x: number): number | null {
  if (points.length === 0) return null;
  if (x < points[0].x || x > points[points.length - 1].x) return null;
  for (let i = 0; i < points.length; i++) {
    if (Math.abs(points[i].x - x) < 1e-9) return points[i].y;
    if (points[i].x > x) {
      const a = points[i - 1];
      const b = points[i];
      return lerp(a.x, a.y, b.x, b.y, x);
    }
  }
  return null;
}

function seriesFromSample(sample: string, arr: number[]): SeriesPoint[] {
  const resolution = TimeResolutionS[sample as keyof typeof TimeResolutionS] ?? 1;
  const points: SeriesPoint[] = [];
  arr.forEach((val, i) => {
    if (typeof val === "number" && Number.isFinite(val)) {
      points.push({ x: (i * resolution) / 60, y: val });
    }
  });
  return points;
}

export const MLineChart: React.FC<MLineChartProps> = ({
  CellName,
  MLineList,
  DataName,
  height = 400,
}) => {
  const [LineData, setLineData] = useState<LineDataType | null>(null);
  const [monotone, setMonotone] = useState(false);
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

  const ChartData = useMemo(() => {
    if (!LineData) return [];

    const filteredData = Object.fromEntries(
      Object.entries(LineData).filter(
        ([key, val]) => MLineList.includes(key) && Array.isArray(val) && val.length > 0
      )
    ) as Record<string, number[]>;

    if (Object.values(filteredData).length === 0) return [];

    // Time series for currently selected samples only
    const selectedSeries = Object.entries(filteredData).map(
      ([sample, arr]) => seriesFromSample(sample, arr)
    );

    const timeMap = new Map<number, Record<string, number>>();

    for (const [key, arr] of Object.entries(filteredData)) {
      const resolution = TimeResolutionS[key as keyof typeof TimeResolutionS] ?? 1;

      arr.forEach((val, i) => {
        const time = (i * resolution) / 60;
        if (!timeMap.has(time)) timeMap.set(time, { time });
        timeMap.get(time)![key] = val;
      });
    }

    // Mean of selected samples at each plotted timepoint (interpolate missing ones).
    // Guarantees the mean sits between min/max of contributing selected samples.
    for (const row of timeMap.values()) {
      const t = row.time as number;
      const vals: number[] = [];
      for (const points of selectedSeries) {
        const v = interpAt(points, t);
        if (v != null && Number.isFinite(v)) vals.push(v);
      }
      if (vals.length > 0) {
        row[REFERENCE_KEY] = vals.reduce((s, v) => s + v, 0) / vals.length;
      }
    }

    return Array.from(timeMap.values()).sort(
      (a, b) => (a.time as number) - (b.time as number)
    );
  }, [LineData, MLineList]);

  const hasReference = useMemo(
    () => ChartData.some((row) => typeof row[REFERENCE_KEY] === "number"),
    [ChartData]
  );

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

    if (allValues.length === 0) return ["auto", "auto"];

    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const padding = (max - min) * 0.1 || 0.05;

    return [min - padding, max + padding];
  }, [LineData, MLineList]);

  return (
    <>
      {ChartData.length > 0 ? (
        <div className="w-full">
          <div className="flex justify-end mb-1">
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
                name === REFERENCE_KEY ? REFERENCE_LABEL : name,
              ]}
            />
            <Legend
              layout="vertical"
              verticalAlign="middle"
              align="right"
              wrapperStyle={{ paddingLeft: 20 }}
              formatter={(value) =>
                value === REFERENCE_KEY ? REFERENCE_LABEL : value
              }
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
            {hasReference && (
              <Line
                type={lineType}
                dataKey={REFERENCE_KEY}
                name={REFERENCE_KEY}
                stroke="#64748b"
                strokeDasharray="6 4"
                strokeWidth={2}
                dot={false}
                connectNulls
                legendType="plainline"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
        </div>
      ) : null}
    </>
  );
};
