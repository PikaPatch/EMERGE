import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Shapes,
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
  { id: "morphology-features", label: "12 Morphology Features" },
] as const;

/** Inline math helpers for morphology formulas */
const Cuberoot = ({ children }: { children: React.ReactNode }) => (
  <span>
    <sup>3</sup>√({children})
  </span>
);
const Frac = ({
  num,
  den,
}: {
  num: React.ReactNode;
  den: React.ReactNode;
}) => (
  <span className="inline-flex flex-col items-center align-middle text-[0.85em] leading-none mx-0.5">
    <span className="border-b border-foreground/70 px-0.5 pb-0.5">{num}</span>
    <span className="px-0.5 pt-0.5">{den}</span>
  </span>
);

type MorphologyFeatureRow = {
  category?: string;
  categoryRowSpan?: number;
  feature: string;
  formula: React.ReactNode;
  minShape: string;
  maxShape: string;
  description: string;
  applications: React.ReactNode;
};

const morphologyFeatures: MorphologyFeatureRow[] = [
  {
    category: "Sphericity",
    categoryRowSpan: 4,
    feature: "General Sphericity",
    formula: (
      <Frac
        num={<Cuberoot>36π<i>V</i><sup>2</sup></Cuberoot>}
        den={<i>S</i>}
      />
    ),
    minShape: "/img/intro/shapes/general-sphericity-min.png",
    maxShape: "/img/intro/shapes/general-sphericity-max.png",
    description:
      "Surface area of an equal-volume sphere divided by the cell surface area. Values approach 1 for a sphere and decrease when the surface becomes more irregular.",
    applications: (
      <>
        Used to describe (1) cell migration velocity (Cao et al., <i>Nat. Commun.</i>, 2020);
        (2) the transition from a relatively rounded to a dumbbell-shaped membrane during cytokinesis
        (Guan et al., LangTaoSha Preprint, 2026); (3) red blood cell shape transitions and osmotic
        deformation (Geekiyanage et al., <i>PLoS One</i>, 2019); (4) the extent of brain injury of
        microglial cells (St Pierre et al., <i>Life</i>, 2023); (5) phytoplankton morphological
        diversity (Ryabov et al., <i>Ecol. Lett.</i>, 2021).
      </>
    ),
  },
  {
    feature: "Diameter Sphericity",
    formula: (
      <Frac
        num={<Cuberoot>6<i>V</i>/π</Cuberoot>}
        den={<i>a</i>}
      />
    ),
    minShape: "/img/intro/shapes/diameter-sphericity-min.png",
    maxShape: "/img/intro/shapes/diameter-sphericity-max.png",
    description:
      "Diameter of an equal-volume sphere divided by the longest axis length. Lower values indicate less volume relative to longitudinal extent, where the spherical reference is 1.",
    applications: (
      <>
        A candidate for tracking longitudinal deformation, with a strong correlation with general
        sphericity (Guan et al., <i>Membranes</i>, 2024). Used to evaluate three-dimensional gravel
        morphology (Hayakawa and Oguchi, <i>Comput. Geosci.</i>, 2005).
      </>
    ),
  },
  {
    feature: "Intercept Sphericity",
    formula: <Cuberoot><Frac num={<><i>bc</i></>} den={<><i>a</i><sup>2</sup></>} /></Cuberoot>,
    minShape: "/img/intro/shapes/intercept-sphericity-min.png",
    maxShape: "/img/intro/shapes/intercept-sphericity-max.png",
    description:
      "Cube root of the volume ratio between an ellipsoid with full axis lengths a, b and c and a sphere of diameter a. Values approach 1 for equal axes and decrease with axis inequality.",
    applications: (
      <>
        Positively correlated with general sphericity (Guan et al., <i>Membranes</i>, 2024). Used to
        simulate isotropic and anisotropic growth of brain tumour masses (Ballatore et al.,{" "}
        <i>Comput. Mech.</i>, 2024).
      </>
    ),
  },
  {
    feature: "Maximum Projection Sphericity",
    formula: <Cuberoot><Frac num={<><i>c</i><sup>2</sup></>} den={<><i>ab</i></>} /></Cuberoot>,
    minShape: "/img/intro/shapes/maximum-projection-sphericity-min.png",
    maxShape: "/img/intro/shapes/maximum-projection-sphericity-max.png",
    description:
      "The equal-volume sphere projection area divided by the largest ellipsoid projection area, with a two-thirds power. Values approach 1 for equal axes and decrease with relative thinness.",
    applications: (
      <>
        Used to characterize particle morphology and settling behaviour such as river pebbles (Sneed
        and Folk, <i>J. Geol.</i>, 1958).
      </>
    ),
  },
  {
    category: "Roundness",
    categoryRowSpan: 1,
    feature: "Hayakawa Roundness",
    formula: (
      <Frac
        num={<i>V</i>}
        den={
          <>
            <i>S</i>
            <Cuberoot>
              <i>abc</i>
            </Cuberoot>
          </>
        }
      />
    ),
    minShape: "/img/intro/shapes/hayakawa-roundness-min.png",
    maxShape: "/img/intro/shapes/hayakawa-roundness-max.png",
    description:
      "Volume-to-surface-area ratio normalized by the geometric mean of the three axis lengths. A sphere gives 1/6, while the value decreases as the surface of the object becomes rougher.",
    applications: (
      <>
        Used to track (1) shape changes associated with the progress of cytokinesis (Guan et al.,
        LangTaoSha Preprint, 2026); (2) synergistic differentiation between morphology and gene
        expression among descendants of the <i>C. elegans</i> D lineage (Guan et al.,{" "}
        <i>Membranes</i>, 2024); (3) the roundness of gravel (Hayakawa and Oguchi,{" "}
        <i>Comput. Geosci.</i>, 2005).
      </>
    ),
  },
  {
    category: "Convex Hull",
    categoryRowSpan: 1,
    feature: "Spreading Index",
    formula: (
      <Frac
        num={
          <Cuberoot>
            36π<i>V</i>
            <sub>convex</sub>
            <sup>2</sup>
          </Cuberoot>
        }
        den={
          <>
            <i>S</i>
            <sub>convex</sub>
          </>
        }
      />
    ),
    minShape: "/img/intro/shapes/spreading-index-min.png",
    maxShape: "/img/intro/shapes/spreading-index-max.png",
    description:
      "General sphericity calculated for the convex hull of the original object. A spherical hull gives 1, and comparing General Sphericity with Spreading Index reveals geometric concavity and convexity.",
    applications: (
      <>
        Used to describe (1) neurite outgrowth and growth-cone morphology in two-dimensional contour
        (Kawa et al., <i>J. Neurosci. Methods</i>, 1998); (2) microglial spatial coverage (St Pierre
        et al., <i>Life</i>, 2023).
      </>
    ),
  },
  {
    category: "Shape Factor",
    categoryRowSpan: 6,
    feature: "Elongation Ratio",
    formula: <Frac num={<i>a</i>} den={<i>b</i>} />,
    minShape: "/img/intro/shapes/elongation-ratio-min.png",
    maxShape: "/img/intro/shapes/elongation-ratio-max.png",
    description:
      "Longest-to-intermediate axis ratio. Increasing values indicate preferential extension along the longest axis.",
    applications: (
      <>
        Used to track (1) cell elongation during dorsal intercalation (Guan et al., LangTaoSha
        Preprint, 2026); (2) placental syncytial-knot morphology in pre-eclampsia (Hermans et al.,{" "}
        <i>Int. J. Mol. Sci.</i>, 2023); (3) cell spreading, nuclear deformation and molecular
        transport into the nucleus (Nava et al., <i>Biomech. Model. Mechanobiol.</i>, 2015);
        (4) phytoplankton morphological diversity (Ryabov et al., <i>Ecol. Lett.</i>, 2021);
        (5) biomaterial performance of living cells in culture (Belay et al., <i>Sci. Rep.</i>, 2021).
      </>
    ),
  },
  {
    feature: "Pivotability Index",
    formula: <Frac num={<i>c</i>} den={<i>b</i>} />,
    minShape: "/img/intro/shapes/pivotability-index-min.png",
    maxShape: "/img/intro/shapes/pivotability-index-max.png",
    description:
      "Shortest-to-intermediate axis ratio. Low values indicate a thin third dimension relative to the intermediate axis. Values near 1 occur in a perfect sphere or elongated rod-like shapes.",
    applications: (
      <>
        Proposed to distinguish flattened from approximately axisymmetric elongated cells. Used to
        evaluate (1) nuclear flattening and effects of compression on nuclear spatial organization
        (Andrey et al., <i>PLoS Comput. Biol.</i>, 2010); (2) MS-lineage shape differentiation (Guan
        et al., <i>Membranes</i>, 2024); (3) biomaterial performance of living cells in culture (Belay
        et al., <i>Sci. Rep.</i>, 2021).
      </>
    ),
  },
  {
    feature: "Wilson Flatness Index",
    formula: <Frac num={<i>c</i>} den={<i>a</i>} />,
    minShape: "/img/intro/shapes/wilson-flatness-index-min.png",
    maxShape: "/img/intro/shapes/wilson-flatness-index-max.png",
    description:
      "Shortest-to-longest axis ratio. Values decrease in both elongated and flattened cells.",
    applications: (
      <>
        Used to describe (1) cell spreading, nuclear deformation and molecular transport into the
        nucleus (Nava et al., <i>Biomech. Model. Mechanobiol.</i>, 2015); (2) MS-lineage shape
        differentiation (Guan et al., <i>Membranes</i>, 2024).
      </>
    ),
  },
  {
    feature: "Hayakawa Flatness Ratio",
    formula: <Frac num={<><i>a</i>+<i>b</i></>} den={<>2<i>c</i></>} />,
    minShape: "/img/intro/shapes/hayakawa-flatness-ratio-min.png",
    maxShape: "/img/intro/shapes/hayakawa-flatness-ratio-max.png",
    description:
      "Mean of the longest and intermediate axis lengths divided by the shortest. Values increase when thickness decreases relative to the other axes.",
    applications: (
      <>
        Used to describe (1) MS-lineage shape differentiation (Guan et al., <i>Membranes</i>, 2024);
        (2) shape-dependent transport and settling behaviour of particles, distinguishing equant,
        oblate, elongated and bladed particles (Sneed and Folk, <i>J. Geol.</i>, 1958).
      </>
    ),
  },
  {
    feature: "Huang Shape Factor",
    formula: <Frac num={<><i>b</i>+<i>c</i></>} den={<>2<i>a</i></>} />,
    minShape: "/img/intro/shapes/huang-shape-factor-min.png",
    maxShape: "/img/intro/shapes/huang-shape-factor-max.png",
    description:
      "Mean of the intermediate and shortest axis lengths divided by the longest. Values approach 1 for equal axes and decrease with dominance of the longest axis.",
    applications: (
      <>
        Used to investigate how the shapes of pumice, glass shards and crystal particles influence
        settling velocity and modes of motion (Wilson and Huang, <i>Earth Planet. Sci. Lett.</i>,
        1979).
      </>
    ),
  },
  {
    feature: "Corey Shape Factor",
    formula: (
      <Frac
        num={<i>c</i>}
        den={
          <>
            √(<i>ab</i>)
          </>
        }
      />
    ),
    minShape: "/img/intro/shapes/corey-shape-factor-min.png",
    maxShape: "/img/intro/shapes/corey-shape-factor-max.png",
    description:
      "Shortest axis divided by the geometric mean of the longest and intermediate axes, reflecting axis anisotropy. Values near 1 indicate similar axis lengths; lower values indicate relative thinness and/or elongation.",
    applications: (
      <>
        Used to investigate how volcanic-particle thickness and transverse dimensions influence
        settling behaviour in fluids (Komar and Reimers, <i>J. Geol.</i>, 1978).
      </>
    ),
  },
];

const keyStats = [
  { value: "959", label: "Somatic cells", hint: (<>in the adult hermaphrodite<sup><a href="https://doi.org/10.1895/wormbook.1.177.1" className="text-primary hover:underline">7</a></sup></>) },
  { value: "558", label: "Living cells at hatching", hint: (<>after 113 apoptotic cell deaths (in the hermaphrodite)<sup><a href="https://www.ncbi.nlm.nih.gov/books/NBK20034/" className="text-primary hover:underline">8</a></sup></>) },
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
              title={<><em>C. elegans</em> Embryogenesis at a Glance</>}
            >
              <Card className="mb-6 border-border/60">
                <CardContent className="space-y-4 p-6 text-base leading-relaxed text-foreground/90">
                  <p>
                    Fertilization occurs within the spermatheca of adult hermaphrodite. 
                    The newly formed embryo is encased in a rigid, ellipsoidal eggshell 
                    and then laid into environment, where it completes embryonic development 
                    within ~10-12 hours at 20°C. During this period, a single cell undergoes 
                    a highly stereotyped cascade of proliferation, gastrulation, and morphogenesis 
                    to produce a larva hermaphrodite with 558 living cells and 113 dead cells at hatching. 
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

            <Separator />

            {/* Section 7: 12 Morphology Features */}
            <Section
              id="morphology-features"
              icon={Shapes}
              eyebrow="07"
              title="Quantitative Morphology Features"
            >
              <Card className="mb-6 border-border/60">
                <CardContent className="space-y-4 p-6 text-base leading-relaxed text-foreground/90">
                  <p>
                    From the segmented 3D cell membrane of every cell, EMERGE computes 12
                    geometrically interpretable morphology features spanning sphericity, roundness,
                    convex-hull geometry, and axis-based shape factors. These descriptors quantify
                    how closely a cell approaches a sphere, how elongated or flattened it is, and
                    how irregular its surface is — enabling systematic comparison of morphological
                    dynamics across lineage, fate, and developmental time.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Notation.</strong>{" "}
                    <i>V</i> and <i>S</i> are the volume and surface area of the 3D region enclosed by
                    the cell membrane; <i>V</i>
                    <sub>convex</sub> and <i>S</i>
                    <sub>convex</sub> are those of its convex hull; and <i>a</i>, <i>b</i>, <i>c</i>{" "}
                    (<span className="whitespace-nowrap">(<i>a</i> ≥ <i>b</i> ≥ <i>c</i>)</span> are
                    the long, intermediate, and short axes of the region (eigenvalues of the
                    coordinate covariance matrix of all voxels within the region).
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/60 overflow-hidden">
                <CardContent className="overflow-x-auto p-0">
                  <Table className="min-w-[64rem] table-fixed">
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[10%] whitespace-nowrap">Category</TableHead>
                        <TableHead className="w-[12%]">Morphology feature</TableHead>
                        <TableHead className="w-[11%] text-center">Formula</TableHead>
                        <TableHead className="w-[9%] text-center">Min</TableHead>
                        <TableHead className="w-[9%] text-center">Max</TableHead>
                        <TableHead className="w-[22%]">Description</TableHead>
                        <TableHead className="w-[27%]">
                          Applicable biological scenarios
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {morphologyFeatures.map((row) => (
                        <TableRow key={row.feature} className="align-top">
                          {row.category ? (
                            <TableCell
                              rowSpan={row.categoryRowSpan}
                              className="align-middle text-sm font-semibold text-foreground whitespace-nowrap"
                            >
                              {row.category}
                            </TableCell>
                          ) : null}
                          <TableCell className="align-top text-sm font-medium text-foreground break-words whitespace-normal">
                            {row.feature}
                          </TableCell>
                          <TableCell className="align-middle text-center font-serif text-sm text-foreground break-words whitespace-normal">
                            {row.formula}
                          </TableCell>
                          <TableCell className="align-middle p-2">
                            <img
                              src={row.minShape}
                              alt={`Minimum ${row.feature} cell shape`}
                              className="mx-auto aspect-square w-full max-w-[5.5rem] bg-card object-contain"
                            />
                          </TableCell>
                          <TableCell className="align-middle p-2">
                            <img
                              src={row.maxShape}
                              alt={`Maximum ${row.feature} cell shape`}
                              className="mx-auto aspect-square w-full max-w-[5.5rem] bg-card object-contain"
                            />
                          </TableCell>
                          <TableCell className="align-top text-sm leading-relaxed text-foreground/90 break-words whitespace-normal">
                            {row.description}
                          </TableCell>
                          <TableCell className="align-top text-xs leading-relaxed text-muted-foreground break-words whitespace-normal">
                            {row.applications}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
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
