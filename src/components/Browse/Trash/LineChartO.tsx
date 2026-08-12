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
import { TimeResolutionS } from '@/components/utils/usefulobject'

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

type NormalizedPosition = { normIndex: number; val: number };
type NormalizedEntry = [string, NormalizedPosition[]];

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

    const values = Object.values(filteredData);
    if (values.length === 0) return [];

    const maxLength = Math.max(...values.map((arr) => arr.length));
    if (maxLength === 0) return [];

    const normalizedEntries: NormalizedEntry[] = Object.entries(filteredData).map(([key, arr]) => {
      const len = arr.length;
      if (len === 0) return [key, []] as NormalizedEntry;

      const normalizedPositions: NormalizedPosition[] = arr.map((val, i) => {
        const normIndex = len === 1 ? 1 : 1 + (i / (len - 1)) * (maxLength - 1);
        return { normIndex, val };
      });

      return [key, normalizedPositions] as NormalizedEntry;
    });

    const CData = Array.from({ length: maxLength }, (_, i) => {
      const index = i + 1;
      const row: Record<string, number | null> = { index };

      for (const [key, positions] of normalizedEntries) {
        if (positions.length === 0) {
          row[key] = null;
          continue;
        }

        let value: number | null = null;
        let left: NormalizedPosition | null = null;
        let right: NormalizedPosition | null = null;

        for (let j = 0; j < positions.length; j++) {
          const p = positions[j];
          if (Math.abs(p.normIndex - index) < 1e-9) {
            value = p.val;
            left = null;
            right = null;
            break;
          }
          if (p.normIndex < index) {
            if (left === null || p.normIndex > left.normIndex) left = p;
          } else {
            if (right === null || p.normIndex < right.normIndex) right = p;
          }
        }

        if (value === null && left && right) {
          const t = (index - left.normIndex) / (right.normIndex - left.normIndex);
          value = left.val + t * (right.val - left.val);
        } else if (value === null && left) {
          value = left.val;
        } else if (value === null && right) {
          value = right.val;
        }

        row[key] = value;
      }

      return row;
    });

    return CData;
  }, [LineData, LineList]);


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
          <LineChart data={ChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="index" />
            <YAxis
              //domain={YRange}
              label={{
                value: YAxisTitle,
                angle: -90,
                position: 'insideLeft',
                style: { textAnchor: 'middle' },
              }}
              tickFormatter={(value: number | null) => (value !== null ? value.toFixed(0) : 'N/A')}
            />
            <Tooltip formatter={(value: number | null) => (value !== null ? value.toFixed(2) : 'N/A')} />
            <Legend />
            {LineList.map((sampleKey, idx) => (
              <Line
                key={sampleKey}
                type="monotone"
                dataKey={sampleKey}
                stroke={COLOR_PALETTE[idx % COLOR_PALETTE.length]}
                strokeWidth={line_width}
                dot={false}
                connectNulls={false}
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
