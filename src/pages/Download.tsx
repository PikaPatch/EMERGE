import { useState, useEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download as DownloadIcon, FileText, Database, Box, Image,Shapes,Dna,Link2 } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem,
  SelectTrigger,
  SelectSeparator,
  SelectValue,
} from "@/components/ui/select";
import {
  SampleRange,
  SMList,
  SMGroupName,
  TimeResolution,
  SampleCellStage,
  SampleCellRegion,
} from "@/components/utils/usefulobject";
import { API_BASE } from "@/components/utils/API_BASE";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ─── Helpers ────────────────────────────────────────────────────────────────

const CMapLabelTheme = "text-sky-600 font-semibold text-xs uppercase tracking-wide";
const CMapItemTheme = "data-[highlighted]:bg-sky-500/10 data-[highlighted]:text-sky-700 data-[state=checked]:text-sky-600";

const CShaperLabelTheme = "text-violet-600 font-semibold text-xs uppercase tracking-wide";
const CShaperItemTheme = "data-[highlighted]:bg-violet-500/10 data-[highlighted]:text-violet-700 data-[state=checked]:text-violet-600";

const EmbSAMLabelTheme = "text-green-600 font-semibold text-xs uppercase tracking-wide";
const EmbSAMItemTheme = "data-[highlighted]:bg-green-500/10 data-[highlighted]:text-green-700 data-[state=checked]:text-green-600";

const MTLabelTheme = "text-pink-600 font-semibold text-xs uppercase tracking-wide";
const MTItemTheme = "data-[highlighted]:bg-pink-500/10 data-[highlighted]:text-pink-700 data-[state=checked]:text-pink-600";

type SMGroupKey = keyof typeof SMList;

const SAMPLE_GROUP_ORDER: SMGroupKey[] = [
  "Natural",
  "NaturalF",
  "Compress",
  "CompressF",
  "MT_lag1",
  "MT_pop1",
  "MT_wee",
];

const SAMPLE_GROUP_BLURB: Record<SMGroupKey, ReactNode> = {
  Natural: <>Wild-type <em>C. elegans</em> embryos imaged at standard temporal resolution.</>,
  NaturalF: "Wild-type embryos imaged at high temporal resolution (~10 s per time point).",
  Compress: "Embryos developing under mechanical compression.",
  CompressF: "Mechanically-compressed embryos imaged at high temporal resolution.",
  MT_lag1: <>Embryos with Notch signaling blocked (<em>lag-1</em>).</>,
  MT_pop1: <>Embryos with Wnt signaling blocked (<em>pop-1</em>).</>,
  MT_wee: <>Embryos with accelerated cell division (<em>wee-1.1</em>).</>,
};

const isFastImaging = (sample: string) =>
  SMList.NaturalF.includes(sample) || SMList.CompressF.includes(sample);

const formatTimeResolution = (sample: string) => {
  const value = TimeResolution[sample as keyof typeof TimeResolution];
  if (value == null) return "—";
  return isFastImaging(sample) ? `${value} s/TP` : `${value} min/TP`;
};

const formatCount = (n: number | undefined) =>
  n == null ? "—" : n.toLocaleString();
// ─── Standalone SampleSelect component (defined OUTSIDE Download) ────────────

interface SampleSelectProps {
  value: string;
  Expression?: boolean;
  onChange: (v: string) => void;
}

const SampleSelect = ({ value, Expression = false, onChange }: SampleSelectProps) => {
  const isCMap = SMList.Natural.includes(value);
  const isCShaper = SMList.Compress.includes(value);

  const triggerTheme = isCMap
    ? "border-sky-400/60 hover:border-sky-400/90 text-sky-600 bg-sky-500/5 hover:bg-sky-500/10 focus:ring-sky-400/50"
    : isCShaper
    ? "border-violet-400/60 hover:border-violet-400/90 text-violet-600 bg-violet-500/5 hover:bg-violet-500/10 focus:ring-violet-400/50"
    : "border-primary/40 hover:border-primary/70 bg-card/60 hover:bg-card/80 focus:ring-primary/50";

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={cn("w-full transition-all duration-200", triggerTheme)}>
        <SelectValue placeholder="Please select an embryo" />
      </SelectTrigger>
            <SelectContent>
        <SelectGroup>
          <SelectLabel className={CMapLabelTheme}>Natural</SelectLabel>
          {SMList.Natural.map((s) => (
            <SelectItem key={s} value={s} className={CMapItemTheme}>
              {s}
            </SelectItem>
          ))}
        </SelectGroup>
        <SelectSeparator />

        <SelectGroup>
          <SelectLabel className={EmbSAMLabelTheme}>Natural (fast imaging)</SelectLabel>
          {SMList.NaturalF.map((s) => (
            <SelectItem key={s} value={s} className={EmbSAMItemTheme} disabled={Expression}>
              {s}
            </SelectItem>
          ))}
        </SelectGroup>
        <SelectSeparator />
        
        <SelectGroup>
          <SelectLabel className={CShaperLabelTheme}>Mechanically-compressed</SelectLabel>
          {SMList.Compress.map((s) => (
            <SelectItem key={s} value={s} className={CShaperItemTheme}>
              {s}
            </SelectItem>
          ))}
        </SelectGroup>
        <SelectSeparator />

        <SelectGroup>
          <SelectLabel className={EmbSAMLabelTheme}>Mechanically-compressed (fast imaging)</SelectLabel>
          {SMList.CompressF.map((s) => (
            <SelectItem key={s} value={s} className={EmbSAMItemTheme} disabled={Expression}>
              {s}
            </SelectItem>
          ))}
        </SelectGroup>
        <SelectSeparator />

        <SelectGroup>
          <SelectLabel className={MTLabelTheme}>Notch-signaling-blocked (<em className="italic normal-case">lag-1</em>)</SelectLabel>
          {SMList.MT_lag1.map((s) => (
            <SelectItem key={s} value={s} className={MTItemTheme} disabled={Expression}>
              {s}
            </SelectItem>
          ))}
        </SelectGroup>
        <SelectSeparator />

        <SelectGroup>
          <SelectLabel className={MTLabelTheme}>Wnt-signaling-blocked (<em className="italic normal-case">pop-1</em>)</SelectLabel>
          {SMList.MT_pop1.map((s) => (
            <SelectItem key={s} value={s} className={MTItemTheme} disabled={Expression}>
              {s}
            </SelectItem>
          ))}
        </SelectGroup>
        <SelectSeparator />

        <SelectGroup>
          <SelectLabel className={MTLabelTheme}>Cell-division-accelerated (<em className="italic normal-case">wee-1.1</em>)</SelectLabel>
          {SMList.MT_wee.map((s) => (
            <SelectItem key={s} value={s} className={MTItemTheme} disabled={Expression}>
              {s}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};

// ─── SMType badge helper ─────────────────────────────────────────────────────

const SMTypeBadge = ({ smType, isCMap }: { smType: string; isCMap: boolean }) =>
  smType ? (
    <span
      className={cn(
        "ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold",
        isCMap ? "bg-sky-500/10 text-sky-600" : "bg-violet-500/10 text-violet-600"
      )}
    >
      {smType}
    </span>
  ) : null;

// ─── Download component ──────────────────────────────────────────────────────

const Download = () => {
  // ── Lineage card state ──
  const [lineageSM, setLineageSM] = useState<string>("");
  const [lineageSMType, setLineageSMType] = useState<"CMap8" | "CShaper17" | "">("");

  // ── 3D Models card state ──
  const [modelSM, setModelSM] = useState<string>("");
  const [modelSMType, setModelSMType] = useState<"CMap8" | "CShaper17" | "">("");
  const [TP, setTP] = useState<string>("");

  // ── Gene Expression card state ──
  const [geneSM, setGeneSM] = useState<string>("");
  const [geneSMType, setGeneSMType] = useState<"CMap8" | "CShaper17" | "">("");
  const [ExpMeta, setExpMeta] = useState<any>(null);
  const [OpenGeneSelect, setOpenGeneSelect] = useState(false);
  const [Gene, setGene] = useState<string>("");
  const [GID, setGID] = useState<string>("");

  // ── Handlers ──

  const handleLineageSMChange = (v: string) => {
    setLineageSM(v);
  };

  const handleModelSMChange = (v: string) => {
    setModelSM(v);
    //setModelSMType(deriveSMType(v));
    setTP("");
  };

  const handleGeneSMChange = (v: string) => {
    setGeneSM(v);
  };

  // ── Fetch ExpMeta whenever geneSM changes ──
  // useEffect(() => {
  //   if (!geneSM) {
  //     setExpMeta(null);
  //     return;
  //   }
  //   const fetchData = async () => {
  //     try {
  //       const url = `${API_BASE}/ExpMeta?SM=${geneSM}&SMType=${geneSMType}`;
  //       const response = await fetch(url);
  //       if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  //       const jsonData = await response.json();
  //       console.log(jsonData);
  //       setExpMeta(jsonData);
  //     } catch (err) {
  //       setExpMeta(null);
  //     }
  //   };
  //   fetchData();
  // }, [geneSM]);

  // ── Download helpers ──

  const handleDownloadLineageCSV = async () => {
    if (!lineageSM) {
      alert("Please select a sample first");
      return;
    }
    try {
      window.location.href = `${API_BASE}/Download/OneMorphology?SM=${lineageSM}`
    } catch (err) {
      console.error("Download failed", err);
      alert("Failed to download CSV file");
    }
  };

  const handleDownload3DModel = () => {
    if (!modelSM || !TP) {
      alert("Please select both sample and time point");
      return;
    }
    window.location.href = `${API_BASE}/model/WholeEMBOBJ?SM=${modelSM}&SMType=${modelSMType}&TP=${TP}`;
  };

  const handleDownloadExpressionCSV = () => {
    if (!geneSM ) {
      alert("Please select sample, gene, and gene variant");
      return;
    }
    try {
      window.location.href = `${API_BASE}/Download/OneReporter?SM=${geneSM}`;
    } catch (err) {
      console.error("Download failed", err);
      alert("Failed to download CSV file");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-3xl font-bold text-foreground">
            <span className="text-primary">Download</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Datasets, models, and documentations
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">

          {/* ── Lineage Data Card ── */}
          <Card>
            <CardHeader>
              <Shapes className="w-10 h-10 mb-2 text-primary" />
              <CardTitle>Quantitative cell morphology feature</CardTitle>
              <CardDescription>Volume, surface area, nucleus position, and 12 quantitative morphology features of cells within a completely resolved lineage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Embryo
                  <SMTypeBadge smType={lineageSMType} isCMap={SMList.Natural.includes(lineageSM)} />
                </p>
                <SampleSelect value={lineageSM} onChange={handleLineageSMChange} />
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  className="w-full"
                  variant="default"
                  onClick={handleDownloadLineageCSV}
                  disabled={!lineageSM}
                >
                  <DownloadIcon className="mr-2 h-4 w-4" />
                  Download {lineageSM || ""} embryo
                </Button>
                <Button
                  className="w-full"
                  variant="secondary"
                  onClick={() => (window.location.href = `${API_BASE}/Download/Morphology`)}
                >
                  <DownloadIcon className="mr-2 h-4 w-4" />
                  Download all
                </Button>
                {/* Divider */}
              <div className="border-t border-border my-4" />
                <Button
                className="w-full"
                variant="secondary"
                onClick={() => (window.location.href = `${API_BASE}/Download/SampleInfo`)}
              >
                <DownloadIcon className="mr-2 h-4 w-4" />
                Sample info (.xlsx)
              </Button>
              </div>
            </CardContent>
          </Card>

          {/* ── Gene Expression Data Card ── */}
          <Card>
            <CardHeader>
              <Dna className="w-10 h-10 mb-2 text-primary" />
              <CardTitle>Single-cell gene expression</CardTitle>
              <CardDescription>
                Gene expression measured with fluorescence labeling and RNA sequencing at single-cell resolution.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Embryo
                  <SMTypeBadge smType={geneSMType} isCMap={SMList.Natural.includes(geneSM)} />
                </p>
                <SampleSelect value={geneSM} Expression={true} onChange={handleGeneSMChange} />
              </div>

              {/* Download buttons */}
              <Button
                className="w-full"
                variant="default"
                onClick={handleDownloadExpressionCSV}
                disabled={!geneSM}
              >
                <DownloadIcon className="mr-2 h-4 w-4" />
                Download {geneSM} gene (.csv)
              </Button>
              <Button
                className="w-full"
                variant="secondary"
                onClick={() => (window.location.href = `${API_BASE}/Download/Reporter`)}
              >
                <DownloadIcon className="mr-2 h-4 w-4" />
                Download all (Fluorescence-based)
              </Button>
              <Button
                className="w-full"
                variant="secondary"
                onClick={() => (window.location.href = `${API_BASE}/Download/SingleCell`)}
              >
                <DownloadIcon className="mr-2 h-4 w-4" />
                Download all (Sequencing-Based)
              </Button>
              {/* Divider */}
              <div className="border-t border-border my-4" />
              <Button
                className="w-full"
                variant="secondary"
                onClick={() => (window.location.href = `${API_BASE}/Download/MetaTable`)}
              >
                <DownloadIcon className="mr-2 h-4 w-4" />
                Source Dictionary (.xlsx)
              </Button>
              
              
            </CardContent>
          </Card>

          {/* ── 3D Models Card ── */}
          <Card>
            <CardHeader>
              <Box className="w-10 h-10 mb-2 text-primary" />
              <CardTitle>3D model</CardTitle>
              <CardDescription>3D Object files for embryo models at specific time points</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Embryo
                  <SMTypeBadge smType={modelSMType} isCMap={SMList.Natural.includes(modelSM)} />
                </p>
                <SampleSelect value={modelSM} onChange={handleModelSMChange} />
              </div>
              
              <Button
                className="w-full"
                variant="secondary"
                onClick={() => (window.location.href = `${API_BASE}/Download/SLL?SM=${modelSM}`)}
                disabled={!modelSM}
              >
                <DownloadIcon className="mr-2 h-4 w-4" />
                Download all {modelSM} (.zip)
              </Button>

              {/* Divider */}
              <div className="border-t border-border my-4" />
              


                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Time point
                  </p>
                  <Select value={TP} onValueChange={(v) => setTP(v)} disabled={!modelSM}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select time point" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from(
                        { length: SampleRange[modelSM as keyof typeof SampleRange] },
                        (_, i) => i + 1
                      ).map((tp) => (
                        <SelectItem key={tp} value={tp.toString()}>
                          Time point {tp}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

              <Button
                className="w-full"
                variant="default"
                onClick={handleDownload3DModel}
                disabled={!modelSM || !TP}
              >
                <DownloadIcon className="mr-2 h-4 w-4" />
                Download 3D model
              </Button>
              
            </CardContent>
          </Card>

          {/* ── Large-scale raw ── */}
          {/* Large-scale raw Card */}
          <Card className="col-span-1 md:col-span-1 lg:col-span-1">
            <CardHeader>
              <Image className="w-10 h-10 mb-2 text-primary" />
              <CardTitle>Image data</CardTitle>
              <CardDescription>
                Large-scale raw and segmented image data before morphological quantification is downloadable below
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full"
                variant="secondary"
                onClick={() => { window.open("https://www.nature.com/articles/s41467-025-58878-0", "_blank", "noopener,noreferrer"); }}
              >
                <Link2 className="mr-2 h-4 w-4" />
                Natural
              </Button>
              <Button
                className="w-full"
                variant="secondary"
                onClick={() => { window.open("https://www.nature.com/articles/s42003-025-09220-3", "_blank", "noopener,noreferrer"); }}
              >
                <Link2 className="mr-2 h-4 w-4" />
                Natural (fast imaging)
              </Button>
              <Button
                className="w-full"
                variant="secondary"
                onClick={() => { window.open("https://doi.org/10.1038/s41467-020-19863-x", "_blank", "noopener,noreferrer"); }}
              >
                <Link2 className="mr-2 h-4 w-4" />
                Mechanically-compressed
              </Button>
              <Button
                className="w-full"
                variant="secondary"
                onClick={() => { window.open("https://www.nature.com/articles/s42003-025-09220-3", "_blank", "noopener,noreferrer"); }}
              >
                <Link2 className="mr-2 h-4 w-4" />
                Mechanically-compressed (fast imaging)
              </Button>
              <Button
                className="w-full"
                variant="secondary"
                onClick={() => { window.open("https://www.nature.com/articles/s41467-025-58878-0", "_blank", "noopener,noreferrer"); }}
              >
                <Link2 className="mr-2 h-4 w-4" />
                Notch-signaling-blocked
              </Button>
              <Button
                className="w-full"
                variant="secondary"
                onClick={() => { window.open("https://www.nature.com/articles/s41467-025-58878-0", "_blank", "noopener,noreferrer"); }}
              >
                <Link2 className="mr-2 h-4 w-4" />
                Wnt-signaling-blocked
              </Button>
              <Button
                className="w-full"
                variant="secondary"
                onClick={() => { window.open("https://www.nature.com/articles/s41467-025-58878-0", "_blank", "noopener,noreferrer"); }}
              >
                <Link2 className="mr-2 h-4 w-4" />
                Cell-division-accelerated
              </Button>
            </CardContent>
          </Card>

          
        </div>

        {/* Data Format Information */}
        <section className="mt-12 max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">Data format information</h2>
          <div className="space-y-6 text-muted-foreground">
            <div>
              <h3 className="font-semibold text-foreground mb-2">Sample information</h3>
              <p className="mb-4 text-sm">
                Embryos are organized into experimental condition groups. For each sample,
                time resolution, total time points, last cell number (membrane-enclosed cells
                at the final edited time point), and total cell number (cell-region observations
                across all time points) are listed below. The full metadata spreadsheet is also
                available via{" "}
                <button
                  type="button"
                  className="text-primary underline underline-offset-2 hover:text-primary/80"
                  onClick={() => (window.location.href = `${API_BASE}/Download/SampleInfo`)}
                >
                  Sample info (.xlsx)
                </button>
                .
              </p>

              <div className="space-y-8">
                {SAMPLE_GROUP_ORDER.map((groupKey) => {
                  const samples = SMList[groupKey];
                  return (
                    <div key={groupKey}>
                      <div className="mb-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                        <h4 className="font-semibold text-foreground">
                          {SMGroupName[groupKey]}
                        </h4>
                        <span className="text-xs text-muted-foreground">
                          {samples.length} sample{samples.length === 1 ? "" : "s"}
                        </span>
                      </div>
                      <p className="mb-3 text-sm">{SAMPLE_GROUP_BLURB[groupKey]}</p>
                      <div className="rounded-md border border-border/60 overflow-hidden bg-card/40">
                        <Table>
                          <TableHeader>
                            <TableRow className="hover:bg-transparent">
                              <TableHead className="h-9 px-3 text-xs">Sample</TableHead>
                              <TableHead className="h-9 px-3 text-xs">Time resolution</TableHead>
                              <TableHead className="h-9 px-3 text-xs text-right">Total time points</TableHead>
                              <TableHead className="h-9 px-3 text-xs text-right">Last cell number</TableHead>
                              <TableHead className="h-9 px-3 text-xs text-right">Total cell number</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {samples.map((sample) => (
                              <TableRow key={sample}>
                                <TableCell className="px-3 py-2 text-sm font-medium text-foreground">
                                  {sample}
                                </TableCell>
                                <TableCell className="px-3 py-2 text-sm tabular-nums">
                                  {formatTimeResolution(sample)}
                                </TableCell>
                                <TableCell className="px-3 py-2 text-sm text-right tabular-nums">
                                  {formatCount(SampleRange[sample as keyof typeof SampleRange])}
                                </TableCell>
                                <TableCell className="px-3 py-2 text-sm text-right tabular-nums">
                                  {formatCount(SampleCellStage[sample as keyof typeof SampleCellStage])}
                                </TableCell>
                                <TableCell className="px-3 py-2 text-sm text-right tabular-nums">
                                  {formatCount(SampleCellRegion[sample as keyof typeof SampleCellRegion])}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">Quantitative cell morphology feature</h3>
              <p className="mb-2">
                Each sample&apos;s quantitative cell morphology feature (.csv) file contains one row per
                cell at each developmental time point. Column names and meanings:
              </p>
              <div className="bg-muted/50 p-3 rounded-md text-xs font-mono space-y-1.5 mb-2">
                <div><span className="text-primary">Cell name: </span>Lineage identity of the cell (<em>e.g.</em>, ABa, EMS)</div>
                <div><span className="text-primary">Terminal fate: </span>Annotated terminal fate of the lineage; &quot;Unspecified&quot; when not assigned</div>
                <div><span className="text-primary">Time point: </span>Edited imaging frame index within the sample</div>
                <div><span className="text-primary">Cell volume (um3): </span>Cell volume (µm³)</div>
                <div><span className="text-primary">Surface area (um2): </span>Cell membrane surface area (µm²)</div>
                <div><span className="text-primary">Nuclei location X/Y/Z (um): </span>Nucleus coordinates (µm) in the embryo model space</div>
                <div><span className="text-primary">Axis a/b/c (um): </span>Long, intermediate, and short principal-axis lengths (µm; a ≥ b ≥ c)</div>
                <div><span className="text-primary">Contacted cells: </span>Names of cells in direct membrane contact, pipe-separated (<em>e.g.</em>, ABp|EMS)</div>
                <div><span className="text-primary">Contact area (um2): </span>Contact area (µm²) with each contacted cell, pipe-separated in the same order</div>
                <div><span className="text-primary">General sphericity: </span>Equal-volume sphere surface area divided by cell surface area; approaches 1 for a sphere</div>
                <div><span className="text-primary">Diameter sphericity: </span>Equal-volume sphere diameter divided by the longest axis length</div>
                <div><span className="text-primary">Intercept sphericity: </span>Cube root of the volume ratio between the a–b–c ellipsoid and a sphere of diameter a</div>
                <div><span className="text-primary">Maximum projection sphericity: </span>Equal-volume sphere projection area relative to the largest ellipsoid projection</div>
                <div><span className="text-primary">Hayakawa roundness: </span>Volume-to-surface-area ratio normalized by the geometric mean of axis lengths; decreases with surface roughness</div>
                <div><span className="text-primary">Spreading index: </span>General sphericity of the cell&apos;s convex hull; comparison with general sphericity reflects concavity</div>
                <div><span className="text-primary">Elongation ratio: </span>Longest-to-intermediate axis ratio (a/b); higher values indicate elongation along a</div>
                <div><span className="text-primary">Pivotability index: </span>Shortest-to-intermediate axis ratio (c/b); low values indicate thinness along c</div>
                <div><span className="text-primary">Wilson flatness index: </span>Shortest-to-longest axis ratio (c/a); decreases for elongated or flattened cells</div>
                <div><span className="text-primary">Hayakawa flatness ratio: </span>Mean of a and b divided by c; increases when thickness decreases relative to the other axes</div>
                <div><span className="text-primary">Huang shape factor: </span>Mean of b and c divided by a; approaches 1 for equal axes</div>
                <div><span className="text-primary">Corey shape factor: </span>c divided by the geometric mean of a and b; lower values indicate relative thinness and/or elongation</div>
              </div>
              <p className="text-xs">
                Formulas and biological applications for the 12 morphology features are detailed on the{" "}
                <a href="/Background#morphology-features" className="text-primary underline underline-offset-2 hover:text-primary/80">
                  Background
                </a>{" "}
                page.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">Single-cell gene expression</h3>

              <h4 className="font-medium text-foreground mb-1 text-sm">Fluorescence-based</h4>
              <p className="mb-2 text-sm">
                Available for Sample1–Sample8 and Sample11–Sample25 (Natural and
                Mechanically-compressed embryos). Fast-imaging and mutant samples are not included.
                Each sample (.csv) has one row per cell at each time point; remaining columns are
                individual reporter measurements.
              </p>
              <div className="bg-muted/50 p-3 rounded-md text-xs font-mono space-y-1.5 mb-4">
                <div><span className="text-primary">Cell name: </span>Lineage identity of the cell (<em>e.g.</em>, ABa, EMS)</div>
                <div><span className="text-primary">Time point: </span>Edited imaging frame index within the sample</div>
                <div>
                  <span className="text-primary">Reporter columns: </span>
                  Named <span className="text-foreground">geneSymbol_Type_PaperID</span> (<em>e.g.</em>,{" "}
                  <span className="text-foreground"><em>acp-5</em>_Promoter_7</span>,{" "}
                  <span className="text-foreground"><em>aha-1</em>_Protein_5</span>), where Type is Promoter
                  or Protein and PaperID refers to the source dictionary. Values are normalized
                  expression levels.
                </div>
              </div>

              <h4 className="font-medium text-foreground mb-1 text-sm">Sequencing-based</h4>
              <p className="mb-2 text-sm">
                A single matrix (.csv) of transcriptome-wide expression across lineage-resolved
                cells. One row per cell; remaining columns are genes.
              </p>
              <div className="bg-muted/50 p-3 rounded-md text-xs font-mono space-y-1.5 mb-4">
                <div><span className="text-primary">CellName: </span>Lineage identity of the cell (<em>e.g.</em>, ABala, Epr)</div>
                <div>
                  <span className="text-primary">Gene columns: </span>
                  WormBase gene IDs or gene symbols (<em>e.g.</em>,{" "}
                  <span className="text-foreground">2L52.1</span>,{" "}
                  <span className="text-foreground"><em>hlh-1</em></span>,{" "}
                  <span className="text-foreground"><em>zyx-1</em></span>). Values are expression levels for
                  that cell.
                </div>
              </div>

              <h4 className="font-medium text-foreground mb-1 text-sm">Source dictionary</h4>
              <p className="mb-2 text-sm">
                The source dictionary (.xlsx) has two sheets that map fluorescence reporter columns
                to publications:
              </p>
              <p className="mb-1 text-xs font-medium text-foreground">Gene Dictionary</p>
              <div className="bg-muted/50 p-3 rounded-md text-xs font-mono space-y-1.5 mb-3">
                <div><span className="text-primary">Gene: </span>Gene name/ID (<em>e.g.</em>, <em>acp-5</em>, <em>aha-1</em>)</div>
                <div><span className="text-primary">Paper ID: </span>Numeric ID linking to the Source Dictionary sheet</div>
                <div><span className="text-primary">Fusion Type: </span>Promoter or Protein</div>
                <div>
                  <span className="text-primary">Gene Mark Name: </span>
                  Column name used in the fluorescence CSV (<em>e.g.</em>,{" "}
                  <span className="text-foreground"><em>acp-5</em>_Promoter_7</span>)
                </div>
                <div>
                  <span className="text-primary">Replicates: </span>
                  Number of CD-file replicates for this reporter
                </div>
              </div>
              <p className="mb-1 text-xs font-medium text-foreground">Source Dictionary</p>
              <div className="bg-muted/50 p-3 rounded-md text-xs font-mono space-y-1.5 mb-2">
                <div><span className="text-primary">Paper ID: </span>Numeric reference ID</div>
                <div><span className="text-primary">Title: </span>Publication title</div>
                <div><span className="text-primary">DOI: </span>Publication DOI link</div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">3D model</h3>
              <p className="mb-2">
                3D models are Wavefront object files (.obj) of segmented embryonic cell meshes at a
                chosen time point. Download a single time point, or a zip archive of all time points
                for a sample.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">Citation</h3>
              <p>
If EMERGE's quantitative cell morphology feature data contributes to your research, please cite <strong className="text-foreground/70">EMERGE</strong>: c<strong className="text-foreground/70">E</strong>ll <strong className="text-foreground/70">M</strong>orphology and gene <strong className="text-foreground/70">E</strong>xpression for emb<strong className="text-foreground/70">R</strong>yo<strong className="text-foreground/70">GE</strong>nesis.
              </p>
              <p>If you encounter any problems, please feel free to contact :</p><p>
                Pohao Ye (pika_chu at life.hkbu.edu.hk), Yixuan Chen (yixuanchen at stu.pku.edu.cn), Guoye Guan (guanguoye at gmail.com), or Zhongying Zhao (zyzhao at hkbu.edu.hk).
              </p>
            </div>

          </div>
        </section>
      </main>
    </div>
  );
};

export default Download;
