import { useState, useMemo, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Loader } from "lucide-react";
import * as d3 from "d3";
import { FateColor } from "@/config/FateColor";
import { expCol, expCol2, shapeCol, getLineageColor } from "@/components/utils/LineageTreeFunctions";
import { LineageSetting } from "@/components/utils/usefulobject";
import { API_BASE } from "@/components/utils/API_BASE";

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
  GID?: string;
  ScGene?: string;
  ScGene2?: string;
  colorMode?: "default" | "fate" | "expression" | "shape";
  ExpColorMode?: 1 | 2;
  ExpressionType?: string;
  Fac?: string;
  line_width?: number;
  setCellName: (CellName: string) => void;
  setExpVal?: (ExpVal: object) => void;
  zoomLevel?: number;
  setScalingRange?: (Range: [number, number, number, number]) => void;
  Theme?: "dark" | "bright";
}

// ── shared per-panel segment types ─────────────────────────────────────────
interface FlatSegment {
  key: string;
  startTP: number;
  endTP: number;
  color: string;
  isNA: boolean;
  cx: number;
}

// ── component ──────────────────────────────────────────────────────────────
export const Best_Lineage = forwardRef<{ resetZoom: () => void }, AllSubLineageProps>((
  {
    SM,
    GID,
    ScGene,
    ScGene2,
    ExpressionType,
    Fac,
    line_width = 1.5,
    colorMode = "default",
    ExpColorMode,
    setCellName,
    setExpVal,
    zoomLevel,
    setScalingRange,
    Theme = 'dark',
  },
  ref
) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasWidthRef = useRef(900);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const selectedCellRef = useRef<string | null>(null);
  const renderTokenRef = useRef(0); // cancels stale chunked render loops

  const [LineageData, setLineageData] = useState<LineageDataType>();
  const [ColorData, setColorData] = useState<ColorData>({});

  const [ExpLoading, setExpLoading] = useState(false);

  const cellLineages = LineageSetting[SM].cellLineages;
  const klist = LineageSetting[SM].klist;
  const squzlist = LineageSetting[SM].squzlist;
  const showlabellist = LineageSetting[SM].showlabellist;
  const FIXED_LONG_SCALE = LineageSetting[SM].L;
  const LabelShowLength = LineageSetting[SM].LabelShowLength;
  const MarginLeft = LineageSetting[SM].MarginLeft;

  // ── constants ──────────────────────────────────────────────────────────────
  const PANEL_GAP = 60;
  const celllabel_font_size = 14;
  const line_col = Theme === 'dark' ? "#ccc" : 'black';
  const labelColor = Theme === 'dark' ? 'white' : 'black';

  const scaleExtentMin = 0.5;
  const scaleExtentMax = 5;

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

  // load LineageData
  useEffect(() => {
    if (!SM) { console.log("require SM"); return; }
    const fetchData = async () => {
      try {
        const url = `${API_BASE}/Tree?SM=${SM}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const jsonData = await response.json();
        setLineageData(jsonData);
      } catch (err) {
        setLineageData(null);
      }
    };
    fetchData();
  }, [SM]);

  // load reporter Expression Data
  useEffect(() => {
    if (colorMode !== 'expression' || ExpressionType !== 'Reporters' || !GID) { setColorData({}); return; }
    const fetchData = async () => {
      try {
        setExpLoading(true);
        const url = `${API_BASE}/Exp/LineageExpressionData?SM=${SM}&ExpColName=${GID}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const jsonData = await response.json();
        setColorData(jsonData);
        setScalingRange(jsonData.Range);
      } catch (err) {
        setColorData({});
      } finally {
        setExpLoading(false);
      }
    };
    fetchData();
  }, [colorMode, ExpressionType, GID, SM]);

  // load single cell Expression Data
  useEffect(() => {
    if (colorMode !== 'expression' || ExpressionType !== 'SingleCell' || !ScGene) { setColorData({}); return; }
    const fetchData = async () => {
      try {
        setExpLoading(true);
        const url = ScGene2
          ? `${API_BASE}/scExp/ForLineageTreeDual?DataSet=P009D01S&Gene=${ScGene}&Gene2=${ScGene2}`
          : `${API_BASE}/scExp/ForLineageTree?DataSet=P009D01S&Gene=${ScGene}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const jsonData = await response.json();
        setColorData(jsonData);
        setScalingRange(jsonData.Range);
      } catch (err) {
        setColorData({});
      } finally {
        setExpLoading(false);
      }
    };
    fetchData();
  }, [colorMode, ExpressionType, ScGene, ScGene2, SM]);

  // load Shape Data
  useEffect(() => {
    if (colorMode !== 'shape' || !Fac) { setColorData({}); return; }
    const fetchData = async () => {
      try {
        setExpLoading(true);
        const url = `${API_BASE}/Shape/LineageShapeData?SM=${SM}&Fac=${Fac}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const jsonData = await response.json();
        setColorData(jsonData);
        setScalingRange(jsonData.Range);
      } catch (err) {
        setColorData({});
      } finally {
        setExpLoading(false);
      }
    };
    fetchData();
  }, [Fac, SM]);

  const LineageDataGroups = useMemo(() => {
    if (!LineageData) return;
    const result: Record<string, LineageDataType> = Object.fromEntries(
      cellLineages.map(lineage => [lineage.id, {} as LineageDataType])
    );
    Object.entries(LineageData).forEach(([key, value]) => {
      const match = cellLineages.find(lineage => key.startsWith(lineage.id));
      if (match) result[match.id][key] = value;
    });
    return result;
  }, [LineageData]);

  const ColorDataGroups = useMemo(() => {
    const result = Object.fromEntries(cellLineages.map(lineage => [lineage.id, {}]));
    Object.entries(ColorData).forEach(([key, value]) => {
      const match = cellLineages.find(lineage => key.startsWith(lineage.id));
      if (match) result[match.id][key] = value;
    });
    Object.keys(result).forEach(id => { result[id]['Range'] = ColorData.Range; });
    return result;
  }, [ColorData]);

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

  // ── zoom level effect ──────────────────────────────────────────────────────
  useEffect(() => {
    if (zoomLevel == null || !svgRef.current || !zoomBehaviorRef.current) return;

    const svg = d3.select(svgRef.current);
    const svgEl = svgRef.current as SVGSVGElement;
    const { width, height } = svgEl.getBoundingClientRect();

    const cx = width / 2;
    const cy = height / 2;

    const newTransform = d3.zoomIdentity
      .translate(cx, cy)
      .scale(zoomLevel)
      .translate(-cx, -cy);

    svg
      .transition()
      .duration(350)
      .call(zoomBehaviorRef.current.transform, newTransform);
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

    // invalidate any in-flight chunked render from a previous effect run
    renderTokenRef.current += 1;
    const myToken = renderTokenRef.current;

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
      .attr("height", LineageSetting[SM].Height || 2600)
      .attr("viewBox", `0 0 ${wrapperWidth} ${totalHeight}`);

    defs
      .append("marker")
      .attr("id", "arrowhead-shared")
      .attr("viewBox", "0 0 10 10")
      .attr("refX", 0).attr("refY", 5)
      .attr("markerWidth", 5).attr("markerHeight", 5)
      .attr("orient", "auto")
      .append("path").attr("d", "M 0 0 L 10 5 L 0 10 z").attr("fill", "red");

    // ── single delegated click handler shared across ALL panels ──────────
    // instead of one .on("click", ...) per <rect> (thousands of listeners),
    // we attach ONE listener on rootG and resolve which segment was hit via
    // the datum bound to the clicked element. This removes the dominant
    // listener-allocation cost that stalls the main thread on slow machines.
    interface PanelCtx {
      LineageData: LineageDataType;
      ColorData: any;
      x: number;
      tpY: (tp: number) => number;
      CellX1: (id: string) => number;
      panelOffsetY: number;
    }
    const perPanelCtx = new Map<string, PanelCtx>();

    rootG.on("click", function (event) {
      const target = event.target as SVGElement;
      const d = d3.select(target).datum() as (FlatSegment | undefined);
      if (!d || d.isNA) return;

      let panelCtx: PanelCtx | undefined;
      for (const cell of cellLineages) {
        if (d.key.startsWith(cell.id)) { panelCtx = perPanelCtx.get(cell.id); break; }
      }
      if (!panelCtx) return;
      const { LineageData, ColorData, x, tpY, CellX1, panelOffsetY } = panelCtx;
      const clickedKey = d.key;

      if (selectedCellRef.current) {
        const prevKey = selectedCellRef.current;
        rootG.selectAll<SVGTextElement, string>(".lines-clab text")
          .filter((k) => k === prevKey)
          .attr("fill", "white")
          .style("display", (k) => (k.length < LabelShowLength ? null : "none"));
      }

      rootG.selectAll<SVGTextElement, string>(".lines-clab text")
        .filter((k) => k.length < LabelShowLength)
        .attr("fill", labelColor);

      rootG.selectAll<SVGTextElement, string>(".lines-clab text")
        .filter((k) => k === clickedKey)
        .style("display", null)
        .attr("fill", "red");

      selectedCellRef.current = clickedKey;

      const triG = rootG.select<SVGGElement>("#triangle-indicators");
      triG.selectAll("*").remove();

      const branchStart = LineageData[clickedKey].Start;
      const branchEnd = LineageData[clickedKey].End;
      const absY_top = panelOffsetY + tpY(branchStart);
      const absY_bot = panelOffsetY + tpY(branchEnd) + FIXED_LONG_SCALE;
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

      setCellName(LineageData[clickedKey].CellName);
      colorMode === 'expression' && setExpVal?.(ColorData[clickedKey]);
    });

    // ── build static (cheap) parts of every panel synchronously ──────────
    // static parts: axis, ticks, horizontal links, labels — these are few
    // elements per panel and safe to build immediately.
    const heavyWorkQueue: Array<() => void> = [];

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

      const x = -CellX1(LineageLongestA) + MarginLeft;
      const y = 50;
      const tpY = (tp: number) => y + (tp - minStart) * FIXED_LONG_SCALE;

      perPanelCtx.set(OriCellID, { LineageData, ColorData, x, tpY, CellX1, panelOffsetY });

      // colorCache dedupes repeated getColor() calls per (key) baseline color
      const colorCache = new Map<string, string>();
      const getColor = (key: string, tp: number) => {
        switch (colorMode) {
          case "fate": return FateColor[LineageData[key].Fate];
          case "expression": return ExpColorMode === 1
            ? expCol(key, tp, ColorData)
            : expCol2(key, tp, ColorData);
          case "shape": return shapeCol(key, tp, ColorData["Range"], ColorData);
          default: return getLineageColor(key);
        }
      };

      const keys = Object.keys(LineageData);
      const labellist = keys.filter((c) => c.length === 6);
      const lineColorMap = new Map(keys.map((k) => [k, getColor(k, LineageData[k].Start)]));

      const g_verti_exp = panelG.append("g").attr("class", "lines-tp");
      const g_hori = panelG.append("g").attr("class", "lines-link");
      const g_label = panelG.append("g").attr("class", "lines-label");
      const g_celllabel = panelG.append("g").attr("class", "lines-clab").style("pointer-events", "none");
      const g_axis = panelG.append("g").attr("class", "g-axis");

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
        .attr("fill", labelColor);

      g_axis.selectAll<SVGLineElement, number>("line")
        .data(ticksArr).join("line")
        .attr("x1", axisX).attr("x2", axisX - 5)
        .attr("y1", (d) => tpY(d)).attr("y2", (d) => tpY(d))
        .attr("stroke", line_col).attr("stroke-width", 2);

      g_axis.selectAll<SVGTextElement, number>("text")
        .data(ticksArr).join("text")
        .attr("x", axisX - 10)
        .attr("y", (d) => tpY(d))
        .text((d) => d)
        .attr("font-size", celllabel_font_size)
        .attr("text-anchor", "end")
        .attr("dominant-baseline", "middle")
        .attr("fill", labelColor);

      g_hori.selectAll("line")
        .data(keys).join("line")
        .attr("x1", (d) => x + CellX1(d) + (d.endsWith("a") ? line_width / 2 : -line_width / 2))
        .attr("x2", (d) => x + CellX2(d) + (d.endsWith("a") ? line_width / 2 : -line_width / 2))
        .attr("y1", (d) => tpY((LineageData[parentCell(d)]?.End ?? minStart) + 1) + line_width / 2)
        .attr("y2", (d) => tpY((LineageData[parentCell(d)]?.End ?? minStart) + 1) + line_width / 2)
        .attr("stroke", (d) => lineColorMap.get(d) || line_col)
        .attr("stroke-width", line_width);

      showlabellist && g_label.selectAll<SVGLineElement, string>("line")
        .data(labellist).join("line")
        .attr("y1", (d) => {
          const a = LineageData[longestAP(d, "a")];
          const p = LineageData[longestAP(d, "p")];
          const later = a.End >= p.End ? a : p;
          return tpY(later.End + 15);
        })
        .attr("y2", (d) => {
          const a = LineageData[longestAP(d, "a")];
          const p = LineageData[longestAP(d, "p")];
          const later = a.End >= p.End ? a : p;
          return tpY(later.End + 15);
        })
        .attr("x1", (d) => x + CellX1(longestAP(d, "a")))
        .attr("x2", (d) => x + CellX1(longestAP(d, "p")))
        .attr("stroke", labelColor).attr("stroke-width", line_width);

      showlabellist && g_label.selectAll<SVGTextElement, string>("text")
        .data(labellist).join("text")
        .attr("x", (d) => x + CellX1(d))
        .attr("y", (d) => {
          const a = LineageData[longestAP(d, "a")];
          const p = LineageData[longestAP(d, "p")];
          const later = a.End >= p.End ? a : p;
          return tpY(later.End + 20);
        })
        .text((d) => LineageData[d].CellName)
        .attr("font-size", celllabel_font_size + 10)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "hanging")
        .attr("fill", labelColor);

      g_celllabel.selectAll<SVGTextElement, string>("text")
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
        .attr("fill", labelColor)
        .style("display", (d) => (d.length < LabelShowLength ? null : "none"));

      // ── build the heavy per-timepoint colored segments as ONE flattened
      // batch per panel (single data-join instead of one join per cell) ───
      heavyWorkQueue.push(() => {
        const flatTP: FlatSegment[] = [];
        const flatNA: FlatSegment[] = [];

        keys.forEach((key) => {
          const cx = x + CellX1(key);

          const tpSegments = mergeTPSegments(
            LineageData[key].TPs,
            (d) => getColor(key, d)
          );
          tpSegments.forEach((seg) => flatTP.push({ ...seg, key, isNA: false, cx }));

          const natpSegments = mergeTPSegments(
            LineageData[key].NATPs,
            () => "DimGrey"
          );
          natpSegments.forEach((seg) => flatNA.push({ ...seg, key, isNA: true, cx }));
        });

        g_verti_exp.style("shape-rendering", "crispEdges")
          .selectAll("rect.tp-seg")
          .data(flatTP)
          .join("rect")
          .attr("class", "tp-seg")
          .attr("x", (d) => d.cx - line_width / 2)
          .attr("y", (d) => tpY(d.startTP))
          .attr("width", line_width)
          .attr("height", (d) => tpY(d.endTP) + FIXED_LONG_SCALE - tpY(d.startTP))
          .attr("fill", (d) => d.color)
          .style("cursor", "pointer");

        g_verti_exp
          .selectAll("rect.na-seg")
          .data(flatNA)
          .join("rect")
          .attr("class", "na-seg")
          .attr("x", (d) => d.cx - line_width / 2)
          .attr("y", (d) => tpY(d.startTP))
          .attr("width", line_width)
          .attr("height", (d) => tpY(d.endTP) + FIXED_LONG_SCALE - tpY(d.startTP))
          .attr("fill", "DimGrey")
          .style("pointer-events", "none");
      });
    });

    // ── run the heavy per-panel work across animation frames instead of all
    // in one synchronous block. This keeps the main thread responsive on
    // slower machines: the browser gets to paint/handle input between
    // panels rather than blocking for the full duration of the draw. ──────
    const runChunked = (idx: number) => {
      if (myToken !== renderTokenRef.current) return; // a newer render started; abort
      if (idx >= heavyWorkQueue.length) return;
      heavyWorkQueue[idx]();
      requestAnimationFrame(() => runChunked(idx + 1));
    };
    requestAnimationFrame(() => runChunked(0));

    // create the triangle-indicator layer LAST so it's appended after all
    // panel <g> elements — SVG paints in document order, so a later sibling
    // renders on top. This keeps the click-selection triangles visible in
    // front of the lineage tree instead of being covered by later panels.
    const triangleG = rootG.append("g").attr("id", "triangle-indicators");

    // ── zoom/pan ───────────────────────────────────────────────────────────
    const zoomed = (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
      rootG.attr("transform", event.transform.toString());
    };

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([scaleExtentMin, scaleExtentMax])
      .translateExtent([
        [-canvasWidthRef.current, -1200],
        [canvasWidthRef.current * 2, totalHeight + 1200],
      ])
      .filter((event) => event.type !== "wheel")
      .on("zoom", zoomed);

    zoomBehaviorRef.current = zoom;
    svg.call(zoom);

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
      renderTokenRef.current += 1; // abort any pending chunked frames
      resizeObserver.disconnect();
      svg.selectAll("*").remove();
    };
  }, [LineageDataGroups, ColorDataGroups, colorMode, line_width, Theme]);

  return (
    <div
      ref={wrapperRef}
      className="lineage-svg w-full relative overflow-y-auto overflow-x-hidden"
      style={{
        minHeight: 400, maxHeight: "500vh",
        backgroundColor: Theme === 'dark' ? '' : "#FFFAFA"
      }}
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
        style={{ display: "block" }}
      />
    </div>
  );
});
