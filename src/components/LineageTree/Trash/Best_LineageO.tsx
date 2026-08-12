import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Loader } from "lucide-react";
import * as d3 from "d3";
import { FateColor } from "@/config/FateColor";
import { expCol, shapeCol, getLineageColor } from "@/components/utils/LineageTreeFunctions";

// ── helpers ────────────────────────────────────────────────────────────────
function getDivisibleInRange(range: number[], divisor: number): number[] {
  const [start, end] = range;
  const result: number[] = [];
  const firstDivisible = Math.ceil(start / divisor) * divisor;
  for (let i = firstDivisible; i <= end; i += divisor) result.push(i);
  return result;
}

interface ColorData {
  Range?: number[];
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
    NATPs: number[];
  };
}

interface CellLineageConfig {
  id: string;
  CellName: string;
  stepping: number;
}

interface AllSubLineageProps {
  SM: string;
  SMType: "CMap8" | "CShaper17" | "EmbSAM4567" | "EmbSAM89" | "MT_lag1" | "MT_pop1" | "MT_wee";
  cellLineages: CellLineageConfig[];
  GID: string;
  ScDataSet?: string;
  ScGene?: string;
  LineageDataGroups: { [id: string]: LineageDataType } | null;
  colorMode?: "default" | "fate" | "expression" | "shape";
  ColorChange: string;
  ColorDataGroups: { [id: string]: ColorData };
  ExpressionType?: string;
  Fac?: string;
  line_width?: number;
  /** [minScale, maxScale] — defaults to [0.5, 5] */
  ZoomExtent?: [number, number];
  zoomLevel?: number;
  setCellName: (CellName: string) => void;
  ExpLoading: boolean;
}

// ── constants ──────────────────────────────────────────────────────────────
const PANEL_GAP = 60;
const FIXED_LONG_SCALE = 1.8;
const celllabel_font_size = 14;
const line_col = "#ccc";

const klist: Record<string, number> = {
  Zpap: 3.5,
  Zpaa: 0.5,
  Zppp: 0.55,
};
const squzlist: Record<string, number> = {
  Za: 0.8,
  Zpaa: 0.7,
  Zpap: 0.15,
  Zppa: 0.5,
  Zpppa: 0.5,
  Zpppp: 0.1,
};

function xoffset(ori: string, end: string, stepping: number): number {
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
    const k = Object.prototype.hasOwnProperty.call(klist, route) ? klist[route] : 1;
    xoff = eCell === "p" ? xoff + eachstep * k * s : xoff - eachstep * k * s;
    eachstep /= 2;
  }
  return xoff;
}

// ── component ──────────────────────────────────────────────────────────────
export const Best_Lineage = forwardRef<{ resetZoom: () => void }, AllSubLineageProps>(
  (
    {
      cellLineages,
      LineageDataGroups,
      line_width = 1.5,
      colorMode = "default",
      ColorDataGroups,
      setCellName,
      ExpLoading,
      ZoomExtent,
      zoomLevel,
    },
    ref
  ) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const canvasWidthRef = useRef(900);
    const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
    const selectedCellRef = useRef<string | null>(null);
    const selectedTrianglesRef = useRef<SVGGElement | null>(null);

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

    // ── programmatic zoom level ────────────────────────────────────────────
    // Runs whenever zoomLevel prop changes, independently of the draw effect.
    useEffect(() => {
      if (zoomLevel == null || !svgRef.current || !zoomBehaviorRef.current) return;
      const svg = d3.select(svgRef.current);
      // Get current transform so we only change the scale, preserving pan position
      const currentTransform = d3.zoomTransform(svgRef.current);
      const cx = canvasWidthRef.current / 2;
      const cy = 300; // approximate vertical center of viewport
      // Scale around the center of the viewport
      const newTransform = d3.zoomIdentity
        .translate(cx, cy)
        .scale(zoomLevel)
        .translate(-cx, -cy)
        // re-apply current translation offset scaled to new zoom
        .translate(
          (currentTransform.x - cx * (1 - currentTransform.k)) / zoomLevel,
          (currentTransform.y - cy * (1 - currentTransform.k)) / zoomLevel
        );
      svg
        .transition()
        .duration(400)
        .call(zoomBehaviorRef.current.transform, d3.zoomIdentity.translate(
          currentTransform.x + (zoomLevel - currentTransform.k) * cx / currentTransform.k,
          currentTransform.y
        ).scale(zoomLevel));
    }, [zoomLevel]);

    function mergeTPSegments(
      tps: number[],
      getColorFn: (tp: number) => string
    ): { startTP: number; endTP: number; color: string }[] {
      if (tps.length === 0) return [];
      const segments: { startTP: number; endTP: number; color: string }[] = [];
      let segStart = tps[0];
      let segColor = getColorFn(tps[0]);

      for (let i = 1; i < tps.length; i++) {
        const c = getColorFn(tps[i]);
        if (c !== segColor) {
          segments.push({ startTP: segStart, endTP: tps[i - 1], color: segColor });
          segStart = tps[i];
          segColor = c;
        }
      }
      segments.push({ startTP: segStart, endTP: tps[tps.length - 1], color: segColor });
      return segments;
    }

    useEffect(() => {
      if (!LineageDataGroups || !svgRef.current || !wrapperRef.current) return;

      const hasAnyData = cellLineages.some(
        (cell) => LineageDataGroups[cell.id] && Object.keys(LineageDataGroups[cell.id]).length > 0
      );
      if (!hasAnyData) return;

      const wrapperWidth = wrapperRef.current.getBoundingClientRect().width;
      canvasWidthRef.current = wrapperWidth;

      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();

      const defs = svg.append("defs");
      const rootG = svg.append("g").attr("class", "root-zoom");

      // ── compute each panel's height to stack vertically ──────────────────
      const panelHeights: number[] = cellLineages.map((cell) => {
        const ld = LineageDataGroups[cell.id];
        if (!ld || Object.keys(ld).length === 0) return 0;
        const values = Object.values(ld);
        const maxEnd = Math.max(...values.map((i) => i.End));
        const minStart = Math.min(...values.map((i) => i.Start));
        const topMargin = 60;
        const bottomExtra = 80;
        return topMargin + (maxEnd - minStart) * FIXED_LONG_SCALE + bottomExtra;
      });

      const panelOrigins: number[] = [];
      let cumY = 0;
      panelHeights.forEach((h) => {
        panelOrigins.push(cumY);
        cumY += h + PANEL_GAP;
      });
      const totalHeight = cumY;

      svg
        .attr("width", wrapperWidth)
        .attr("height", 2600)
        .attr("viewBox", `0 0 ${wrapperWidth} ${totalHeight}`);

      // ── draw each panel ──────────────────────────────────────────────────
      cellLineages.forEach((cell, panelIdx) => {
        const OriCellID = cell.id;
        const stepping = cell.stepping;
        const LineageData = LineageDataGroups[cell.id];
        const ColorData = ColorDataGroups?.[cell.id] || {};

        if (!LineageData || Object.keys(LineageData).length === 0) return;

        const panelOffsetY = panelOrigins[panelIdx];
        const panelG = rootG
          .append("g")
          .attr("class", `panel-${OriCellID}`)
          .attr("transform", `translate(0, ${panelOffsetY})`);

        const parentCell = (id: string) => (id === OriCellID ? id : id.slice(0, -1));
        const CellX1 = (id: string) => xoffset(OriCellID, id, stepping);
        const CellX2 = (id: string) => CellX1(parentCell(id));

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
        const y = 50;
        const tpY = (tp: number) => y + (tp - minStart) * FIXED_LONG_SCALE;
        const LabelShowLength = 8;

        const getColor = (key: string, tp: number) => {
          switch (colorMode) {
            case "fate":       return FateColor[LineageData[key].Fate];
            case "expression": return expCol(key, tp, ColorData);
            case "shape":      return shapeCol(key, tp, ColorData["Range"], ColorData);
            default:           return getLineageColor(key);
          }
        };

        const keys = Object.keys(LineageData);
        const labellist = keys.filter((c) => c.length === 6);
        const lineColorMap = new Map(keys.map((k) => [k, getColor(k, LineageData[k].Start)]));

        const g_verti_exp = panelG.append("g").attr("class", "lines-tp");
        const g_hori      = panelG.append("g").attr("class", "lines-link");
        const g_label     = panelG.append("g").attr("class", "lines-label");
        const g_celllabel = panelG.append("g").attr("class", "lines-clab").style("pointer-events", "none");
        const g_axis      = panelG.append("g").attr("class", "g-axis");

        const axisX = x + CellX1(LineageLongestA) - 30;
        panelG.append("line")
          .attr("x1", axisX).attr("x2", axisX)
          .attr("y1", tpY(minStart)).attr("y2", tpY(maxEnd))
          .attr("stroke", line_col).attr("stroke-width", 2);

        panelG.append("text")
          .attr("x", axisX)
          .attr("y", tpY(minStart) - 15)
          .text("Time point")
          .attr("font-size", celllabel_font_size + 5)
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .attr("fill", "white");

        g_axis.selectAll("line")
          .data(ticksArr).join("line")
          .attr("x1", axisX).attr("x2", axisX - 5)
          .attr("y1", (d) => tpY(d)).attr("y2", (d) => tpY(d))
          .attr("stroke", line_col).attr("stroke-width", 2);

        g_axis.selectAll("text")
          .data(ticksArr).join("text")
          .attr("x", axisX - 10)
          .attr("y", (d) => tpY(d))
          .text((d) => d)
          .attr("font-size", celllabel_font_size)
          .attr("text-anchor", "end")
          .attr("dominant-baseline", "middle")
          .attr("fill", "white");

        keys.forEach((key) => {
          const cx = x + CellX1(key);

          const tpSegments = mergeTPSegments(LineageData[key].TPs, (d) => getColor(key, d));
          g_verti_exp.append("g").attr("class", `lines-${key}`)
            .style("shape-rendering", "crispEdges")
            .selectAll("rect")
            .data(tpSegments)
            .join("rect")
            .attr("x", cx - line_width / 2)
            .attr("y", (d) => tpY(d.startTP))
            .attr("width", line_width)
            .attr("height", (d) => tpY(d.endTP) + FIXED_LONG_SCALE - tpY(d.startTP))
            .attr("fill", (d) => d.color)
            .on("click", function (_event, _d) {
              const clickedKey = key;

              if (selectedCellRef.current) {
                const prevKey = selectedCellRef.current;
                rootG.selectAll(".lines-clab text")
                  .filter((k: any) => k === prevKey)
                  .attr("fill", "white")
                  .style("display", (k: any) => (k.length < LabelShowLength ? null : "none"));
              }

              rootG.selectAll(".lines-clab text")
                .filter((k: any) => k.length < LabelShowLength)
                .attr("fill", "white");

              rootG.selectAll(".lines-clab text")
                .filter((k: any) => k === clickedKey)
                .style("display", null)
                .attr("fill", "red");

              selectedCellRef.current = clickedKey;

              const triG = rootG.select("#triangle-indicators");
              triG.selectAll("*").remove();

              const branchStart = LineageData[clickedKey].Start;
              const branchEnd   = LineageData[clickedKey].End;
              const absY_top    = panelOffsetY + tpY(branchStart);
              const absY_bot    = panelOffsetY + tpY(branchEnd) + FIXED_LONG_SCALE;
              const triX = x + CellX1(clickedKey);
              const tw = 6;
              const th = 8;

              triG.append("polygon")
                .attr("points", `${triX},${absY_top + th} ${triX - tw},${absY_top} ${triX + tw},${absY_top}`)
                .attr("fill", "red")
                .style("pointer-events", "none");

              triG.append("polygon")
                .attr("points", `${triX},${absY_bot - th} ${triX - tw},${absY_bot} ${triX + tw},${absY_bot}`)
                .attr("fill", "red")
                .style("pointer-events", "none");

              setCellName(LineageData[key].CellName);
            });

          const natpSegments = mergeTPSegments(LineageData[key].NATPs, () => "DimGrey");
          g_verti_exp.append("g").attr("class", `Glines-${key}`)
            .selectAll("rect")
            .data(natpSegments)
            .join("rect")
            .attr("x", cx - line_width / 2)
            .attr("y", (d) => tpY(d.startTP))
            .attr("width", line_width)
            .attr("height", (d) => tpY(d.endTP) + FIXED_LONG_SCALE - tpY(d.startTP))
            .attr("fill", "DimGrey");
        });

        g_hori.selectAll("line")
          .data(keys).join("line")
          .attr("x1", (d) => x + CellX1(d) + (d.endsWith("a") ? line_width / 2 : -line_width / 2))
          .attr("x2", (d) => x + CellX2(d) + (d.endsWith("a") ? line_width / 2 : -line_width / 2))
          .attr("y1", (d) => tpY((LineageData[parentCell(d)]?.End ?? minStart) + 1) + line_width / 2)
          .attr("y2", (d) => tpY((LineageData[parentCell(d)]?.End ?? minStart) + 1) + line_width / 2)
          .attr("stroke", (d) => lineColorMap.get(d) || line_col)
          .attr("stroke-width", line_width);

        g_label.selectAll("line")
          .data(labellist).join("line")
          .attr("y1", (d) => tpY(LineageData[longestAP(d, "p")].End + 15))
          .attr("y2", (d) => tpY(LineageData[longestAP(d, "p")].End + 15))
          .attr("x1", (d) => x + CellX1(longestAP(d, "a")))
          .attr("x2", (d) => x + CellX1(longestAP(d, "p")))
          .attr("stroke", "white").attr("stroke-width", line_width);

        g_label.selectAll("text")
          .data(labellist).join("text")
          .attr("x", (d) => x + CellX1(d))
          .attr("y", (d) => tpY(LineageData[longestAP(d, "p")].End + 20))
          .text((d) => LineageData[d].CellName)
          .attr("font-size", celllabel_font_size + 10)
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "hanging")
          .attr("fill", "white");

        g_celllabel.selectAll("text")
          .data(keys).join("text")
          .attr("y", (d) =>
            d === OriCellID
              ? tpY(LineageData[d].Start) - 5
              : tpY((LineageData[d].Start + LineageData[d].End) / 2)
          )
          .attr("x", (d) => x + CellX1(d))
          .text((d) => LineageData[d].CellName)
          .attr("font-size", (d) => (d === OriCellID ? celllabel_font_size + 14 : celllabel_font_size))
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", (d) => (d === OriCellID ? "auto" : "hanging"))
          .attr("fill", "white")
          .style("display", (d) => (d.length < LabelShowLength ? null : "none"));
      });

      rootG.append("g").attr("id", "triangle-indicators");

      defs
        .append("marker")
        .attr("id", "arrowhead-shared")
        .attr("viewBox", "0 0 10 10")
        .attr("refX", 0).attr("refY", 5)
        .attr("markerWidth", 5).attr("markerHeight", 5)
        .attr("orient", "auto")
        .append("path").attr("d", "M 0 0 L 10 5 L 0 10 z").attr("fill", "red");

      // ── zoom/pan ──────────────────────────────────────────────────────────
      const zoomed = (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        rootG.attr("transform", event.transform.toString());
      };

      const zoom = d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent(ZoomExtent)
        .translateExtent([
          [-canvasWidthRef.current, -200],
          [canvasWidthRef.current * 2, totalHeight + 200],
        ])
        .filter((event) => {
          return event.type !== "wheel";
        })
        .on("zoom", zoomed);

      zoomBehaviorRef.current = zoom;
      svg.call(zoom);

      // Apply initial zoomLevel if provided
      if (zoomLevel != null) {
        svg.call(zoom.transform, d3.zoomIdentity.scale(zoomLevel));
      }

      const resizeObserver = new ResizeObserver(() => {
        if (!wrapperRef.current) return;
        const { width } = wrapperRef.current.getBoundingClientRect();
        if (Math.abs(width - canvasWidthRef.current) > 10) {
          canvasWidthRef.current = width;
          svg.attr("width", width).attr("viewBox", `0 0 ${width} ${totalHeight}`);
        }
      });
      resizeObserver.observe(wrapperRef.current);

      return () => {
        resizeObserver.disconnect();
        svg.selectAll("*").remove();
      };
    }, [LineageDataGroups, ColorDataGroups, colorMode, line_width, ZoomExtent]);

    return (
      <div ref={wrapperRef} style={{ position: "relative", width: "100%", overflow: "hidden" }}>
        {ExpLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
            <Loader className="animate-spin text-white" />
            <span className="ml-2 text-white">Loading data...</span>
          </div>
        )}
        <svg ref={svgRef} style={{ display: "block", width: "100%" }} />
      </div>
    );
  }
);
