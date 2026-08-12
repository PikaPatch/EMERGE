import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen,
  ImageIcon,
  Network,
  ChartNetwork,
  Atom,
  Search,
  Download,
} from "lucide-react";

/* ---------- Reusable building blocks ---------- */

const ImagePlaceholder = ({
  src,
  caption = "",
}: {
  src?: string;
  caption?: string;
}) => {
  if (src) {
    return (
      <figure className="my-4">
        <img
          src={src}
          alt={caption.replace(/<[^>]*>/g, "")}   // strip tags for alt text
          className="w-full rounded-lg border border-border/70 object-cover shadow-sm"
        />
        {caption && (
          <figcaption
            className="mt-2 text-center text-xs text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: caption }}   // ← render HTML
          />
        )}
      </figure>
    );
  }

  return (
    <div
      role="img"
      aria-label={caption.replace(/<[^>]*>/g, "") || "Image placeholder"}  // strip tags for aria
      className="group my-4 flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/70 bg-gradient-to-br from-muted/40 to-muted/10 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted/40"
    >
      <ImageIcon className="h-7 w-7 opacity-60 group-hover:opacity-100" />
      {/* Plain text fallback — strip any tags */}
      <span className="text-xs font-medium">
        {caption.replace(/<[^>]*>/g, "") || "Add image here"}
      </span>
    </div>
  );
};

// Numbered step item with badge marker. Children render the step body.
const Step = ({
  n,
  title,
  children,
}: {
  n: number;
  title: React.ReactNode;
  children?: React.ReactNode;
}) => (
  <li className="relative grid grid-cols-[auto_1fr] gap-4 pb-2">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-sm font-semibold text-primary">
      {n}
    </div>
    <div className="pt-1.5">
      <div className="text-foreground">
        <span className="font-semibold">{title}</span>
      </div>
      {children && <div className="mt-2 text-foreground/90">{children}</div>}
    </div>
  </li>
);

// Section wrapper with a leading accent and consistent spacing.
const Section = ({
  id,
  title,
  children,
}: {
  id: string;
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) => (
  <section id={id} className="scroll-mt-28">
    <div className="mb-6 flex items-start gap-4">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-5xl">
          {title}
        </h2>
      </div>
    </div>
    {children}
  </section>
);

/* ---------- Static data ---------- */

const tocItems = [
  { id: "getting-started", label: "Getting Started" },
  { id: "page-overview", label: "Overview" },
  { id: "worked-examples", label: "Examples" },
  { id: "example-1", label: "1 · Visualize embryo developmental stages", indent: true },
  { id: "example-2", label: "2 · Find a specific cell", indent: true },
  { id: "example-3", label: "3 · Expression & morphology overlay", indent: true },
  { id: "example-4", label: "4 · Lineage tree tracking", indent: true },
  { id: "example-5", label: "5 · Cell-cell contact network", indent: true },
  { id: "example-6", label: "6 · Search a cell", indent: true },
  { id: "citing-emerge", label: "Citing EMERGE" },
] as const;

const pageOverview = [
  {
    icon: BookOpen,
    name: "Background",
    description: (
      <>
        A primer on <em>C. elegans</em> embryogenesis and how EMERGE&apos;s data
        were generated — covering the imaging pipeline, segmentation, lineage
        tracing, and the reporter and single-cell RNA-seq datasets that power
        every other page.
      </>
    ),
  },
  {
    icon: Atom,
    name: "Morphology Map",
    description:
      "An interactive 3D viewer of the entire embryo at any developmental time point. Rotate and zoom the model, color cells by lineage, fate, gene expression, or any of 12 morphology features, and isolate a tissue, sub-lineage, or individual cells.",
  },
  {
    icon: Network,
    name: "Lineage Tree",
    description:
      "The complete invariant cell lineage as a clickable tree, split into six founder sub-trees (AB, MS, E, C, D, P4). Click any branch to inspect that cell's 3D shape and morphology, or recolor the tree by gene expression or morphology feature to see how a quantity evolves along the developmental trajectory.",
  },
  {
    icon: ChartNetwork,
    name: "Contact Network",
    description:
      "A force-directed graph of cell–cell physical contacts at a chosen time point, where edge weight encodes shared contact area. Pair the network with the linked 3D model to inspect neighborhoods and overlay any reporter gene to compare expression patterns across cells in direct contact.",
  },
  {
    icon: Search,
    name: "Single Cell",
    description:
      "A cell-centric summary view. Search a cell by name to see its 3D shape over its lifespan, time-course plots of volume, surface area, and morphology features, and a heatmap of every available transcription-factor reporter — with the option to drill into any single TF.",
  },
  {
    icon: Download,
    name: "Download",
    description:
      "Bulk-export EMERGE data for offline analysis. Pick a specific sample, time point range, and data type (3D meshes, morphology tables, contact networks, reporter expression, or single-cell RNA-seq) and download CSV or mesh files ready for downstream pipelines.",
  },
] as const;


/* ---------- Page ---------- */

const Help = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero / Header */}
      

      {/* Main + Sidebar TOC */}
      <main className="container mx-auto px-6 py-12">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_240px]">
          {/* Content column */}
          <div className="min-w-0 space-y-16">
            {/* Getting Started */}
            <Section id="getting-started" title="Getting Started" >
              <p className="mb-6 text-base leading-relaxed text-foreground/90">
                EMERGE is a public, no-login resource that lets you explore the
                complete cellular morphology, contact network, and gene
                expression of the <em>C. elegans</em> embryo across 37 imaged
                samples including wild-type and perturbed development at hundreds of imaging time points.
              </p>

              <h3 className="mb-3 text-lg font-semibold text-foreground">
                What EMERGE contains
              </h3>
              <Card className="border-border/60">
                <CardContent className="p-6">
                  <ul className="grid gap-x-6 gap-y-3 text-sm text-foreground/90 sm:grid-cols-1">
                    <li className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <span>
                        <strong>37 embryo samples</strong> from zygote through the
                        ~550-cell stage
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <span>
                        <strong>900,000+ 3D cell geometries</strong>{" "}
                        with volume and surface area
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <span>
                        <strong>12 morphology features</strong>, plus cell nuclei
                        locations and ABC axis lengths
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <span>
                        <strong>Cell–cell contact network</strong> and contact area
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <span>
                        <strong>20000+ gene expression profiles</strong>{" "}
                        mapped onto every cell
                      </span>
                    </li>
                    {/* <li className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <span>
                        <strong>Single-cell RNA-seq</strong> data
                      </span>
                    </li> */}
                  </ul>
                </CardContent>
              </Card>
            </Section>

            <Separator />

            {/* Page Overview */}
            <Section id="page-overview" title="Page Overview">
              <p className="mb-6 text-foreground/90">
                EMERGE is organized into six main pages, each accessible from the
                top navigation bar.
              </p>

              {/* Card grid view */}
              <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pageOverview.map(({ icon: Icon, name, description }) => (
                  <Card
                    key={name}
                    className="group border-border/60 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                  >
                    <CardHeader className="pb-3">
                      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <CardTitle className="text-base">{name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-sm leading-relaxed">
                        {description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </Section>

            <Separator />

            {/* Worked Examples */}
            <Section
              id="worked-examples"
              title="Worked Examples"
            >

              <div className="space-y-6">
                {/* Example 1 */}
                <Card id="example-1" className="scroll-mt-28 border-border/60">
                  <CardHeader>
                    <CardTitle className="mt-2 text-xl">
                      Example 1:  Visualize different developmental stages across time points
                    </CardTitle>
                    <CardDescription>
                      The <strong>Morphology map</strong> page renders the full <em>C. elegans</em> embryo in 3D at differernt
                      developmental time point. Scrub through time to follow morphogenesis from the 4-cell stage all the
                      way to ~550 cells or render the model to focus on a tissue, a
                      sublineage, or any individual cell of interest.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-6">
                      <Step
                        n={1}
                        title={
                          <>
                            Slide the <span className="text-primary">timepoint slider</span>
                          </>
                        }
                      >
                        Choose any time point from early embryo to late embryo.
                        Color the embryo by <strong>terminal fate</strong> or{" "}
                        <strong>cell lineage</strong> using the{" "}
                        <strong><span className="text-primary">Object color</span></strong> dropdown.
                        <div className="mt-3 grid gap-3 sm:grid-cols-3">
                          <ImagePlaceholder src="/img/helpImage/elemb.png" caption="Early embryo (TP: 12)" />
                          <ImagePlaceholder src="/img/helpImage/midemb.png" caption="Mid embryo (TP: 95)" />
                          <ImagePlaceholder src="/img/helpImage/latemb.png" caption="Late embryo (TP: 183)" />
                        </div>
                      </Step>
                      <Step n={2} title="Focus on a region of interest">
                        Pick a specific tissue (<em>e.g.</em> muscle, neuron, intestine), a
                        specific founder lineage (AB, MS, E, C, D, or P4), or even
                        individual cells of your choice using the highlighting
                        controls.
                        <div className="mt-3 grid gap-3 sm:grid-cols-5">
                          <ImagePlaceholder src="/img/helpImage/Pharynx.png" caption="Pharynx" />
                          <ImagePlaceholder src="/img/helpImage/Muscle.png" caption="Muscle" />
                          <ImagePlaceholder src="/img/helpImage/Intestine.png" caption="Intestine" />
                          <ImagePlaceholder src="/img/helpImage/Skin.png" caption="Skin" />
                          <ImagePlaceholder src="/img/helpImage/Neuron.png" caption="Neuron" />
                        </div>
                        <div className="mt-3 grid gap-3 sm:grid-cols-5">
                          <ImagePlaceholder src="/img/helpImage/AB.png" caption="AB" />
                          <ImagePlaceholder src="/img/helpImage/E.png" caption="E" />
                          <ImagePlaceholder src="/img/helpImage/MS.png" caption="MS" />
                          <ImagePlaceholder src="/img/helpImage/C.png" caption="C" />
                          <ImagePlaceholder src="/img/helpImage/D.png" caption="D" />
                        </div>
                      </Step>
                      <Step n={3} title="Export the model">
                        Choose <code className="rounded bg-muted px-1.5 py-0.5 text-xs">.obj</code>{" "}
                        for geometry only (convenient for downstream data
                        analysis) or{" "}
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">.gltf</code>{" "}
                        to keep all your color and visibility settings.
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <ImagePlaceholder src="/img/helpImage/obj.png" caption=".obj" />
                          <ImagePlaceholder src="/img/helpImage/gltf.png" caption=".gltf" />
                        </div>
                      </Step>
                    </ol>
                  </CardContent>
                </Card>

                {/* Example 2 */}
                <Card id="example-2" className="scroll-mt-28 border-border/60">
                <CardHeader>
                    <CardTitle className="mt-2 text-xl">
                      Example 2:  Find and inspect a specific cell on the embryo
                    </CardTitle>
                    <CardDescription>
                      Use the <strong><span className="text-primary">Highlighting specific cells</span></strong> control on the morphology map page to search and pick
                      one or more cells by name. Selected cells are highlighted on the 3D model and their full
                      morphology details — volume, surface area, ABC axis lengths, and morphology features — are
                      summarised in the side panel for quick inspection.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-6">
                      <Step n={1} title="Open display specific cells">
                        On the morphology map page, click{" "}
                        <strong><span className="text-primary">Highlighting specific cells</span></strong> to select a cell to
                        focus on. Type the first few characters of the cell name to
                        narrow the suggestions. Once selected, all morphology data
                        for that cell is shown in the side panel.
                        <div className="mt-3 grid gap-3 sm:grid-cols-3">
                          <div className="mt-3 grid gap-3 col-span-1">
                            <ImagePlaceholder src="/img/helpImage/DisplayCell1.png" caption="" />
                          </div>
                          <div className="mt-3 grid gap-3 col-span-2">
                            <ImagePlaceholder src="/img/helpImage/DisplayCell2.png" caption="" />
                          </div>
                        </div>
                      </Step>
                      <Step n={2} title="Select multiple cells">
                        Tick the checkbox on the right of each entry in the
                        dropdown to add multiple cells at once.
                        <div className="mt-3 grid gap-3 sm:grid-cols-3">
                          <div className="mt-3 grid gap-3 col-span-1">
                            <ImagePlaceholder src="/img/helpImage/DisplayCell3.png" caption="" />
                          </div>
                          <div className="mt-3 grid gap-3 col-span-2">
                            <ImagePlaceholder src="/img/helpImage/DisplayCell4.png" caption="" />
                          </div>
                        </div>
                      </Step>
                      <Step n={3} title="Toggle cell-name labels">
                        Turn on cell-name
                        labels with the <strong><span className="text-primary">Show cells identity</span></strong> toggle to show the name of each highlighted cell on the 3D model. This is useful when multiple cells are highlighted at the same time.
                        <ImagePlaceholder src="/img/helpImage/DisplayCell5.png" caption="" />
                      </Step>
                    </ol>
                  </CardContent>
                </Card>

                {/* Example 3 */}
                <Card id="example-3" className="scroll-mt-28 border-border/60">
                  <CardHeader>
                    <CardTitle className="mt-2 text-xl">
                      Example 3:  Map gene expression and morphology features on the 3D embryo
                    </CardTitle>
                    <CardDescription>
                      Map quantitative data directly onto the embryo. Color cells by any of 400+ transcription-factor
                      reporters or single-cell RNA-seq genes — even compare two genes simultaneously — or by any of 12
                      morphology features to reveal where shape properties such as roundness or elongation peak
                      across the embryo.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-6">
                      <Step n={1} title="Set the Cell Coloring mode">
                        On the Morphology map page, set <strong><span className="text-primary">Object color</span></strong>{" "}
                        to <strong>gene expression</strong> or{" "}
                        <strong>morphology feature</strong> to superimpose gene expression value onto the embryo model. EMERGE includes two types of expression data:{" "}
                        <strong>fluorescent reporters</strong> and{" "}
                        <strong>single-cell RNA-seq</strong>. Pick a gene by typing
                        its symbol, and the expression level will be mapped onto the
                        embryo as cell color.
                        <div className="mt-3 grid gap-3 sm:grid-cols-6">
                          <div className="mt-3 grid gap-3 col-span-2">
                            <ImagePlaceholder src="/img/helpImage/exp1.png" caption="" />
                          </div>
                          <div className="mt-3 grid gap-3 col-span-2">
                            <ImagePlaceholder src="/img/helpImage/exp2.png" caption="<i>end-1</i>" />
                          </div>
                          <div className="mt-3 grid gap-3 col-span-2">
                            <ImagePlaceholder src="/img/helpImage/exp3.png" caption="<i>end-1</i> (focus on intestine)" />
                          </div>
                        </div>
                      </Step>
                      <Step n={2} title="Visualize 2 gene expression at the same time">
                        To inspect 2 genes expression at the same time,
                        choose a second gene in <strong>Gene 2</strong> to
                        visualize both expression patterns simultaneously.
                        <div className="mt-3 grid gap-3 sm:grid-cols-6">
                          <div className="mt-3 grid gap-3 col-span-2">
                            <ImagePlaceholder src="/img/helpImage/exp4.png" caption="" />
                          </div>
                          <div className="mt-3 grid gap-3 col-span-2">
                            <ImagePlaceholder src="/img/helpImage/exp5.png" caption="<i>pha-4</i> & <i>elt-2</i>" />
                          </div>
                          <div className="mt-3 grid gap-3 col-span-2">
                            <ImagePlaceholder src="/img/helpImage/exp6.png" caption="<i>pha-4</i> & <i>elt-2</i> (focus on pharynx intestine)" />
                          </div>
                        </div>
                      </Step>
                      <Step n={3} title="Visualize morphological features">
                        With Cell Coloring set to{" "}
                        <strong>morphological feature</strong>, choose any of the
                        12 available shape features to see how that property
                        varies across cells.
                        <div className="mt-3 grid gap-3 sm:grid-cols-3">
                          <div className="mt-3 grid gap-3 col-span-1">
                            <ImagePlaceholder src="/img/helpImage/exp7.png" caption="" />
                          </div>
                          <div className="mt-3 grid gap-3 col-span-1">
                            <ImagePlaceholder src="/img/helpImage/exp8.png" caption="Elongation ratio" />
                          </div>
                          <div className="mt-3 grid gap-3 col-span-1">
                            <ImagePlaceholder src="/img/helpImage/exp9.png" caption="Hayakawa roundness" />
                          </div>
                        </div>
                      </Step>
                    </ol>
                  </CardContent>
                </Card>

                {/* Example 4 */}
                <Card id="example-4" className="scroll-mt-28 border-border/60">
                  <CardHeader>
                    <CardTitle className="mt-2 text-xl">
                      Example 4:  Track single-cell development from the lineage tree
                    </CardTitle>
                    <CardDescription>
                      The <strong>Lineage Tree</strong> page is the time-axis view of the embryo. The full invariant
                      lineage is split into six founder sub-trees, with each branch corresponding to a cell. Click
                      any branch to load that cell's 3D model and morphology data, or recolor the entire tree by
                      reporter expression or a morphology feature to track how a quantity evolves along the developmental
                      trajectory.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-6">
                      <Step n={1} title="Pick a coloring mode">
                        On the <strong>Lineage Tree</strong> page, the full lineage
                        is split into <strong>6 sub-trees</strong> (one per founder
                        lineage). Pick a coloring mode such as{" "}
                        <strong>cell fate</strong> or <strong>cell lineage</strong>{" "}
                        from the controls.
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <div className="mt-3 grid gap-3 col-span-1">
                            <ImagePlaceholder src="/img/helpImage/lin1.png" caption="" />
                          </div>
                          <div className="mt-3 grid gap-3 col-span-1">
                            <ImagePlaceholder src="/img/helpImage/lin2.png" caption="Colored by terminal fate" />
                          </div>
                        </div>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <div className="mt-3 grid gap-3 col-span-1">
                            <ImagePlaceholder src="/img/helpImage/lin3.png" caption="" />
                          </div>
                          <div className="mt-3 grid gap-3 col-span-1">
                            <ImagePlaceholder src="/img/helpImage/lin4.png" caption="Colored by founder cells" />
                          </div>
                        </div>
                      </Step>
                      <Step n={2} title="Click any branch to inspect a cell">
                        Click anywhere on the tree to load the corresponding
                        cell&rsquo;s 3D model and morphology data into the side
                        panel.
                        <div className="mt-3 grid gap-3 sm:grid-cols-1">
                          <div className="mt-3 grid gap-3 col-span-1">
                            <ImagePlaceholder src="/img/helpImage/lin5.png" caption="Click the lineage tree branch" />
                          </div>
                          {/* <div className="mt-3 grid gap-3 col-span-1">
                            <ImagePlaceholder src="/img/helpImage/lin6.png" caption="Cell model" />
                          </div> */}
                        </div>
                        <div className="mt-3 grid gap-3 sm:grid-cols-1">
                          <div className="mt-3 grid gap-3 col-span-1">
                            <ImagePlaceholder src="/img/helpImage/lin7.png" caption="Cell morphology" />
                          </div>
                        </div>
                      </Step>
                      <Step n={3} title="Map expression or morphology onto the tree">
                        Switch the tree&rsquo;s color encoding to a gene-expression
                        profile or a morphology feature to inspect how that
                        quantity changes along the developmental trajectory.
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <div className="mt-3 grid gap-3 col-span-1">
                            <ImagePlaceholder src="/img/helpImage/lin8.png" caption="<i>hlh-1</i> expression" />
                          </div>
                          <div className="mt-3 grid gap-3 col-span-1">
                            <ImagePlaceholder src="/img/helpImage/lin9.png" caption="General sphericity" />
                          </div>
                        </div>
                      </Step>
                    </ol>
                  </CardContent>
                </Card>

                {/* Example 5 */}
                <Card id="example-5" className="scroll-mt-28 border-border/60">
                  <CardHeader>
                    <CardTitle className="mt-2 text-xl">
                      Example 5:  Visualize the cell–cell contact network with gene expression
                    </CardTitle>
                    <CardDescription>
                      The <strong>Contact Network</strong> page exposes the embryo's spatial topology as a force-directed
                      graph: each node is a cell and each edge represents direct physical contact between neighbours,
                      with edge weight encoding shared contact area. Pair the graph with the linked 3D model and
                      overlay reporter expression to compare patterns across physically adjacent cells.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-6">
                      <Step n={1} title="Read the network layout">
                        On the <strong>Contact Network</strong> page, the left side
                        shows the contact graph (nodes = cells, edges = direct
                        physical contact between cells), and the right side shows
                        the matching 3D embryo model.
                        <ImagePlaceholder src="/img/helpImage/con1.png" caption="" />
                      </Step>
                      <Step n={2} title="Click a node to focus">
                        The right panel updates to highlight that cell on the 3D
                        model.
                        <ImagePlaceholder src="/img/helpImage/con2.png" caption="" />
                      </Step>
                      <Step n={3} title="Overlay gene expression">
                        Map a chosen gene onto the network nodes. This makes it
                        easy to compare expression patterns across transcription
                        factors and across neighbors in physical contact.
                        <ImagePlaceholder src="/img/helpImage/con3.png" caption="<i>zeel-1</i> expression" />
                      </Step>
                    </ol>
                  </CardContent>
                </Card>

                {/* Example 6 */}
                <Card id="example-6" className="scroll-mt-28 border-border/60">
                  <CardHeader>
                    <CardTitle className="mt-2 text-xl">
                      Example 6:  Search a cell to see everything about it
                    </CardTitle>
                    <CardDescription>
                      The <strong>Single cell</strong> page is a single-cell summary dashboard. Search a cell by name to see
                      its 3D shape evolve across its lifespan, time-course plots for volume, surface area, and every
                      morphology feature, and heatmap of reporter genes.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-6">
                      <Step n={1} title="Search by cell name">
                        Go to the <strong>Single Cell</strong> page, type the cell name
                        into the search box, and press <strong>Search</strong>.
                        <ImagePlaceholder src="/img/helpImage/b3.png" caption="" />
                      </Step>
                      <Step n={2} title="Inspect morphology over time">
                        Use the line charts to see how cell volume,
                        surface area, and morphology features change across
                        its lifespan.
                        <ImagePlaceholder src="/img/helpImage/mline.png" caption="Morphology line charts" />
                      </Step>
                      <Step n={3} title="Inspect expression profiles">
                        The <strong>Reporter Gene Expression Profile</strong>{" "}
                        heatmap shows every available transcription factor&rsquo;s
                        expression in this cell over time.
                        <ImagePlaceholder src="/img/helpImage/b1.png" caption="Expression profile of all available genes" />
                      </Step>
                      <Step n={4} title="Drill into one transcription factor">
                        Select a specific TF to see its expression in all cells
                        alive during the target cell&rsquo;s lifespan, giving
                        spatial context to the temporal profile.
                        <ImagePlaceholder src="/img/helpImage/b2.png" caption="aly-1 expression" />
                      </Step>
                    </ol>
                  </CardContent>
                </Card>
              </div>
            </Section>

            <Separator />

            {/* Citing EMERGE */}
            <Section id="citing-emerge" title="Citing EMERGE">
              <p className="mb-4 text-foreground/90">
                If EMERGE contributes to your research, please cite the database
                in your publications. 
              </p>
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
                            className={`block rounded-md px-2 py-1.5 transition-colors hover:bg-muted hover:text-foreground ${
                              "indent" in item && item.indent
                                ? "ml-3 border-l border-border/60 pl-3 text-muted-foreground"
                                : "font-medium text-foreground/90"
                            }`}
                          >
                            {item.label}
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

export default Help;
