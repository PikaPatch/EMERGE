import { useMemo, useRef, useEffect, useState } from "react";
import { Loader } from "lucide-react";
import * as d3 from "d3";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ColorScaler } from "@/components/utils/ColorScaler";
import { API_BASE } from "@/components/utils/API_BASE";

interface HeatmapEntry {
  ExpColName: string;
  PaperID: string;
  Gene: string;
  TP: number;
  Exp: number;
}

interface Props {
  SM: string;
  CellName: string;
}

export const GeneExpressionHeatmap2 = ({ SM, CellName }: Props) => {
  const svgRef = useRef(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [HeatMapData, setHeatMapData] = useState(null);
  const [ExpLoading, setExpLoading] = useState(false);

  useEffect(() => {
    if (!CellName) {
      return;
    }
    const fetchData = async () => {
      try {
        setExpLoading(true);
        const url = `${API_BASE}/Exp/HeatmapWithGene?SM=${SM}&CellName=${CellName}`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const jsonData = await response.json();
        setHeatMapData(jsonData);
      } catch (err) {
        console.error("Error fetching exp data:", err);
        setHeatMapData(null);
      } finally {
        setExpLoading(false);
      }
    };
    fetchData();
  }, [SM, CellName]);

  // Process data
  const { uniqueCMOSGIDs, uniqueTPs, expRange } = useMemo(() => {
    const data = HeatMapData as HeatmapEntry[];
    if (!data || data.length === 0) {
      return {
        uniqueCMOSGIDs: [],
        uniqueTPs: [],
        expRange: [0, 1] as [number, number],
      };
    }
    const cmosgids = [...new Set(data.map((d) => d.ExpColName))].sort();
    const tps = [...new Set(data.map((d) => d.TP))].sort((a, b) => a - b);
    const validExps = data.filter((d) => d.Exp !== -1).map((d) => d.Exp);
    const minExp = validExps.length > 0 ? Math.min(...validExps) : 0;
    const maxExp = validExps.length > 0 ? Math.max(...validExps) : 1;
    return {
      uniqueCMOSGIDs: cmosgids,
      uniqueTPs: tps,
      expRange: [minExp, maxExp] as [number, number],
    };
  }, [HeatMapData]);

  // D3 Heatmap rendering
  useEffect(() => {
    if (!svgRef.current || HeatMapData.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 120, right: 30, bottom: 20, left: 60 };
    const cellWidth = 10;
    const cellHeight = 10;
    const width = uniqueCMOSGIDs.length * cellWidth + margin.left + margin.right;
    const height = uniqueTPs.length * cellHeight + margin.top + margin.bottom;

    svg.attr("width", width).attr("height", height);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const colorScale = ColorScaler(expRange);
    const noDataColor = "#9ca3af";

    const xScale = d3
      .scaleBand()
      .domain(uniqueCMOSGIDs)
      .range([0, uniqueCMOSGIDs.length * cellWidth])
      .padding(0.05);

    const yScale = d3
      .scaleBand()
      .domain(uniqueTPs)
      .range([0, uniqueTPs.length * cellHeight])
      .padding(0.05);

    // Legend
    const legendWidth = 120;
    const legendHeight = 12;
    const legendX = 0;
    const legendY = -65;
    const legendScale = d3.scaleLinear().domain(expRange).range([0, legendWidth]);
    const legendAxis = d3
      .axisTop(legendScale)
      .ticks(4)
      .tickFormat((d) => (d as number).toFixed(2));

    const defs = svg.append("defs");
    const gradient = defs
      .append("linearGradient")
      .attr("id", "exp-legend-gradient-2")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "0%");

    const numStops = 10;
    for (let i = 0; i <= numStops; i++) {
      const t = i / numStops;
      const value = expRange[0] + t * (expRange[1] - expRange[0]);
      gradient
        .append("stop")
        .attr("offset", `${t * 100}%`)
        .attr("stop-color", colorScale(value));
    }

    g.append("rect")
      .attr("x", legendX)
      .attr("y", legendY)
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .attr("rx", 2)
      .style("fill", "url(#exp-legend-gradient-2)");

    g.append("g")
      .attr("transform", `translate(${legendX}, ${legendY})`)
      .call(legendAxis)
      .selectAll("text")
      .attr("fill", "currentColor")
      .style("font-size", "9px");

    g.selectAll(".domain, .tick line").attr("stroke", "currentColor");

    g.append("g")
      .call(d3.axisTop(xScale).tickFormat((d) => d))
      .selectAll("text")
      .attr("fill", "currentColor")
      .style("font-size", "7px")
      .attr("transform", "rotate(-45)")
      .attr("text-anchor", "start")
      .each(function (d) {
        const el = d3.select(this);
        const parts = (d as string).split("_");
        const gene = parts[0];
        const rest = parts.slice(1).join("_");
        el.text("");
        el.append("tspan").attr("font-style", "italic").text(gene);
        if (rest) {
          el.append("tspan").attr("font-style", "normal").text(`_${rest}`);
        }
      });

    g.append("g")
      .call(d3.axisLeft(yScale).tickFormat((d) => `${d}`))
      .selectAll("text")
      .attr("fill", "currentColor")
      .style("font-size", "10px");

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -(uniqueTPs.length * cellHeight) / 2)
      .attr("y", -margin.left + 15)
      .attr("text-anchor", "middle")
      .attr("fill", "currentColor")
      .style("font-size", "12px")
      .style("font-weight", "500")
      .text("Time point");

    const tooltip = d3.select(tooltipRef.current);

    const positionTooltip = (event: MouseEvent) => {
      const tooltipEl = tooltipRef.current;
      if (!tooltipEl) return;

      const tooltipWidth = tooltipEl.offsetWidth;
      const tooltipHeight = tooltipEl.offsetHeight;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const offset = 14;

      // Horizontal: flip to left if overflowing right edge
      let left: number;
      if (event.clientX + offset + tooltipWidth > viewportWidth) {
        left = event.clientX - tooltipWidth - offset;
      } else {
        left = event.clientX + offset;
      }

      // Vertical: flip to below if overflowing top edge
      let top: number;
      if (event.clientY - 36 < 0) {
        top = event.clientY + offset;
      } else if (event.clientY - 36 + tooltipHeight > viewportHeight) {
        top = viewportHeight - tooltipHeight - offset;
      } else {
        top = event.clientY - 36;
      }

      tooltip.style("left", `${left}px`).style("top", `${top}px`);
    };

    HeatMapData.forEach((d) => {
      const exp = d.Exp;
      if (exp === undefined) return;

      let fillColor: string;
      if (exp === -1) {
        fillColor = noDataColor;
      } else {
        fillColor = colorScale(exp);
      }

      g.append("rect")
        .attr("x", xScale(d.ExpColName) || 0)
        .attr("y", yScale(d.TP) || 0)
        .attr("width", xScale.bandwidth())
        .attr("height", cellHeight)
        .attr("fill", fillColor)
        .attr("stroke", "hsl(var(--border))")
        .attr("stroke-width", 0.5)
        .style("cursor", "pointer")
        .on("mouseover", function (event) {
          d3.select(this)
            .attr("stroke-width", 2)
            .attr("stroke", "hsl(var(--primary))");

          // Set content first so we can measure the tooltip dimensions
          tooltip
            .style("opacity", 1)
            .html(
              exp === -1
                ? `<div>Gene: <strong><em>${d.Gene}</em></strong></div>
                
                <div>Time point: ${d.TP}</div><div>Expression value: N/A</div>`
                : `<div>Gene: <strong><em>${d.Gene}</em></strong></div>
                
                <div>Time point: ${d.TP}</div><div>Expression value: ${exp.toFixed(2)}</div>`
            );

          // Now position after content is set (dimensions are known)
          positionTooltip(event);
        })
        .on("mousemove", function (event) {
          positionTooltip(event);
        })
        .on("mouseout", function () {
          d3.select(this)
            .attr("stroke-width", 0.5)
            .attr("stroke", "hsl(var(--border))");
          tooltip.style("opacity", 0);
        });
    });
  }, [HeatMapData, uniqueCMOSGIDs, uniqueTPs, expRange]);

  return (
    <div className="relative w-full">
      {ExpLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader className="animate-spin w-5 h-5 text-muted-foreground" />
        </div>
      )}
      {!ExpLoading && HeatMapData && (
        <ScrollArea className="w-full whitespace-nowrap">
          <svg ref={svgRef} />
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}
      {/* Tooltip — rendered outside scroll area, fixed to viewport */}
      <div
        ref={tooltipRef}
        className="pointer-events-none fixed z-50 rounded-md border bg-popover px-3 py-2 shadow-md"
        style={{ opacity: 0, transition: "opacity 0.1s ease" }}
      />
    </div>
  );
};
