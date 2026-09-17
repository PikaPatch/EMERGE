import React, { useEffect, useMemo, useState } from "react";
import { ChevronsUpDown, X } from "lucide-react";
import { API_BASE } from "@/components/utils/API_BASE";
import { FourCellList, SMGroupName, SMList, TimeResolutionS } from "@/components/utils/usefulobject";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLOR_PALETTE = [
  "#8884d8", "#82ca9d", "#ffc658", "#ff7c7c", "#ff7f50",
  "#6495ed", "#32cd32", "#ff1493", "#a0522d", "#20b2aa",
  "#ffd700", "#9370db", "#00ced1", "#ff6347", "#4682b4",
  "#adff2f", "#da70d6", "#f08080", "#90ee90", "#87ceeb",
];

const SAMPLE_GROUPS = (Object.keys(SMList) as (keyof typeof SMList)[]).map((key) => ({
  key,
  label: SMGroupName[key],
  samples: SMList[key],
}));

const MAX_SELECT = 17;

type ContactRow = {
  TP: number;
  [partner: string]: number | null;
};

type SamplePayload = {
  partners: string[];
  data: ContactRow[];
};

type ContactAreaResponse = Record<string, SamplePayload>;

interface ContactAreaChartProps {
  CellName: string;
  defaultSample?: string;
  LineList?: string[];
  MLineList?: string[];
  height?: number;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function partnerTotal(data: ContactRow[], partner: string): number {
  return data.reduce((sum, row) => {
    const value = row[partner];
    return sum + (isFiniteNumber(value) ? value : 0);
  }, 0);
}

function hasContactArea(value: unknown): value is number {
  return isFiniteNumber(value) && value !== 0;
}

function ContactAreaTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number | null; color?: string; dataKey?: string }>;
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;

  const items = payload.filter((entry) => hasContactArea(entry.value));
  if (items.length === 0) return null;

  return (
    <div className="rounded-md border bg-background px-2 py-1.5 text-xs shadow-sm">
      <p className="mb-1 font-medium text-muted-foreground">TP {label}</p>
      <div className="space-y-0.5">
        {items.map((entry) => (
          <div key={String(entry.dataKey ?? entry.name)} className="flex items-center gap-2">
            <span
              className="h-2 w-2 shrink-0 rounded-[2px]"
              style={{ backgroundColor: entry.color }}
            />
            <span>{entry.name}</span>
            <span className="ml-auto tabular-nums">{entry.value.toFixed(2)} µm²</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export const ContactAreaChart: React.FC<ContactAreaChartProps> = ({
  CellName,
  defaultSample = "Sample1",
  LineList,
  MLineList,
  height = 400,
}) => {
  const [payload, setPayload] = useState<ContactAreaResponse | null>(null);
  const [sample, setSample] = useState(defaultSample);
  const [view, setView] = useState("area");
  const [lineList, setLineList] = useState<string[]>(LineList ?? MLineList ?? []);
  const [partnerCell, setPartnerCell] = useState<string>("");
  const [monotone, setMonotone] = useState(false);

  useEffect(() => {
    if (LineList) setLineList(LineList);
  }, [LineList]);

  useEffect(() => {
    if (!LineList && MLineList) setLineList(MLineList);
  }, [LineList, MLineList]);

  useEffect(() => {
    if (!CellName) {
      setPayload(null);
      return;
    }

    const fetchData = async () => {
      try {
        const url = `${API_BASE}/ChartData/ContactArea?CellName=${encodeURIComponent(CellName)}`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const jsonData: ContactAreaResponse = await response.json();
        setPayload(jsonData);
      } catch {
        setPayload(null);
      }
    };

    fetchData();
  }, [CellName]);

  useEffect(() => {
    if (!payload) return;

    const preferred = payload[defaultSample];
    if (preferred?.data?.length) {
      setSample(defaultSample);
      return;
    }

    const firstWithData = Object.keys(payload).find((key) => payload[key]?.data?.length > 0);
    if (firstWithData) setSample(firstWithData);
  }, [CellName, defaultSample, payload]);

  const sampleData = payload?.[sample];
  const rawPartners = sampleData?.partners ?? [];
  const rows = sampleData?.data ?? [];

  const partners = useMemo(
    () =>
      [...rawPartners].sort(
        (a, b) => partnerTotal(rows, b) - partnerTotal(rows, a)
      ),
    [rawPartners, rows]
  );

  const areaData = useMemo(
    () =>
      rows.map((row) => {
        const point: Record<string, number> = { TP: row.TP };
        for (const partner of partners) {
          const value = row[partner];
          point[partner] = isFiniteNumber(value) ? value : 0;
        }
        return point;
      }),
    [partners, rows]
  );

  const availablePartners = useMemo(() => {
    if (!payload || lineList.length === 0) return [];
    const names = new Set<string>();
    for (const sampleName of lineList) {
      const samplePartners = payload[sampleName]?.partners ?? [];
      for (const name of samplePartners) names.add(name);
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [lineList, payload]);

  useEffect(() => {
    if (availablePartners.length === 0) {
      setPartnerCell("");
      return;
    }
    if (!availablePartners.includes(partnerCell)) {
      setPartnerCell(availablePartners[0]);
    }
  }, [availablePartners, partnerCell]);

  const partnerLineData = useMemo(() => {
    if (!payload || !partnerCell || lineList.length === 0) return [];

    const filtered: Record<string, Array<number | null>> = {};
    for (const sampleName of lineList) {
      const sampleRows = payload[sampleName]?.data ?? [];
      if (sampleRows.length === 0) continue;
      filtered[sampleName] = sampleRows.map((row) => {
        const value = row[partnerCell];
        return isFiniteNumber(value) ? value : null;
      });
    }

    if (Object.keys(filtered).length === 0) return [];

    const timeMap = new Map<number, Record<string, number>>();
    for (const [sampleName, arr] of Object.entries(filtered)) {
      const resolution = TimeResolutionS[sampleName as keyof typeof TimeResolutionS] ?? 1;
      arr.forEach((val, i) => {
        if (!isFiniteNumber(val)) return;
        const time = (i * resolution) / 60;
        if (!timeMap.has(time)) timeMap.set(time, { time });
        timeMap.get(time)![sampleName] = val;
      });
    }

    return Array.from(timeMap.values()).sort(
      (a, b) => (a.time as number) - (b.time as number)
    );
  }, [lineList, partnerCell, payload]);

  const tps = rows.map((row) => row.TP);

  const hasData = partners.length > 0 && rows.length > 0;
  const lineType = monotone ? "monotone" : "linear";
  const showSingleSample = view !== "line";

  const toggleSample = (name: string, checked: boolean) => {
    setLineList((prev) => {
      if (checked) {
        if (prev.includes(name) || prev.length >= MAX_SELECT) return prev;
        return [...prev, name];
      }
      return prev.filter((s) => s !== name);
    });
  };

  const toggleGroup = (samples: string[], checked: boolean) => {
    setLineList((prev) => {
      if (checked) {
        const toAdd = samples.filter((s) => !prev.includes(s));
        const slots = MAX_SELECT - prev.length;
        return [...new Set([...prev, ...toAdd.slice(0, slots)])];
      }
      return prev.filter((s) => !samples.includes(s));
    });
  };

  return (
    <div className="w-full space-y-4">
      {showSingleSample && (
        <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:justify-between">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Select sample</label>
            <Select value={sample} onValueChange={setSample} disabled={!payload}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select a sample" />
              </SelectTrigger>
              <SelectContent className="max-h-80">
                {SAMPLE_GROUPS.map((group) => (
                  <SelectGroup key={group.key}>
                    <SelectLabel className="text-xs uppercase tracking-wide">
                      {group.label}
                    </SelectLabel>
                    {group.samples.map((name) => {
                      const n = payload?.[name]?.partners?.length ?? 0;
                      return (
                        <SelectItem key={name} value={name}>
                          {name}
                          {payload ? ` · ${n} neighbour${n === 1 ? "" : "s"}` : ""}
                        </SelectItem>
                      );
                    })}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>

          {hasData && (
            <p className="text-xs text-muted-foreground pb-1">
              {partners.length} contacted cell{partners.length === 1 ? "" : "s"} · TP {tps[0]}–{tps[tps.length - 1]} · {sample}
            </p>
          )}
        </div>
      )}

      {!payload ? (
        <div className="w-full h-64 flex items-center justify-center bg-muted/50 rounded-lg border border-dashed">
          <p className="text-muted-foreground">Loading contact-area data…</p>
        </div>
      ) : (
        <Tabs value={view} onValueChange={setView}>
          <TabsList className="mb-3">
            <TabsTrigger value="area">Stacked area</TabsTrigger>
            <TabsTrigger value="line">Line chart</TabsTrigger>
          </TabsList>

          <TabsContent value="area">
            {!hasData ? (
              <div className="w-full h-64 flex items-center justify-center bg-muted/50 rounded-lg border border-dashed">
                <p className="text-muted-foreground">
                  No contact-area data for {CellName} in {sample}
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={height} key={`${sample}-area`}>
                <AreaChart data={areaData} margin={{ top: 10, right: 20, left: 10, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="TP"
                    label={{ value: "Time point", position: "insideBottom", offset: -15 }}
                  />
                  <YAxis
                    tickFormatter={(v) => v.toFixed(0)}
                    label={{
                      value: "Contact area (µm²)",
                      angle: -90,
                      position: "insideLeft",
                      offset: -2,
                      style: { textAnchor: "middle" },
                    }}
                  />
                  <Tooltip content={<ContactAreaTooltip />} />
                  <Legend
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                    wrapperStyle={{ paddingLeft: 12 }}
                  />
                  {partners.map((cell, idx) => (
                    <Area
                      key={cell}
                      //type="monotone"
                      dataKey={cell}
                      stackId="contact"
                      stroke={COLOR_PALETTE[idx % COLOR_PALETTE.length]}
                      fill={COLOR_PALETTE[idx % COLOR_PALETTE.length]}
                      fillOpacity={0.75}
                      strokeWidth={1}
                      isAnimationActive={false}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            )}
          </TabsContent>

          <TabsContent value="line">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex flex-col gap-4 lg:w-80 lg:flex-shrink-0">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Select contacted cell</label>
                  <Select
                    value={partnerCell}
                    onValueChange={setPartnerCell}
                    disabled={availablePartners.length === 0}
                  >
                    <SelectTrigger className="w-72">
                      <SelectValue placeholder="Select a contacted cell" />
                    </SelectTrigger>
                    <SelectContent className="max-h-80">
                      {availablePartners.map((name) => (
                        <SelectItem key={name} value={name}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-1.5">
                    <label className="text-sm font-medium">Select samples</label>
                    <span className={`text-xs ${lineList.length >= MAX_SELECT ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                      {lineList.length}/{MAX_SELECT} selected
                    </span>
                  </div>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        disabled={!CellName}
                        className="w-72 justify-between font-normal"
                      >
                        {lineList.length === 0
                          ? "Select samples…"
                          : `${lineList.length} sample${lineList.length > 1 ? "s" : ""} selected`}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 p-2" align="start">
                      <div className="flex items-center justify-between mb-2 px-1">
                        <span className="text-xs text-muted-foreground">
                          {lineList.length}/{MAX_SELECT} selected
                        </span>
                        {lineList.length > 0 && (
                          <button
                            onClick={() => setLineList([])}
                            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                          >
                            <X className="h-3 w-3" /> Clear all
                          </button>
                        )}
                      </div>
                      <ScrollArea className="h-72">
                        <div className="flex flex-col gap-2 pr-3">
                          {SAMPLE_GROUPS.map((group) => {
                            const allChecked = group.samples.every((s) => lineList.includes(s));
                            return (
                              <div key={group.label}>
                                <div className="flex items-center gap-2 px-1 py-0.5">
                                  <Checkbox
                                    id={`contact-line-group-${group.label}`}
                                    checked={allChecked}
                                    disabled={!allChecked && lineList.length >= MAX_SELECT}
                                    onCheckedChange={(checked) => toggleGroup(group.samples, checked === true)}
                                  />
                                  <label
                                    htmlFor={`contact-line-group-${group.label}`}
                                    className="text-xs font-semibold cursor-pointer leading-none"
                                  >
                                    {group.label}
                                  </label>
                                </div>
                                <div className="flex flex-wrap gap-x-3 gap-y-1 pl-6 pb-1">
                                  {group.samples.map((sampleName) => (
                                    <div key={sampleName} className="flex items-center gap-1">
                                      <Checkbox
                                        id={`contact-line-${sampleName}`}
                                        checked={lineList.includes(sampleName)}
                                        disabled={!lineList.includes(sampleName) && lineList.length >= MAX_SELECT}
                                        onCheckedChange={(checked) => toggleSample(sampleName, checked === true)}
                                      />
                                      <label htmlFor={`contact-line-${sampleName}`} className="text-xs cursor-pointer">
                                        {sampleName}
                                      </label>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </PopoverContent>
                  </Popover>

                  {lineList.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {lineList.map((sampleName) => (
                        <span
                          key={sampleName}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary border border-primary/20"
                        >
                          {sampleName}
                          <button
                            onClick={() => setLineList((prev) => prev.filter((s) => s !== sampleName))}
                            className="hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                {partnerLineData.length > 0 && partnerCell ? (
                  <div className="w-full">
                    <div className="flex justify-end mb-1">
                      <label
                        htmlFor="monotone-contact-area"
                        className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none"
                      >
                        <Checkbox
                          id="monotone-contact-area"
                          checked={monotone}
                          onCheckedChange={(checked) => setMonotone(checked === true)}
                        />
                        Smooth
                      </label>
                    </div>
                    <ResponsiveContainer width="100%" height={height} key={`${partnerCell}-line`}>
                      <LineChart data={partnerLineData} margin={{ top: 10, right: 20, left: 10, bottom: 50 }}>
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
                          tickFormatter={(v) => v.toFixed(0)}
                          label={{
                            value: `Contact area with ${partnerCell} (µm²)`,
                            angle: -90,
                            position: "insideLeft",
                            offset: -2,
                            style: { textAnchor: "middle" },
                          }}
                        />
                        <Tooltip
                          labelFormatter={(label) => (
                            <span style={{ color: "grey", fontWeight: "bold" }}>
                              {`Time: ${(label as number).toFixed(1)} min`}
                            </span>
                          )}
                          formatter={(value, name) => {
                            if (!hasContactArea(value)) return null;
                            return [`${(value as number).toFixed(2)} µm²`, name];
                          }}
                        />
                        <Legend
                          layout="vertical"
                          verticalAlign="middle"
                          align="right"
                          wrapperStyle={{ paddingLeft: 12 }}
                        />
                        {lineList.map((sampleKey, idx) => (
                          <Line
                            key={sampleKey}
                            type={lineType}
                            dataKey={sampleKey}
                            stroke={COLOR_PALETTE[idx % COLOR_PALETTE.length]}
                            dot={false}
                            strokeWidth={2}
                            connectNulls
                            isAnimationActive={false}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="w-full py-12 flex items-center justify-center bg-muted/50 rounded-lg border border-dashed">
                    <p className="text-muted-foreground">
                      {lineList.length === 0
                        ? "Select samples to view contact-area trends"
                        : "Select a contacted cell to display the line chart"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};
