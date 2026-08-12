import { useEffect,useState } from "react";
import {Shapefac} from '@/components/utils/usefulobject'
import { API_BASE } from "@/components/utils/API_BASE";

interface ParaProps {
  SM: string;
  TP: number;
  CellName: string; 
}

export const CellStatistics = ({
  SM,
  TP,
  CellName
}:ParaProps) => {
  const [HighligtCellsDats, setHighligtCellsDats] = useState<any>(null);
  
  // load HighligtCells data
  useEffect(() => {
    if (!SM || !TP || !CellName ) {
      return;
    }
    const fetchData = async () => {
      try {
        const DatsUrl = `${API_BASE}/CellDats/OneCell?SM=${SM}&CellName=${CellName}&TP=${TP}`;
        const response = await fetch(DatsUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const jsonData = await response.json();
        setHighligtCellsDats(jsonData);
      } catch (err) {
        console.error('Failed to load highlight cell data:', err);
        setHighligtCellsDats(null);
      }
    };
    fetchData();
  }, [SM, TP, CellName]);

  const contactedCells = HighligtCellsDats?.ConCells?.split('|') || [];

  return (
    <div className="bg-background border border-border rounded-lg shadow-sm overflow-hidden h-full">
        {/* Header */}
        <div className="bg-muted/50 border-b border-border px-3 py-2">
          <p className="font-semibold text-primary text-sm">
            Cell name: {CellName} | Time point: {HighligtCellsDats ? HighligtCellsDats.TP : '-'}
          </p>
        </div>

        {/* Content */}
        <div className="px-3 py-2 space-y-2 text-xs">
          {/* Basic metrics in compact grid */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Volume:</span>
              <span className="font-medium">{HighligtCellsDats ? HighligtCellsDats?.Vol.toFixed(1) : '-'} µm³</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Surface area:</span>
              <span className="font-medium">{HighligtCellsDats ? HighligtCellsDats?.Sur.toFixed(1) : '-'}  µm²</span>
            </div>
            {!['Sample32','Sample33','Sample34','Sample35'].includes(SM) && (<div className="flex justify-between col-span-2">
              <span className="text-muted-foreground">Fate:</span>
              <span className="font-medium">{HighligtCellsDats ? HighligtCellsDats?.Fate : '-'} </span>
            </div>) }
          </div>

          <div className="h-px bg-border" />

          {/* Shape factors compact */}
          <div>
            <p className="text-muted-foreground text-[10px] font-medium mb-1 uppercase tracking-wide">
              Morphology features
            </p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
              {Object.keys(Shapefac).map((metric) => (
                <div key={'shape' + metric} className="flex justify-between">
                  <span className="text-muted-foreground truncate">{Shapefac[metric]}:</span>
                  <span className="font-medium">{HighligtCellsDats?.Morphology?.[metric].toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* Contacted cells compact */}
          <div>
            <p className="text-muted-foreground text-[10px] font-medium mb-1 tracking-wide">
              Contacted cells ({contactedCells.length})
            </p>
            <div className="flex flex-wrap gap-1 max-h-16">
              {contactedCells.map((cell, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] font-medium rounded border border-primary/20"
                >
                  {cell.trim()}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
  );
}
