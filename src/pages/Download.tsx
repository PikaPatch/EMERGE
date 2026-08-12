import { useState, useEffect } from "react";
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
import { SampleRange, SMList,SMGroupName } from "@/components/utils/usefulobject";
import { API_BASE } from "@/components/utils/API_BASE";

// ─── Helpers ────────────────────────────────────────────────────────────────

const CMapLabelTheme = "text-sky-600 font-semibold text-xs uppercase tracking-wide";
const CMapItemTheme = "data-[highlighted]:bg-sky-500/10 data-[highlighted]:text-sky-700 data-[state=checked]:text-sky-600";

const CShaperLabelTheme = "text-violet-600 font-semibold text-xs uppercase tracking-wide";
const CShaperItemTheme = "data-[highlighted]:bg-violet-500/10 data-[highlighted]:text-violet-700 data-[state=checked]:text-violet-600";

const EmbSAMLabelTheme = "text-green-600 font-semibold text-xs uppercase tracking-wide";
const EmbSAMItemTheme = "data-[highlighted]:bg-green-500/10 data-[highlighted]:text-green-700 data-[state=checked]:text-green-600";

const MTLabelTheme = "text-pink-600 font-semibold text-xs uppercase tracking-wide";
const MTItemTheme = "data-[highlighted]:bg-pink-500/10 data-[highlighted]:text-pink-700 data-[state=checked]:text-pink-600";
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
          <SelectLabel className={MTLabelTheme}>Notch-signaling-blocked (lag-1)</SelectLabel>
          {SMList.MT_lag1.map((s) => (
            <SelectItem key={s} value={s} className={MTItemTheme} disabled={Expression}>
              {s}
            </SelectItem>
          ))}
        </SelectGroup>
        <SelectSeparator />

        <SelectGroup>
          <SelectLabel className={MTLabelTheme}>Wnt-signaling-blocked (pop-1)</SelectLabel>
          {SMList.MT_pop1.map((s) => (
            <SelectItem key={s} value={s} className={MTItemTheme} disabled={Expression}>
              {s}
            </SelectItem>
          ))}
        </SelectGroup>
        <SelectSeparator />

        <SelectGroup>
          <SelectLabel className={MTLabelTheme}>Cell-division-accelerated (wee-1.1)</SelectLabel>
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
                onClick={() => { window.open("https://www.nature.com/articles/s42003-025-09220-3", "_blank", "noopener,noreferrer"); }}
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
        <section className="mt-12 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">Data format information</h2>
          <div className="space-y-6 text-muted-foreground">
            <div>
              <h3 className="font-semibold text-foreground mb-2">Sample information</h3>
              <div className="text-xs space-y-1">
                <div><span className="font-semibold">CMap samples: </span>WT_Sample1 through WT_Sample8 — Wild-type <em>C. elegans</em> embryos (CMap8)</div>
                <div><span className="font-semibold">CShaper samples: </span>Sample04 through Sample20 (CShaper17)</div>
                <div><span className="font-semibold">Time points: </span>Range from 1 to 255 depending on sample (see metadata for exact range)</div>
                <div><span className="font-semibold">Temporal resolution: </span>~1.5 minute per time point during early embryogenesis</div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">Quantitative cell morphology feature</h3>
              <p className="mb-2">
                The quantitative cell morphology feature (.csv) file contains comprehensive cell information across developmental time points.
              </p>
              <div className="bg-muted/50 p-3 rounded-md text-xs font-mono space-y-1 mb-2">
                <div><span className="text-primary">Cell name: </span>Cell identity</div>
                <div><span className="text-primary">Time point: </span>Imagine time frame number</div>
                <div><span className="text-primary">Terminal fate: </span>Cell lineage terminal fate</div>
                <div><span className="text-primary">Volume, Surface area: </span>Cell volume(µm³) and cell surface area(µm²),</div>
                <div><span className="text-primary">Nuclei location X, Y, Z: </span>Nucleus location of this cell, relative to the whole cell model</div>
                <div><span className="text-primary">Axis_a, b, c: </span>Cell axis length</div>
                <div><span className="text-primary">Contacted cells, Contact area: </span>All cells with direct contact with this cells and the contacted area at this time point</div>
                <div><span className="text-primary">General Sphericity...: </span>12 morphology features</div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">3D model files</h3>
              <p className="mb-2">3D object files(.obj) contain 3D geometry data of embryonic cells at specific time points.</p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">Gene expression</h3>
              <p className="mb-2">
                Expression data contains normalized transcription factor(promoter and protein fusion) expression levels across developmental time points.
              </p>
              <div className="bg-muted/50 p-3 rounded-md text-xs font-mono space-y-1 mb-2">
                <div><span className="text-primary">Cell name, Time point: </span>Cell identity and time point</div>
                <div><span className="text-primary">Gene: </span>The format is gene symbol + promoter/protein fusion + paper ID.</div>
              </div>
              {/* <p className="text-xs">
                <span className="font-semibold">Example: </span>
                &quot;AB&quot;, 0, 0.45; &quot;ABa&quot;, 1, 0.62
              </p> */}
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">Expression metadata data</h3>
              <p className="mb-2">Metadata file provides information about all florecene reporter gene expression data collected.</p>
              <div className="bg-muted/50 p-3 rounded-md text-xs font-mono space-y-1 mb-2">
                <div><span className="text-primary">Gene: </span>Gene name/ID (e.g., lin-39, elt-2)</div>
                <div><span className="text-primary">Type: </span>Fusion type (promoter or protein)</div>
                <div><span className="text-primary">PaperID: </span>Paper ID used for reference in EMERGE database</div>
                <div><span className="text-primary">Source: </span>Publication DOI or reference link</div>
              </div>
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
