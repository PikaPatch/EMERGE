import React from "react";
import { useState, useEffect } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { BadgeInfo } from "lucide-react";
import { FateName } from "@/components/utils/usefulobject";
import { API_BASE } from "@/components/utils/API_BASE";

type CellInfoProps = {
  SM: string;
  SMType: string;
  TP: number;
  CenterCell: string;
};

export const CellInfoCard: React.FC<CellInfoProps> = ({ SM, SMType, TP, CenterCell }) => {
  const [CenterCellDats, setCenterCellDats] = useState<any>(null);

  useEffect(() => {
    if (!CenterCell) { setCenterCellDats(null); return; }
    const fetchData = async () => {
      try {
        const url = `${API_BASE}/CellDats/Cell?SM=${SM}&SMType=${SMType}&CellName=${CenterCell}&TP=${TP}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const jsonData = await response.json();
        setCenterCellDats(jsonData);
      } catch (err) {
        setCenterCellDats(null);
      }
    };
    fetchData();
  }, [SM, TP, CenterCell]);

  return (
    <Card className="w-full h-full">
      <CardHeader className="pb-2 pt-3 px-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <BadgeInfo className="w-4 h-4 text-primary shrink-0" />
          Cell Information
          {CenterCell && (
            <span className="ml-1 text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">
              {CenterCell}
            </span>
          )}
        </h3>
      </CardHeader>

      {/* min-h matches the bar height (h-40 = 160px) + label rows + padding so the card never jumps */}
      <CardContent className="px-4 pb-3 pt-0 min-h-[13rem]">
        {CenterCell && CenterCellDats ? (
          <div className="flex flex-row gap-4 items-stretch h-full">

            {/* ── Left column: metadata tiles stacked vertically, full height ── */}
            <div className="flex flex-col gap-2 w-28 shrink-0">

              {/* Lifespan */}
              <div className="flex-1 bg-background border border-border/50 rounded-md px-3 py-2 flex flex-col justify-center">
                <p className="text-xs text-muted-foreground font-medium mb-0.5 whitespace-nowrap">Lifespan</p>
                <p className="text-xs font-mono text-primary">
                  {CenterCellDats.Range[0]}–{CenterCellDats.Range[1]}
                </p>
              </div>

              {/* Fate */}
              {!['Sample32','Sample33','Sample34','Sample35'].includes(SM) &&(<div className="flex-1 bg-background border border-border/50 rounded-md px-3 py-2 flex flex-col justify-center">
                <p className="text-xs text-muted-foreground font-medium mb-0.5">Cell fate</p>
                <p className="text-xs font-semibold text-foreground leading-tight">
                  {FateName[CenterCellDats.Fate] || "N/A"}
                </p>
              </div>)}
              

              {/* Surface Area */}
              <div className="flex-1 bg-background border border-border/50 rounded-md px-3 py-2 flex flex-col justify-center">
                <p className="text-xs text-muted-foreground font-medium mb-0.5 whitespace-nowrap">Surface area</p>
                <p className="text-xs font-semibold text-foreground leading-tight">
                  {CenterCellDats.Surface.toFixed(2)} µm²
                </p>
              </div>

            </div>

            {/* Vertical divider */}
            <div className="w-px self-stretch bg-border/50 shrink-0" />

            {/* ── Right column: Contacted cells bar chart with shadcn ScrollArea ── */}
            <div className="flex-1 min-w-0 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Contacted Cells
                </p>
                <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono">
                  {CenterCellDats.Contacted_cells.split("|").length}
                </span>
              </div>

              <ScrollArea className="flex-1 w-full">
                <div className="flex flex-row gap-2 pb-2 pr-1">
                  {(() => {
                    const cells = CenterCellDats.Contacted_cells.split("|");
                    const areas = CenterCellDats.Contacted_area.split("|").map(parseFloat);
                    const maxArea = Math.max(...areas, 1);

                    return cells.map((cellName: string, i: number) => {
                      const conArea = areas[i];
                      const percentage = (conArea / maxArea) * 100;
                      return (
                        <div
                          key={cellName}
                          className="flex flex-col items-center gap-1 shrink-0 w-14"
                        >
                          {/* Vertical bar */}
                          <div className="w-full h-40 bg-secondary rounded flex items-end overflow-hidden">
                            <div
                              className="w-full bg-primary/70 rounded transition-all duration-300"
                              style={{ height: `${percentage}%` }}
                            />
                          </div>
                          {/* Cell name */}
                          <span className="text-[10px] font-mono text-foreground text-center leading-tight truncate w-full">
                            {cellName}
                          </span>
                          {/* Area label */}
                          <span className="text-[9px] text-muted-foreground font-mono">
                            {conArea.toFixed(1)} µm²
                          </span>
                        </div>
                      );
                    });
                  })()}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>

            </div>

          </div>
        ) : (
          /* Empty state — vertically centered within the reserved height */
          <div className="flex items-center justify-center gap-2 h-full text-center">
            <BadgeInfo className="w-4 h-4 text-muted-foreground/50 shrink-0" />
            <p className="text-sm text-muted-foreground">
              Click on a cell in the network to see details
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CellInfoCard;
