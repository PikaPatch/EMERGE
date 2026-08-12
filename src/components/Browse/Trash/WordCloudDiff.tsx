import { useEffect, useRef, useMemo, useState } from "react";
import { Loader } from "lucide-react";
import * as d3 from "d3";
import cloud from "d3-cloud";
import { API_BASE } from "@/components/utils/API_BASE";

interface WordCloudItem {
  Gene: string;
  pValue: number;
  CellName1: number;
  CellName2: number;
}

interface Props {
  CellName1: string;
  CellName2: string;
  ScDataset: string;
}

export const WordCloudDiff = ({ CellName1,CellName2, ScDataset }: Props) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [WordCloudData, setWordCloudData] = useState<WordCloudItem[]>(null);
  const [ExpLoading, setExpLoading] = useState<boolean>(false);

  // load WordCloud data
  useEffect(() => {
    if (!ScDataset || !CellName1 || !CellName2) {
      return;
    }
    const fetchData = async () => {
      try {
        setExpLoading(true);
        const url = `${API_BASE}/scExp/WordCloudDiff2?DataSet=${ScDataset}&CellName1=${CellName1}&CellName2=${CellName2}`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const jsonData = await response.json();
        setWordCloudData(jsonData);
      } catch (err) {
        setWordCloudData(null);
      } finally {
        setExpLoading(false);
      }
    };
    fetchData();
  }, [ScDataset, CellName1,CellName2]);

  // Process data: use absolute value for sizing, keep original for coloring
  const words = useMemo(() => {
    if (!WordCloudData) {
      return null;
    }
    const data = WordCloudData as WordCloudItem[];
    return data
      .filter((d) => d.pValue < 0.05) // Filter out zero values
      .map((d) => ({
        text: d.Gene,
        size: d.pValue, // Use absolute value for font sizing
        value: d.CellName1 - d.CellName2, // Keep original for color determination
        CellName1: d.CellName1,
        CellName2: d.CellName2
      }));
  }, [WordCloudData]);

  useEffect(() => {
    console.log(words)
    if (!svgRef.current || !words || words.length === 0) return;
    

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 800;
    const height = 500;

    // Scale font size based on absolute E values
    const maxE = d3.max(words, (d) => d.size) || 1;
    const minE = d3.min(words, (d) => d.size) || 0;
    const fontScale = d3
      .scaleLinear()
      .domain([maxE, minE])
      .range([10, 60]);

    const layout = cloud()
      .size([width, height])
      .words(
        words.map((d) => ({
          text: d.text,
          size: fontScale(d.size),
          value: d.value,
          p:d.size,
          CellName1: d.CellName1,
          CellName2: d.CellName2
        }))
      )
      .padding(3)
      .rotate(() => (Math.random() > 0.5 ? 0 : 90))
      .font("sans-serif")
      .fontSize((d: any) => d.size)
      .on("end", draw);

    layout.start();

    function draw(words: any[]) {
      // Create tooltip
      const tooltip = d3
        .select("body")
        .append("div")
        .attr("class", "wordcloud-tooltip")
        .style("position", "absolute")
        .style("background", "rgba(0,0,0,0.8)")
        .style("color", "white")
        .style("padding", "8px 12px")
        .style("border-radius", "4px")
        .style("font-size", "12px")
        .style("pointer-events", "none")
        .style("opacity", 0)
        .style("z-index", 1000);

      svg
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`)
        .selectAll("text")
        .data(words)
        .enter()
        .append("text")
        .style("font-size", (d: any) => `${d.size}px`)
        .style("font-family", "sans-serif")
        .style("fill", (d: any) => (d.value > 0 ? "#22c55e" : "#ef4444")) // Green for positive, Red for negative
        .style("cursor", "pointer")
        .attr("text-anchor", "middle")
        .attr("transform", (d: any) => `translate(${d.x},${d.y}) rotate(${d.rotate})`)
        .text((d: any) => d.text)
        .on("mouseover", function (event, d: any) {
          d3.select(this)
            .style("font-weight", "bold")
            .style("opacity", 0.8);

          // Show tooltip
          tooltip
            .style("opacity", 1)
            .html(
              `<strong>${d.text}</strong><br/>CellName1: ${d.CellName1}<br/>CellName2: ${d.CellName2}<br/>pval: ${d.p}`
            )
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY - 28}px`);
        })
        .on("mouseout", function () {
          d3.select(this)
            .style("font-weight", "normal")
            .style("opacity", 1);

          tooltip.style("opacity", 0);
        });
    }

    return () => {
      d3.selectAll(".wordcloud-tooltip").remove();
    };
  }, [words]);

  return (
    <div ref={containerRef} className="relative w-full overflow-x-auto">
      {/* Loading State */}
      {ExpLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin">
              <Loader className="w-8 h-8 text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground">Loading data...</p>
          </div>
        </div>
      )}

      {/* No Data State */}
      {!ExpLoading && (!WordCloudData || WordCloudData.length === 0) && (
        <div className="flex items-center justify-center min-h-[500px]">
          <p className="text-sm text-muted-foreground">No data available</p>
        </div>
      )}

      {/* SVG */}
      <svg ref={svgRef} className="mx-auto" />
    </div>
  );
};
