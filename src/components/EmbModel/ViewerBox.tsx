import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shapefac,FateName } from '@/components/utils/usefulobject'
import { API_BASE } from "@/components/utils/API_BASE";


interface ParaProps {
  SM: string;
  TP: number;
  CellName: string;
}

interface HighligtCellsDats {
  SampleID: string;
  ID: string;
  CellName: string;
  Fate: string;
  TP: number;
  Volume: number;
  Surface: number;

  NucLoc_x: string;
  NucLoc_y: string;
  NucLoc_z: string;

  Contacted_cells: string;
  Contacted_area: string;

  Axis_a: number;
  Axis_b: number;
  Axis_c: number;
  CoreyShapeFactor: number;
  DiameterSphericity: number;
  ElongationRatio: number;
  GeneralSphericity: number;
  HayakawaFlatnessRatio: number;
  HayakawaRoundness: number;
  HuangShapeFactor: number;
  InterceptSphericity: number;
  MaximumProjectionSphericity: number;
  PivotabilityIndex: number;
  SpreadingIndex: number;
  WilsonFlatnessIndex: number;

  Range: [number, number];
}


export const ViewerBox = ({
  SM,
  TP,
  CellName
}: ParaProps) => {
  const [HighligtCellsDats, setHighligtCellsDats] = useState<HighligtCellsDats>(null);

  useEffect(() => {
    if (!SM || !TP || !CellName) return;
    const fetchData = async () => {
      try {
        const url = `${API_BASE}/CellDats/Cell?SM=${SM}&CellName=${CellName}&TP=${TP}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const jsonData = await response.json();
        setHighligtCellsDats(jsonData);
      } catch (err) {
        console.error('Failed to load SingleCell expression:', err);
        setHighligtCellsDats(null);
      }
    };
    fetchData();
  }, [SM, TP, CellName]);

  return (
    HighligtCellsDats && (
      <div className="bg-background/95 backdrop-blur-md border border-border/50 rounded-lg shadow-lg overflow-hidden max-w-xs flex flex-col h-[480px]">

        {/* Header — fixed, does not scroll */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border/30 px-4 py-3 flex-shrink-0">
          <p className="font-semibold text-primary text-base tracking-tight">
            Cell: {HighligtCellsDats.CellName}
          </p>
        </div>

        {/* Scrollable content */}
        <ScrollArea className="flex-1 min-h-0 px-4 pb-4">
          <div className="space-y-2">

            <div className="flex justify-between items-start gap-3">
              <span className="text-muted-foreground text-sm font-medium min-w-fit">
                Life span in this sample (TP):
              </span>
              <span className="text-foreground text-sm text-right">
                {HighligtCellsDats.Range[0]} to {HighligtCellsDats.Range[1]}
              </span>
            </div>

            <div className="flex justify-between items-start gap-3">
              <span className="text-muted-foreground text-sm font-medium min-w-fit">
                Cell volume:
              </span>
              <span className="text-foreground text-sm text-right">
                {HighligtCellsDats.Volume.toFixed(2)} µm³
              </span>
            </div>

            <div className="flex justify-between items-start gap-3">
              <span className="text-muted-foreground text-sm font-medium min-w-fit">
                Surface area:
              </span>
              <span className="text-foreground text-sm text-right">
                {HighligtCellsDats.Surface.toFixed(2)} µm²
              </span>
            </div>

{!['Sample32','Sample33','Sample34','Sample35'].includes(SM) && (<div className="flex justify-between items-start gap-3">
              <span className="text-muted-foreground text-sm font-medium min-w-fit">
                Terminal fate:
              </span>
              <span className="text-foreground text-sm text-right">
                {FateName[HighligtCellsDats.Fate]}
              </span>
            </div>)}
            

            <div className="flex justify-between items-start gap-3">
              <span className="text-muted-foreground text-sm font-medium min-w-fit">
                Cell nuclei position:
              </span>
              <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-sm text-right">
                {HighligtCellsDats?.NucLoc_x ? (
                  <>
                    <span className="text-muted-foreground font-medium text-right">X:</span>
                    <span className="text-foreground">{HighligtCellsDats?.NucLoc_x} µm</span>
                    <span className="text-muted-foreground font-medium text-right">Y:</span>
                    <span className="text-foreground">{HighligtCellsDats?.NucLoc_y} µm</span>
                    <span className="text-muted-foreground font-medium text-right">Z:</span>
                    <span className="text-foreground">{HighligtCellsDats?.NucLoc_z} µm</span>
                  </>
                ) : (
                  <span className="col-span-2 text-foreground font-medium text-right">
                    During cytokinesis
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-between items-start gap-3">
              <span className="text-muted-foreground text-sm font-medium min-w-fit">
                Axis length:
              </span>
              <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-sm text-right">
                <span className="text-muted-foreground font-medium text-right">A:</span>
                <span className="text-foreground">
                  {HighligtCellsDats.Axis_a && HighligtCellsDats.Axis_a.toFixed(2)} µm
                </span>
                <span className="text-muted-foreground font-medium text-right">B:</span>
                <span className="text-foreground">
                  {HighligtCellsDats.Axis_b && HighligtCellsDats.Axis_b.toFixed(2)} µm
                </span>
                <span className="text-muted-foreground font-medium text-right">C:</span>
                <span className="text-foreground">
                  {HighligtCellsDats.Axis_c && HighligtCellsDats.Axis_c.toFixed(2)} µm
                </span>
              </div>
            </div>
          </div>

          {/* Separator */}
          <div className="h-px bg-border/30 my-1" />

          {/* Morphology descriptors */}
          <div className="pt-1">
            <p className="text-muted-foreground text-xs font-medium mb-1.5 tracking-wide">
              Morphology features
            </p>
            {Object.keys(Shapefac).map((metric) => (
              <div key={'shape' + metric} className="flex justify-between items-start gap-3">
                <span className="text-muted-foreground text-sm font-medium min-w-fit">
                  {Shapefac[metric]}:
                </span>
                <span className="text-foreground text-sm text-right">
                  {HighligtCellsDats[metric] && HighligtCellsDats[metric].toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Separator */}
          <div className="h-px bg-border/30 my-1" />

          {/* Contacted cells */}
          <div className="pt-1">
            <p className="text-muted-foreground text-xs font-medium mb-1.5 uppercase tracking-wide">
              Contacted Cells
            </p>
            <div className="flex flex-wrap gap-1.5">
              {HighligtCellsDats?.Contacted_cells?.split('|').map((cell, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-md border border-primary/20 hover:bg-primary/15 transition-colors"
                >
                  {cell.trim()}
                </span>
              ))}
            </div>
          </div>
        </ScrollArea>

        {/* Fixed footer with download button */}
        <div className="px-4 pb-3 pt-2 flex-shrink-0 border-t border-border/30">
          <Button
            onClick={() => {
              if (!SM || !TP) {
                alert("Please select a sample and time point");
                return;
              }
              window.location.href = `${API_BASE}/Model/SingleCellOBJFile?SM=${SM}&TP=${TP}&CellName=${CellName}`;
            }}
            className="w-full"
            variant="secondary"
          >
            <Download className="mr-2 h-4 w-4" />
            Download Cell Model (.obj)
          </Button>
        </div>

      </div>
    )
  );
}
