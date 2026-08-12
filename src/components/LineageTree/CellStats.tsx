import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Shapefac } from "@/components/utils/usefulobject";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { API_BASE } from "@/components/utils/API_BASE";

interface Props {
  SM: string;
  CellName : string;
  colorMode : string;
  Gene?:string;
  ExpVal?:any;
}

export const CellStats = ({ SM, CellName,colorMode, Gene, ExpVal }:Props) => {
  const [CellData, setCellData] = useState<any>(null);
  const [selectedTP, setSelectedTP] = useState<number | null>(null);


  useEffect(() => {
    if (!CellName) {
      setCellData(null);
      setSelectedTP(null);
      return;
    }
    (async () => {
      try {
        const url = `${API_BASE}/CellDats/CellAllTP?SM=${SM}&CellName=${CellName}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setCellData(data);
        const initTP = data?.Range && data.Range[0];
        setSelectedTP(initTP);
      } catch {
        setCellData(null);
        setSelectedTP(null);
      }
    })();
  }, [SM, CellName]);

  const rangeText = useMemo(() => {
    return CellData?.Range ? `${CellData.Range[0]}–${CellData.Range[1]}` : "—";
  }, [CellData]);

  const TPData = useMemo(() => {
    if (!CellData?.data || selectedTP === null) return null;
    return CellData.data[String(selectedTP)] ?? null;
  }, [CellData, selectedTP]);

  const ExpValData = useMemo(() => {
    if (typeof ExpVal === 'number') return ExpVal;
    if (!ExpVal || selectedTP === null) return null;
    return ExpVal[String(selectedTP)] ?? null;
  }, [ExpVal, selectedTP]);


  return (
    <Card className="shadow-md border border-border/50 hover:shadow-lg transition-shadow duration-300">
      <CardContent className="p-3 flex flex-col gap-3">

        {/* ── Top section: stacks vertically on mobile, side-by-side on sm+ ── */}
        <div className="flex flex-col sm:flex-row gap-4">

          {/* Left: Basic Metrics */}
          <div className="flex flex-col gap-2 sm:w-1/4 sm:flex-none">
            {/* Cell measurements */}
            <div>
              <p className="text-xs font-semibold text-foreground tracking-wide mb-1.5">
                Cell measurements
              </p>
              <div className="space-y-0.5 text-xs">
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Cell name:</span>
                  <span className="font-semibold text-primary flex-shrink-0">{CellName || "—"}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Volume:</span>
                  <span className="font-semibold text-foreground tabular-nums flex-shrink-0">
                    {TPData?.Volume != null ? `${TPData.Volume.toFixed(1)} µm³` : "—"}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Surface area:</span>
                  <span className="font-semibold text-foreground tabular-nums flex-shrink-0">
                    {TPData?.Surface != null ? `${TPData.Surface.toFixed(1)} µm²` : "—"}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-foreground tracking-wide mb-1.5">
                Gene expression
              </p>
              <div className="space-y-0.5 text-xs">
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground"><em>{colorMode == 'expression' && Gene ? Gene : ''}</em></span>
                    <span className="font-semibold text-primary flex-shrink-0">
                      {
                        colorMode !== 'expression'
                          ? "-"
                          : typeof ExpValData === 'number'
                            ? (ExpValData < 0
                                ? 'NA'
                                : ExpValData > 1
                                  ? '-'
                                  : ExpValData)
                            : Array.isArray(ExpVal)
                              ? ExpValData
                              : '-'
                      }
                    </span>
                </div>
              </div>
            </div>

            <div className="border-t border-border" />

            {/* Cell life cycle */}
            <div>
              <p className="text-xs font-semibold text-foreground tracking-wide mb-1.5">
                Cell cycle
              </p>
              <div className="space-y-0.5 text-xs">
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Lifespan:</span>
                  <span className="font-semibold text-foreground flex-shrink-0">{rangeText}</span>
                </div>
              </div>

              {/* TP Slider */}
              {CellData?.Range ? (
                <div className="flex items-center gap-2 mt-2 ">
                  <span className="text-xs text-muted-foreground flex-shrink-0">TP:</span>
                  <Slider
                    min={CellData.Range[0]}
                    max={CellData.Range[1]}
                    step={1}
                    value={[selectedTP ?? CellData.Range[0]]}
                    onValueChange={([val]) => setSelectedTP(val)}
                    className="flex-1"
                  />
                  <span className="text-xs font-semibold text-primary w-8 text-right flex-shrink-0">
                    {selectedTP ?? "—"}
                  </span>
                </div>
              ) : (<div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-muted-foreground flex-shrink-0">TP:</span>
                  <Slider
                    min={0}
                    max={100}
                    step={1}
                    value={[0]}
                    disabled
                    className="flex-1"
                  />
                  <span className="text-xs font-semibold text-primary w-8 text-right flex-shrink-0">
                    {selectedTP ?? "—"}
                  </span>
                </div>)}

                <div className="border-t border-border mt-4" />

                
            </div>


            {/* Export button */}
            <Button
                onClick={() => {
                  if (!SM || !selectedTP) {
                    alert("Please select a sample and time point");
                    return;
                  }
                  window.location.href = `${API_BASE}/Model/SingleCellOBJFile?SM=${SM}&TP=${selectedTP}&CellName=${CellName}`;
                }}
                className="w-full h-8 text-xs"
                variant="secondary"
              >
                <Download className="mr-1 h-3 w-3" />
                Export cell model (.obj)
              </Button>
          </div>

          {/* Right: Axis + Morphology metrics — full width on mobile, flex-1 on sm+ */}
          <div className="flex flex-col gap-3 sm:flex-1 sm:pl-4 sm:border-l sm:border-border/50">

              {/* Axis lengths */}
              <div>
                <p className="text-xs font-semibold text-foreground tracking-wide mb-1.5">
                  Axis length
                </p>
                {/* 3 columns always — these are short labels */}
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { key: "Axis_a", label: "Axis A" },
                    { key: "Axis_b", label: "Axis B" },
                    { key: "Axis_c", label: "Axis C" },
                  ].map(({ key, label }) => (
                    <div
                      key={key}
                      className="p-1.5 rounded-md bg-muted/30 border border-border/30 hover:bg-muted/50 transition-colors"
                    >
                      <p className="text-xs text-muted-foreground font-medium leading-tight">{label}</p>
                      <p className="text-xs font-semibold text-foreground tabular-nums leading-tight">
                        {TPData?.[key] != null ? `${TPData[key].toFixed(1)} µm` : "—"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-border" />

              {/* Morphology descriptors */}
              <div>
                <p className="text-xs font-semibold text-foreground tracking-wide mb-1.5">
                  Morphology features
                </p>
                {/* 2 cols on mobile, auto-fit on larger screens */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5">
                  {Object.entries(Shapefac).map(([key, label]) => (
                    <div
                      key={key}
                      className="p-1.5 rounded-md bg-muted/30 border border-border/30 hover:bg-muted/50 transition-colors"
                    >
                      <p className="text-xs text-muted-foreground font-medium leading-tight truncate">{label}</p>
                      <p className="text-xs font-semibold text-foreground tabular-nums leading-tight">
                        {TPData?.[key] != null ? TPData[key].toFixed(3) : "—"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
        </div>
      </CardContent>
    </Card>
  );
};
