import React, { useMemo, useState, useEffect } from 'react';
import { Shapefac,TimeResolutionS,FourCellList } from "@/components/utils/usefulobject";
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

const COLOR_PALETTE = [
  "#8884d8", "#82ca9d", "#ffc658", "#ff7c7c", "#ff7f50",
  "#6495ed", "#32cd32", "#ff1493", "#a0522d", "#20b2aa",
  "#ffd700", "#9370db", "#00ced1", "#ff6347", "#4682b4",
  "#adff2f", "#da70d6", "#f08080", "#90ee90", "#87ceeb",
];

interface MLineChartProps {
  CellName?: string;
  MLineList: string[];
  DataName?: keyof typeof Shapefac;
  height?: number;
}

type LineDataType = {
  [sampleName: string]: number[];
};

type NormalizedPosition = { normIndex: number; val: number };
type NormalizedEntry = [string, NormalizedPosition[]];

export const MLineChart: React.FC<MLineChartProps> = ({
  CellName,
  MLineList,
  DataName,
  height = 400,
}) => {
  const [LineData, setLineData] = useState<LineDataType | null>(null);
  const YAxisTitle = Shapefac[DataName];
  const line_width = 2;

  useEffect(() => {
    if (!CellName) {
      setLineData(null);
      return;
    }
    const fetchData = async () => {
      try {
        const url = `${API_BASE}/Shape/Line?&CellName=${CellName}&DataName=${DataName}`;
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

  // const ChartData = useMemo(() => {

  //   if (!LineData) return [];

  //   const filteredData = Object.fromEntries(
  //     Object.entries(LineData).filter(([key]) => MLineList.includes(key))
  //   );

  //   const values = Object.values(filteredData);
  //   if (values.length === 0) return [];

  //   const maxLength = Math.max(...values.map((arr) => arr.length));
  //   if (maxLength === 0) return [];

  //   const normalizedEntries: NormalizedEntry[] = Object.entries(filteredData).map(([key, arr]) => {
  //     const len = arr.length;
  //     if (len === 0) return [key, []] as NormalizedEntry;

  //     const normalizedPositions: NormalizedPosition[] = arr.map((val, i) => {
  //       const normIndex = len === 1 ? 1 : 1 + (i / (len - 1)) * (maxLength - 1);
  //       return { normIndex, val };
  //     });

  //     return [key, normalizedPositions] as NormalizedEntry;
  //   });

  //   const CData = Array.from({ length: maxLength }, (_, i) => {
  //     const index = i + 1;
  //     const row: Record<string, number | null> = { index };

  //     for (const [key, positions] of normalizedEntries) {
  //       if (positions.length === 0) {
  //         row[key] = null;
  //         continue;
  //       }

  //       let value: number | null = null;
  //       let left: NormalizedPosition | null = null;
  //       let right: NormalizedPosition | null = null;

  //       for (let j = 0; j < positions.length; j++) {
  //         const p = positions[j];
  //         if (Math.abs(p.normIndex - index) < 1e-9) {
  //           value = p.val;
  //           left = null;
  //           right = null;
  //           break;
  //         }
  //         if (p.normIndex < index) {
  //           if (left === null || p.normIndex > left.normIndex) left = p;
  //         } else {
  //           if (right === null || p.normIndex < right.normIndex) right = p;
  //         }
  //       }

  //       if (value === null && left && right) {
  //         const t = (index - left.normIndex) / (right.normIndex - left.normIndex);
  //         value = left.val + t * (right.val - left.val);
  //       } else if (value === null && left) {
  //         value = left.val;
  //       } else if (value === null && right) {
  //         value = right.val;
  //       }

  //       row[key] = value;
  //     }

  //     return row;
  //   });

  //   return CData;
  // }, [LineData, MLineList]);

  const ChartData = useMemo(() => {
    if (!LineData) return [];

    const filteredData = Object.fromEntries(
      Object.entries(LineData).filter(([key]) => MLineList.includes(key))
    );

    if (Object.values(filteredData).length === 0) return [];

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
  }, [LineData, MLineList]);

  const YRange = useMemo<[number, number] | ['auto', 'auto']>(() => {
    if (!LineData) return ['auto', 'auto'];

    const filteredData = Object.fromEntries(
      Object.entries(LineData).filter(([key]) => MLineList.includes(key))
    );

    const allValues = Object.values(filteredData).flat();
    if (allValues.length === 0) return ['auto', 'auto'];

    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const padding = (max - min) * 0.1;

    return [min - padding, max + padding];
  }, [LineData, MLineList]);

  // const YRange = useMemo<[number, number] | ['auto', 'auto']>(() => {
  //   if (!LineData) return ['auto', 'auto'];

  //   const filteredData = Object.fromEntries(
  //     Object.entries(LineData).filter(([key]) => MLineList.includes(key))
  //   );

  //   const allValues = Object.values(filteredData).flat();
  //   if (allValues.length === 0) return ['auto', 'auto'];

  //   return [Math.min(...allValues) , Math.max(...allValues)];
  // }, [LineData, MLineList]);


//   const ChartData = useMemo(() => {
//   if (!LineData) return [];

//   const filteredData = Object.fromEntries(
//     Object.entries(LineData).filter(([key]) => MLineList.includes(key))
//   );

//   const samples = Object.keys(filteredData);
//   if (samples.length === 0) return [];

//   // Pre-compute once
//   const lengths = samples.map((s) => filteredData[s].length);
//   const maxLen = Math.max(...lengths);
//   const offsets = lengths.map((len) => maxLen - len); // left-padding per sample

//   // Pre-allocate to avoid dynamic array resizing
//   const result = new Array(maxLen);

//   for (let i = 0; i < maxLen; i++) {
//     const entry: Record<string, number | null> = { index: i + 1 };
//     for (let j = 0; j < samples.length; j++) {
//       const dataIdx = i - offsets[j];
//       entry[samples[j]] = dataIdx >= 0 ? filteredData[samples[j]][dataIdx] : null;
//     }
//     result[i] = entry;
//   }

//   return result;
// }, [LineData, MLineList]);

return (
  <>
    {ChartData.length > 0 ? (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={ChartData} margin={{ top: 10, right: 30, left: 20, bottom: 50 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="time"
            type="number"
            domain={['dataMin', 'dataMax']}
            tickFormatter={(v) => `${v.toFixed(0)}`}
            label={{ value: FourCellList.includes(CellName) ? 'Time after division (min)' : 'Time after division (min)', position: 'insideBottom', offset: -15 }}
          />
          <YAxis
              domain={YRange}
              tickFormatter={(v) => v.toFixed(2)}
              label={{
                value: YAxisTitle,
                angle: -90,
                position: 'insideLeft',
                offset: -0,
                style: { textAnchor: 'middle' },
              }}
            />
          <Tooltip
            labelFormatter={(label) => (
              <span style={{ color: '#ffc658', fontWeight: 'bold' }}>
                {`Time: ${(label as number).toFixed(1)} min`}
              </span>
            )}
            formatter={(value, name) => [
              (value as number).toFixed(2),
              name
            ]}
          />
          <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ paddingLeft: 20 }}/>
          {MLineList.map((sampleKey, idx) => (
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
    ) : null}
  </>
);

  // return (
  //   <>
  //     {ChartData.length > 0 ? (
  //       <ResponsiveContainer width="100%" height={height}>
  //         <LineChart data={ChartData}>
  //           <CartesianGrid strokeDasharray="3 3" />
  //           <XAxis dataKey="index" />
  //           <YAxis
  //             domain={YRange}
  //             label={{
  //               value: YAxisTitle,
  //               angle: -90,
  //               position: 'insideLeft',
  //               style: { textAnchor: 'middle' },
  //             }}
  //             tickFormatter={(value: number | null) => (value !== null ? value.toFixed(2) : 'N/A')}
  //           />
  //           <Tooltip formatter={(value: number | null) => (value !== null ? value.toFixed(2) : 'N/A')} />
  //           <Legend />
  //           {MLineList.map((sampleKey, idx) => (
  //             <Line
  //               key={sampleKey}
  //               type="monotone"
  //               dataKey={sampleKey}
  //               stroke={COLOR_PALETTE[idx % COLOR_PALETTE.length]}
  //               strokeWidth={line_width}
  //               dot={false}
  //               connectNulls={false}
  //             />
  //           ))}
  //         </LineChart>
  //       </ResponsiveContainer>
  //     ) : null}
  //   </>
  // );
};
