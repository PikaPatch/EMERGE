import React, { useMemo, useState, useEffect } from 'react';
import { API_BASE } from "@/components/utils/API_BASE";
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
import { TimeResolutionS,FourCellList } from '@/components/utils/usefulobject'

const COLOR_PALETTE = [
  "#8884d8", "#82ca9d", "#ffc658", "#ff7c7c", "#ff7f50",
  "#6495ed", "#32cd32", "#ff1493", "#a0522d", "#20b2aa",
  "#ffd700", "#9370db", "#00ced1", "#ff6347", "#4682b4",
  "#adff2f", "#da70d6", "#f08080", "#90ee90", "#87ceeb",
];

interface CellDataChartProps {
  CellName: string;
  LineList: string[];
  DataName?: "Volume" | "Surface";
  height?: number;
}

type LineDataType = {
  [sampleName: string]: number[];
};

// type NormalizedPosition = { normIndex: number; val: number };
// type NormalizedEntry = [string, NormalizedPosition[]];

export const CellDataChart: React.FC<CellDataChartProps> = ({
  CellName,
  LineList,
  DataName = 'Volume',
  height = 400,
}) => {
  const [LineData, setLineData] = useState<LineDataType | null>(null);
  const YAxisTitle = DataName === 'Volume' ? `Volume (µm³)` : `Surface area (µm²)`;
  const line_width = 2;

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


const ChartData = useMemo(() => {
  if (!LineData) return [];

  const filteredData = Object.fromEntries(
    Object.entries(LineData).filter(([key]) => LineList.includes(key))
  );

  if (Object.values(filteredData).length === 0) return [];

  // Map: time-before-division (seconds, ≤ 0) -> { [sampleKey]: value }
  const timeMap = new Map<number, Record<string, number>>();

  for (const [key, arr] of Object.entries(filteredData)) {
    const resolution = TimeResolutionS[key as keyof typeof TimeResolutionS] ?? 1;
    const maxTime = (arr.length - 1) * resolution;

    arr.forEach((val, i) => {
      //const time = FourCellList.includes(CellName) ? ((i * resolution - maxTime) / 60) : (i * resolution / 60);
      const time = (i * resolution / 60);
      if (!timeMap.has(time)) timeMap.set(time, { time });
      timeMap.get(time)![key] = val;
    });
  }

  return Array.from(timeMap.values()).sort((a, b) => (a.time as number) - (b.time as number));
}, [CellName, LineData, LineList]);

  // const YRange = useMemo<[number, number] | ['auto', 'auto']>(() => {
  //     if (!LineData) return ['auto', 'auto'];
  
  //     const filteredData = Object.fromEntries(
  //       Object.entries(LineData).filter(([key]) => LineList.includes(key))
  //     );
  
  //     const allValues = Object.values(filteredData).flat();
  //     if (allValues.length === 0) return ['auto', 'auto'];
  
  //     return [Math.min(...allValues), Math.max(...allValues)];
  //   }, [LineData, LineList]);

  return (
    <>
      {ChartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={ChartData} margin={{ top: 10, right: 30, left: 20, bottom: 30 }}>
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
              //label={{ value: YAxisTitle, angle: -90, position: 'insideLeft', offset: -10 }}
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
                name
              ]}
            />
            <Legend
              verticalAlign="bottom"
              wrapperStyle={{ paddingTop: 20 }}
            />
            {LineList.map((sampleKey, idx) => (
              <Line
                key={sampleKey}
                type="monotone"
                dataKey={sampleKey}
                stroke={COLOR_PALETTE[idx % COLOR_PALETTE.length]}
                dot={false}
                strokeWidth={line_width}
                connectNulls={true}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
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
