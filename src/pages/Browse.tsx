import { useState, useEffect, useMemo, useRef } from "react";
import { Navigation } from "@/components/Navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, TrendingUp, Dna, Shapes, ChevronsUpDown, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CellDataChart } from "@/components/Browse/LineChart";
import { MLineChart } from "@/components/Browse/MLineChart";
import { OneCellCard } from "@/components/Browse/OneCellCard";
import { SMSelect } from "@/components/utils/SMSelect";
import { GeneExpressionSelector } from "@/components/Browse/ReporterGeneExpressionSelector";
import { GeneExpressionHeatmap } from "@/components/Browse/GeneExpressionHeatmap";
import { GeneExpressionHeatmap2 } from "@/components/Browse/GeneExpressionHeatmap2";
import { Shapefac,SampleHasExp } from "@/components/utils/usefulobject";
import { API_BASE } from "@/components/utils/API_BASE";

interface CellData {
  CellID: string;
  Fate: string;
  Range: [number, number];
  AllConCells: string[];
}

const Browse = () => {
  const [SM, setSM] = useState<string>("Sample6");
  const [CellName, setCellName] = useState("");
  const [CellData, setCellData] = useState<CellData>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [AllCellList, setAllCellList] = useState<string[] | null>(null);
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [Gene, setGene] = useState<string>("");
  const [GID, setGID] = useState<string>("");
  const [Fac, setFac] = useState<keyof typeof Shapefac | null>(null);

  const [LineList, setLineList] = useState<string[]>([]);
  const [MLineList, setMLineList] = useState<string[]>([]);


  const SAMPLE_GROUPS: { label: string; samples: string[] }[] = [
  { label: "Natural", samples: ["Sample1","Sample2","Sample3","Sample4","Sample5","Sample6","Sample7","Sample8"] },
  { label: "Natural (fast imaging)", samples: ["Sample9","Sample10"] },
  { label: "Mechanically-compressed", samples: ["Sample11","Sample12","Sample13","Sample14","Sample15","Sample16","Sample17","Sample18","Sample19","Sample20","Sample21","Sample22","Sample23","Sample24","Sample25","Sample26","Sample27"] },
  { label: "Mechanically-compressed (fast imaging)", samples: ["Sample28","Sample29","Sample30","Sample31"] },
  { label: "Notch-signaling-blocked", samples: ["Sample32","Sample33"] },
  { label: "Wnt-signaling-blocked", samples: ["Sample34","Sample35"] },
  { label: "Cell-division-accelerated", samples: ["Sample36","Sample37"] },
];

const MAX_SELECT = 17;

  const filteredCells = useMemo(() => {
    if (!AllCellList || !inputValue) return AllCellList || [];
    const lowerInput = inputValue.toLowerCase();
    return AllCellList.filter((cell) =>
      cell.toLowerCase().includes(lowerInput)
    ).slice(0, 50);
  }, [AllCellList, inputValue]);

  // const handleSearch = () => {
  //   if (!inputValue.trim()) { setError("Please enter a cell name"); return; }
  //   setError(null);
  //   setCellName(inputValue.trim());
  //   setOpen(false);
  // };

  const handleSearch = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      setError("Please enter a cell name");
      return;
    }
    if (!AllCellList || !AllCellList.includes(trimmed)) {
      setError(`Cell "${trimmed}" is not available.`);
      setCellName("");
      setCellData(null);
      setOpen(false);
      return;
    }
    setError(null);
    setCellName(trimmed);
    setOpen(false);
  };

  const EmptyBox = (_newSM) => {
    setCellName(""); setCellData(null); setInputValue("");
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const url = `${API_BASE}/CellDats/EmbCellList?SM=${SM}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const jsonData = await response.json();
        setAllCellList(jsonData);
      } catch (err) {
        setAllCellList(null);
        console.error("Error fetching AllCellList:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [SM]);

  useEffect(() => {
    if (!CellName) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const url = `${API_BASE}/CellDats/JuseCell?SM=${SM}&CellName=${CellName}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const jsonData = await response.json();
        setCellData(jsonData);
      } catch (err) {
        console.error("Error fetching cell data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [SM, CellName]);

  const showResults = CellName.length > 0 && !loading;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="w-full px-3 sm:px-6 py-3 sm:py-6">

        {/* ── Page Header ── */}
        <div className="mb-4 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shrink-0">
                  <Search className="w-6 h-6 text-primary-foreground" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                  Cell Morphology Browser
                </h1>
              </div>
              <p className="text-sm text-muted-foreground ml-[52px]">
                Search and analyze cell morphology, statistics, and gene expression data
              </p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-sm text-white/60 whitespace-nowrap">
              Experimental condition
            </span>
            <SMSelect SM={SM} setSM={setSM} setEmpty={EmptyBox} />
          </div>
          </div>
        </div>

        {/* ── Cell Query Card ── */}
        <Card className="mb-4 sm:mb-8">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search
            </CardTitle>
            <CardDescription>
              Enter a cell name (<em>e.g.</em> ABa, EMS, Eala) to retrieve 3D shape, morphology features,
              contacted cells, and gene expression profiles.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 sm:space-y-6">
            <div className="flex flex-col items-center gap-3 py-2 sm:py-4">
  {/* 👇 New wrapper: input + button side by side */}
  <div className="flex items-center gap-2 w-full max-w-xl">
    <div className="relative flex-1">
      <Input
        placeholder="Enter cell name"
        value={inputValue}
        onChange={(e) => { setInputValue(e.target.value); if (!open) setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
        className="h-11 pr-4 text-base"
      />
      {open && filteredCells.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-md border bg-popover shadow-md">
          <ScrollArea className="h-60 p-1">
            {filteredCells.map((cell) => (
              <div
                key={cell}
                className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                onMouseDown={(e) => { e.preventDefault(); setInputValue(cell); setOpen(false); }}
              >
                {cell}
              </div>
            ))}
          </ScrollArea>
        </div>
      )}
    </div>
    {/* 👇 Button now sits right of the input */}
    <Button onClick={handleSearch} size="lg" className="px-6 shrink-0">
      <Search className="h-4 w-4 mr-2" /> Search
    </Button>
  </div>

  {AllCellList && (
    <span className="text-xs text-muted-foreground">
      {AllCellList.length} cells available
    </span>
  )}
</div>
          </CardContent>
        </Card>

        {loading && <div className="text-center py-12">Loading...</div>}
        {error && (
          <Card className="border-destructive mb-4 sm:mb-6">
            <CardContent className="py-6">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {showResults && (
          <div className="space-y-4 sm:space-y-6">

            {/* ── 3D Viewer + Volume & Surface Charts ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-stretch">

              {CellName && (
                <OneCellCard
                  SM={SM}
                  CellName={CellName}
                  CellData={CellData}
                />
              )}

              {CellName && (
                <div className="flex flex-col gap-4 sm:gap-6">

                  {/* Volume & Surface charts */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Cell development trends
                      </CardTitle>
                      <CardDescription>
                        Volume and surface area of {CellName} across embryo samples.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Tabs defaultValue="volume">
                        <TabsList className="mb-4">
                          <TabsTrigger value="volume">Volume (µm³)</TabsTrigger>
                          <TabsTrigger value="surface">Surface area (µm²)</TabsTrigger>
                        </TabsList>

                        {/* Shared sample selector */}
                        <div className="flex flex-col gap-3 mb-4">
                          <label className="text-sm font-medium">
                            Select samples{" "}
                            <span className={`text-xs font-normal ${LineList.length >= MAX_SELECT ? "text-destructive" : "text-muted-foreground"}`}>
                              ({LineList.length}/{MAX_SELECT} selected)
                            </span>
                          </label>
                          <div className="flex flex-col gap-3">
                            {SAMPLE_GROUPS.map((group) => {
                              const allChecked = group.samples.every((s) => LineList.includes(s));
                              return (
                                <div key={group.label} className="flex flex-col gap-1.5">
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      id={`group-${group.label}`}
                                      checked={allChecked}
                                      disabled={!CellName || (!allChecked && LineList.length >= MAX_SELECT)}
                                      onCheckedChange={(checked) => {
                                        setLineList((prev) => {
                                          if (checked) {
                                            const toAdd = group.samples.filter((s) => !prev.includes(s));
                                            const slots = MAX_SELECT - prev.length;
                                            return [...new Set([...prev, ...toAdd.slice(0, slots)])];
                                          }
                                          return prev.filter((s) => !group.samples.includes(s));
                                        });
                                      }}
                                    />
                                    <label
                                      htmlFor={`group-${group.label}`}
                                      className="text-sm font-semibold cursor-pointer"
                                    >
                                      {group.label}
                                    </label>
                                  </div>
                                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 pl-6">
                                    {group.samples.map((sample) => (
                                      <div key={sample} className="flex items-center gap-1.5">
                                        <Checkbox
                                          id={`vol-surf-${sample}`}
                                          checked={LineList.includes(sample)}
                                          disabled={!CellName || (!LineList.includes(sample) && LineList.length >= MAX_SELECT)}
                                          onCheckedChange={(checked) => {
                                            setLineList((prev) =>
                                              checked
                                                ? [...prev, sample]
                                                : prev.filter((s) => s !== sample)
                                            );
                                          }}
                                        />
                                        <label htmlFor={`vol-surf-${sample}`} className="text-sm cursor-pointer">
                                          {sample}
                                        </label>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <TabsContent value="volume">
                          {LineList.length > 0 ? (
                            <CellDataChart LineList={LineList} CellName={CellName} DataName="Volume" />
                          ) : (
                            <div className="w-full py-12 flex items-center justify-center bg-muted/50 rounded-lg border border-dashed">
                              <p className="text-muted-foreground">Select samples above to view the analysis</p>
                            </div>
                          )}
                        </TabsContent>

                        <TabsContent value="surface">
                          {LineList.length > 0 ? (
                            <CellDataChart LineList={LineList} CellName={CellName} DataName="Surface" />
                          ) : (
                            <div className="w-full py-12 flex items-center justify-center bg-muted/50 rounded-lg border border-dashed">
                              <p className="text-muted-foreground">Select samples above to view the analysis</p>
                            </div>
                          )}
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>


                </div>
              )}
            </div>

            {/* ── Shape Factor / Morphology Descriptor ── */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shapes className="h-5 w-5" />
                  Morphology features
                </CardTitle>
                <CardDescription>
                  Analyze different morphology features of {CellName} across developmental stages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col lg:flex-row gap-6">

                  {/* Left column: feature selector + sample selector */}
                  <div className="flex flex-col gap-4 lg:w-80 lg:flex-shrink-0">

                    {/* Feature selector */}
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium">Select morphology feature</label>
                      <Select
                        value={Fac || ""}
                        onValueChange={(value) => setFac(value as keyof typeof Shapefac)}
                      >
                        <SelectTrigger className="w-72">
                          <SelectValue placeholder="Select a feature" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(Shapefac).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Sample selector — compact dropdown */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-1.5">
                        <label className="text-sm font-medium">Select samples</label>
                        <span className={`text-xs ${MLineList.length >= MAX_SELECT ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                          {MLineList.length}/{MAX_SELECT} selected
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
                            {MLineList.length === 0
                              ? "Select samples…"
                              : `${MLineList.length} sample${MLineList.length > 1 ? "s" : ""} selected`}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72 p-2" align="start">
                          <div className="flex items-center justify-between mb-2 px-1">
                            <span className="text-xs text-muted-foreground">
                              {MLineList.length}/{MAX_SELECT} selected
                            </span>
                            {MLineList.length > 0 && (
                              <button
                                onClick={() => setMLineList([])}
                                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                              >
                                <X className="h-3 w-3" /> Clear all
                              </button>
                            )}
                          </div>
                          <ScrollArea className="h-72">
  <div className="flex flex-col gap-2 pr-3">
                            {SAMPLE_GROUPS.map((group) => {
                              const allChecked = group.samples.every((s) => MLineList.includes(s));
                              return (
                                <div key={group.label}>
                                  <div className="flex items-center gap-2 px-1 py-0.5">
                                    <Checkbox
                                      id={`mfac-dd-group-${group.label}`}
                                      checked={allChecked}
                                      disabled={!allChecked && MLineList.length >= MAX_SELECT}
                                      onCheckedChange={(checked) => {
                                        setMLineList((prev) => {
                                          if (checked) {
                                            const toAdd = group.samples.filter((s) => !prev.includes(s));
                                            const slots = MAX_SELECT - prev.length;
                                            return [...new Set([...prev, ...toAdd.slice(0, slots)])];
                                          }
                                          return prev.filter((s) => !group.samples.includes(s));
                                        });
                                      }}
                                    />
                                    <label
                                      htmlFor={`mfac-dd-group-${group.label}`}
                                      className="text-xs font-semibold cursor-pointer leading-none"
                                    >
                                      {group.label}
                                    </label>
                                  </div>
                                  <div className="flex flex-wrap gap-x-3 gap-y-1 pl-6 pb-1">
                                    {group.samples.map((sample) => (
                                      <div key={sample} className="flex items-center gap-1">
                                        <Checkbox
                                          id={`mfac-dd-${sample}`}
                                          checked={MLineList.includes(sample)}
                                          disabled={!MLineList.includes(sample) && MLineList.length >= MAX_SELECT}
                                          onCheckedChange={(checked) => {
                                            setMLineList((prev) =>
                                              checked
                                                ? [...prev, sample]
                                                : prev.filter((s) => s !== sample)
                                            );
                                          }}
                                        />
                                        <label htmlFor={`mfac-dd-${sample}`} className="text-xs cursor-pointer">
                                          {sample}
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

                      {/* Selected sample badges */}
                      {MLineList.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {MLineList.map((sample) => (
                            <span
                              key={sample}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary border border-primary/20"
                            >
                              {sample}
                              <button
                                onClick={() => setMLineList((prev) => prev.filter((s) => s !== sample))}
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

                  {/* Right column: Chart */}
                  <div className="flex-1 min-w-0">
                    {Fac ? (
                      <div className="w-full h-full">
                        {MLineList.length > 0 ? (
                          <MLineChart MLineList={MLineList} CellName={CellName} DataName={Fac} />
                        ) : (
                          <div className="w-full py-12 flex items-center justify-center bg-muted/50 rounded-lg border border-dashed">
                            <p className="text-muted-foreground">Select samples above to view the analysis</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-full py-12 flex items-center justify-center bg-muted/50 rounded-lg border border-dashed">
                        <p className="text-muted-foreground">Select a morphology feature above to view the analysis</p>
                      </div>
                    )}
                  </div>

                </div>
              </CardContent>
            </Card>

            {/* ── Reporter Gene Expression Heatmap ── */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Dna className="h-5 w-5" />
                  Reporter gene expression profile
                </CardTitle>
                <CardDescription>
                  Fluorescence intensity for all reporter available across time points.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {CellName && SampleHasExp.includes(SM) ? (<GeneExpressionHeatmap2 SM={SM} CellName={CellName} />) : (
                  <div className="w-full h-full py-12 flex items-center justify-center bg-muted/50 border border-dashed">
                    <p className="text-muted-foreground">No expression data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ── Single Reporter Heatmap ── */}
            {CellName && SampleHasExp.includes(SM) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Dna className="h-5 w-5" />
                    Single reporter expression heatmap
                  </CardTitle>
                  <CardDescription>
                    Fluorescence intensity of the <i>{Gene}</i> reporter in {CellName} (highlighted in red)
                    and its contacted cells (highlighted in yellow) across time points
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Gene selector stacks above chart on mobile, side-by-side on lg */}
                  <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
                    <div className="w-full lg:w-64 lg:flex-shrink-0">
                      <GeneExpressionSelector
                        SM={SM}
                        Gene={Gene}
                        setGene={setGene}
                        GID={GID}
                        setGID={setGID}
                      />
                    </div>
                    <div className="w-full min-w-0">
                      {GID ? (
                        <GeneExpressionHeatmap
                          SM={SM}
                          CellName={CellName}
                          ConCells={CellData.AllConCells}
                          Range={CellData.Range}
                          GID={GID}
                        />
                      ) : (
                        <div className="w-full h-48 sm:h-64 flex items-center justify-center bg-muted/50 rounded-lg border border-dashed">
                          <p className="text-muted-foreground text-sm text-center px-4">
                            Select a reporter gene on the left to display its expression heatmap for{" "}
                            {CellName} and contacted cells.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

          </div>
        )}
      </div>
    </div>
  );
};

export default Browse;
