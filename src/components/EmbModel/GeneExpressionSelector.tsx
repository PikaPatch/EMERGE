import { useState, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Check, Search, ChevronDown, Dna } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PaperList } from '@/components/utils/usefulobject'
import { ColorGradientBar } from "@/components/LineageTree/LegendBar";
//import { ColorGradientBarShape } from "@/components/utils/LegendBarShape";
import { API_BASE } from "@/components/utils/API_BASE";

interface GeneExpressionSelectorProps {
  SM: string;
  ExpressionType: "Reporters" | "SingleCell";
  setExpressionType: (value: "Reporters" | "SingleCell") => void;
  Gene: string;
  setGene: (value: string) => void;
  Gene2?: string;
  setGene2?: (value: string) => void;
  GID: string;
  GID2?: string;
  setGID: (value: string) => void;
  setGID2?: (value: string) => void;
  DualExp?: boolean;
  scDualExp?: boolean;
  ScGene: string;
  setScGene: (value: string) => void;
  ScGene2?: string;
  setScGene2?: (value: string) => void;
  setGene1N2?: (value: [string,string]) => void;
  showLegend?: boolean;
}

interface ReporterGID {
  Gene: string;
  FusionType: string;
  PaperID: string;
  ExpColName: string;
  min: number;
  max: number;
  Best: number;
}

export const GeneExpressionSelector = ({
  SM,
  ExpressionType,
  setExpressionType,
  Gene,
  setGene,
  Gene2,
  setGene2,
  GID,
  GID2,
  setGID,
  setGID2,
  DualExp,
  scDualExp,
  ScGene,
  setScGene,
  ScGene2,
  setScGene2,
  setGene1N2,
  showLegend = false,
}: GeneExpressionSelectorProps) => {
  const [openGeneSelect, setOpenGeneSelect] = useState(false);
  const [geneSearch, setGeneSearch] = useState("");
  const [openGene2Select, setOpenGene2Select] = useState(false);
  const [gene2Search, setGene2Search] = useState("");
  const [openScGeneSelect, setOpenScGeneSelect] = useState(false);
  const [scGeneSearch, setScGeneSearch] = useState("");

  // ── NEW: ScGene2 popover + search state ──────────────────────────────────
  const [openScGene2Select, setOpenScGene2Select] = useState(false);
  const [scGene2Search, setScGene2Search] = useState("");
  // ─────────────────────────────────────────────────────────────────────────

  const [ReporterGeneList, setReporterGeneList] = useState<string[]>(null);
  const [ReporterGIDList, setReporterGIDList] = useState<ReporterGID[]>(null);
  const [ReporterGID2List, setReporterGID2List] = useState<ReporterGID[]>(null);

  const [ScGeneList, setScGeneList] = useState<string[]>([]);

  // Reset search when popovers close
  useEffect(() => {
    if (!openGeneSelect) setGeneSearch("");
  }, [openGeneSelect]);

  useEffect(() => {
    if (!openGene2Select) setGene2Search("");
  }, [openGene2Select]);

  useEffect(() => {
    if (!openScGeneSelect) setScGeneSearch("");
  }, [openScGeneSelect]);

  // ── NEW: reset ScGene2 search when its popover closes ────────────────────
  useEffect(() => {
    if (!openScGene2Select) setScGene2Search("");
  }, [openScGene2Select]);
  // ─────────────────────────────────────────────────────────────────────────

  // Filter reporter genes
  const filteredGenes = useMemo(() => {
    const geneList = Array.isArray(ReporterGeneList) ? ReporterGeneList : [];
    if (!geneSearch.trim()) return geneList.slice(0, 10);
    const search = geneSearch.toLowerCase();
    return geneList.filter((g) => g.toLowerCase().includes(search)).slice(0, 10);
  }, [geneSearch, ReporterGeneList]);

  const filteredGenes2 = useMemo(() => {
    const geneList = Array.isArray(ReporterGeneList) ? ReporterGeneList : [];
    if (!gene2Search.trim()) return geneList.slice(0, 10);
    const search = gene2Search.toLowerCase();
    return geneList.filter((g) => g.toLowerCase().includes(search)).slice(0, 10);
  }, [gene2Search, ReporterGeneList]);

  // Filter single-cell Gene1
  const filteredScGenes = useMemo(() => {
    if (!scGeneSearch.trim()) return ScGeneList.slice(0, 10);
    const search = scGeneSearch.toLowerCase();
    return ScGeneList.filter((gene) => gene.toLowerCase().includes(search)).slice(0, 10);
  }, [scGeneSearch, ScGeneList]);

  // ── NEW: filter single-cell Gene2 ────────────────────────────────────────
  const filteredScGenes2 = useMemo(() => {
    if (!scGene2Search.trim()) return ScGeneList.slice(0, 10);
    const search = scGene2Search.toLowerCase();
    return ScGeneList.filter((gene) => gene.toLowerCase().includes(search)).slice(0, 10);
  }, [scGene2Search, ScGeneList]);
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    setGene('')
    setGene2?.('')
    setGID('')
    setGID2?.('')
    setScGene('')
    setScGene2?.('')
  }, [ExpressionType]);


  // Load reporter gene list
  useEffect(() => {
    if (ExpressionType !== "Reporters") return;
    const fetchData = async () => {
      try {
        const url = `${API_BASE}/ExpMeta/GeneList`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const jsonData = await response.json();
        setReporterGeneList(jsonData);
      } catch {
        setReporterGeneList(null);
      }
    };
    fetchData();
  }, [ExpressionType]);

  // Load Gene1 meta
  useEffect(() => {
    if (ExpressionType !== "Reporters" || !Gene) {
      setReporterGIDList(null);
      return;
    }
    const fetchData = async () => {
      try {
        const url = `${API_BASE}/ExpMeta/OneGene?SM=${SM}&Gene=${Gene}`;
        console.log(url)
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const jsonData = await response.json();
        setReporterGIDList(jsonData);
      } catch {
        setReporterGIDList(null);
      }
    };
    fetchData();
  }, [SM, ExpressionType, Gene]);

  // Load Gene2 meta
  useEffect(() => {
    if (ExpressionType !== "Reporters" || !Gene2) {
      setReporterGID2List(null);
      return;
    }
    const fetchData = async () => {
      try {
        const url = `${API_BASE}/ExpMeta/OneGene?SM=${SM}&Gene=${Gene2}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const jsonData = await response.json();
        setReporterGID2List(jsonData);
      } catch {
        setReporterGID2List(null);
      }
    };
    fetchData();
  }, [SM, ExpressionType, Gene2]);

  useEffect(() => {
    if (!ReporterGIDList || ReporterGIDList.length === 0) return;
    const bestGID = ReporterGIDList.reduce((max, item) => 
      item.Best > (max?.Best ?? -Infinity) ? item : max, null
    );
    setGID(bestGID ? bestGID.ExpColName : ReporterGIDList[0].ExpColName);
  }, [ReporterGIDList]);

  // Auto-set GID2
useEffect(() => {
    if (!ReporterGID2List || ReporterGID2List.length === 0) return;
    const bestGID2 = ReporterGID2List.reduce((max, item) =>
      item.Best > (max?.Best ?? -Infinity) ? item : max, null
    );
    setGID2(bestGID2 ? bestGID2.ExpColName : ReporterGID2List[0].ExpColName);
  }, [ReporterGID2List]);

  // Load SingleCell gene list
  useEffect(() => {
    if (ExpressionType !== "SingleCell") {return;}
    const fetchData = async () => {
      try {
        const url = `${API_BASE}/scExp/GeneListFast`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const jsonData = await response.json();
        setScGeneList(jsonData);
      } catch (err) {
        console.error("Failed to load gene list:", err);
        setScGeneList([]);
      }
    };
    fetchData();
  }, [ExpressionType]);

  useEffect(() => {
    if(Gene){
      setGene1N2?.([Gene,Gene2])
      return
    }
    if(ScGene){
      setGene1N2?.([ScGene,ScGene2])
      return
    }
    setGene1N2?.(['',''])
  },[Gene,Gene2,ScGene,ScGene2])

  return (
    <div className="space-y-4">
      {/* Expression Type Selector */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Measurement methodology</Label>
        <Select
          value={ExpressionType}
          onValueChange={(value: any) => setExpressionType(value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select expression type" />
          </SelectTrigger>
          <SelectContent className="z-[100]">
            <SelectItem value="Reporters">Fluorescence-based</SelectItem>
            <SelectItem value="SingleCell">Sequencing-based</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reporters Mode */}
      {ExpressionType === "Reporters" && (
        <>
          {/* Gene1 Combobox */}
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
                      onClick={(e) => { e.stopPropagation(); setGene(""); }}
                    />
                  ) : (
                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-[100]" align="start" sideOffset={4}>
                <Command shouldFilter={false}>
                  <CommandInput placeholder="Type to search genes..." value={geneSearch} onValueChange={setGeneSearch} />
                  <CommandList>
                    {filteredGenes.length === 0 ? (
                      <CommandEmpty>{geneSearch ? `No genes matching "${geneSearch}"` : "No genes found"}</CommandEmpty>
                    ) : (
                      <CommandGroup>
                        <ScrollArea className="h-[200px]">
                          {filteredGenes.map((g) => (
                            <CommandItem key={g} value={g} onSelect={() => { setGene(g); setOpenGeneSelect(false); }} className="cursor-pointer">
                              <Check className={cn("mr-2 h-4 w-4", Gene === g ? "opacity-100" : "opacity-0")} />
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

          {/* Dataset for Gene1 */}
          {Gene && ReporterGIDList && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Dataset</Label>
              <RadioGroup value={GID} onValueChange={setGID} className="gap-1.5">
                {ReporterGIDList.map((gdata, idx) => (
                  <label
                    key={gdata.ExpColName}
                    htmlFor={gdata.ExpColName}
                    className={`flex items-center gap-2 px-2.5 py-2 rounded-md border cursor-pointer transition-all text-xs ${
                      GID === gdata.ExpColName ? "border-primary bg-primary/10" : "border-border hover:border-primary/50 hover:bg-muted/50"
                    }`}
                  >
                    <RadioGroupItem value={gdata.ExpColName} id={gdata.ExpColName} className="shrink-0 h-3.5 w-3.5" />
                    <div className="flex-1 min-w-0 flex flex-col gap-1 w-full">
                      <div className="flex items-center justify-between gap-2 w-full min-w-0">
                        <span className="font-medium flex-shrink-0">#{idx + 1}</span>
                        <span className="text-muted-foreground truncate flex-1 min-w-0">TP {gdata.min}-{gdata.max}</span>
                        <span className="text-muted-foreground truncate flex-shrink-0">{gdata.FusionType}</span>
                      </div>
                      {gdata.PaperID && (
                        <span className="text-primary break-all text-xs w-full block min-w-0">
                          Source: {PaperList[gdata.PaperID].DOI}
                        </span>
                      )}
                    </div>
                  </label>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Gene2 Combobox */}
          {DualExp && Gene && GID && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Gene2</Label>
                  <div className="flex items-center gap-2">
                    {ReporterGeneList && (
                      <span className="text-xs text-muted-foreground">{ReporterGeneList.length} genes available</span>
                    )}
                    {Gene2 && (
                      <Button variant="ghost" size="sm" className="h-5 px-1.5 text-xs" onClick={() => { setGene2(""); setGID2(""); }}>
                        ✕ Clear
                      </Button>
                    )}
                  </div>
                </div>
                <Popover open={openGene2Select} onOpenChange={setOpenGene2Select}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={openGene2Select} className="w-full justify-between">
                      <span className={cn("truncate", !Gene2 && "text-muted-foreground")}>
                        <i>{Gene2 || "Select a gene..."}</i>
                      </span>
                      {Gene2 ? (
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50 hover:opacity-100" onClick={(e) => { e.stopPropagation(); setGene2(""); }} />
                      ) : (
                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-[100]" align="start" sideOffset={4}>
                    <Command shouldFilter={false}>
                      <CommandInput placeholder="Type to search genes..." value={gene2Search} onValueChange={setGene2Search} />
                      <CommandList>
                        {filteredGenes2.length === 0 ? (
                          <CommandEmpty>{gene2Search ? `No genes matching "${gene2Search}"` : "No genes found"}</CommandEmpty>
                        ) : (
                          <CommandGroup>
                            <ScrollArea className="h-[200px]">
                              {filteredGenes2.map((g) => (
                                <CommandItem key={g} value={g} onSelect={() => { setGene2(g); setOpenGene2Select(false); }} className="cursor-pointer">
                                  <Check className={cn("mr-2 h-4 w-4", Gene2 === g ? "opacity-100" : "opacity-0")} />
                                  <i>{g}</i>
                                </CommandItem>
                              ))}
                              {filteredGenes2.length === 10 && (
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

              {/* Dataset for Gene2 */}
              {Gene2 && ReporterGID2List && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Dataset</Label>
                  <RadioGroup value={GID2} onValueChange={setGID2} className="gap-1.5">
                    {ReporterGID2List.map((gdata, idx) => (
                      <label
                        key={gdata.ExpColName}
                        htmlFor={`gene2-${gdata.ExpColName}`}
                        className={`flex items-center gap-2 px-2.5 py-2 rounded-md border cursor-pointer transition-all text-xs ${
                          GID2 === gdata.ExpColName ? "border-primary bg-primary/10" : "border-border hover:border-primary/50 hover:bg-muted/50"
                        }`}
                      >
                        <RadioGroupItem value={gdata.ExpColName} id={`gene2-${gdata.ExpColName}`} className="shrink-0 h-3.5 w-3.5" />
                        <div className="flex-1 min-w-0 flex flex-col gap-1 w-full">
                          <div className="flex items-center justify-between gap-2 w-full min-w-0">
                            <span className="font-medium flex-shrink-0">#{idx + 1}</span>
                            <span className="text-muted-foreground truncate flex-1 min-w-0">TP {gdata.min}-{gdata.max}</span>
                            <span className="text-muted-foreground truncate flex-shrink-0">{gdata.FusionType}</span>
                          </div>
                          {gdata.PaperID && (
                            <span className="text-primary break-words text-xs w-full block min-w-0">Source: {PaperList[gdata.PaperID].SourceName}</span>
                          )}
                        </div>
                      </label>
                    ))}
                  </RadioGroup>
                </div>
              )}
            </>
          )}
        </>
      )}

      {ExpressionType === "Reporters" && showLegend && Gene && GID && !Gene2 && !GID2 && <ColorGradientBar Type="Exp"/>}
      {Gene && GID && Gene2 && GID2 && (
        <div>
          <p className="font-medium mb-1 text-primary">Color Legend:</p>
          <p>(expression {'>'} 0)</p>
          <p><span style={{ color: "blue" }}>&#9632;</span> <i>{Gene}</i></p>
          <p><span style={{ color: "red" }}>&#9632;</span> <i>{Gene2}</i></p>
          <p><span style={{ color: "purple" }}>&#9632;</span> <i>{Gene}</i> & <i>{Gene2}</i></p>
          <p><span style={{ color: "grey" }}>&#9632;</span> No Expression</p>
        </div>
      )}

      {/* Single Cell Mode */}
      {ExpressionType === "SingleCell" && (
        <div className="space-y-4 p-3 rounded-lg border border-border bg-muted/30">

              {/* ScGene1 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Gene</Label>
                  {ScGeneList.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {ScGeneList.length.toLocaleString()} genes available
                    </span>
                  )}
                </div>

                {ScGeneList.length === 0 ? (
                  <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
                    Loading gene list...
                  </div>
                ) : (
                  <Popover open={openScGeneSelect} onOpenChange={setOpenScGeneSelect}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={openScGeneSelect} className="w-full justify-between bg-background">
                        <span className={cn("truncate", !ScGene && "text-muted-foreground")}>
                          <i>{ScGene || "Select a gene..."}</i>
                        </span>
                        {ScGene ? (
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50 hover:opacity-100" onClick={(e) => { e.stopPropagation(); setScGene(""); }} />
                        ) : (
                          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-[100]" align="start" sideOffset={4}>
                      <Command shouldFilter={false}>
                        <CommandInput placeholder="Type to search genes..." value={scGeneSearch} onValueChange={setScGeneSearch} />
                        <CommandList>
                          {filteredScGenes.length === 0 ? (
                            <CommandEmpty>{scGeneSearch ? `No genes matching "${scGeneSearch}"` : "No genes found"}</CommandEmpty>
                          ) : (
                            <CommandGroup>
                              <ScrollArea className="h-[200px]">
                                {filteredScGenes.map((gene) => (
                                  <CommandItem key={gene} value={gene} onSelect={() => { setScGene(gene); setOpenScGeneSelect(false); }} className="cursor-pointer">
                                    <Check className={cn("mr-2 h-4 w-4", ScGene === gene ? "opacity-100" : "opacity-0")} />
                                    <i>{gene}</i>
                                  </CommandItem>
                                ))}
                                {filteredScGenes.length === 10 && (
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
                )}
              </div>

              {/* ScGene2 */}
              {scDualExp && ScGene && ScGeneList.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Gene2</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {ScGeneList.length.toLocaleString()} genes available
                      </span>
                      {ScGene2 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 px-1.5 text-xs"
                          onClick={() => setScGene2("")}
                        >
                          ✕ Clear
                        </Button>
                      )}
                    </div>
                  </div>

                  <Popover open={openScGene2Select} onOpenChange={setOpenScGene2Select}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={openScGene2Select} className="w-full justify-between bg-background">
                        <span className={cn("truncate", !ScGene2 && "text-muted-foreground")}>
                          <i>{ScGene2 || "Select a gene..."}</i>
                        </span>
                        {ScGene2 ? (
                          <ChevronDown
                            className="ml-2 h-4 w-4 shrink-0 opacity-50 hover:opacity-100"
                            onClick={(e) => { e.stopPropagation(); setScGene2(""); }}
                          />
                        ) : (
                          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-[100]" align="start" sideOffset={4}>
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder="Type to search genes..."
                          value={scGene2Search}
                          onValueChange={setScGene2Search}
                        />
                        <CommandList>
                          {filteredScGenes2.length === 0 ? (
                            <CommandEmpty>
                              {scGene2Search ? `No genes matching "${scGene2Search}"` : "No genes found"}
                            </CommandEmpty>
                          ) : (
                            <CommandGroup>
                              <ScrollArea className="h-[200px]">
                                {filteredScGenes2.map((gene) => (
                                  <CommandItem
                                    key={gene}
                                    value={gene}
                                    onSelect={() => { setScGene2(gene); setOpenScGene2Select(false); }}
                                    className="cursor-pointer"
                                  >
                                    <Check className={cn("mr-2 h-4 w-4", ScGene2 === gene ? "opacity-100" : "opacity-0")} />
                                    <i>{gene}</i>
                                  </CommandItem>
                                ))}
                                {filteredScGenes2.length === 10 && (
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
              )}
              {/* ───────────────────────────────────────────────────────── */}

              {/* Color legend / gradient bar */}
              {showLegend && ScGene && !ScGene2 && <ColorGradientBar Type='Exp' />}
              {showLegend && ScGene && ScGene2 && (
                <div>
                  <p className="font-medium mb-1 text-primary">Color Legend:</p>
                  <p>(expression {'>'} 0)</p>
                  <p><span style={{ color: "blue" }}>&#9632;</span> <i>{ScGene}</i></p>
                  <p><span style={{ color: "red" }}>&#9632;</span> <i>{ScGene2}</i></p>
                  <p><span style={{ color: "purple" }}>&#9632;</span> <i>{ScGene}</i> & <i>{ScGene2}</i></p>
                  <p><span style={{ color: "grey" }}>&#9632;</span> No Expression</p>
                </div>
              )}
        </div>
      )}
    </div>
  );
};