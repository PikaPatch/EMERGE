import { useMemo,useState, useRef, useEffect } from "react";
import { Loader } from "lucide-react";
import * as d3 from "d3";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ColorScaler } from "@/components/utils/ColorScaler";
import { API_BASE } from "@/components/utils/API_BASE";

interface HeatmapEntry {
  CellName: string;
  ID:string;
  DID:number;
  TP: number;
  Exp: number;
  Est: string[];
}

interface DataList {
  CellName: string;
  TP : number;
  Exp : number;
  Aest: string;
  Pest: string;
}

interface Props {
  SM : string,
  CellName: string,
  ConCells?: string[],
  Range: [number,number],
  GID : string,
}

export const GeneExpressionHeatmap = ({
  SM,CellName,ConCells,Range,GID,
}:Props) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const [HeatMapData, setHeatMapData] = useState<HeatmapEntry[] | null>(null);
  const [ExpLoading, setExpLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!CellName||!Range||!GID) {
      return;
    }
    const fetchData = async () => {
      try {
        setExpLoading(true);
        const url = `${API_BASE}/Exp/HeatmapRange?SM=${SM}&TPmin=${Range[0]}&TPmax=${Range[1]}&ExpColName=${GID}`;
        console.log("Fetching data from:", url);
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
  }, [SM,CellName,GID]);


const { DataList, YaxisList, XaxisList, expRange } = useMemo(() => {
  if (!HeatMapData || HeatMapData.length === 0) {
    return {
      DataList: [] as DataList[],
      YaxisList: [] as string[],
      XaxisList: [] as number[],
      expRange: [0, 1] as [number, number]
    };
  }

  const data = HeatMapData as HeatmapEntry[];
  

  const DataList = [...new Set(data.map(d => 
    ({CellName: d.CellName,
      Exp: d.Exp,
      TP: d.TP,
      Aest: d.Est[0] ?? d.CellName,
      Pest: d.Est[d.Est.length - 1] ?? d.CellName
    })))];

  const YaxisList = [...new Set(
    data
      .filter(d => d.Est.length === 0)
      .map(d => d.CellName)
  )];
  const XaxisList = [...new Set(data.map(d => d.TP))].sort((a, b) => a - b);

  const validExps = data.filter(d => d.Exp !== -1).map(d => d.Exp);
  const minExp = validExps.length > 0 ? Math.min(...validExps) : 0;
  const maxExp = validExps.length > 0 ? Math.max(...validExps) : 1;

  return {
    DataList,
    YaxisList,
    XaxisList,
    expRange: [minExp, maxExp] as [number, number]
  };
}, [HeatMapData]);


  // D3 Heatmap rendering
  useEffect(() => {
    if (!HeatMapData){return}
    if (!svgRef.current || YaxisList.length === 0 || XaxisList.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 30, right: 80, bottom: 60, left: 140 };
    const cellWidth = 20;
    const cellHeight = cellWidth;
    const width = XaxisList.length * cellWidth + margin.left + margin.right;
    const height = YaxisList.length * cellHeight + margin.top + margin.bottom;

    svg.attr("width", width).attr("height", height);

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    // Color scale using ColorScaler
    const colorScale = ColorScaler(expRange);
    const noDataColor = "#9ca3af"; // gray-400 for Exp = -1

    // X scale (TP)
    const xScale = d3
      .scaleBand<number>()
      .domain(XaxisList)
      .range([0, XaxisList.length * cellWidth])
      .padding(0.05);

    // Y scale (CellName)
    const yScale = d3
      .scaleBand<string>()
      .domain(YaxisList)
      .range([0, YaxisList.length * cellHeight])
      .padding(0.05);
    

    // X axis (TP)
    g.append("g")
      .attr("transform", `translate(0,${YaxisList.length * cellHeight})`)
      .call(d3.axisBottom(xScale).tickFormat(d => `${d}`))
      .selectAll("text")
      .attr("fill", "currentColor")
      .style("font-size", "9px")
      .attr("transform", "rotate(-45)")
      .attr("text-anchor", "end");

    g.selectAll(".domain, .tick line").attr("stroke", "currentColor");

    // X axis label
    g.append("text")
      .attr("x", (XaxisList.length * cellWidth))
      .attr("y", YaxisList.length * cellHeight + 50)
      .attr("text-anchor", "middle")
      .attr("fill", "currentColor")
      .style("font-size", "12px")
      .style("font-weight", "500")
      .text("TP");

    // Y axis (CellName)
    g.append("g")
      .call(d3.axisLeft(yScale))
      .selectAll("text")
      .attr("fill", (d) => d === CellName ? "#ef4444" : ConCells.includes(d) ? "yellow" : "currentColor")
      .style("font-size", "8px");

    // Y axis label
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -(YaxisList.length * cellHeight) / 2)
      .attr("y", -margin.left + 15)
      .attr("text-anchor", "middle")
      .attr("fill", "currentColor")
      .style("font-size", "12px")
      .style("font-weight", "500")
      .text("Cell Name");

    // Tooltip
    const tooltip = d3.select(tooltipRef.current);

    // Heatmap cells
    DataList.forEach(Cell => {
        const tp = Cell.TP
        const exp = Cell.Exp;
        const aest = Cell.Aest
        const pest = Cell.Pest
        
        // Skip if no data
        if (exp === undefined) return;

        let fillColor: string;
        if (exp === -1) {
          fillColor = noDataColor;
        } else {
          fillColor = colorScale(exp);
        }
        let x = xScale(tp)
        let y = yScale(aest)
        let width = xScale.bandwidth()
        let height = yScale(pest) - y + yScale.bandwidth()

        g.append("rect")
          .attr("x", x || 0)
          .attr("y", y || 0)
          .attr("width", width)
          .attr("height", height)
          .attr("fill", fillColor)
          .attr("stroke", "hsl(var(--border))")
          //.attr("stroke", (d) => d === CellName ? "#ef4444" : "currentColor")
          .attr("stroke-width", 0.5)
          .style("cursor", "pointer")
          .on("mouseover", function (event) {
            d3.select(this).attr("stroke-width", 2).attr("stroke", "hsl(var(--primary))");
            tooltip
              .style("opacity", 1)
              .style("left", `${event.offsetX + 10}px`)
              .style("top", `${event.offsetY - 30}px`)
              .html(
                exp === -1
                  ? `<strong>${Cell.CellName}</strong><br/>TP: ${tp}<br/>Expression: N/A`
                  : `<strong>Cell: ${Cell.CellName}</strong><br/>Time point: ${tp}<br/>Expression: ${exp.toFixed(2)}`
              );
          })
          .on("mouseout", function () {
            d3.select(this).attr("stroke-width", 0.5).attr("stroke", "hsl(var(--border))");
            tooltip.style("opacity", 0);
          });
      //});
    });

    // Color legend
    const legendWidth = 15;
    const legendHeight = Math.min(YaxisList.length * cellHeight, 150);
    const legendX = XaxisList.length * cellWidth + 20;

    const legendScale = d3.scaleLinear().domain(expRange).range([legendHeight, 0]);
    const legendAxis = d3.axisRight(legendScale).ticks(5).tickFormat((d) => (d as number).toFixed(4));

    // Legend gradient
    const defs = svg.append("defs");
    const gradient = defs
      .append("linearGradient")
      .attr("id", "exp-legend-gradient")
      .attr("x1", "0%")
      .attr("y1", "100%")
      .attr("x2", "0%")
      .attr("y2", "0%");

    // Use ColorScaler colors (interpolateReds)
    const numStops = 10;
    for (let i = 0; i <= numStops; i++) {
      const t = i / numStops;
      const value = expRange[0] + t * (expRange[1] - expRange[0]);
      gradient.append("stop")
        .attr("offset", `${t * 100}%`)
        .attr("stop-color", colorScale(value));
    }

    g.append("rect")
      .attr("x", legendX)
      .attr("y", 0)
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .attr("rx", 2)
      .style("fill", "url(#exp-legend-gradient)");

    g.append("g")
      .attr("transform", `translate(${legendX + legendWidth}, 0)`)
      .call(legendAxis)
      .selectAll("text")
      .attr("fill", "currentColor")
      .style("font-size", "9px");

    // Legend for -1 (N/A)
    g.append("rect")
      .attr("x", legendX)
      .attr("y", legendHeight + 15)
      .attr("width", legendWidth)
      .attr("height", 15)
      .attr("fill", noDataColor)
      .attr("stroke", "hsl(var(--border))")
      .attr("stroke-width", 0.5);

    g.append("text")
      .attr("x", legendX + legendWidth + 5)
      .attr("y", legendHeight + 15 + 10)
      .attr("fill", "currentColor")
      .style("font-size", "9px")
      .text("N/A");

  }, [YaxisList, XaxisList, HeatMapData, expRange]);

  return (
  expRange[0] === expRange[1] ? (<div className="w-full h-48 sm:h-64 flex items-center justify-center bg-muted/50 rounded-lg border border-dashed">
                          <p className="text-muted-foreground text-sm text-center px-4">
                            No expression data available for the selected gene in the specified time range.
                          </p>
                        </div>) : (<div className="space-y-4">
    <ScrollArea className="w-full rounded-md" style={{ height: "600px" }}>
      <div className="relative w-max">
        {ExpLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10 rounded-lg">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin">
                <Loader className="w-8 h-8 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground">Loading data...</p>
            </div>
          </div>
        )}
        {!HeatMapData || HeatMapData.length === 0 ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <p className="text-sm text-muted-foreground">No data available</p>
          </div>
        ) : (
          <>
            <svg ref={svgRef} />
            <div
              ref={tooltipRef}
              className="absolute bg-popover text-popover-foreground border border-border rounded-md px-2 py-1 text-xs shadow-md pointer-events-none opacity-0 transition-opacity z-10"
            />
          </>
        )}
      </div>
      <ScrollBar orientation="horizontal" />
      <ScrollBar orientation="vertical" />
    </ScrollArea>
  </div>)



);

};