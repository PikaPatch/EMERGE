import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { CCForcegraph } from "@/components/ContactNetwork/CCForcegraph";
import { GeneExpressionSelector } from "@/components/EmbModel/GeneExpressionSelector";
import { CellInfoCard } from "@/components/ContactNetwork/CellInfoCard";
//import { EMB3D } from "@/components/EmbModel/EMBobj";
import { EMB3D } from "@/components/EmbModel/EMBglb";
import { SMSelect } from "@/components/utils/SMSelect";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { API_BASE } from "@/components/utils/API_BASE";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ArrowLeft, ArrowRight, Cog, Dna, Network, SlidersHorizontal } from "lucide-react";
import { SMOBJList,SampleHasExp } from "@/components/utils/usefulobject";

const ContactNetwork = () => {
  const [SM, setSM] = useState("Sample6");
  const [SMType, setSMType] = useState<"CMap8" | "CShaper17" | "EmbSAM4567" | "EmbSAM89" | "MT_lag1" | "MT_pop1" | "MT_wee">("CMap8");
  const [Gene, setGene] = useState("");
  const [GID, setGID] = useState("");
  const [TP, setTP] = useState(50);
  const [InputTP, setInputTP] = useState(50);
  const [colorMode, setColorMode] = useState<"default" | "fate" | "lineage" | "expression" | "shape">("default");
  const [TPRange, setTPRange] = useState(null);
  const [CenterCell, setCenterCell] = useState("");
  const [ExpressionType, setExpressionType] = useState<"Reporters" | "SingleCell">("SingleCell");
  const [ScGene, setScGene] = useState("");
  const [EmbCellList, setEmbCellList] = useState(null);

  const EmptyBox = (_newSM: string) => {
    setCenterCell(""); setGene(""); setGID(""); setTP(50); setInputTP(50);
  };

  useEffect(() => { setCenterCell(""); }, [TP]);

  useEffect(() => {
    setGID(""); setGene(""); setScGene(""); setCenterCell("");
  }, [colorMode]);

  useEffect(() => {
    setGID(""); setGene(""); setScGene(""); setColorMode("default");
  }, [SM, SMType]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const url = `${API_BASE}/CellDats/TPRange?SM=${SM}&SMType=${SMType}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const jsonData = await response.json();
        setTPRange(jsonData.TPRange);
      } catch (err) {
        console.log("somethings wrong!!");
      }
    };
    fetchData();
  }, [SM]);

  const ControlsPanelContent = (
    <div className="flex flex-col gap-4 p-4">
      {/* Timepoint */}
      <div className="flex flex-col gap-2">
        <Label className="text-[11px] uppercase tracking-wider text-white/40">Time Point</Label>

        {/* Current TP display + arrow buttons */}
        <div className="flex gap-1 items-center">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setInputTP(Math.max(1, InputTP - 1))}
            className="shrink-0 h-8 w-8"
            title="Step back 1 TP"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" className="flex-1 h-8 text-xs pointer-events-none" disabled>
            Current TP {TP}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setInputTP(Math.min(TPRange ?? 999, InputTP + 1))}
            className="shrink-0 h-8 w-8"
            title="Step forward 1 TP"
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Slider + input value + Go */}
        <div className="flex gap-2 items-center">
          <Slider
            id="timepoint"
            min={1}
            max={TPRange ?? 999}
            step={1}
            value={[InputTP]}
            onValueChange={(value) => setInputTP(value[0])}
            className="flex-1"
            style={{ touchAction: "none" }}
          />
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-sm font-medium text-muted-foreground w-8 text-right tabular-nums">
              {InputTP}
            </span>
            <Button
              size="sm"
              variant="default"
              onClick={() => { setCenterCell(""); setTP(InputTP); }}
              className="shrink-0 h-8"
            >
              Go
            </Button>
          </div>
        </div>

        <span className="text-[10px] text-white/30 text-right tabular-nums">
          Range: 1 – {TPRange ?? "…"}
        </span>
      </div>
      {/* Color mode */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-[11px] uppercase tracking-wider text-white/40">Color Mode</Label>
        <div className="flex items-center gap-1 rounded-md bg-white/5 p-0.5 border border-white/10 w-full">
          <Button
            onClick={() => setColorMode("default")}
            variant={colorMode === "default" ? "secondary" : "ghost"}
            size="sm" className="h-7 text-xs px-2 flex-1"
          >
            <Cog className="w-3 h-3 mr-1" />
            Default
          </Button>
          {SampleHasExp.includes(SM) && (
            <Button
              onClick={() => setColorMode("expression")}
              variant={colorMode === "expression" ? "secondary" : "ghost"}
              size="sm" className="h-7 text-xs px-2 flex-1"
            >
              <Dna className="w-3 h-3 mr-1" />
              Expression
            </Button>
          )}
        </div>
      </div>

      {/* Focus cell */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-[11px] uppercase tracking-wider text-white/40">Focus Cell</Label>
        <Select value={CenterCell} onValueChange={setCenterCell}>
          <SelectTrigger className="h-8 w-full text-xs bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
            <SelectValue placeholder="All cells" />
          </SelectTrigger>
          <SelectContent>
            {EmbCellList?.map((n) => (
              <SelectItem key={n} value={n} className="text-xs">{n}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      
    </div>
  );

  const GenePanelContent = (
    <div className="flex-1 min-h-0 overflow-auto p-3">
      {colorMode === "expression" ? (
        <GeneExpressionSelector
          SM={SM} scDualExp={false}
          Gene={Gene} setGene={setGene}
          GID={GID} setGID={setGID}
          ExpressionType={ExpressionType} setExpressionType={setExpressionType}
          ScGene={ScGene} setScGene={setScGene} showLegend={false}
        />
      ) : (
        <div className="h-full flex flex-col justify-center items-center text-center text-xs text-white/40 px-2 py-6 gap-4">
          <div className="flex flex-col items-center gap-3">
            <Dna className="w-8 h-8 text-white/20" />
            <p className="leading-relaxed">
              Switch color mode to <span className="text-white/70">Expression</span> to select a gene.
            </p>
          </div>
          <span className="text-[10px] text-white/25">
            Gene expression overlays the network with reporter or single-cell data.
          </span>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#0d0d14] text-white">
      <Navigation />

      {/* ── Page header ── */}
      <div className="w-full px-3 sm:px-6 py-3 sm:py-5 bg-[#0d0d14] border-b border-white/10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1.5">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shrink-0">
                <Network className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/70">
                  Contact Network
                </span>
                <span className="text-white ml-2">Explorer</span>
              </h1>
            </div>
            <p className="text-sm text-white/50 ml-[52px]">
              Visualize <span className="font-semibold text-white/80">cell contact</span> with network topology and gene expression patterns
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

      {/* ── Top info row: Controls card (left) + CellInfoCard (right) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 px-3 sm:px-6 pt-3">
        {/* Controls card occupies the same col-span-1 as the main panel column below */}
        <div className="lg:col-span-1">
          <section className="rounded-lg border border-white/10 bg-[#0d0d14] shadow-lg overflow-hidden">
            <header className="flex items-center px-4 py-2.5 border-b border-white/10 bg-white/[0.02] shrink-0">
              <h2 className="text-sm font-semibold text-white/85 tracking-wide flex items-center gap-2">
                <span className="inline-block w-1 h-4 rounded-full bg-primary" />
                Controls
              </h2>
            </header>
            {ControlsPanelContent}
          </section>
        </div>

        {/* CellInfoCard */}
        <div className="lg:col-span-4">
          <CellInfoCard TP={TP} SM={SM} SMType={SMType} CenterCell={CenterCell} />
        </div>
      </div>

      {/* ── Main panels ── */}
      <div className="flex-1 min-h-0 px-3 sm:px-6 pb-3">

        {/* Desktop: 5-column grid */}
        <div className="hidden lg:grid grid-cols-5 h-[calc(100vh-260px)] min-h-[520px] gap-3 mt-3">

          <section className="flex col-span-1 flex-col min-w-0 rounded-lg border border-white/10 bg-[#0d0d14] shadow-lg overflow-hidden">
            <header className="flex items-center px-4 py-2.5 border-b border-white/10 bg-white/[0.02] shrink-0">
              <h2 className="text-sm font-semibold text-white/85 tracking-wide flex items-center gap-2">
                <span className="inline-block w-1 h-4 rounded-full bg-primary" />
                Gene Expression
              </h2>
            </header>
            {GenePanelContent}
          </section>

          <section className="flex col-span-2 flex-col min-w-0 rounded-lg border border-white/10 bg-[#0d0d14] shadow-lg overflow-hidden">
            <header className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-white/[0.02] shrink-0">
              <h2 className="text-sm font-semibold text-white/85 tracking-wide flex items-center gap-2">
                <span className="inline-block w-1 h-4 rounded-full bg-primary" />
                Contact Network Graph
              </h2>
              <span className="text-[11px] text-white/40">{EmbCellList?.length ?? 0} cells</span>
            </header>
            <div className="flex-1 min-h-0 overflow-hidden">
              <CCForcegraph
                TP={TP} SM={SM} SMType={SMType}
                GID={GID} ScGene={ScGene}
                colorMode={colorMode} CenterCell={CenterCell}
                setCenterCell={setCenterCell} setEmbCellList={setEmbCellList}
              />
            </div>
          </section>

          <section className="flex flex-col col-span-2 min-w-0 rounded-lg border border-white/10 bg-[#0d0d14] shadow-lg overflow-hidden">
            <header className="flex items-center px-4 py-2.5 border-b border-white/10 bg-white/[0.02] shrink-0">
              <h2 className="text-sm font-semibold text-white/85 tracking-wide flex items-center gap-2">
                <span className="inline-block w-1 h-4 rounded-full bg-primary" />
                3D Embryo Model
              </h2>
            </header>
            <div className="flex-1 min-h-0">
              {/* {SampleHasOBJ.includes(SM) ? (
                <EMB3D
                  EmbMode="ContactNet"
                  TP={TP} SM={SM}
                  CenterCell={CenterCell}
                  cameraPosition={[0, 0, 200]}
                  ShowLabel={true}
                  HighligtCells={["All"]}
                  MonoColor="#58D6FC"
                  Resolution="Low"
                />
              ) : (
                <div className="w-full h-full py-12 flex items-center justify-center bg-muted/50 border border-dashed">
                  <p className="text-muted-foreground">No model available</p>
                </div>
              )} */}
              <EMB3D
                  EmbMode="ContactNet"
                  TP={TP} SM={SM}
                  CenterCell={CenterCell}
                  cameraPosition={[0, 0, 200]}
                  ShowLabel={true}
                  HighligtCells={["All"]}
                  MonoColor="#58D6FC"
                  Resolution="Low"
                />
            </div>
          </section>
        </div>

        {/* Mobile: stacked */}
        <div className="flex lg:hidden flex-col gap-3 mt-3">

          {/* Mobile Controls card */}
          <section className="flex flex-col rounded-lg border border-white/10 bg-[#0d0d14] shadow-lg overflow-hidden">
            <header className="flex items-center px-3 py-2 border-b border-white/10 bg-white/[0.02] shrink-0">
              <h2 className="text-sm font-semibold text-white/85 flex items-center gap-2">
                <span className="inline-block w-1 h-4 rounded-full bg-primary" />
                Controls
              </h2>
            </header>
            {ControlsPanelContent}
          </section>

          <section className="flex flex-col rounded-lg border border-white/10 bg-[#0d0d14] shadow-lg overflow-hidden">
            <header className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-white/[0.02] shrink-0">
              <h2 className="text-sm font-semibold text-white/85 flex items-center gap-2">
                <span className="inline-block w-1 h-4 rounded-full bg-primary" />
                Contact Network Graph
              </h2>
              <span className="text-[11px] text-white/40">{EmbCellList?.length ?? 0} cells</span>
            </header>
            <div className="h-[50vw] min-h-[280px] max-h-[420px] overflow-hidden">
              <CCForcegraph
                TP={TP} SM={SM} SMType={SMType}
                GID={GID} ScGene={ScGene}
                colorMode={colorMode} CenterCell={CenterCell}
                setCenterCell={setCenterCell} setEmbCellList={setEmbCellList}
              />
            </div>
          </section>

          <section className="flex flex-col rounded-lg border border-white/10 bg-[#0d0d14] shadow-lg overflow-hidden">
            <header className="flex items-center px-3 py-2 border-b border-white/10 bg-white/[0.02] shrink-0">
              <h2 className="text-sm font-semibold text-white/85 flex items-center gap-2">
                <span className="inline-block w-1 h-4 rounded-full bg-primary" />
                3D Embryo Model
              </h2>
            </header>
            <div className="h-[50vw] min-h-[280px] max-h-[420px]">
              {/* {SampleHasOBJ.includes(SM) ? (
                <EMB3D
                  EmbMode="ContactNet"
                  TP={TP} SM={SM}
                  CenterCell={CenterCell}
                  cameraPosition={[0, 0, 200]}
                  ShowLabel={true}
                  HighligtCells={["All"]}
                  MonoColor="#58D6FC"
                  Resolution="Low"
                />
              ) : (
                <div className="w-full h-full py-12 flex items-center justify-center bg-muted/50 border border-dashed">
                  <p className="text-muted-foreground">No model available</p>
                </div>
              )} */}
              <EMB3D
                  EmbMode="ContactNet"
                  TP={TP} SM={SM}
                  CenterCell={CenterCell}
                  cameraPosition={[0, 0, 200]}
                  ShowLabel={true}
                  HighligtCells={["All"]}
                  MonoColor="#58D6FC"
                  Resolution="Low"
                />
            </div>
          </section>
        </div>
      </div>

      {/* Legend bar */}
      {CenterCell && (
        <div className="flex items-center justify-center gap-4 sm:gap-8 px-3 sm:px-6 py-2 bg-[#12121c] border-t border-white/10 shrink-0 flex-wrap">
          <LegendItem color="bg-red-500"   label={CenterCell}                     sublabel="Focus cell"         shape="circle" />
          <LegendItem color="bg-green-500" label={`Contacted with ${CenterCell}`} sublabel="Neighbouring cells" shape="circle" />
          <LegendItem color="bg-gray-400"  label="No contact"                     sublabel=""                   shape="circle" />
        </div>
      )}

      {/* Mobile: floating Gene Expression Sheet */}
      <div className="lg:hidden fixed bottom-4 right-4 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" className="rounded-full shadow-lg h-12 w-12 bg-primary hover:bg-primary/90">
              <SlidersHorizontal className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[70vh] bg-[#0d0d14] border-white/10 p-0 overflow-hidden flex flex-col">
            <div className="flex items-center px-4 py-2.5 border-b border-white/10 bg-white/[0.02] shrink-0">
              <h2 className="text-sm font-semibold text-white/85 flex items-center gap-2">
                <span className="inline-block w-1 h-4 rounded-full bg-primary" />
                Gene Expression
              </h2>
            </div>
            {GenePanelContent}
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};

const LegendItem = ({
  color, label, sublabel, shape,
}: {
  color: string; label: string; sublabel: string;
  shape: "circle" | "line" | "dashed" | "dot";
}) => (
  <div className="flex items-center gap-2">
    {shape === "circle"  && <span className={`inline-block w-4 h-4 rounded-full ${color}`} />}
    {shape === "line"    && <span className={`inline-block w-6 h-0.5 ${color}`} />}
    {shape === "dashed"  && (
      <span className="inline-block w-6 h-0.5 bg-gray-500"
        style={{ backgroundImage: "repeating-linear-gradient(90deg,#9ca3af 0,#9ca3af 4px,transparent 4px,transparent 8px)" }}
      />
    )}
    {shape === "dot"     && <span className={`inline-block w-2.5 h-2.5 rounded-full ${color}`} />}
    <div className="leading-tight">
      <p className="text-xs font-medium text-white/80">{label}</p>
      {sublabel && <p className="text-[10px] text-white/40">{sublabel}</p>}
    </div>
  </div>
);

export default ContactNetwork;
