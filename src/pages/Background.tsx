import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Worm,
  Sparkles,
  GitBranch,
  Award,
  Microscope,
  Dna,
  Egg,
  Layers,
  Shuffle,
  StretchHorizontal,
} from "lucide-react";
import f1 from "/img/intro/f1.jpg";
import f2 from "/img/intro/f2.png";
import f3 from "/img/intro/f3.png";
import f4 from "/img/intro/f4.png";
import f5 from "/img/intro/f5.png";

/* ---------- Reusable building blocks ---------- */

// Section wrapper with leading icon tile, eyebrow number, and consistent rhythm.
const Section = ({
  id,
  icon: Icon,
  title,
  eyebrow,
  children,
}: {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: React.ReactNode;
  eyebrow?: string;
  children: React.ReactNode;
}) => (
  <section id={id} className="scroll-mt-28">
    <div className="mb-6 flex items-start gap-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-5xl">
          {title}
        </h2>
      </div>
    </div>
    {children}
  </section>
);

// Figure card — image + figcaption inside a styled Card.
const FigureCard = ({
  src,
  alt,
  number,
  caption,
  className = "",
}: {
  src: string;
  alt: string;
  number: number;
  caption: React.ReactNode;
  className?: string;
}) => (
  <figure className={`flex flex-col gap-3 ${className}`}>
    <Card className="overflow-hidden border-border/60 bg-muted/30 p-0">
      <img src={src} alt={alt} className="h-auto w-full object-contain" />
    </Card>
    <figcaption className="px-1 text-xs leading-snug text-muted-foreground">
      <strong className="text-foreground">Fig. {number}</strong> {caption}
    </figcaption>
  </figure>
);

/* ---------- Static data ---------- */

const tocItems = [
  { id: "what-is", label: "What is C. elegans?" },
  { id: "embryogenesis", label: "Embryogenesis at a Glance" },
  { id: "lineage", label: "Eutely & Invariant Lineage" },
  { id: "nobel", label: "Scientific Impact" },
  { id: "imaging", label: "Whole-Embryo Imaging" },
  { id: "expression", label: "Gene Expression Profiling" },
] as const;

const keyStats = [
  { value: "959", label: "Somatic cells", hint: (<>in the adult hermaphrodite<sup><a href="https://doi.org/10.1895/wormbook.1.177.1" className="text-primary hover:underline">7</a></sup></>) },
  { value: "508", label: "Living cells at hatching", hint: (<>after 113 apoptotic cell deaths<sup><a href="https://www.ncbi.nlm.nih.gov/books/NBK20034/" className="text-primary hover:underline">8</a></sup></>) },
  { value: "10–12 h", label: "Embryogenesis", hint: (<>at 20 °C<sup><a href="https://doi.org/10.1895/wormbook.1.177.1" className="text-primary hover:underline">9</a></sup></>) },
  { value: "~20 k", label: "Protein-coding genes", hint: (<>first genetically sequenced metazoan<sup><a href="https://doi.org/10.1126/science.282.5396.2012" className="text-primary hover:underline">10</a></sup></>) },
] as const;

const developmentSteps = [
  {
    icon: Egg,
    step: "01",
    title: "Fertilisation",
    body: "Haploid oocyte and sperm fuse inside the spermatheca. The zygote exits prophase arrest and a three-layered eggshell is secreted around the embryo.",
  },
  {
    icon: Layers,
    step: "02",
    title: "Proliferation",
    body: (
      <>
        Rapid, coordinated cell divisions generate the six somatic founder
        lineages (<i>i.e.,</i> AB, MS, E, C, D, P4).
      </>
    ),
  },
  {
    icon: Shuffle,
    step: "03",
    title: "Gastrulation",
    body: "Since the ~30-cell stage, endoderm and mesoderm precursor cells start to be internalized. Cell fate is specified through both lineage differentiation and inductive signaling.",
  },
  {
    icon: StretchHorizontal,
    step: "04",
    title: "Morphogenesis",
    body: "Actomyosin-driven cell morphology changes drive embryo elongation and bending, transforming a round multicellular mass into a larva with a recognizable metazoan body plan, including distinct anterior-posterior, left-right, and dorsal-ventral axes.",
  },
] as const;

const nobelPrizes = [
  {
    "year": "2002",
    "prize": "Nobel Prize in Physiology or Medicine",
    "recipients": "Sydney Brenner · H. Robert Horvitz · John E. Sulston",
    "discovery": "Genetic regulation of organ development and programmed cell death (apoptosis)"
  },
  {
    "year": "2006",
    "prize": "Nobel Prize in Physiology or Medicine",
    "recipients": "Andrew Z. Fire · Craig C. Mello",
    "discovery": "RNA interference — gene silencing by double-stranded RNA"
  },
  {
    "year": "2008",
    "prize": "Nobel Prize in Chemistry",
    "recipients": "Osamu Shimomura · Martin Chalfie · Roger Y. Tsien",
    "discovery": "Discovery and development of the green fluorescent protein (GFP)"
  },
  {
    "year": "2024",
    "prize": "Nobel Prize in Physiology or Medicine",
    "recipients": "Victor Ambros · Gary Ruvkun",
    "discovery": "Discovery of microRNA and its role in post-transcriptional gene regulation"
  }
] as const;

/* ---------- Page ---------- */

const Introduction = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero / Header */}
      <header className="relative overflow-hidden border-b border-border bg-gradient-to-b from-primary/5 via-card/40 to-background">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]"
        >
          <div className="absolute -top-24 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
        </div>
        <div className="container relative mx-auto px-6 py-14">
          <div className="mx-auto max-w-4xl">
            <Badge variant="secondary" className="mb-4 gap-1.5">
              <Sparkles className="h-3 w-3" />
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              <em className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent not-italic">
                Morphological dynamics
              </em>{" "}
               during embryonic development
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              A transparent spatiotemporal blueprint of development from a single cell to a living organism.
            </p>
          </div>
        </div>
      </header>

      {/* Main + Sidebar TOC */}
      <main className="container mx-auto px-6 py-12">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_240px]">
          {/* Content column */}
          <div className="min-w-0 space-y-16">
            {/* Section 1: What is C. elegans */}
            <Section
              id="what-is"
              icon={Worm}
              eyebrow="01"
              title={<>What is <em>C. elegans</em>?</>}
            >
              <div className="grid items-start gap-8 md:grid-cols-1">
                <Card className="border-border/60 col-span-1">
                  <CardContent className="space-y-4 p-6 text-base leading-relaxed text-foreground/90">
                  <p>
                    <em>C. elegans</em> is a free-living soil nematode, 
                    roughly 1 mm in length, that feeds on microorganisms<sup><a href="https://doi.org/10.1895/wormbook.1.177.1" className="text-primary hover:underline">1</a></sup>. 
                    Despite its anatomical simplicity, the adult hermaphrodite contains exactly 959 somatic cells, 
                    each of which can be traced back to the zygote through a completely invariant cell lineage<sup><a href="https://wormatlas.org/SulstonNeuronalCellLineages/Sulston1983.html" className="text-primary hover:underline">2</a></sup>. 
                    Its body is optically transparent throughout development, enabling internal structures and organelles to 
                    be imaged in living animals by standard fluorescence microscopy without dissection or fixation 
                    <sup><a href="https://www.ncbi.nlm.nih.gov/books/NBK19652/" className="text-primary hover:underline">3</a></sup>. <em>C. elegans</em> {" "}
                    is also exceptionally amenable to genetic analysis: it can reproduce either by self-fertilization 
                    as a hermaphrodite or by crossing with males, has a rapid life cycle of approximately 3 days, and 
                    possesses a compact genome of about 19,000 genes<sup><a href="https://doi.org/10.1126/science.282.5396.2012" className="text-primary hover:underline">4</a></sup>. 
                    It was the first multicellular species to have its genome fully sequenced<sup><a href="https://doi.org/10.1126/science.282.5396.2012" className="text-primary hover:underline">5</a></sup>.
                  </p>
                  </CardContent>
                </Card>

                <FigureCard
                    src={f1}
                    alt="Microscopic image of an adult hermaphrodite C. elegans, containing self-fertilized embryos"
                    number={1}
                    caption={
                      <>
                        Microscopic image of an adult hermaphrodite <em>C. elegans</em>, containing self-fertilized embryos
                      </>
                    }
                  />
              </div>

              {/* Key stats strip */}
              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {keyStats.map((stat) => (
                  <Card
                    key={stat.label}
                    className="border-border/60 bg-card/50 backdrop-blur-sm"
                  >
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold tracking-tight text-foreground">
                        {stat.value}
                      </div>
                      <div className="mt-0.5 text-xs font-medium text-foreground/80">
                        {stat.label}
                      </div>
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        {stat.hint}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </Section>

            <Separator />

            {/* Section 2: Embryogenesis at a Glance */}
            <Section
              id="embryogenesis"
              icon={Sparkles}
              eyebrow="02"
              title={<><em>C. elegans</em> embryogenesis at a glance</>}
            >
              <Card className="mb-6 border-border/60">
                <CardContent className="space-y-4 p-6 text-base leading-relaxed text-foreground/90">
                  <p>
                    Fertilization occurs within the spermatheca of adult hermaphrodite. 
                    The newly formed embryo is encased in a rigid, ellipsoidal eggshell 
                    and then laid into environment, where it completes embryonic development 
                    within ~10-12 hours at 20°C. During this period, a single cell undergoes 
                    a highly stereotyped cascade of proliferation, gastrulation, and morphogenesis 
                    to produce a larva hermaphrodite with 558 living cells and 131 dead cells at hatching. 
                    The developed body contains multiple tissue/organ fates: skin, muscle, pharynx, neuron, 
                    intestine, and so on and so forth. 
                  </p>
                </CardContent>
              </Card>

              {/* 4-step timeline as cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {developmentSteps.map(({ icon: StepIcon, step, title, body }) => (
                  <Card
                    key={step}
                    className="group border-border/60 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                  >
                    <CardHeader className="pb-3">
                      <div className="mb-2 flex items-center justify-between">
                        {/* <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                          <StepIcon className="h-4 w-4" />
                        </div> */}
                        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
                          {step}
                        </span>
                      </div>
                      <CardTitle className="text-base">{title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-sm leading-relaxed">
                        {body}
                      </CardDescription>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </Section>

            <Separator />

            {/* Section 3: Eutely & Invariant Lineage */}
            <Section
              id="lineage"
              icon={GitBranch}
              eyebrow="03"
              title="Invariant Cell Lineage and Precise Cell Position"
            >
              <div className="grid items-start gap-8 md:grid-cols-2">
                <Card className="border-border/60 col-span-1">
                  <CardContent className="space-y-4 p-6 text-base leading-relaxed text-foreground/90">
                    <p>
                      <em>C. elegans</em> exhibits eutely — every individual of the same sex produces the same number of somatic cells in similar positions<sup><a href="https://doi.org/10.1016/0012-1606(77)90158-0" className="text-primary hover:underline">11</a></sup>. Unlike vertebrate embryogenesis, where stochastic variation is the norm, the <em>C. elegans</em> cell lineage is essentially identical from individual to individual. Each cell can therefore be assigned a unique, reproducible name based on its ancestry.
This invariance and precision make it possible to record a 3D+time atlas of all cells across the entire embryo, integrating lineage and fate information — a level of single-cell resolution unmatched by any vertebrate model. The complete <em>C. elegans</em> embryonic cell lineage remains one of the most foundational knowledge maps in developmental biology<sup><a href="https://doi.org/10.1016/0012-1606(83)90201-4" className="text-primary hover:underline">12</a></sup>.

                    </p>
                  </CardContent>
                </Card>

                <div className="col-span-1">
                  <FigureCard
                    src={f2}
                    alt=""
                    number={2}
                    caption=
                    {<>
                      Invariant cell lineage revealed by experimentally measured cell cycle lengths across 17 individual embryos
                      <sup>
                        <a href="https://doi.org/10.1016/j.csbj.2022.08.024" className="text-primary hover:underline">
                          13
                        </a>
                      </sup>.
                    </>}
                  />
                  <FigureCard
                    src={f3}
                    alt=""
                    number={3}
                    caption={<>
                      Precise cell position revealed by experimentally measured cell nucleus
                      locations across 17 individual embryos
                      <sup>
                        <a href="https://doi.org/10.1038/s41467-020-19863-x" className="text-primary hover:underline">
                          14
                        </a>
                      </sup>.
                    </>}
                  />
                </div>
              </div>
            </Section>

            <Separator />

            {/* Section 4: Scientific Impact & Nobel Legacy */}
            <Section
              id="nobel"
              icon={Award}
              eyebrow="04"
              title="Scientific Impact & Nobel Legacy"
            >
              <Card className="mb-6 border-border/60">
                <CardContent className="p-6 text-base leading-relaxed text-foreground/90">
                  <p>
                    Research in <em>C. elegans</em> has generated fundamental
                    insights into organ development, apoptosis, and gene
                    silencing — discoveries of such universal importance that
                    they have been recognised with multiple Nobel Prizes in
                    Physiology or Medicine.
                  </p>
                </CardContent>
              </Card>

              <div className="grid gap-5 sm:grid-cols-2">
                {nobelPrizes.map(({ year, recipients, discovery }) => (
                  <Card
                    key={year}
                    className="group border-border/60 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                  >
                    <CardHeader>
                      <div className="mb-2 flex items-center gap-2">
                        <Badge variant="secondary" className="gap-1.5">
                          <Award className="h-3 w-3" />
                          Nobel Prize
                        </Badge>
                        <Badge variant="outline">{year}</Badge>
                      </div>
                      <CardTitle className="text-base leading-snug">
                        {recipients}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-sm italic leading-relaxed">
                        “{discovery}”
                      </CardDescription>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                These breakthroughs, alongside advances in connectomics, aging
                research, and drug screening, have established{" "}
                <em>C. elegans</em> as one of the most productive model
                organisms in the history of biology — bridging the gap between
                molecular mechanisms and whole-organism behaviour.
              </p>
            </Section>

            <Separator />

            {/* Section 5: Whole-Embryo Imaging */}
            <Section
              id="imaging"
              icon={Microscope}
              eyebrow="05"
              title="Whole-Embryogenesis Imaging & Cell Morphology Segmentation"
            >
              <div className="grid items-start gap-8 md:grid-cols-2">
                <Card className="mb-8 border-border/60 col-span-1">
                  <CardContent className="space-y-4 p-6 text-base leading-relaxed text-foreground/90">
                  <p>
                    Under customized light excitation to guarantee viability, {" "}
                    <em>C. elegans</em> embryonic development can be imaged by confocal 
                    microscopy at ~1.5 min intervals, with cell nuclei fluorescently 
                    labeled for body-wide cell lineage tracing. An additional fluorescence 
                    channel labeling cell membrane further enables cell morphology segmentation 
                    of every individual cell throughout embryogenesis, with resolved cell lineage 
                    that covers the fates of all tissues and organs (<em>e.g.</em>, skin, muscle, pharynx, neuron, intestine)<sup>
                        <a href="https://doi.org/10.1038/s41467-025-58878-0" className="text-primary hover:underline">
                          15
                        </a>
                      </sup> .
                  </p>
                  </CardContent>
                </Card>

                <FigureCard
                  src={f4}
                  alt="Whole-embryogenesis fluorescence monitoring of cell nucleus (GFP) and cell membrane (mCherry), followed by lineage-resolved quantification."
                  number={4}
                  caption=
                  {<>
                      Whole-embryogenesis fluorescence monitoring of cell nucleus (GFP) and cell membrane (mCherry), followed by lineage-resolved quantification
                      <sup>
                        <a href="https://doi.org/10.1038/s42003-025-09220-3" className="text-primary hover:underline">
                          16
                        </a>
                      </sup>.
                    </>}
                  className="max-w-2xl col-span-1"
                />
              </div>
            </Section>

            <Separator />

            {/* Section 6: Gene Expression Profiling */}
            <Section
              id="expression"
              icon={Dna}
              eyebrow="06"
              title="Whole-Embryogenesis Imaging & Gene Expression Profiling"
            >
              <div className="grid items-start gap-8 md:grid-cols-2">
                <Card className="border-border/60">
                  <CardContent className="space-y-4 p-6 text-base leading-relaxed text-foreground/90">
                    <p>
                      Under customized light excitation to guarantee viability, <em>C. elegans</em> {" "}
                      embryonic development can be imaged by confocal microscopy at ~1.5 min intervals, 
                      with cell nuclei fluorescently labeled for body-wide cell lineage tracing<sup>
                        <a href="https://doi.org/10.1073/pnas.0511111103" className="text-primary hover:underline">
                          17
                        </a>
                      </sup>. 
                      An additional fluorescence channel labeling cell membrane further enables 
                      gene expression profiling of every individual cell throughout embryogenesis, 
                      with resolved cell lineage that covers the fates of all tissues and organs 
                      (<em>e.g.</em>, skin, muscle, pharynx, neuron, intestine)<sup>
                        <a href="https://doi.org/10.1038/nmeth.1228" className="text-primary hover:underline">
                          18
                        </a>
                      </sup>.
                    </p>
                  </CardContent>
                </Card>

                <FigureCard
                  src={f5}
                  alt="Embryo with GFP labelling nuclei and mCherry labelling promoter activity of hlh-1 muscle-specific transcription factor, followed by expression profiling"
                  number={5}
                  caption={
                    <>
                      Whole-embryogenesis fluorescence monitoring of cell nuclei (GFP) and gene expression (mCherry), followed by lineage-resolved quantification<sup>
                        <a href="https://doi.org/10.3389/fcell.2022.978962" className="text-primary hover:underline">
                          19
                        </a>
                      </sup>.
                    </>
                  }
                />
              </div>
            </Section>
          </div>

          {/* Sticky sidebar TOC */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <Card className="border-border/60 bg-card/40 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    On this page
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <nav>
                    <ul className="space-y-1 text-sm">
                      {tocItems.map((item) => (
                        <li key={item.id}>
                          <a
                            href={`#${item.id}`}
                            className="block rounded-md px-2 py-1.5 font-medium text-foreground/90 transition-colors hover:bg-muted hover:text-foreground"
                          >
                            {item.label.includes("C. elegans") ? (
                              <>
                                {item.label.split("C. elegans")[0]}
                                <em>C. elegans</em>
                                {item.label.split("C. elegans")[1]}
                              </>
                            ) : item.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </CardContent>
              </Card>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default Introduction;
