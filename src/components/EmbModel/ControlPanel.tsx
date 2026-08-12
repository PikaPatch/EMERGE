import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Aperture,
  Maximize2,
  Eye,
  EyeOff,
  Atom,
  FileBox,
  Cog,
  FishSymbol,
  FilePieChart,
  Flower,
  FastForward,
  ArrowLeft,
  ArrowRight,
  Download,
  Rotate3D,
  PaintBucket,
  Glasses,
  Dna,
  Diamond,
  StarHalf,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CellMultiSelect } from "@/components/EmbModel/CellMultiSelect";
import { GeneExpressionSelector } from "@/components/EmbModel/GeneExpressionSelector";
import { LineageColor } from "@/config/LineageColor";
import { FateName, Shapefac, TimeResolution,SMList,SampleHasExp } from "@/components/utils/usefulobject";
import { API_BASE } from "@/components/utils/API_BASE";
import { ColorGradientBar } from "@/components/LineageTree/LegendBar";

interface CellData {
  CellName: string;
  ID: string;
  Fate: string;
}

interface ControlPanelProps {
  SM: string;
  TP: number;
  setTP: (value: number) => void;
  Resolution:"High" | "Low";
  setResolution:(r: "High" | "Low") => void;
  MonoFate: string;
  setMonoFate;
  MonoColor: string;
  setMonoColor: (value: string) => void;
  HighligtCells: string[];
  setHighligtCells;
  onResetCamera: () => void;
  onViewPreset: (preset: "Dorsal" | "Anterior" | "Right") => void;
  selectedCells: string[];
  onSelectedCellsChange: (cells: string[]) => void;
  GID: string;
  GID2: string;
  setGID: (value: string) => void;
  setGID2: (value: string) => void;
  setGene1N2: (g: [string,string]) => void;
  Fac: string;
  setFac: (value: string) => void;
  ShowLabel: boolean;
  setShowLabel: (value: boolean) => void;
  ExpressionType: "Reporters" | "SingleCell";
  setExpressionType: (value: "Reporters" | "SingleCell") => void;
  ScGene: string;
  setScGene: (value: string) => void;
  ScGene2: string;
  setScGene2: (value: string) => void;
  BinaryScaling: boolean;
  setBinaryScaling: (value: boolean) => void;
  ShapeDataRange: [number, number,number,number];
  onDownloadGLTF?: () => void;
  isSceneReady?: boolean;
  expressionCutoff: number;
  setExpressionCutoff: (value: number) => void;
  expressionEnabled: boolean;
  setExpressionEnabled: (value: boolean) => void;
  ShowNuclei: boolean;
  setShowNuclei: (value: boolean) => void;
}

// Reusable help tooltip button
const HelpTooltip = ({ children }: { children: React.ReactNode }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-muted cursor-help text-[10px] font-semibold text-muted-foreground hover:bg-primary/20 hover:text-primary transition-colors shrink-0"
          aria-label="Help"
        >
          ?
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" align="start" className="max-w-xs z-[9999]">
        {children}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export const ControlPanel = ({
  SM,
  Resolution,
  setResolution,
  MonoFate,
  setMonoFate,
  MonoColor,
  setMonoColor,
  HighligtCells,
  setHighligtCells,
  TP,
  setTP,
  onResetCamera,
  onViewPreset,
  GID,
  setGID,
  GID2,
  setGID2,
  setGene1N2,
  Fac,
  setFac,
  ShowLabel,
  setShowLabel,
  ExpressionType,
  setExpressionType,
  ScGene,
  setScGene,
  ScGene2,
  setScGene2,
  ShapeDataRange,
  onDownloadGLTF,
  isSceneReady,
  expressionCutoff,
  setExpressionCutoff,
  expressionEnabled,
  setExpressionEnabled,
  ShowNuclei,
  setShowNuclei
}: ControlPanelProps) => {
  const [Gene, setGene] = useState<string>("");
  const [Gene2, setGene2] = useState<string>("");
  const [CellNameID, setCellNameID] = useState({});
  const [TPRange, setTPRange] = useState<number>(0);
  const [CData, setCData] = useState<CellData[]>(null);
  const [activeFate, setActiveFate] = useState<string[]>([]);
  const [activeLin, setActiveLin] = useState<string[]>([]);
  const [LinCellInput, setLinCellInput] = useState<string>("");
  const [InputTP, setInputTP] = useState<number>(TP ?? 10);

  const Dual = useMemo<boolean>(() => {
      if ((Gene && Gene2) || (ScGene && ScGene2)) {
        return true;
      } else {
        return false;
      }
    }, [Gene,Gene2,ScGene,ScGene2]);

  

  const MonoColors = { Cyan: "#58D6FC", Red: "#FF6B6B", Green: "#4ECDC4" };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const url = `${API_BASE}/CellDats/TPRange?SM=${SM}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const jsonData = await response.json();
        const TPmax = jsonData.TPRange;
        setTPRange(TPmax);
        if (InputTP > TPmax) setInputTP(TPmax);
      } catch (err) {
        console.log("somethings wrong!!");
      }
    };
    fetchData();
  }, [SM]);

  useEffect(() => {
    setInputTP(TP);
  }, [TP]);


  useEffect(() => {
    const fetchData = async () => {
      try {
        const url = `${API_BASE}/CellDats/CellName2ID`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const jsonData = await response.json();
        setCellNameID(jsonData);
      } catch (err) {
        console.log("somethings wrong!!");
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!TP || !SM) {
      console.log("require TP or SM or SMType");
      return;
    }
    const fetchData = async () => {
      try {
        const url = `${API_BASE}/CellDats/EmbCD?SM=${SM}&TP=${TP}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const CData = await response.json();
        setCData(CData);
      } catch (err) {
        setCData([]);
      }
    };
    fetchData();
  }, [SM, TP]);

  const expressionCutoffEnabled = MonoFate === "expression" && !Dual;

    useEffect(() => {
      if (!expressionCutoffEnabled) {
        setExpressionCutoff(0);
        setExpressionEnabled(false);
      }
    }, [expressionCutoffEnabled]);

  useEffect(() => {
    if (GID) setScGene("");
    if (ScGene) setGID("");
  }, [GID, ScGene]);

  const { FateCells, LinCells, fates, lineage } = useMemo(() => {
    if (!CData || CData.length === 0) {
      return {
        FateCells: (Fate: string) => [] as string[],
        LinCells: (CellName: string) => [] as string[],
        fates: [] as string[],
        lineage: [] as string[],
      };
    }
    const FateCellsFn = (Fate: string) =>
      CData.filter((C) => Fate === C.Fate).map((C) => C.CellName);
    const LinCellsFn = (CellName: string) => {
      const ID = CellNameID[CellName];
      return CData.filter((C) => C.ID.includes(ID)).map((C) => C.CellName);
    };
    const fatesArray = Array.from(
      new Set(CData.map((v) => v?.Fate).filter(Boolean))
    ) as string[];
    const lineageArray =
      CData.length > 5
        ? Object.keys(LineageColor)
        : (Array.from(new Set(CData.map((v) => v?.CellName).filter(Boolean))) as string[]);
    return { FateCells: FateCellsFn, LinCells: LinCellsFn, fates: fatesArray, lineage: lineageArray };
  }, [CData, CellNameID, LineageColor]);

  return (
    <Card className="bg-card/95 backdrop-blur-sm border-border flex flex-col h-[calc(100vh-2rem)] min-h-0">
      {/* Header — always visible */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        <Cog className="w-5 h-5 text-primary shrink-0" />
        <h3 className="text-lg font-semibold text-foreground">Controls</h3>
      </div>

      {/* Scrollable body with fixed height on desktop, natural height on mobile */}
      <ScrollArea className="flex-1 min-h-0 px-4 pb-4">
        <Accordion type="multiple" defaultValue={["timepoint","visibility", "color"]} className="w-full">

          {/* ── RESOLUTION ── */}
          <AccordionItem value="resolution">
            <AccordionTrigger className="py-2 hover:no-underline">
              <span className="flex items-center gap-2 text-sm font-medium">
                <Aperture className="w-4 h-4 text-primary" />
                Resolution
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pb-3">
              <div className="flex items-center gap-2">
                <Label htmlFor="resolution-select" className="text-sm font-medium">
                  Model resolution
                </Label>
                <HelpTooltip>
                  <div className="space-y-2 text-xs">
                    <div>
                      <p className="font-semibold text-primary">High</p>
                      <p className="text-muted-foreground">
                        Full-resolution 3D geometry with finer surface detail. Slower to load.
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-primary">Low</p>
                      <p className="text-muted-foreground">
                        Simplified geometry for faster rendering and smoother interaction.
                      </p>
                    </div>
                  </div>
                </HelpTooltip>
              </div>

              <Select value={Resolution} onValueChange={(v) => setResolution(v as "High" | "Low")}>
                <SelectTrigger id="resolution-select" className="w-full">
                  <SelectValue placeholder="Select resolution" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                </SelectContent>
              </Select>
            </AccordionContent>
          </AccordionItem>

          {/* ── TIME POINT ── */}
          <AccordionItem value="timepoint">
            <AccordionTrigger className="py-2 hover:no-underline">
              <span className="flex items-center gap-2 text-sm font-medium">
                <FastForward className="w-4 h-4 text-primary" />
                Time point
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Label className="text-sm font-medium">
                  Time point (1 ~ {TPRange}):
                </Label>
                <HelpTooltip>
                  <div className="space-y-2 text-xs">
                    <p className="font-semibold text-primary">Select a time point</p>
                    <p className="text-muted-foreground">
                      A time point is a time unit for each sequential microscopic photograph
                      in a time-lapse series of embryonic development. This dataset (
                      <span className="text-primary">{SM}</span>) comprises{" "}
                      <span className="text-primary">{TPRange}</span> time points, with
                      consecutive frames captured at {TimeResolution[SM]}{SMList.NaturalF.includes(SM) || SMList.CompressF.includes(SM) ? 's' : ' min'} intervals.
                    </p>
                  </div>
                </HelpTooltip>
              </div>

              <Label className="text-sm font-medium block">
                Time resolution: {TimeResolution[SM]} {SMList.NaturalF.includes(SM) || SMList.CompressF.includes(SM) ? 's/TP' : ' min/TP'}
              </Label>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setInputTP(InputTP - 1)}
                  className="shrink-0"
                  title="Step back 1 TP"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" className="flex-1" disabled>
                  Current TP {TP}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setInputTP(InputTP + 1)}
                  className="shrink-0"
                  title="Step forward 1 TP"
                >
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex gap-2 items-center">
                <Slider
                  id="timepoint"
                  min={1}
                  max={TPRange}
                  step={1}
                  value={[InputTP]}
                  onValueChange={(value) => setInputTP(value[0])}
                  className="flex-1"
                />
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-medium text-muted-foreground w-8 text-right">
                    {InputTP}
                  </span>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => setTP(InputTP)}
                    className="shrink-0"
                  >
                    Go
                  </Button>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ── CAMERA ── */}
          <AccordionItem value="camera">
            <AccordionTrigger className="py-2 hover:no-underline">
              <span className="flex items-center gap-2 text-sm font-medium">
                <Rotate3D className="w-4 h-4 text-primary" />
                Camera
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pb-3">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">Camera angle</Label>
                <HelpTooltip>
                  <div className="space-y-2 text-xs">
                    <div>
                      <p className="font-semibold text-primary"><i>X, Y, Z</i></p>
                      <p className="text-muted-foreground">View the embryo from the dorsal (back) side</p>
                    </div>
                    <div>
                      <p className="font-semibold text-primary">Reset</p>
                      <p className="text-muted-foreground">View the embryo from the default, usually left-lateral side</p>
                    </div>
                  </div>
                </HelpTooltip>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Button variant="secondary" size="sm" onClick={() => onViewPreset("Dorsal")} className="text-xs"><i>Y</i></Button>
                <Button variant="secondary" size="sm" onClick={() => onViewPreset("Anterior")} className="text-xs"><i>X</i></Button>
                <Button variant="secondary" size="sm" onClick={() => onViewPreset("Right")} className="text-xs"><i>Z</i></Button>
              </div>

              <Button variant="secondary" className="w-full" onClick={onResetCamera}>
                <Maximize2 className="w-4 h-4 mr-2" />
                Reset to default view
              </Button>
            </AccordionContent>
          </AccordionItem>

          {/* ── COLOR MODE ── */}
          <AccordionItem value="color">
            <AccordionTrigger className="py-2 hover:no-underline">
              <span className="flex items-center gap-2 text-sm font-medium">
                <PaintBucket className="w-4 h-4 text-primary" />
                Object color
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pb-3">
              <div className="flex items-center gap-2">
                <Label htmlFor="color-preset" className="text-sm font-medium">Coloring mode</Label>
                <HelpTooltip>
                  <div className="space-y-2 text-xs">
                    <div><p className="font-semibold text-primary">Default</p><p className="text-muted-foreground">Show all cells in a single neutral color.</p></div>
                    <div><p className="font-semibold text-primary">Founder lineage</p><p className="text-muted-foreground">Color cells by 6 founder lineage.</p></div>
                    <div><p className="font-semibold text-primary">Cell fate</p><p className="text-muted-foreground">Color cells by terminal fate.</p></div>
                    <div><p className="font-semibold text-primary">Morphology feature</p><p className="text-muted-foreground">Color cells by morphology feature (sphericity, elongation, flatness, etc.) derived from 3D morphology.</p></div>
                    <div><p className="font-semibold text-primary">Gene expression</p><p className="text-muted-foreground">Color cells by gene expression level (requires gene selection).</p></div>
                  </div>
                </HelpTooltip>
              </div>

              <Select value={MonoFate} onValueChange={setMonoFate}>
                <SelectTrigger id="color-preset" className="w-full">
                  <SelectValue placeholder="Select color preset" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mono">Default</SelectItem>
                  <SelectItem value="lineage">Founder lineage</SelectItem>
                  <SelectItem value="fate"  disabled={['Sample32','Sample33','Sample34','Sample35'].includes(SM)}>Cell fate</SelectItem>
                  <SelectItem value="shape">Morphology feature</SelectItem>
                  <SelectItem value="expression" disabled={!SampleHasExp.includes(SM)}>Gene expression</SelectItem>
                </SelectContent>
              </Select>

              {MonoFate === "mono" && (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(MonoColors).map(([colorname, color]) => (
                    <Button
                      key={color}
                      variant={MonoColor === color ? "default" : "secondary"}
                      size="sm"
                      className="text-xs"
                      onClick={() => setMonoColor(color)}
                    >
                      {colorname}
                    </Button>
                  ))}
                </div>
              )}

              {MonoFate === "shape" && (
                <>
                  <Select value={Fac} onValueChange={setFac}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a feature" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto">
                      {Object.entries(Shapefac).map(([f, fname]) => (
                        <SelectItem key={f} value={f}>{fname}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {ShapeDataRange && <ColorGradientBar range={ShapeDataRange} Type="Shape" />}
                </>
              )}

              {MonoFate === "expression" && (
                <GeneExpressionSelector
                  SM={SM}
                  ExpressionType={ExpressionType}
                  setExpressionType={setExpressionType}
                  setGene1N2={setGene1N2}
                  Gene={Gene}
                  setGene={setGene}
                  Gene2={Gene2}
                  setGene2={setGene2}
                  GID={GID}
                  GID2={GID2}
                  setGID={setGID}
                  setGID2={setGID2}
                  DualExp={true}
                  scDualExp={true}
                  ScGene={ScGene}
                  setScGene={setScGene}
                  ScGene2={ScGene2}
                  setScGene2={setScGene2}
                  showLegend={false}
                />
              )}
            </AccordionContent>
          </AccordionItem>

          {/* ── VISIBILITY ── */}
          <AccordionItem value="visibility">
            <AccordionTrigger className="py-2 hover:no-underline">
              <span className="flex items-center gap-2 text-sm font-medium">
                <Eye className="w-4 h-4 text-primary" />
                Visibility
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-2 pb-3">
              {/* ── Cell count badge ── */}
              <div className="flex items-center justify-between rounded-md bg-muted/50 border border-border px-3 py-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-medium">Cell number</span>
                </div>
                <span className="text-sm font-semibold tabular-nums text-foreground">
                  {CData?.length != null ? (
                    CData.length
                  ) : (
                    <span className="text-muted-foreground italic text-xs">Loading…</span>
                  )}
                </span>
              </div>
              <Button
                onClick={() => {
                  setHighligtCells(["All"]);
                  setActiveFate([]);
                  setActiveLin([]);
                  setExpressionEnabled(false);
                }}
                className="w-full"
                variant="secondary"
              >
                <Eye className="mr-2 h-4 w-4" />
                Show all cells
              </Button>
              <Button
                onClick={() => {
                  setHighligtCells([]);
                  setActiveFate([]);
                  setActiveLin([]);
                }}
                className="w-full"
                variant="secondary"
              >
                <EyeOff className="mr-2 h-4 w-4" />
                Hide all cells
              </Button>

              {/* ── Show nuclei toggle ── */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor="show-nuclei"
                    className="text-sm font-medium flex items-center gap-2 cursor-pointer"
                  >
                    <Atom className="w-4 h-4" />
                    Show nuclei
                  </Label>
                  <HelpTooltip>
                    <div className="text-xs space-y-1">
                      <p className="font-semibold text-primary">Show nuclei</p>
                      <p className="text-muted-foreground">
                        Toggle visibility of cell nuclei in the embryo.
                      </p>
                    </div>
                  </HelpTooltip>
                </div>
                <Switch
                  id="show-nuclei"
                  checked={ShowNuclei}
                  onCheckedChange={setShowNuclei}
                />
              </div>
              
            </AccordionContent>
          </AccordionItem>

          {/* ── HIGHLIGHT BY FATE ── */}
          <AccordionItem value="fate">
            <AccordionTrigger className="py-2 hover:no-underline">
              <span className="flex items-center gap-2 text-sm font-medium">
                <Glasses className="w-4 h-4 text-primary" />
                Highlighting cell fate
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-3">
              <div className="flex flex-wrap gap-2 mt-1">
                {Object.keys(FateName)
                  .filter((fate) => fates.includes(fate))
                  .sort((a, b) => Object.keys(FateName).indexOf(a) - Object.keys(FateName).indexOf(b))
                  .map((fate) => (
                    <Button
                      key={fate}
                      variant={activeFate.includes(fate) ? "default" : "secondary"}
                      size="sm"
                      className="text-xs"
                      onClick={() => {
                        setActiveLin([]);
                        setLinCellInput("");
                        const updatedFates = activeFate.includes(fate)
                          ? activeFate.filter((f) => f !== fate)
                          : [...activeFate, fate];
                        const highlightedCells = updatedFates.flatMap((f) => FateCells(f));
                        setHighligtCells(highlightedCells);
                        setActiveFate(updatedFates);
                      }}
                    >
                      {FateName[fate]}
                    </Button>
                  ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ── HIGHLIGHT BY LINEAGE ── */}
          <AccordionItem value="lineage">
            <AccordionTrigger className="py-2 hover:no-underline">
              <span className="flex items-center gap-2 text-sm font-medium">
                <Glasses className="w-4 h-4 text-primary" />
                Highlighting founder lineage
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pb-3">
              {CData && Object.keys(CData).length > 5 ? (
                <>
                  <div className="flex flex-wrap gap-2">
                    {lineage.map((c) => (
                      <Button
                        key={c}
                        variant={activeLin.includes(c) ? "default" : "secondary"}
                        size="sm"
                        className="text-xs"
                        onClick={() => {
                          setActiveFate([]);
                          setLinCellInput("");
                          const updatedLins = activeLin.includes(c)
                            ? activeLin.filter((l) => l !== c)
                            : [...activeLin, c];
                          const highlightedCells = updatedLins.flatMap((l) => LinCells(l));
                          setHighligtCells(highlightedCells);
                          setActiveLin(updatedLins);
                        }}
                      >
                        {c}
                      </Button>
                    ))}
                  </div>

                  {/* Lineage search — fixed: removed max-w-xs, full width */}
                  <div className="flex gap-2 w-full items-center">
                    <Label className="text-sm font-medium shrink-0">AND</Label>
                    <Input
                      id="LinCellInputInput"
                      type="text"
                      placeholder="Enter a cell"
                      className="flex-1 min-w-0"
                      value={LinCellInput}
                      onChange={(e) => setLinCellInput(e.target.value)}
                    />
                    <HelpTooltip>
                      <div className="space-y-1 text-xs">
                        <p className="font-semibold text-primary">Cell Lineage Search:</p>
                        <p className="text-muted-foreground mt-1">
                          For example, enter a cell named "ABa", then it will display all the descendant cells of ABa
                        </p>
                      </div>
                    </HelpTooltip>
                    <Button
                      onClick={() => {
                        setActiveFate([]);
                        setHighligtCells(LinCells(LinCellInput));
                        setActiveLin([LinCellInput]);
                      }}
                      size="icon"
                      className="shrink-0"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-sm font-light text-zinc-500">
                  Lineage filter needs ≥ 5 visible cells
                </p>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* ── Expression cutoff ── */}
          <AccordionItem
            value="expression-highlight"
            disabled={!expressionCutoffEnabled}
            className={!expressionCutoffEnabled ? "opacity-50" : ""}
          >
            <AccordionTrigger className="py-2 hover:no-underline">
              <span className="flex items-center gap-2 text-sm font-medium">
                <StarHalf className="w-4 h-4 text-primary" />
                Expression cutoff
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pb-3">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium shrink-0">
                  Expression cutoff: {expressionCutoff}
                </Label>
                <HelpTooltip>
                  <div className="space-y-1 text-xs">
                    <p className="font-semibold text-primary">Expression cutoff:</p>
                    <p className="text-muted-foreground mt-1">
                      Set an expression cutoff (0–0.9). Enable the toggle to activate highlighting — cells with expression above this threshold will be highlighted.
                    </p>
                  </div>
                </HelpTooltip>
              </div>

              <div className="flex gap-3 items-center w-full">
                <Slider
                  min={0}
                  max={0.9}
                  step={0.1}
                  value={[expressionCutoff]}
                  onValueChange={(val) => setExpressionCutoff(val[0])}
                  disabled={!expressionEnabled || !expressionCutoffEnabled}
                  className={`flex-1 ${
                    !expressionEnabled || !expressionCutoffEnabled
                      ? "[&_[role=slider]]:bg-gray-400 [&>.relative>span:first-child]:bg-gray-300"
                      : ""
                  }`}
                />
                <div className="flex items-center gap-1.5 shrink-0">
                  <Switch
                    id="expression-enabled"
                    checked={expressionEnabled}
                    onCheckedChange={setExpressionEnabled}
                    disabled={!expressionCutoffEnabled}
                  />
                  <Label
                    htmlFor="expression-enabled"
                    className="text-xs text-muted-foreground cursor-pointer select-none w-5"
                  >
                    {expressionEnabled ? "On" : "Off"}
                  </Label>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ── DISPLAY SPECIFIC CELLS ── */}
          <AccordionItem value="cells" >
            <AccordionTrigger className="py-2 hover:no-underline">
              <span className="flex items-center gap-2 text-sm font-medium">
                <Glasses className="w-4 h-4 text-primary" />
                Highlighting specific cells
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pb-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Select cells</Label>
                <HelpTooltip>
                  <div className="space-y-2 text-xs">
                    <p className="font-semibold text-primary">Select cells:</p>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Search for cells by name</li>
                      <li>• Click to select/deselect</li>
                      <li>• Selected cells are highlighted in the 3D view</li>
                    </ul>
                  </div>
                </HelpTooltip>
              </div>
              {CData && (
                <CellMultiSelect
                  SM={SM}
                  TP={TP}
                  HighligtCells={HighligtCells}
                  setHighligtCells={setHighligtCells}
                  setActiveLin={setActiveLin}
                  setActiveFate={setActiveFate}
                  setLinCellInput={setLinCellInput}
                  setExpressionEnabled={setExpressionEnabled}
                />
              )}

              {/* Show cell identity label */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <Label htmlFor="show-label" className="text-sm font-medium flex items-center gap-2">
                    <FishSymbol className="w-4 h-4" />
                    Show cells identity
                  </Label>
                  <HelpTooltip>
                    <div className="text-sm space-y-2">
                      <p className="font-semibold text-primary">Cell Labels:</p>
                      <p className="text-muted-foreground">Display cell names in the 3D model.</p>
                    </div>
                  </HelpTooltip>
                </div>
                <Switch id="show-label" checked={ShowLabel} onCheckedChange={setShowLabel} />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ── EXPORT ── */}
          <AccordionItem value="export" className="border-b-0">
            <AccordionTrigger className="py-2 hover:no-underline">
              <span className="flex items-center gap-2 text-sm font-medium">
                <Download className="w-4 h-4 text-primary" />
                Export
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pb-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <FileBox className="w-4 h-4" />
                Export 3D model
              </Label>
              <Button
                onClick={() => {
                  if (!SM || !TP) {
                    alert("Please select a sample and time point");
                    return;
                  }
                  window.location.href = `${API_BASE}/Model/WholeEMBOBJ?SM=${SM}&TP=${TP}`;
                }}
                className="w-full"
                variant="secondary"
              >
                <Download className="mr-2 h-4 w-4" />
                Geometry only (.obj)
              </Button>
              {onDownloadGLTF && (
                <Button
                  onClick={onDownloadGLTF}
                  disabled={!isSceneReady}
                  className="w-full"
                  variant="secondary"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Geometry + color (.gltf)
                </Button>
              )}

              <Label className="text-sm font-medium flex items-center gap-2 pt-1">
                <FilePieChart className="w-4 h-4" />
                Export data table
              </Label>
              <Button
                onClick={() => {
                  if (!SM || !TP) {
                    alert("Please select a sample and time point");
                    return;
                  }
                  window.location.href = `${API_BASE}/CellDats/CSVALL?SM=${SM}&TP=${TP}`;
                }}
                className="w-full"
                variant="secondary"
              >
                <Download className="mr-2 h-4 w-4" />
                Detailed information (.csv)
              </Button>
            </AccordionContent>
          </AccordionItem>

        </Accordion>
      </ScrollArea>
    </Card>
  );
};
