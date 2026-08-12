import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/Navigation";
import {
  ArrowRight, Box, GitBranch, Network, BarChart3,Atom,Search,
  Download, Dna, Layers, MousePointer, FlaskConical, ImageIcon,ChartNetwork,
} from "lucide-react";

const highlights = [
  { value: "37",        unit: "Embryo sample",         icon: FlaskConical, desc: "Natural\nNatural (fast imaging)\nMechanically-compressed\nNotch-signaling-blocked\nWnt-signaling-blocked\nCell-division-delayed" },
  { value: "944,302",  unit: "Cell model",      icon: Box,       desc: "Segmented 3D cell object" },
  { value: "12",  unit: "Morphology features",      icon: Layers,       desc: "Geometrically interpretable" },
  { value: "~20,000", unit: "Gene expression",  icon: Dna,          desc: "Fluorescence labeling\nRNA sequencing" },
  { value: "100%",      unit: "Interactive",      icon: MousePointer, desc: "Fully explorable online" },
];

const modules = [
  {
    title: "Morphology map",
    icon: Atom,
    link: "/Morphology",
    image: "/img/indexImage/Emb.png",
    desc: "Rotate, zoom, and inspect every cell in 3D. Superimpose gene expression as color on cells, integrated with quantitative measurements of each cell's volume and surface area.",
  },
  {
    title: "Lineage tree",
    icon: Network,
    link: "/LineageTree",
    image: "/img/indexImage/Lin.png",
    desc: "Trace every division up to ~550 cells. View division timing, fate annotations, and 400+ TF expression profiles.",
  },
  {
    title: "Contact network",
    icon: ChartNetwork,
    link: "/ContactNetwork",
    image: "/img/indexImage/Contact.png",
    desc: "Visualise cell–cell contacts as a force-directed graph. Edge weight reflects shared membrane area across developmental time.",
  },
  {
    title: "Single cell",
    icon: Search,
    link: "/Browse",
    image: "/img/indexImage/Cell.png",
    desc: "Browse sphericity, elongation, flatness, volume and surface area for any cell across time. Compare across 37 embryo samples.",
  },
];

// 5 tissue types — fill in image paths when ready
const tissueShowcase = [
  {
    gene: "pah-1",
    morph: "Elongation ratio",
    exprImage:  "/img/indexImage/Fate/1.png",
    morphImage: "/img/indexImage/Fate/2.png",
  },
  {
    gene: "kle-2",
    morph: "General sphericity",
    exprImage:  "/img/indexImage/Fate/3.png",
    morphImage: "/img/indexImage/Fate/4.png",
  },
  {
    gene: "dpy-3",
    morph: "Hayakawa flatness ratio",
    exprImage:  "/img/indexImage/Fate/5.png",
    morphImage: "/img/indexImage/Fate/6.png",
  },
  {
    gene: "set-1",
    morph: "General sphericity",
    exprImage:  "/img/indexImage/Fate/7.png",
    morphImage: "/img/indexImage/Fate/8.png",
  },
];

/** Renders an image or a styled placeholder if no src is provided */
const EmbryoImage = ({
  src,
  alt,
  label,
}: {
  src: string;
  alt: string;
  label: string;
}) => (
  <div className="flex flex-col gap-1.5">
    <div className="relative w-full aspect-square rounded-lg overflow-hidden border border-border/60 bg-muted/50">
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground/50">
          <ImageIcon className="h-8 w-8" strokeWidth={1.2} />
          <span className="text-[10px] font-mono text-center leading-tight px-2">{alt}</span>
        </div>
      )}
    </div>
    <p className="text-[11px] text-center text-muted-foreground font-medium uppercase tracking-wide">
      {label}
    </p>
  </div>
);

const Index = () => (
  <div className="min-h-screen bg-background text-foreground">
    <Navigation />

    {/* ── HERO ─────────────────────────────────────────────────── */}
    <section className="relative overflow-hidden border-b border-border">
      {/* Soft ambient glow — two layered blurs for depth */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[420px] rounded-full bg-primary/8 blur-[140px] pointer-events-none" />
      <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[340px] h-[260px] rounded-full bg-primary/6 blur-[80px] pointer-events-none" />

      <div className="relative w-full max-w-5xl mx-auto px-6 md:px-12 pt-24 pb-20 text-center">
        {/* Badge */}
        <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full border border-primary/30 text-primary bg-primary/5 mb-6">
          <Dna className="w-3.5 h-3.5" /> <i>C. elegans</i> Embryo Database
        </span>

        {/* Logo */}
        <div className="flex justify-center mb-2">
          <img
            src="/img/logo3.png"
            alt="EMERGE logo"
            className="h-24 md:h-48 w-auto object-contain"
          />
        </div>
        <p className="text-lg md:text-xl font-medium text-muted-foreground mb-6 max-w-2xl mx-auto">
          
        </p>
        <p className="text-sm text-muted-foreground/60 italic -mt-4 mb-6 max-w-2xl mx-auto">
          <strong className="text-foreground/70">EMERGE</strong>: c<strong className="text-foreground/70">E</strong>ll{" "}
          <strong className="text-foreground/70">M</strong>orphology and gene{" "}
          <strong className="text-foreground/70">E</strong>xpression for emb
          <strong className="text-foreground/70">R</strong>yo<strong className="text-foreground/70">GE</strong>nesis
        </p>

        <p className="text-base md:text-lg text-muted-foreground/80 mb-10 max-w-2xl mx-auto leading-relaxed">
        A user-friendly website for exploring cell-lineage-resolved developmental properties across diverse conditions of <i>C. elegans</i> <strong className="text-foreground">embryogenesis</strong>, integrating <strong className="text-foreground">quantitative morphological</strong> and <strong className="text-foreground">genetic dimensions</strong> with information on cell fate, size, contact, etc.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap justify-center gap-4 mb-14">
          <Button asChild size="lg" className="text-base px-8 h-12 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20">
            <Link to="/Background">
              Introduction <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="text-base px-8 h-12 border-border hover:bg-secondary">
            <Link to="/Download"><Download className="mr-2 h-5 w-5" /> Download Data</Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-2">
          {highlights.map((h, i) => {
            const Icon = h.icon;
            const colors = [
              { ring: "ring-emerald-400/40", glow: "bg-emerald-500/10", icon: "text-emerald-500", bar: "bg-emerald-500", value: "text-emerald-500" },
              { ring: "ring-sky-400/40",     glow: "bg-sky-500/10",     icon: "text-sky-500",     bar: "bg-sky-500",     value: "text-sky-500" },
              { ring: "ring-violet-400/40",  glow: "bg-violet-500/10",  icon: "text-violet-500",  bar: "bg-violet-500",  value: "text-violet-500" },
              { ring: "ring-amber-400/40",   glow: "bg-amber-500/10",   icon: "text-amber-500",   bar: "bg-amber-500",   value: "text-amber-500" },
              { ring: "ring-rose-400/40",    glow: "bg-rose-500/10",    icon: "text-rose-500",    bar: "bg-rose-500",    value: "text-rose-500" },
            ];
            const c = colors[i % colors.length];
            return (
              <div
                key={h.unit}
                className={`relative flex flex-col items-center gap-2 rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm px-4 py-5 ring-1 ${c.ring} overflow-hidden`}
              >
                {/* subtle radial glow behind icon */}
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full blur-2xl opacity-60 pointer-events-none ${c.glow}`} />

                {/* top accent bar */}
                <div className={`absolute top-0 left-0 right-0 h-0.5 ${c.bar} opacity-70`} />

                {/* icon badge */}
                <div className={`relative z-10 w-9 h-9 rounded-xl flex items-center justify-center ${c.glow} ring-1 ${c.ring}`}>
                  <Icon className={`w-4 h-4 ${c.icon}`} strokeWidth={1.6} />
                </div>

                {/* big number */}
                <span className={`relative z-10 text-3xl md:text-4xl font-extrabold tracking-tight leading-none tabular-nums ${c.value}`}>
                  {h.value}
                </span>

                {/* unit label */}
                <span className="relative z-10 text-xs font-bold text-foreground/75 uppercase tracking-widest text-center leading-tight">
                  {h.unit}
                </span>

                {/* desc — revealed on hover */}
                <div className="relative z-10 w-full">
                  <p className="text-[10.5px] text-muted-foreground whitespace-pre-line text-center leading-relaxed pt-2 border-t border-border/40 mt-1">
                    {h.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>

    {/* ── TISSUE SHOWCASE ──────────────────────────────────────── */}
    <section className="w-full max-w-6xl mx-auto px-6 md:px-12 pb-20">
      <h2 className="text-3xl font-bold text-foreground mb-2">
        Gene Expression &amp; Morphology Across Tissues
      </h2>
      <p className="text-muted-foreground mb-10">
        3D embryo image pairs — gene expression (left) paired with the correlated cell morphology feature (right) —
        across four representative examples in <em>C. elegans</em>.
      </p>

      {/* 4 sets, each set: left = expression, right = morphology */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-8">
        {tissueShowcase.map((t, i) => (
          <div
            key={`set-${i}`}
            className="rounded-xl border border-border/60 bg-card/50 p-4"
          >
            <div className="grid grid-cols-2 gap-4">
              {/* Left: Gene Expression */}
              <div className="flex flex-col gap-2">
                <EmbryoImage
                  src={t.exprImage}
                  alt={`${t.gene} gene expression`}
                  label="Gene Expression"
                />
                <p className="text-xs font-italic font-semibold text-center text-foreground truncate">
                  <i>{t.gene}</i>
                </p>
              </div>
              {/* Right: Morphology */}
              <div className="flex flex-col gap-2">
                <EmbryoImage
                  src={t.morphImage}
                  alt={`${t.morph} morphology`}
                  label="Morphology"
                />
                <p className="text-xs font-semibold text-center text-foreground truncate">
                  {t.morph}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>

    {/* ── MODULES ──────────────────────────────────────────────── */}
    <section className="w-full max-w-6xl mx-auto px-6 md:px-12 py-20">
      <h2 className="text-3xl font-bold text-foreground mb-2">Explore EMERGE</h2>
      <p className="text-muted-foreground mb-12">Four modules, one integrated dataset.</p>

      <div className="grid md:grid-cols-2 gap-6">
        {modules.map((mod) => {
          const Icon = mod.icon;
          return (
            <Link
              key={mod.title}
              to={mod.link}
              className="group relative flex flex-col rounded-xl border border-border bg-card overflow-hidden hover:border-primary/50 hover:shadow-xl hover:shadow-primary/8 transition-all duration-300"
            >
              <div className="h-52 overflow-hidden bg-secondary">
                <img
                  src={mod.image}
                  alt={mod.title}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                />
              </div>
              <div className="flex-1 p-6">
                <div className="flex items-center gap-2.5 mb-3">
                  <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </span>
                  <h3 className="text-lg font-bold text-foreground">{mod.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">{mod.desc}</p>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary group-hover:gap-2.5 transition-all duration-200">
                  Explore <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>

    

    {/* ── FOOTER ───────────────────────────────────────────────── */}
    <footer className="border-t border-border bg-card/50">
      <div className="max-w-6xl mx-auto px-6 md:px-12 py-6 flex flex-col md:flex-row justify-between items-center gap-3 text-sm text-muted-foreground">
        <span>
          EMERGE – c<strong>E</strong>ll <strong>M</strong>orphology and gene{" "}
          <strong>E</strong>xpression for emb<strong>R</strong>yo<strong>GE</strong>nesis
        </span>
        <div className="flex gap-6">
          <Link to="/Background" className="hover:text-foreground transition-colors">Background</Link>
          <Link to="/Download" className="hover:text-foreground transition-colors">Download</Link>
          <Link to="/Help" className="hover:text-foreground transition-colors">Help</Link>
        </div>
      </div>
    </footer>
  </div>
);

export default Index;
