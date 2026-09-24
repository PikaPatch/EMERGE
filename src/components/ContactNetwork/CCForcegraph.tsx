// ForceTimelineGraph.tsx
import React, { useEffect, useRef, useState } from "react";
import { Loader } from "lucide-react";
import * as d3 from "d3";
import { ColorScaler } from "@/components/utils/ColorScaler";
import { API_BASE } from "@/components/utils/API_BASE";

type NodeDatum = {
  id: string;
  start: number;
  end: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
};

type LinkDatum = {
  source: string | NodeDatum;
  target: string | NodeDatum;
  start: number;
  end: number;
};

type Props = {
  SM: string;
  SMType : string;
  TP: number;
  GID : string;
  GID2?: string;
  ScGene: string;
  ScGene2?: string;
  Gene1N2?: [string, string];
  colorMode?: string;
  CenterCell?:string;
  setCenterCell: (C: string) => void;
  setEmbCellList: (C: string[]) => void;
};

const contains = (d: { start: number; end: number }, time: number) =>
  d.start <= time && time <= d.end;

const scaleExp = ColorScaler([0,1]);

const DualExpColorScaler = (v: number) => {
  switch (v) {
    case 0: return "white";
    case 1: return "blue";
    case 2: return "red";
    case 3: return "purple";
    default: return "grey";
  }
};

export const CCForcegraph: React.FC<Props> = ({
  SM,
  SMType,
  TP = 100,
  GID,
  GID2 = "",
  ScGene,
  ScGene2 = "",
  Gene1N2 = ["", ""],
  colorMode,
  CenterCell,
  setCenterCell,
  setEmbCellList,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 930, height: 930 });
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown>>();
  const [loading, setLoading] = useState(false);
  const [CytoData, setCytoData] = useState(null);
  const [ExpData, setExpData] = useState<any>({});
  
  const selectedNodeRef = useRef<string>(CenterCell??"");
  const isDualExp = Boolean(GID2 || ScGene2);

  // Constants
  const NODE_RADIUS = { default: 5, highlight: 7, bg: 5 };
  const NODE_COLOR = { default: "white", highlight: "red", contact: "green", bg: "white", noExp: "#111" };
  const NODE_STROKE = { width: 0.5, color: "#ddd" };
  const NODE_TEXT = { size: 5, colorBg: "#ccc" };
  const NODE_TEXT_COLOR = { default: "grey", highlight: "cyan", contact: "white", bg: "grey", noExp: "#111" };
  const NODE_OPA = { default: 1, highlight: 1, contact: 1, bg: 0.3, noExp: 1 };
  const LINK_COLOR = { default: "#999", highlight: "red", contact: "red", bg: "#999", noExp: "#111" };

  useEffect(() => {
    if(CytoData?.nodes.some(node => node.id === CenterCell)){
      
    }
    selectedNodeRef.current = CenterCell ?? "";
  }, [CenterCell]);

  // load data 
      useEffect(() => {
        const fetchData = async () => {
          try {
            setLoading(true);
            const url = `${API_BASE}/Cyto?SM=${SM}`
            const response = await fetch(url);
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            const jsonData = await response.json();
            setCytoData(jsonData);
          } catch (err) {
            setCytoData(null);
          } finally {
            setLoading(false);
          }
        };
        fetchData();
      }, [SM]);

    // load reporter ExpDats (single or dual)
      useEffect(() => {
        if (!GID || colorMode !== "expression") {
          if (!ScGene) setExpData(null);
          return;
        }
        // Prefer single-cell fetch when ScGene is active
        if (ScGene) return;
        const controller = new AbortController();
        const fetchData = async () => {
          try {
            setLoading(true);
            const url = GID2
              ? `${API_BASE}/Exp/DualEene?SM=${SM}&TP=${TP}&ExpColName=${GID},${GID2}`
              : `${API_BASE}/Exp/CytoExp?SM=${SM}&ExpColName=${GID}`;
            const response = await fetch(url, { signal: controller.signal });
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            const jsonData = await response.json();
            setExpData(jsonData);
          } catch (err: any) {
            if (err?.name === "AbortError") return;
            setExpData(null);
          } finally {
            setLoading(false);
          }
        };
        fetchData();
        return () => controller.abort();
      }, [GID, GID2, SM, TP, colorMode, ScGene]);
  
      // load single cell Expression Data (single or dual)
  useEffect(() => {
    if (!ScGene || colorMode !== "expression") {
          if (!GID) setExpData(null);
          return;
        }
    const controller = new AbortController();
    const fetchData = async () => {
      try {
        setLoading(true);
        const url = ScGene2
          ? `${API_BASE}/scExp/DualExp?DataSet=P009D01S&Gene=${ScGene},${ScGene2}`
          : `${API_BASE}/scExp?DataSet=P009D01S&Gene=${ScGene}`;
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const jsonData = await response.json();
        setExpData(jsonData);
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        setExpData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    return () => controller.abort();
  },[ScGene, ScGene2, colorMode, GID])

    // set current celllist for cell selection
      useEffect(() => {
        if (!CytoData) {
          setEmbCellList(null);
          return;
        }
        setEmbCellList(CytoData.nodes.filter((n) => TP >= n.start && TP <= n.end).map((n) => n.id))
      }, [CytoData,SM,TP]);

  // ============ HELPER FUNCTIONS ============

  const resolveExpValue = (nodeId: string): number | undefined => {
    const raw = ExpData?.[nodeId]?.[TP] ?? ExpData?.[nodeId];
    return typeof raw === "number" ? raw : undefined;
  };

  const getNodeColor = (nodeId: string, isSelected: boolean, isLinked: boolean): string => {
    if (colorMode === "expression") {
      const exp = resolveExpValue(nodeId);
      if (exp == null || exp < 0) return NODE_COLOR.noExp;
      return isDualExp ? DualExpColorScaler(exp) : scaleExp(exp);
    }
    if (isSelected) return NODE_COLOR.highlight;
    if (isLinked) return NODE_COLOR.contact;
    return NODE_COLOR.bg;
  };


  const getNodeOpacity = (isSelected: boolean, isLinked: boolean): number => {
    if (colorMode === "expression") return 1;
    if (isSelected || isLinked) return 1;
    return 0.3;
  };

  const getInitialNodeColor = (nodeId: string): string => {
    if (colorMode === "expression") {
      const exp = resolveExpValue(nodeId);
      if (exp == null || exp < 0) return NODE_COLOR.noExp;
      return isDualExp ? DualExpColorScaler(exp) : scaleExp(exp);
    }
    return NODE_COLOR.default;
  };

  const findLinkedNodeIds = (nodeId: string, links: LinkDatum[]): string[] => {
    const linkedIds = new Set<string>();
    links.forEach((link) => {
      const sourceId = typeof link.source === "string" ? link.source : link.source.id;
      const targetId = typeof link.target === "string" ? link.target : link.target.id;
      if (sourceId === nodeId) linkedIds.add(targetId);
      if (targetId === nodeId) linkedIds.add(sourceId);
    });
    return Array.from(linkedIds);
  };

  const findBoundingBox = (nodes: NodeDatum[]) => {
    const xs = nodes.map((d) => d.x ?? 0);
    const ys = nodes.map((d) => d.y ?? 0);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    return [[minX, minY], [maxX, maxY]];
  };

  const zoomToBBox = (bbox: any, svgWidth: number, svgHeight: number, padding: number = 0.85) => {
    const [[minX, minY], [maxX, maxY]] = bbox;
    const bboxWidth = maxX - minX;
    const bboxHeight = maxY - minY;
    const bboxCenterX = (minX + maxX) / 2;
    const bboxCenterY = (minY + maxY) / 2;
    const scale = padding / Math.max(bboxWidth / svgWidth, bboxHeight / svgHeight);
    const tx = -bboxCenterX * scale;
    const ty = -bboxCenterY * scale;

    const svg = d3.select(svgRef.current);
    const zoom = zoomRef.current;
    if (zoom) {
      svg.transition().duration(500).call(zoom.transform as any, d3.zoomIdentity.translate(tx, ty).scale(scale));
    }
  };

  // ============ RESPONSIVE SIZING ============

  useEffect(() => {
    if (!containerRef.current) return;
    

    const handleResize = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        const dim = { width : width, height : height }
        setDimensions(dim);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);

    return () => {
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
    };
  }, []);

  const { width, height } = dimensions;

  // ============ MAIN D3 VISUALIZATION ============

  useEffect(() => {
    if (!svgRef.current) return;
    if (!CytoData) return;

    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", [-width / 2, -height / 2, width, height] as any)
      .attr("width", width)
      .attr("height", height)
      .attr("style", "width: 100%; height: 100%;")

    let g = svg.selectAll("g.zoomable").data([null]).join("g").attr("class", "zoomable");

    const simulation = d3
      .forceSimulation<NodeDatum>()
      .force("charge", d3.forceManyBody<NodeDatum>())
      .force("link", d3.forceLink<NodeDatum, d3.SimulationLinkDatum<NodeDatum>>().id((d: any) => d.id))
      .force("x", d3.forceX<NodeDatum>())
      .force("y", d3.forceY<NodeDatum>());

    let link = g.append("g")
                .attr("stroke", "#999")
                .attr("stroke-opacity", 0.6)
                .selectAll<SVGLineElement, any>("line");

    let node = g.append("g")
                .style("cursor", "pointer")
                .selectAll<SVGGElement, any>("g.node");

    const zoom = d3.zoom<SVGSVGElement, any>()
                  .scaleExtent([1, 8])
                  .on("zoom", (event) => {
                    g.attr("transform", event.transform);
                  });

    zoomRef.current = zoom;
    //svg.call(zoom).on("wheel.zoom", null);
    svg.call(zoom)
    

    function ticked() {
      node.attr("transform", (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
      link
        .attr("x1", (d) => (typeof d.source !== "string" ? (d.source.x ?? 0) : 0))
        .attr("y1", (d) => (typeof d.source !== "string" ? (d.source.y ?? 0) : 0))
        .attr("x2", (d) => (typeof d.target !== "string" ? (d.target.x ?? 0) : 0))
        .attr("y2", (d) => (typeof d.target !== "string" ? (d.target.y ?? 0) : 0));
    }

    const drag = (sim: d3.Simulation<NodeDatum, any>) => {
      function dragstarted(event: d3.D3DragEvent<SVGGElement, NodeDatum, unknown>, d: NodeDatum) {
        if (!event.active) sim.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      }
      function dragged(event: d3.D3DragEvent<SVGGElement, NodeDatum, unknown>, d: NodeDatum) {
        d.fx = event.x;
        d.fy = event.y;
      }
      function dragended(event: d3.D3DragEvent<SVGGElement, NodeDatum, unknown>, d: NodeDatum) {
        if (!event.active) sim.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }
      return d3.drag<SVGGElement, NodeDatum>().on("start", dragstarted).on("drag", dragged).on("end", dragended);
    };

    simulation.on("tick", ticked);

    // ============ COLOR LEGEND (Gene Mode) ============

    if (colorMode === "expression") {
      const legendX = width / 2 - 60;
      const legendY = -height / 2 + 20;
      const gene1 = Gene1N2?.[0] || "Gene1";
      const gene2 = Gene1N2?.[1] || "Gene2";

      // Clear any previous legend
      svg.selectAll("g.legend").remove();

      if (isDualExp) {
        const dualItems = [
          { color: "white", label: "Neither" },
          { color: "blue", label: gene1 },
          { color: "red", label: gene2 },
          { color: "purple", label: `${gene1} & ${gene2}` },
        ];
        const legend = svg
          .append("g")
          .attr("class", "legend")
          .attr("transform", `translate(${legendX - 40},${legendY})`);

        legend
          .append("text")
          .attr("x", 0)
          .attr("y", 0)
          .attr("font-size", 11)
          .attr("font-weight", "bold")
          .attr("fill", "white")
          .text("Dual expression");

        dualItems.forEach((item, i) => {
          const y = 18 + i * 16;
          legend
            .append("rect")
            .attr("x", 0)
            .attr("y", y - 8)
            .attr("width", 10)
            .attr("height", 10)
            .attr("fill", item.color)
            .attr("rx", 1);
          legend
            .append("text")
            .attr("x", 16)
            .attr("y", y)
            .attr("font-size", 10)
            .attr("fill", "white")
            .attr("dominant-baseline", "central")
            .text(item.label);
        });
      } else {
        const legendWidth = 10;
        const legendHeight = 100;

        // Create gradient (in defs, outside zoomable group)
        const defs = svg.selectAll("defs").data([null]).join("defs");
        const gradient = defs
          .selectAll("linearGradient#exp-gradient")
          .data([null])
          .join("linearGradient")
          .attr("id", "exp-gradient")
          .attr("x1", "0%")
          .attr("x2", "0%")
          .attr("y1", "100%")
          .attr("y2", "0%");

        const stops = [0, 0.25, 0.5, 0.75, 1];
        gradient
          .selectAll("stop")
          .data(stops)
          .join("stop")
          .attr("offset", (d) => `${d * 100}%`)
          .attr("stop-color", (d) => scaleExp(d));

        // Legend group - ADD TO SVG, NOT TO g
        const legend = svg
          .append("g")
          .attr("class", "legend")
          .attr("transform", `translate(${legendX},${legendY})`);

        // Gradient rectangle
        legend
          .append("rect")
          .attr("class", "legend-gradient")
          .attr("x", 10)
          .attr("y", 10)
          .attr("width", legendWidth)
          .attr("height", legendHeight)
          .attr("fill", "url(#exp-gradient)")
          .attr("stroke", "#999")
          .attr("stroke-width", 0.5);

        // Labels
        legend
          .selectAll("text.legend-label")
          .data([
            { y: 10 + legendHeight, label: "0", align: "start" },
            { y: 10 + legendHeight / 2, label: "0.5", align: "start" },
            { y: 10, label: "1", align: "start" }
          ])
          .join("text")
          .attr("class", "legend-label")
          .attr("x", legendWidth + 15)
          .attr("y", (d) => d.y)
          .attr("font-size", 10)
          .attr("fill", "white")
          .attr("text-anchor", "start")
          .attr("dominant-baseline", "central")
          .text((d) => d.label);

        // Title
        legend
          .append("text")
          .attr("class", "legend-title")
          .attr("x", 20)
          .attr("y", -5)
          .attr("font-size", 11)
          .attr("font-weight", "bold")
          .attr("fill", "white")
          .attr("text-anchor", "middle")
          .text("Expression");
      }
    } else {
      svg.selectAll("g.legend").remove();
    }

    // ============ UPDATE FUNCTION ============

    const update = (currentTime: number) => {
      let nodes: NodeDatum[] = CytoData.nodes
        .filter((d) => contains(d, currentTime))
        .map((d) => ({ ...d }));

      let links: LinkDatum[] = CytoData.links
        .filter((d) => contains(d, currentTime))
        .map((d) => ({ ...d }));

      const old = new Map<any, NodeDatum>(node.data().map((d) => [d.id, d]));
      nodes = nodes.map((d) => ({ ...old.get(d.id), ...d }));
      
      node = node
        .data(nodes, (d: any) => d.id)
        .join((enter) =>
          enter
            .append("g")
            .attr("class", "node")
            .attr("id", (d) => d.id)
            .call(drag(simulation))
            .call((nodeGroup) => {
              nodeGroup
                .append("circle")
                .attr("r", NODE_RADIUS.default)
                .attr("fill", (d) => getInitialNodeColor(d.id))
                .attr("stroke", NODE_STROKE.color)
                .attr("stroke-width", NODE_STROKE.width);

              nodeGroup
                .append("text")
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "central")
                .attr("font-size", NODE_TEXT.size)
                .attr("font-weight", "500")
                .attr("fill", "grey")
                .attr("pointer-events", "none")
                .text((d) => d.id);
            })
        )
        .style("cursor", "pointer");

      // ============ NODE CLICK HANDLER ============

      node.on("click", (e, d: any) => {
        if (d.id === selectedNodeRef.current) {
          // // DESELECT: Reset everything
          selectedNodeRef.current = ''
          setCenterCell("");
          DefaultNode()

        } else {
          // SELECT: Highlight node and linked nodes
          selectedNodeRef.current = d.id;
          setCenterCell(d.id);
          HighlightNode(d.id)
        }
      });

      link = link
        .data(links as any, (d: any) => `${d.source}-${d.target}`)
        .join("line");

      simulation.nodes(nodes);
      (simulation.force("link") as d3.ForceLink<NodeDatum, any>).links(links as any);
      simulation.alpha(1).restart();

      for (let i = 0; i < 10; i++) {
        simulation.tick();
      }
      ticked();

    };

    update(TP);

    // ============ Highlight EFFECT ============
    if (selectedNodeRef.current) {
      ZoomTo(selectedNodeRef.current)
      HighlightNode(selectedNodeRef.current)
    } else {
      ZoomToAll()
      DefaultNode()
    }

    return () => {
      simulation.stop();
      svg.selectAll("*").remove();
    };
  }, [width, height, TP, CytoData, ExpData, colorMode, isDualExp, Gene1N2]);

const ZoomTo = (NodeID) => {
  if (!svgRef.current) return;

  const svg = d3.select(svgRef.current);
  const allNodes = svg.selectAll<SVGGElement, NodeDatum>("g.node").data() as NodeDatum[];

  if (allNodes.length === 0) return;

  // Find linked nodes
  const links = svg.selectAll<SVGLineElement, LinkDatum>("line").data() as LinkDatum[];
  const linkedNodeIds = findLinkedNodeIds(NodeID, links);
  const nodesToFocus = allNodes.filter(
    (node) => node.id === NodeID || linkedNodeIds.includes(node.id)
  );
  
  if (nodesToFocus.length > 0) {
    const bbox = findBoundingBox(nodesToFocus);
    zoomToBBox(bbox, width, height, 0.75);
  }
}

const ZoomToAll = () => {
  if (!svgRef.current) return;
  const svg = d3.select(svgRef.current);
  const allNodes = svg.selectAll<SVGGElement, NodeDatum>("g.node").data() as NodeDatum[];
  if (allNodes.length === 0) return;

  const bbox = findBoundingBox(allNodes);
  zoomToBBox(bbox, width, height, 0.75);
}

const DefaultNode = () => {
  if (!svgRef.current) return;
  
  const svg = d3.select(svgRef.current);
  const allNodes = svg.selectAll<SVGGElement, NodeDatum>("g.node");
  const allLinks = svg.selectAll<SVGLineElement, LinkDatum>("line");
  
  if (allNodes.empty() || allNodes.data().length === 0) return;

  // ============ RESET NODE STYLING ============
  
  allNodes.select("circle")
    .attr("r", NODE_RADIUS.default)
    .attr("fill", (d) => getInitialNodeColor(d.id))
    .style("fill-opacity", NODE_OPA.default);

  // ============ RESET TEXT STYLING ============
  
  allNodes.select("text")
    .style("fill", NODE_TEXT_COLOR.default)
    .style("font-weight", "500");

  // ============ RESET LINK STYLING ============
  
  allLinks
    .style("stroke", LINK_COLOR.default)
    .style("stroke-opacity", 1);
};


const HighlightNode = (NodeID: string) => {
  if (!svgRef.current) return;
  
  const svg = d3.select(svgRef.current);
  const allNodes = svg.selectAll<SVGGElement, NodeDatum>("g.node");
  const allLinks = svg.selectAll<SVGLineElement, LinkDatum>("line");
  
  if (allNodes.empty() || allNodes.data().length === 0) return;

  const nodeData = allNodes.data() as NodeDatum[];
  const linkData = allLinks.data() as LinkDatum[];

  // Find linked nodes for the selected node
  const linkedNodeIds = findLinkedNodeIds(NodeID, linkData);

  // ============ UPDATE NODE STYLING ============

  allNodes.select("circle")
    .attr("r", (n) => (n.id === NodeID ? NODE_RADIUS.highlight : NODE_RADIUS.default))
    .attr("fill", (n) => {
      const isCenterNode = n.id === NodeID;
      const isLinked = linkedNodeIds.includes(n.id);
      return getNodeColor(n.id, isCenterNode, isLinked);
    })
    .style("fill-opacity", (n) => {
      const isCenterNode = n.id === NodeID;
      const isLinked = linkedNodeIds.includes(n.id);
      return getNodeOpacity(isCenterNode, isLinked);
    });

  // ============ UPDATE TEXT STYLING ============

  allNodes.select("text")
    .style("fill", (n) =>
      n.id === NodeID 
        ? NODE_TEXT_COLOR.highlight 
        : linkedNodeIds.includes(n.id) 
          ?  colorMode == "expression" ? NODE_TEXT_COLOR.default : NODE_TEXT_COLOR.contact 
          : NODE_TEXT_COLOR.default
    )
    .style("font-weight", (n) =>
      n.id === NodeID ? "bold" : "500"
    );

  // ============ HIGHLIGHT LINKS ============

  allLinks
    .style("stroke", (link) => {
      const sourceId = typeof link.source === "string" ? link.source : link.source.id;
      const targetId = typeof link.target === "string" ? link.target : link.target.id;
      return NodeID === sourceId || NodeID === targetId ? LINK_COLOR.highlight : LINK_COLOR.default;
    })
    .style("stroke-opacity", (link) => {
      const sourceId = typeof link.source === "string" ? link.source : link.source.id;
      const targetId = typeof link.target === "string" ? link.target : link.target.id;
      return NodeID === sourceId || NodeID === targetId ? 1 : 0.1;
    });

  // ============ ZOOM TO SELECTED NODE ============

  const nodesToFocus = nodeData.filter(
    (node) => node.id === NodeID || linkedNodeIds.includes(node.id)
  );
  
  if (nodesToFocus.length > 0) {
    const bbox = findBoundingBox(nodesToFocus);
    zoomToBBox(bbox, width, height, 0.75);
  }
};

  // ============ ZOOM EFFECT - TRIGGERED BY CENTER CELL CHANGE ============

useEffect(() => {
  if (CenterCell) {
    ZoomTo(CenterCell)
    HighlightNode(CenterCell)
  } else {
    ZoomToAll()
    DefaultNode()
  }
}, [CenterCell, width, height]); // Trigger on CenterCell change

  return (
  <div
    ref={containerRef}
    className="relative h-full border-1 border-gray-600 rounded-2xl overflow-hidden"
  >
    {loading && (
      <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin">
            <Loader className="w-8 h-8 text-primary" />
          </div>
          <p className="text-sm font-medium text-white">
            Loading expression data...
          </p>
        </div>
      </div>
    )}

    <svg ref={svgRef} />
  </div>
);

};
