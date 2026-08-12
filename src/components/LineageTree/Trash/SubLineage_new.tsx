import { useState, useEffect, useRef, forwardRef, useImperativeHandle, useMemo } from "react";
import { Loader } from "lucide-react";
import * as d3 from "d3";
import { FateColor } from "@/config/FateColor";
import { expCol, shapeCol, getLineageColor } from "@/components/utils/LineageTreeFunctions";

// helper functions
const range = (start: number, end: number): number[] => {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
};

function getDivisibleInRange(range: [number, number], divisor: number): number[] {
  const [start, end] = range;
  const result: number[] = [];
  const firstDivisible = Math.ceil(start / divisor) * divisor;
  for (let i = firstDivisible; i <= end; i += divisor) {
    result.push(i);
  }
  return result;
}

interface ColorData {
  Range?: [number, number];
  [key: string]: any;
}

interface LineageDataType {
  [key: string]: {
    Fate: string;
    CellName: string;
    Start: number;
    End: number;
    Surface: number[];
    Volume: number[];
    TPs: number[];
  };
}

interface CellLineageConfig {
  id: string;
  CellName: string;
  stepping: number;
}

interface AllSubLineageProps {
  SM: string;
  SMType: "CMap8" | "CShaper17" | "EmbSAM456789" | "MT_lag1" | "MT_pop1" | "MT_wee";
  cellLineages: CellLineageConfig[];
  GID: string;
  ScDataSet?: string;
  ScGene?: string;
  // LineageDataGroups: { [id: string]: LineageDataType } — keyed by cellLineage.id
  LineageDataGroups: { [id: string]: LineageDataType } | null;
  colorMode?: "default" | "fate" | "expression" | "shape";
  ColorChange: string;
  // ColorDataGroups: { [id: string]: ColorData } — keyed by cellLineage.id
  ColorDataGroups: { [id: string]: ColorData };
  ExpressionType?: string;
  Fac?: string;
  line_width?: number;
  setTP: (TP: number) => void;
  setCellName: (CellName: string) => void;
  setScalingRange: (range: [number, number]) => void;
  ExpLoading: boolean;
}

const PANEL_GAP = 40; // horizontal gap between panels in px (SVG units)

export const AllSubLineage = forwardRef<{ resetZoom: () => void }, AllSubLineageProps>((
  {
    SM,
    SMType,
    cellLineages,
    LineageDataGroups,
    GID,
    ScDataSet,
    ScGene,
    ExpressionType,
    Fac,
    line_width = 1.5,
    colorMode = "default",
    ColorChange,
    ColorDataGroups,
    setTP,
    setCellName,
    setScalingRange,
    ExpLoading,
  },
  ref
) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [canvasWidth, setCanvasWidth] = useState(1400);
  const [canvasHeight, setCanvasHeight] = useState(600);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  useImperativeHandle(ref, () => ({
    resetZoom: () => {
      if (svgRef.current && zoomBehaviorRef.current) {
        d3.select(svgRef.current)
          .transition()
          .duration(750)
          .call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
      }
    },
  }));

  // ---- per-lineage helpers (same logic as original SubLineage) ----
  const klist = {
    Zpap: 3.5,
    Zpaa: 0.5,
    Zppp: 0.55,
  };
  const squzlist = {
    Za: 0.8,
    Zpaa: 0.7,
    Zpap: 0.15,
    Zppa: 0.5,
    Zpppa: 0.5,
    Zppppp: 0.1,
  };

  const xoffset = (ori: string, end: string, stepping: number): number => {
    let xoff = 0;
    let eachstep = stepping;
    if (ori === end) return xoff;
    const route_array = end.slice(ori.length).split("");
    let route = ori;
    while (route_array.length) {
      const eCell = route_array.shift()!;
      route += eCell;
      let s = 1;
      Object.keys(squzlist).forEach((squz) => {
        if (route.includes(squz)) s = squzlist[squz];
      });
      const k = klist.hasOwnProperty(route) ? klist[route] : 1;
      xoff = eCell === "p" ? xoff + eachstep * k * s : xoff - eachstep * k * s;
      eachstep /= 2;
    }
    return xoff;
  };

  // ---- main draw effect ----
  useEffect(() => {
    if (!LineageDataGroups || !svgRef.current || !wrapperRef.current) return;

    // Check at least one group has data
    const hasAnyData = cellLineages.some(
      (cell) =>
        LineageDataGroups[cell.id] &&
        Object.keys(LineageDataGroups[cell.id]).length > 0
    );
    if (!hasAnyData) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const { width, height } = wrapperRef.current.getBoundingClientRect();

    // Shared defs for all arrowheads
    const defs = svg.append("defs");

    // One top-level group that receives zoom transform
    const rootG = svg.append("g").attr("class", "root-zoom");

    // Global axis group (not zoomed — fixed on left)
    // We'll draw a shared time axis for the first lineage's time range
    // Actually we place per-panel axes inside rootG so they zoom together.

    // ---- layout: compute per-panel x offsets ----
    // Each panel gets a width proportional to its stepping
    // We use a fixed inner width per panel based on stepping
    const PANEL_INNER_WIDTH = (id: string, stepping: number, LineageData: LineageDataType) => {
      if (!LineageData || Object.keys(LineageData).length === 0) return stepping * 2 + 80;
      const longestAP = (ap: string) => {
        const rap = ap === "p" ? "a" : "p";
        return Object.keys(LineageData)
          .filter((c) => c.includes(id))
          .filter((c) => !c.replace(id, "").includes(rap))
          .reduce((a, b) => (b.length > a.length ? b : a), "");
      };
      const lA = longestAP("a");
      const lP = longestAP("p");
      const leftX = xoffset(id, lA, stepping);
      const rightX = xoffset(id, lP, stepping);
      return Math.abs(rightX - leftX) + 120;
    };

    // Panel origins (cumulative x offset)
    const panelOrigins: number[] = [];
    let cumX = 0;
    cellLineages.forEach((cell) => {
      panelOrigins.push(cumX);
      const ld = LineageDataGroups[cell.id] || {};
      const pw = PANEL_INNER_WIDTH(cell.id, cell.stepping, ld);
      cumX += pw + PANEL_GAP;
    });

    const long_scale = height * 0.003;
    const celllabel_font_size = 7;
    const line_col = "#ccc";

    // ---- draw each panel ----
    cellLineages.forEach((cell, panelIdx) => {
      const OriCellID = cell.id;
      const stepping = cell.stepping;
      const LineageData = LineageDataGroups[cell.id];
      const ColorData = ColorDataGroups?.[cell.id] || {};

      if (!LineageData || Object.keys(LineageData).length === 0) return;

      const panelX = panelOrigins[panelIdx];
      const panelG = rootG.append("g").attr("class", `panel-${OriCellID}`).attr("transform", `translate(${panelX}, 0)`);

      // helpers for this panel
      const parentCell = (CellID: string) => (CellID === OriCellID ? CellID : CellID.slice(0, -1));
      const CellX1 = (CellID: string) => xoffset(OriCellID, CellID, stepping);
      const CellX2 = (CellID: string) => CellX1(parentCell(CellID));

      const getKeyColor = (key: string, tp?: number) => {
        switch (colorMode) {
          case "fate":
            return FateColor[LineageData[key].Fate];
          case "expression":
            return expCol(key, tp ?? LineageData[key].Start, ColorData);
          case "shape":
            return shapeCol(key, tp ?? LineageData[key].Start, ColorData["Range"], ColorData);
          default:
            return getLineageColor(key);
        }
      };

      const values = Object.values(LineageData);
      const minStart = Math.min(...values.map((i) => i.Start));
      const maxEnd = Math.max(...values.map((i) => i.End));
      const TPRange: [number, number] = [minStart, maxEnd];
      const ticksArr = getDivisibleInRange(TPRange, 20);

      const longestAP = (id: string, ap: string) => {
        const rap = ap === "p" ? "a" : "p";
        return Object.keys(LineageData)
          .filter((c) => c.includes(id))
          .filter((c) => !c.replace(id, "").includes(rap))
          .reduce((a, b) => (b.length > a.length ? b : a), "");
      };

      const LineageLongestA = longestAP(OriCellID, "a");
      const x = 70 - CellX1(LineageLongestA);
      const y = height * 0.073;

      const keys = Object.keys(LineageData);
      const labellist = keys.filter((c) => c.length === 6);
      const lineColorMap = new Map(keys.map((key) => [key, getKeyColor(key)]));

      // groups
      const g_verti = panelG.append("g").attr("class", "lines-cell");
      const g_verti_exp = panelG.append("g").attr("class", "lines-tp");
      const g_hori = panelG.append("g").attr("class", "lines-link");
      const g_label = panelG.append("g").attr("class", "lines-label");
      const g_celllabel = panelG.append("g").attr("class", "lines-clab");
      const g_axis = panelG.append("g").attr("class", "g-axis");

      // arrowhead marker (unique per panel)
      defs
        .append("marker")
        .attr("id", `arrowhead-${OriCellID}`)
        .attr("viewBox", "0 0 10 10")
        .attr("refX", 0)
        .attr("refY", 5)
        .attr("markerWidth", 5)
        .attr("markerHeight", 5)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M 0 0 L 10 5 L 0 10 z")
        .attr("fill", "red");

      // arrow line
      panelG
        .append("line")
        .attr("id", `arrowLine-${OriCellID}`)
        .attr("x1", 0).attr("y1", 0).attr("x2", 0).attr("y2", 1)
        .attr("stroke", "red").attr("stroke-width", 1)
        .attr("marker-end", `url(#arrowhead-${OriCellID})`);

      // arrow text
      panelG
        .append("text")
        .attr("id", `arrowText-${OriCellID}`)
        .attr("x", 0).attr("y", -10)
        .attr("text-anchor", "middle")
        .attr("font-size", celllabel_font_size + 2)
        .attr("fill", "red").attr("font-weight", "bold")
        .text("");

      // axis line
      panelG
        .append("line")
        .attr("class", "g-axis")
        .attr("x1", x + CellX1(LineageLongestA) - 30)
        .attr("x2", x + CellX1(LineageLongestA) - 30)
        .attr("y1", y + LineageData[OriCellID].Start * long_scale)
        .attr("y2", y + TPRange[1] * long_scale)
        .attr("stroke", line_col).attr("stroke-width", 2);

      // "Time point" label
      panelG
        .append("text")
        .attr("class", "g-axis")
        .attr("x", x + CellX1(LineageLongestA) - 30)
        .attr("y", y + (LineageData[OriCellID].Start - 20) * long_scale)
        .text("Time point")
        .attr("font-size", celllabel_font_size + 5)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("fill", "white");

      // axis ticks
      g_axis
        .selectAll("line")
        .data(ticksArr)
        .join("line")
        .attr("x1", (d) => x + CellX1(LineageLongestA) - 30)
        .attr("x2", (d) => x + CellX1(LineageLongestA) - 35)
        .attr("y1", (d) => y + d * long_scale)
        .attr("y2", (d) => y + d * long_scale)
        .attr("stroke", line_col).attr("stroke-width", 2);

      g_axis
        .selectAll("text")
        .data(ticksArr)
        .join("text")
        .attr("x", (d) => x + CellX1(LineageLongestA) - 45)
        .attr("y", (d) => y + (d + 2) * long_scale)
        .text((d) => d)
        .attr("font-size", celllabel_font_size)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("fill", "white");

      // vertical lines (per-TP colored)
      keys.forEach((key) => {
        const exp_verti = g_verti_exp.append("g").attr("class", `lines-${key}`);
        exp_verti
          .selectAll("line")
          .data(LineageData[key].TPs)
          .join("line")
          .attr("x1", () => x + CellX1(key))
          .attr("x2", () => x + CellX1(key))
          .attr("y1", (d) => y + d * long_scale)
          .attr("y2", (d) => y + (d + 1) * long_scale)
          .attr("stroke", (d) => {
            switch (colorMode) {
              case "fate": return FateColor[LineageData[key].Fate];
              case "expression": return expCol(key, d, ColorData);
              case "shape": return shapeCol(key, d, ColorData["Range"], ColorData);
              default: return getLineageColor(key);
            }
          })
          .attr("stroke-width", line_width)
          .on("click", function (event, d) {
            setCellName(LineageData[key].CellName);
            setTP(d);
            d3.select(`#arrowLine-${OriCellID}`)
              .attr("x1", x + CellX1(key) - 16)
              .attr("x2", x + CellX1(key) - 5)
              .attr("y1", y + (d + 0.5) * long_scale)
              .attr("y2", y + (d + 0.5) * long_scale);
            d3.select(`#arrowText-${OriCellID}`)
              .attr("x", x + CellX1(key) - 20.5)
              .attr("y", y + d * long_scale - 3)
              .text(LineageData[key].CellName);
          });
      });

      // horizontal division lines
      g_hori
        .selectAll("line")
        .data(keys)
        .join("line")
        .attr("x1", (d) => x + CellX1(d) + (d.endsWith("a") ? line_width / 2 : -line_width / 2))
        .attr("x2", (d) => x + CellX2(d) + (d.endsWith("a") ? line_width / 2 : -line_width / 2))
        .attr("y1", (d) => y + (LineageData[parentCell(d)]?.End + 1) * long_scale + line_width / 2)
        .attr("y2", (d) => y + (LineageData[parentCell(d)]?.End + 1) * long_scale + line_width / 2)
        .attr("stroke", (d) => lineColorMap.get(d) || line_col)
        .attr("stroke-width", line_width);

      // branch label lines
      g_label
        .selectAll("line")
        .data(labellist)
        .join("line")
        .attr("y1", (d) => y + (LineageData[longestAP(d, "p")].End + 15) * long_scale)
        .attr("y2", (d) => y + (LineageData[longestAP(d, "p")].End + 15) * long_scale)
        .attr("x1", (d) => x + CellX1(longestAP(d, "a")))
        .attr("x2", (d) => x + CellX1(longestAP(d, "p")))
        .attr("stroke", "white").attr("stroke-width", line_width);

      g_label
        .selectAll("text")
        .data(labellist)
        .join("text")
        .attr("x", (d) => x + CellX1(d))
        .attr("y", (d) => y + (LineageData[longestAP(d, "p")].End + 20) * long_scale)
        .text((d) => `${LineageData[d].CellName}`)
        .attr("font-size", celllabel_font_size + 10)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "hanging")
        .attr("fill", "white");

      // cell name labels on branches
      g_celllabel
        .selectAll("text")
        .data(keys.filter((str) => str.length < 8))
        .join("text")
        .attr("y", (d) =>
          d === OriCellID ? y : y + (LineageData[d].Start + LineageData[d].End) * long_scale / 2
        )
        .attr("x", (d) => x + CellX1(d))
        .text((d) => LineageData[d].CellName)
        .attr("font-size", (d) => (d === OriCellID ? celllabel_font_size + 14 : celllabel_font_size))
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", (d) => (d === OriCellID ? "Auto" : "hanging"))
        .attr("fill", "white");
    }); // end forEach panel

    // ---- single zoom/pan on the whole SVG ----
    const zoomed = (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
      rootG.attr("transform", event.transform.toString());
    };

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 5])
      .translateExtent([
        [-canvasWidth, -canvasHeight],
        [cumX + canvasWidth, canvasHeight * 3],
      ])
      .on("zoom", zoomed);

    zoomBehaviorRef.current = zoom;
    svg.call(zoom);

    // ResizeObserver
    const resizeObserver = new ResizeObserver(() => {
      if (!wrapperRef.current) return;
      const { width, height } = wrapperRef.current.getBoundingClientRect();
      setCanvasWidth(width);
      setCanvasHeight(height);
      svg.attr("viewBox", `0 0 ${width} ${height}`);
    });
    resizeObserver.observe(wrapperRef.current);

    return () => {
      resizeObserver.disconnect();
      svg.selectAll("*").remove();
    };
  }, [LineageDataGroups, ColorDataGroups, canvasWidth, canvasHeight, colorMode]);

  return (
    <div
      ref={wrapperRef}
      className="lineage-svg w-full h-full relative"
      style={{ minHeight: 500 }}
    >
      {ExpLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
          <Loader className="animate-spin text-white mr-2" size={16} />
          <span className="text-white text-sm">Loading data...</span>
        </div>
      )}
      <svg
        ref={svgRef}
        id="AllLineage-SVG"
        width="100%"
        height="100%"
        viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
      />
    </div>
  );
});
