import { useState,useEffect,useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Box } from "lucide-react";
import { CellStatistics } from "@/components/Browse/CellStatistics";
import { OneCell } from "@/components/Browse/OneCell";
import { API_BASE } from "@/components/utils/API_BASE";
import {  } from "@/components/utils/usefulobject"

interface CellData {
  CellID: string;
  Fate: string;
  Range: [number, number];
  AllConCells: string[];
}
interface ParaProps {
  SM: string;
  CellName: string;
  CellData:CellData;
}

export const OneCellCard = ({ SM, CellName,CellData }: ParaProps) => {
  const [TP, setTP] = useState<number>(0);

  const CellRange = useMemo(() => {
      if (!CellData) return null;
      const [start, end] = CellData.Range;
      return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    }, [CellData]);

  return (
<Card className="flex flex-col h-full">  {/* ← h-full */}
  <CardHeader className="pb-3">
    <CardTitle className="flex items-center gap-2">
      <Box className="h-5 w-5" />
      3D cell viewer
    </CardTitle>
    <CardDescription>
      Interactive 3D view of{" "}
      <span className="font-semibold text-foreground">{CellName}</span>{" "}
      at different time points
    </CardDescription>
  </CardHeader>

  <CardContent className="flex flex-col flex-1 gap-4">  {/* ← flex-1 so it fills remaining card height */}

    {/* Top: Time point selector */}
    <div className="space-y-2">
      <p className="text-sm font-medium">
        Select time point: <span className="font-mono text-primary">{TP}</span>
      </p>
      <div className="flex flex-wrap gap-2 pb-3 border-b border-border">
        {CellData && CellRange && CellRange.map((t) => (
          <Button
            key={t}
            onClick={() => setTP(t)}
            variant={TP === t ? "default" : "outline"}
            size="sm"
          >
            TP {t}
          </Button>
        ))}
      </div>
    </div>

    {/* Middle: 3D model — grows to fill space */}
    <div className="h-full w-full rounded-lg overflow-hidden">
        <OneCell SM={SM} TP={TP} CellName={CellName} />
    </div>

    {/* Bottom: Statistics — pinned to bottom */}
    <div className="mt-auto">  {/* ← mt-auto */}
        <CellStatistics SM={SM} TP={TP} CellName={CellName} />
      </div>

  </CardContent>
</Card>
  );
};