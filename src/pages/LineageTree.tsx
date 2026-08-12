import { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/Navigation";
//import { Verti_lineage } from "@/components/LineageTree/verti_lineage";
import { SMSelect } from "@/components/utils/SMSelect";
//import { SubLineage } from "@/components/LineageTree/SubLineage";
import { Best_Lineage } from "@/components/LineageTree/Best_Lineage";
import { ColorGradientBar } from "@/components/LineageTree/LegendBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Shapefac, TimeResolution, SMGroupName, SMList,FateName,SampleHasExp } from '@/components/utils/usefulobject';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Download,
  Cog,
  Eye,
  Info,
  SlidersHorizontal,
  Sprout,
} from "lucide-react";
import { FateColor } from "@/config/FateColor";
import { LineageColor } from "@/config/LineageColor";
import { CellStats } from "@/components/LineageTree/CellStats";
import { GeneExpressionSelector } from "@/components/EmbModel/GeneExpressionSelector";
import { API_BASE } from "@/components/utils/API_BASE";



const LineageNewTree = () => {
  const [SM, setSM] = useState("Sample6");
  const [Gene, setGene] = useState("");
  const [Gene2, setGene2] = useState("");
  const [Fac, setFac] = useState("");
  const [GID, setGID] = useState('');
  const [GID2, setGID2] = useState('');
  const [colorMode, setColorMode] = useState<"default" | "fate" | "expression" | "shape">("default");
  const [TPRange, setTPRange] = useState(0);
  const [CellName, setCellName] = useState("");
  const [ScalingRange, setScalingRange] = useState<[number, number, number, number]>([0, 0, 0, 0]);

  const [Linewidth, setLinewidth] = useState<number>(6);
  const [Theme, setTheme] = useState<"dark" | "bright">('dark');
  const [zoom, setZoom] = useState(1.0);
  const ZoomExtent: [number, number] = [0.5, 3];

  const [ExpressionType, setExpressionType] = useState<"Reporters" | "SingleCell">("SingleCell");
  //const [ScDataSet, setScDataSet] = useState("");
  const [ScGene, setScGene] = useState("");
  const [ScGene2, setScGene2] = useState("");
  const [ExpVal, setExpVal] = useState<object>({});

  

  const EmptyBox = (newSM:string) => {
        setGID('');
        setScGene('');
        setFac('');
        setCellName('');
    }

  const lineageRefsMap = useRef<Map<string, { resetZoom: () => void }>>(new Map());

  // const handleResetAllZoom = () => {
  //   lineageRefsMap.current.forEach(ref => ref?.resetZoom?.());
  // };

const handleDownloadSVG = async () => {
  const svgElement = document.querySelector<SVGSVGElement>(".lineage-svg svg");
  if (!svgElement) return;

  const serializer = new XMLSerializer();
  let svgString = serializer.serializeToString(svgElement);

  if (!svgString.includes('xmlns="http://www.w3.org/2000/svg"')) {
    svgString = svgString.replace(
      /^<svg/,
      '<svg xmlns="http://www.w3.org/2000/svg"'
    );
  }

  const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `lineage-tree-${SM}.svg`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

  // get TPRange
  useEffect(() => {
    const fetchData = async () => {
      try {
        const url = `${API_BASE}/CellDats/TPRange?SM=${SM}`;
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

    // get TPRange
  useEffect(() => {
    setCellName('');
  }, [colorMode, SM]);


  useEffect(() => {
    setGene('');
    setGID('');
    setFac('');
    setCellName('');
    setColorMode('default');
  }, [SM]);

  // useEffect(() => {
  //   setGene('');
  //   setGID('');
  //   setScGene('');
  // }, [Fac]);

  // useEffect(() => {
  //   console.log(ExpVal)
  // }, [CellName]);

  // ── Sidebar content (shared by desktop sidebar and mobile Sheet) ──
  const SidebarContent = (
    <div className="space-y-4">
      {/* Color Legend */}
      <Card>
        <CardHeader className="pb-2">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Info className="w-4 h-4 text-primary" />
             Information
          </h3>
        </CardHeader>
        <CardContent className="text-sm pt-0">
          {/* Embryo info */}
          <div className="grid grid-cols-1 gap-2 text-xs">
            <div><p className="text-muted-foreground">Embryo sample</p><p className="font-medium">{SM}</p></div>
            <div><p className="text-muted-foreground">Experimental condition</p><p className="font-medium">{SMGroupName[Object.keys(SMList).find(k => SMList[k].includes(SM))]}</p></div>
            <div><p className="text-muted-foreground">Time point range</p><p className="font-medium">1–{TPRange}</p></div>
            <div><p className="text-muted-foreground">Interval</p><p className="font-medium">{TimeResolution?.[SM]} {
              SMList.NaturalF.includes(SM) || SMList.CompressF.includes(SM) ? 's/TP' : ' min/TP'}</p></div>
          </div>
        </CardContent>
      </Card>

      {/* Tree Settings */}
      <Card>
        <CardHeader className="pb-2">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Cog className="w-4 h-4 text-primary" />
            Display
          </h3>
        </CardHeader>
        <CardContent className="space-y-1.5 pt-0">
          <Label className="text-xs font-semibold">Color legend</Label>
          <div className="max-h-40 lg:h-24 overflow-y-auto">
          {colorMode === "default" ? (
              <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs">
                {Object.entries(LineageColor).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded shrink-0" style={{ backgroundColor: value as string }} />
                    <span className="truncate">{key}</span>
                  </div>
                ))}
              </div>
          ) : colorMode === "fate" ? (
              <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs">
                {Object.entries(FateColor).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded shrink-0" style={{ backgroundColor: value as string }} />
                    <span className="truncate">{FateName[key]}</span>
                  </div>
                ))}
              </div>
          ) : colorMode === "expression" && !GID && !ScGene && !ScGene2 ? (
              <p className="text-xs text-muted-foreground">Select a gene to color branches by expression</p>
          ) : colorMode === "expression" && (GID || ScGene) && !ScGene2 ? (
              <ColorGradientBar Type="Exp" />
          )
          : colorMode === "expression" && !GID && ScGene && ScGene2 ? (
              <>
                  <p className="text-xs text-muted-foreground">(expression {'>'} 0)</p>
                  <p className="text-xs "><span style={{ color: "blue" }}>&#9632;</span> <i>{ScGene}</i></p>
                  <p className="text-xs "><span style={{ color: "red" }}>&#9632;</span> <i>{ScGene2}</i></p>
                  <p className="text-xs "><span style={{ color: "purple" }}>&#9632;</span> <i>{ScGene}</i> & <i>{ScGene2}</i></p>
                  <p className="text-xs "><span style={{ color: "grey" }}>&#9632;</span> No Expression</p>
                </>
          )
          : colorMode === "shape" ? (
              <ColorGradientBar Type="Shape" range={ScalingRange} />
          )
           : 
              <p className="text-xs text-muted-foreground">-</p>
          }
          </div>
          
          {/* Branch color select → button group */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Branch color</Label>
              <div className="grid grid-cols-2 gap-1.5">
            {(
              [
                { label: "Lineage",    value: "default",    disabled: false },
                { label: "Cell fate",  value: "fate",       disabled: ['Sample32','Sample33','Sample34','Sample35'].includes(SM) },
                { label: "Morphology", value: "shape",      disabled: false },
                { label: "Expression", value: "expression", disabled: !SampleHasExp.includes(SM) },
              ] as { label: string; value: "default" | "fate" | "shape" | "expression"; disabled: boolean }[]
            ).map(({ label, value, disabled }) => (
              <Button
                key={value}
                variant={colorMode === value ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs font-medium"
                disabled={disabled}
                onClick={() => !disabled && setColorMode(value)}
              >
                {label}
              </Button>
            ))}
              </div>
            </div>



          {/* Branch thickness */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Branch thickness</Label>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { label: "Slim",   value: 4 },
                  { label: "Medium", value: 6 },
                  { label: "Thick",  value: 7 },
                ] as const
              ).map(({ label, value }) => (
                <Button
                  key={label}
                  variant={Linewidth === value ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs font-medium"
                  onClick={() => setLinewidth(value)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* Theme */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Theme</Label>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { label: "Dark", value: 'dark' },
                  { label: "Bright",   value: 'bright' },
                ] as const
              ).map(({ label, value }) => (
                <Button
                  key={label}
                  variant={Theme === value ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs font-medium"
                  onClick={() => setTheme(value)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Zoom ({zoom.toFixed(1)}×)</Label>
            <Slider
              min={ZoomExtent[0]}
              max={ZoomExtent[1]}
              step={0.1}
              value={[zoom]}
              onValueChange={(val) => setZoom(val[0])}
              className="w-full"
            />
          </div>

          {/* Gene expression selector */}
          {colorMode === "expression" && (
            <GeneExpressionSelector
              SM={SM}
              ExpressionType={ExpressionType}
              setExpressionType={setExpressionType}
              Gene={Gene}
              //DualExp={true}
              scDualExp={true}
              setGene={setGene}
              Gene2={Gene2}
              setGene2={setGene2}
              GID={GID}
              setGID={setGID}
              GID2={GID2}
              setGID2={setGID2}
              //ScDataSet={ScDataSet}
              //setScDataSet={setScDataSet}
              ScGene={ScGene}
              ScGene2={ScGene2}
              setScGene={setScGene}
              setScGene2={setScGene2}
              // BinaryScaling={BinaryScaling}
              // setBinaryScaling={setBinaryScaling}
            />
          )}

          {/* Shape feature buttons */}
          {colorMode === "shape" && (
            <div className="space-y-2 border-t pt-3">
              <Label className="text-xs font-semibold">Select a feature</Label>
              <div className="grid grid-cols-1 gap-1.5">
                {Object.keys(Shapefac).map((metric) => (
                  <Button
                    key={metric}
                    variant={Fac === metric ? "default" : "outline"}
                    onClick={() => setFac(metric)}
                    className="text-xs font-medium h-7 px-2"
                    size="sm"
                    title={Shapefac[metric]}
                  >
                    {Shapefac[metric]}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="border-t border-border pt-3 space-y-2">
            {/* <Button onClick={handleResetAllZoom} className="w-full h-8 text-xs" variant="secondary" size="sm">
              <Eye className="mr-1.5 h-3.5 w-3.5" />
              Reset zoom &amp; pan
            </Button> */}
            <Button onClick={handleDownloadSVG} className="w-full h-8 text-xs" variant="secondary" size="sm">
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Export lineage tree (.svg)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Header */}
      <div className="w-full px-3 sm:px-6 py-3 sm:py-6">
        <div className="w-full px-3 sm:px-6 py-3 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                  <Sprout className="w-6 h-6 text-primary-foreground" />
                </div>
                <h1 className="text-3xl font-bold text-foreground tracking-tight">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/70">
                    Lineage Tree
                  </span>
                  
                </h1>
              </div>
              <p className="text-sm text-muted-foreground ml-13">
                Visualize <span className="font-semibold text-foreground ml-1">cell lineage</span> with cell fate, gene expression, and morphology feature patterns
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

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:min-h-0">

          {/* ── Sidebar: hidden on mobile (use Sheet), visible on desktop ── */}
          <div className="hidden lg:block lg:col-span-1 space-y-4">
            {SidebarContent}
          </div>

          {/* ── Main content area: tree + cell stats ── */}
          <div className="lg:col-span-4 space-y-4 relative">

            {/* CellStats */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 min-w-0">
                <CellStats SM={SM} CellName={CellName} colorMode={colorMode} Gene={Gene || ScGene} ExpVal={ExpVal} />
              </div>
            </div>

            {/* Tree Visualization — horizontally scrollable for wide SVGs */}
            <div className="lineage-svg relative w-full overflow-hidden min-h-[400px] rounded-lg border border-border bg-card">
              <Best_Lineage
                ExpColorMode={ScGene2 || GID2 ? 2 : 1}
                SM={SM}
                line_width={Linewidth}
                colorMode={colorMode}
                ExpressionType={ExpressionType}
                GID={GID}
                //ScDataSet={ScDataSet}
                ScGene={ScGene}
                ScGene2={ScGene2}
                Fac={Fac}
                setCellName={setCellName}
                setExpVal={setExpVal}
                zoomLevel={zoom}
                setScalingRange={setScalingRange}
                Theme={Theme}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile floating settings button (Sheet drawer) ── */}
      <div className="lg:hidden fixed bottom-4 right-4 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" className="rounded-full shadow-lg h-12 w-12">
              <SlidersHorizontal className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[75vh] overflow-y-auto p-4">
            {SidebarContent}
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};

export default LineageNewTree;
