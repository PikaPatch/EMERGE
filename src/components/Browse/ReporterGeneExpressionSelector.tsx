import { useState, useMemo, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Check, Search, ChevronDown, Smartphone,Dna } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PaperList } from '@/components/utils/usefulobject'
import { API_BASE } from "@/components/utils/API_BASE";


interface GeneExpressionSelectorProps {
  SM: string;
  Gene: string;
  setGene: (value: string) => void;
  GID: string;
  setGID: (value: string) => void;
  BinaryScaling?: boolean;
  setBinaryScaling?: (value: boolean) => void;
}

interface ReporterGID {
  Gene: string;
  FusionType: string;
  min: number;
  max: number;
  ExpColName: string;
  PaperID:string;
  Replicates: number;
  Best: number;
}


export const GeneExpressionSelector = ({
  SM,
  Gene,
  setGene,
  GID,
  setGID,
}: GeneExpressionSelectorProps) => {
  const [openGeneSelect, setOpenGeneSelect] = useState(false);
  const [geneSearch, setGeneSearch] = useState("");
  const [ReporterGeneList, setReporterGeneList] = useState<string[]>(null);
  const [ReporterGIDList, setReporterGIDList] = useState<ReporterGID[]>(null);

  



  // Reset search when popover closes
  useEffect(() => {
    if (!openGeneSelect) {
      setGeneSearch("");
    }
  }, [openGeneSelect]);


  // Filter reporter genes based on search input
  const filteredGenes = useMemo(() => {
    const geneList = Array.isArray(ReporterGeneList) ?ReporterGeneList : [];
    
    if (!geneSearch.trim()) {
      return geneList.slice(0, 10); // Show first 10 when no search
    }
    const search = geneSearch.toLowerCase();
    return geneList.filter((g) =>
      g.toLowerCase().includes(search),
    ).slice(0, 10);
  }, [geneSearch, ReporterGeneList]);

  // load ExpMeta Gene list 
    useEffect(() => {
      if (!Smartphone) {
        return;
      }
      const fetchData = async () => {
        try {
          const url = `${API_BASE}/ExpMeta/GeneList`;
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const jsonData = await response.json();
          setReporterGeneList(jsonData);
        } catch (err) {
          setReporterGeneList(null);
        }
      };
  
      fetchData();
    }, [SM]);

    // load one gene meta data
    useEffect(() => {
      if (!SM || !Gene) {
        setReporterGIDList(null);
        return;
      }
      const fetchData = async () => {
        try {
          const url = `${API_BASE}/ExpMeta/OneGene?SM=${SM}&Gene=${Gene}`;
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const jsonData = await response.json();
          setReporterGIDList(jsonData);
        } catch (err) {
          setReporterGIDList(null);
        }
      };
      fetchData();
    }, [SM,Gene]);

    useEffect(() => {
      if (!ReporterGIDList || ReporterGIDList.length === 0) return;
      const bestGID = ReporterGIDList.reduce((max, item) => 
        item.Best > (max?.Best ?? -Infinity) ? item : max, null
      );
      setGID(bestGID ? bestGID.ExpColName : ReporterGIDList[0].ExpColName);
    }, [ReporterGIDList]);

  return (
    <div className="space-y-4">

      <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Gene</Label>
              {/* {ReporterGeneList && (
                <span className="text-xs text-muted-foreground">
                  {ReporterGeneList.length} genes available
                </span>
              )} */}
            </div>

            <Popover open={openGeneSelect} onOpenChange={setOpenGeneSelect}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openGeneSelect}
                  className="w-full justify-between"
                >
                  <span className={cn("truncate", !Gene && "text-muted-foreground")}>
                    {Gene ? <i>{Gene}</i> : "Select a gene..."}
                  </span>
                  {Gene ? (
                    <ChevronDown
                      className="ml-2 h-4 w-4 shrink-0 opacity-50 hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        setGene("");
                      }}
                    />
                  ) : (
                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[--radix-popover-trigger-width] p-0 z-[100]"
                align="start"
                sideOffset={4}
              >
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Type to search genes..."
                    value={geneSearch}
                    onValueChange={setGeneSearch}
                  />
                  <CommandList>
                    {filteredGenes.length === 0 ? (
                      <CommandEmpty>
                        {geneSearch
                          ? `No genes matching "${geneSearch}"`
                          : "No genes found"}
                      </CommandEmpty>
                    ) : (
                      <CommandGroup>
                        <ScrollArea className="h-[200px]">
                          {filteredGenes.map((g) => (
                            <CommandItem
                              key={g}
                              value={g}
                              onSelect={() => {
                                setGene(g);
                                setOpenGeneSelect(false);
                              }}
                              className="cursor-pointer"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  Gene === g ? "opacity-100" : "opacity-0",
                                )}
                              />
                              <i>{g}</i>
                            </CommandItem>
                          ))}
                          {filteredGenes.length === 10 && (
                            <div className="py-2 px-3 text-xs text-muted-foreground text-center border-t">
                              Showing first 10 results. Type to narrow down.
                            </div>
                          )}
                        </ScrollArea>
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <Button className="w-full" variant="secondary" onClick={() => (window.location.href = `${API_BASE}/Download/MetaTable`)}>
                      <Dna className="mr-2 h-4 w-4" />
                      Gene list
                    </Button>
        
        {Gene && ReporterGIDList && (
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Dataset</Label>
              <RadioGroup
                value={GID}
                onValueChange={setGID}
                className="gap-1"
              >
                {ReporterGIDList.map((gdata, idx) => (
                  <label
                    key={gdata.ExpColName}
                    htmlFor={gdata.ExpColName}
                    className={`flex items-start gap-1.5 px-2 py-1 rounded border cursor-pointer transition-all text-[11px] leading-tight ${
                      GID === gdata.ExpColName
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    }`}
                  >
                    <RadioGroupItem
                      value={gdata.ExpColName}
                      id={gdata.ExpColName}
                      className="shrink-0 h-3 w-3 mt-0.5"
                    />
                    <div className="flex-1 min-w-0 flex flex-col gap-0.5 w-full">
                      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 w-full min-w-0">
                        <span className="font-medium flex-shrink-0">#{idx + 1}</span>
                        <span className="text-muted-foreground">TP {gdata.min}-{gdata.max}</span>
                        <span className="text-muted-foreground">|</span>
                        <span className="text-muted-foreground">{gdata.FusionType} fusion</span>
                        <span className="text-muted-foreground">|</span>
                        <span className="text-muted-foreground">{gdata.Replicates === 1 ? "1 sample" : `Averaged over ${gdata.Replicates} samples`}</span>
                      </div>
                      {gdata.PaperID && (
                        <span className="text-primary break-all text-[10px] w-full block min-w-0 leading-tight">
                          Source: {PaperList[gdata.PaperID].DOI}
                        </span>
                      )}
                    </div>
                  </label>
                ))}
              </RadioGroup>
            </div>
          )}
    </div>
  );
};
