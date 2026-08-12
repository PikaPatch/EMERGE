import  { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Loader } from "lucide-react";
import * as d3 from "d3";
import { FateColor } from "@/config/FateColor";
import { expCol,shapeCol,getLineageColor } from "@/components/utils/LineageTreeFunctions"
//import { API_BASE } from "@/components/utils/API_BASE";

// helper functions
const range = (start: number, end: number): number[] => {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
};

function getDivisibleInRange(range: [number, number], divisor: number): number[] {
  const [start, end] = range;
  const result: number[] = [];
  
  // Find first divisible number
  const firstDivisible = Math.ceil(start / divisor) * divisor;
  
  // Add all multiples
  for (let i = firstDivisible; i <= end; i += divisor) {
    result.push(i);
  }
  
  return result;
}

// main 

interface ColorData {
  Range?: [number, number];
  [key: string]: any;
}
interface LineageDataType {
  [key: string]: {
      Fate: string;          // e.g. "FateSkin", "FateNeuron"
      CellName: string;      // e.g. "ABplappp"
      Start: number;         // e.g. 65
      End: number;           // e.g. 92
      Surface: number[];     // time series of surface values
      Volume: number[];      // time series of volume values
      TPs: number[];
    };
}
interface SubLineageProps {
  SM:string;
  SMType: "CMap8" | "CShaper17" | "EmbSAM456789" | "MT_lag1" | "MT_pop1" | "MT_wee";
  OriCellID:string;
  GID:string;
  ScDataSet?:string;
  ScGene?:string;
  LineageData:LineageDataType;
  colorMode?: "default"|"fate" | "expression" | "shape";
  ColorChange: string;
  ColorData:ColorData;
  ExpressionType?: string;
  Fac?:string;
  stepping?:number;
  line_width?:number;
  setTP: (TP: number) => void;
  setCellName: (CellName: string) => void;
  setScalingRange: (range: [number,number]) => void;
  ExpLoading : boolean;
}

export const BestLineage = forwardRef<{ resetZoom: () => void }, SubLineageProps>(({
  SM,
  SMType,
  LineageData,
  GID,
  ScDataSet,
  ScGene,
  ExpressionType,
  Fac,
  stepping = 600,
  line_width = 1.5,
  colorMode = "default",
  ColorChange,
  ColorData,
  setTP,
  setCellName,
  setScalingRange,
  ExpLoading,
}, ref) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [canvasWidth, setCanvasWidth] = useState(600);
  const [canvasHeight, setCanvasHeight] = useState(400);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  useImperativeHandle(ref, () => ({
    resetZoom: () => {
      if (svgRef.current && zoomBehaviorRef.current) {
        d3.select(svgRef.current)
          .transition()
          .duration(750)
          .call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
      }
    }
  }));

    // setting
  const long_scale = canvasHeight * 0.003;
  const line_col = "#ccc";
  const celllabel_font_size = 7;
  const klist = {
    // Zp: 0.48,
    // Zpa: 0.5,
    // Zpp: 0.5,
    Zpap: 3.5,
    Zpaa: 0.5,
    Zppp: 0.55,
  };
  const squzlist = {
    Za: 0.8, // AB
    Zpaa: 0.7, // MS
    Zpap: 0.15, // E
    Zppa: 0.5, // C
    Zpppa: 0.5, // D
    Zpppp: 0.1, // P4
  };

  

  const xoffset = (ori, end) => {
    let xoff = 0;
    let eachstep = stepping;
    if (ori == end) {
      return xoff;
    }
    const route_array = end.slice(ori.length).split("");
    let route = ori;
    while (route_array.length) {
      // pop the next cell(shift the first ele form route_array)
      var eCell = route_array.shift();
      route += eCell;

      let s = 1;
      Object.keys(squzlist).forEach((squz) => {
        if (route.includes(squz)) s = squzlist[squz];
      });
      const k = klist.hasOwnProperty(route) ? klist[route] : 1;
      //const k = 1

      xoff = eCell == "p" ? xoff + eachstep * k * s : xoff - eachstep * k * s;
      eachstep /= 2;
    }
    return xoff;
  };
  const parentCell = (CellID) => {
      return CellID === OriCellID ? CellID : CellID.slice(0, -1);
    };
  const CellX1 = (CellID: string) => {
      return xoffset(OriCellID, CellID);
    };
  const CellX2 = (CellID: string) => {
      return CellX1(parentCell(CellID));
    };

    // ==========>
    // start rendering
  useEffect(() => {
    if(!LineageData || Object.keys(LineageData).length === 0){
      return
    }
    function getMinStartMaxEnd() : [number, number]{
      const values = Object.values(LineageData);
      const minStart = Math.min(...values.map(item => item.Start));
      const maxEnd = Math.max(...values.map(item => item.End));
      return [minStart, maxEnd];
    }

    const getKeyColor = (key: string) => {
      const firstTP = LineageData[key].Start;
      
      switch (colorMode) {
        case "fate":
          return FateColor[LineageData[key].Fate];
        case "expression":
          return expCol(key, firstTP, ColorData)
          //return ColorData?.Range? expCol(key, firstTP, ColorData) : FateColor[LineageData[key].Fate];
        case "shape":
          return shapeCol(key, firstTP, ColorData['Range'], ColorData);
        default:
          return getLineageColor(key);
      }
};



    // calcutate some
    const longestAP = (id, ap) => {
      const rap = ap == "p" ? "a" : "p";
      return Object.keys(LineageData)
        .filter((c) => c.includes(id))
        .filter((c) => !c.replace(id, "").includes(rap))
        .reduce((a, b) => (b.length > a.length ? b : a), "");
    };

    const LineageLongestA = longestAP(OriCellID, "a")
    const LineageLongestP = longestAP(OriCellID, "p")

    const x = 70 - CellX1(LineageLongestA);
    const y = canvasHeight * 0.073;

    const keys = Object.keys(LineageData);
    const TPRange = getMinStartMaxEnd();
    const ticksArr = getDivisibleInRange(TPRange, 20);
    //const labellist = keys.sort((a, b) => a.length - b.length).slice(0, 5).filter(val => val !== OriCellID);
    const labellist = keys.filter(c => c.length == 6);
    // Create map with less repetition
    const lineColorMap = new Map(keys.map(key => [key, getKeyColor(key)]));
    

    if (!svgRef.current || !wrapperRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    // update canvas dimensions on mount/resizes
    const updateSize = () => {
      const { width, height } = wrapperRef.current!.getBoundingClientRect();
      setCanvasWidth(width);
      setCanvasHeight(height);
    };
    updateSize(); // initial size


    // container group to apply zoom + pan
    const g_verti = svg.append("g").attr("class", "lines-cell");
    const g_verti_exp = svg.append("g").attr("class", "lines-tp");
    const g_hori = svg.append("g").attr("class", "lines-link");
    const g_label = svg.append("g").attr("class", "lines-label");
    const g_celllabel = svg.append("g").attr("class", "lines-clab");
    const g_axis = svg.append("g").attr("class", "g-axis");

    // Red arrow
    // Define an arrowhead marker
    svg
      .append("defs")
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

    // Draw a line and attach the marker
    svg
      .append("line")
      .attr("id", `arrowLine-${OriCellID}`)
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", 0)
      .attr("y2", 1)
      .attr("stroke", "red")
      .attr("stroke-width", 1)
      .attr("marker-end", `url(#arrowhead-${OriCellID})`);

    svg
      .append("text")
      .attr("id", `arrowText-${OriCellID}`)
      .attr("x", 0)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .attr("font-size", celllabel_font_size + 2)
      .attr("fill", "red")
      .attr("font-weight", "bold")
      .text("");
    
      

    // axis
    svg
      .append("line")
      .attr("class", "g-axis")
      .attr("x1", (d) => x + CellX1(LineageLongestA) - 30 )
      .attr("x2", (d) => x + CellX1(LineageLongestA) - 30 )
      .attr("y1", (d) => y + LineageData[OriCellID].Start * long_scale )
      .attr("y2", (d) => y + TPRange[1] * long_scale )
      .attr("stroke", line_col)
      .attr("stroke-width", 2);

    // // Timepoint
    svg
      .append("text")
      .attr("class", "g-axis")
      .attr("x", (d) => x + CellX1(LineageLongestA) - 30)
      .attr("y", (d) => y + (LineageData[OriCellID].Start - 20) * long_scale)
      .text("Time point")
      .attr("font-size", celllabel_font_size + 5)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("fill", "white");

    // // ticks
    g_axis
      .selectAll("line")
      .attr("class", "g-axis")
      .data(ticksArr)
      .join("line")
      .attr("x1", (d) => x + CellX1(LineageLongestA) - 30)
      .attr("x2", (d) => x + CellX1(LineageLongestA) - 30 - 5)
      .attr("y1", (d) => y + d * long_scale)
      .attr("y2", (d) => y + d * long_scale)
      .attr("stroke", line_col)
      .attr("stroke-width", 2);

    // // number
    g_axis
      .selectAll("text")
      .attr("class", "g-axis")
      .data(ticksArr)
      .join("text")
      .attr("x", (d) => x + CellX1(LineageLongestA) - 30 - 5 - 10)
      .attr("y", (d) => y + (d + 2) * long_scale)
      .text((d) => d)
      //.style("writing-mode", "sideways-lr") // top-to-bottom
      .attr("font-size", celllabel_font_size)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("fill", "white");

    
    keys.forEach((key) => {
      const exp_verti = g_verti_exp.append("g").attr("class", `lines-${key}`);
      exp_verti
        .selectAll("line")
        //.data(range(LineageData[key].Start, LineageData[key].End))
        .data(LineageData[key].TPs)
        .join("line")
        .attr("id", (d) => d)
        .attr("x1", () => x + CellX1(key))
        .attr("x2", () => x + CellX1(key))
        .attr("y1", (d) => y + d * long_scale)
        .attr("y2", (d) => y + (d + 1) * long_scale)
        .attr(
          "stroke",
          (d) => {
            switch (colorMode) {
              case "fate":
                return FateColor[LineageData[key].Fate];
              case "expression":
                return expCol(key, d,ColorData);
                //return ColorData?.Range? expCol(key, firstTP, ColorData) : FateColor[LineageData[key].Fate];
              case "shape":
                return shapeCol(key, d,ColorData['Range'],ColorData)
              default: // "default" or lineage
                return getLineageColor(key);
            }
          }
        )
        //.attr("stroke-width", (d) => cellData[key]['Volume'][d] / 10)
        .attr("stroke-width", line_width)
        .on("click", function (event, d) {
          console.log(`Clicked CellName is: ${LineageData[key].CellName} `);
          console.log(`Clicked CellID is: ${key} `);
          console.log(`Clicked TP is: ${d}`);
          setCellName(LineageData[key].CellName);
          setTP(d);
          d3.select(`#arrowLine-${OriCellID}`)
            .attr("x1", () => x + CellX1(key) - 16)
            .attr("x2", () => x + CellX1(key) - 5)
            .attr("y1", () => y + (d + 0.5) * long_scale)
            .attr("y2", () => y + (d + 0.5) * long_scale);

          // Update arrowText
          d3.select(`#arrowText-${OriCellID}`)
            .attr("x", x + CellX1(key) - 20.5)
            .attr("y", y + d * long_scale - 3)
            .text(LineageData[key].CellName);
        });
    });

    g_hori
      .selectAll("line")
      .data(keys)
      .join("line")
      .attr(
        "x1",(d) => x + CellX1(d) + (d.endsWith("a") ? line_width / 2 : -line_width / 2),
      )
      .attr(
        "x2",(d) => x + CellX2(d) + (d.endsWith("a") ? line_width / 2 : -line_width / 2),
      )
      .attr(
        "y1",(d) => y + (LineageData[parentCell(d)]?.End + 1) * long_scale + line_width/2,
      )
      .attr(
        "y2",(d) => y + (LineageData[parentCell(d)]?.End + 1) * long_scale + line_width/2,
      )
      .attr("stroke", (d) => lineColorMap.get(d) || line_col)
      .attr("stroke-width", line_width);

    g_label
      .selectAll("line")
      .data(labellist)
      .join("line")
      .attr("id", (d) => {
        return `label1l${d}`;
      })
      .attr("y1", (d) => y + (LineageData[longestAP(d, "p")].End + 15) * long_scale)
      .attr("y2", (d) => y + (LineageData[longestAP(d, "p")].End + 15) * long_scale)
      .attr(
        "x1",
        (d) =>
          x + CellX1(longestAP(d, "a")),
      )
      .attr(
        "x2",
        (d) =>
          x + CellX1(longestAP(d, "p")),
      )
      .attr("stroke", "white")
      .attr("stroke-width", line_width);

    g_label
      .selectAll("text")
      .data(labellist)
      .join("text")
      .attr("id", (d) => {
        return `label1t${d}`;
      })
      .attr(
        "x", (d) => x + CellX1(d),
      )
      .attr("y", (d) => y + (LineageData[longestAP(d, "p")].End + 20) * long_scale)
      .text((d) => `${LineageData[d].CellName}`)
      .attr("font-size", celllabel_font_size + 10)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "hanging")
      .attr("fill", "white");

    g_celllabel
      .selectAll("text")
      .data(keys.filter((str) => str.length < 8))
      .join("text")
      .attr("id", (d) => { return `label${d}`})
      .attr("y", (d) => d === OriCellID
        ? y
        : y + (LineageData[d].Start + LineageData[d].End) * long_scale / 2 )
      .attr("x", (d) => x + CellX1(d))
      .text((d) => LineageData[d].CellName)
      .attr("font-size", (d) => d === OriCellID 
        ? celllabel_font_size + 14 
        : celllabel_font_size )
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", (d) => d === OriCellID 
        ? "Auto"
        : "hanging")
      .attr("fill", "white");

    

    // Zoom behavior: pan + zoom + constrain translation
    const zoomed = (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
      g_verti.attr("transform", event.transform.toString());
      g_hori.attr("transform", event.transform.toString());
      g_verti_exp.attr("transform", event.transform.toString());
      g_label.attr("transform", event.transform.toString());
      g_celllabel.attr("transform", event.transform.toString());
      svg.selectAll(".g-axis").attr("transform", event.transform.toString());
      svg.select(`#arrowLine-${OriCellID}`).attr("transform", event.transform.toString());
      svg.select(`#arrowText-${OriCellID}`).attr("transform", event.transform.toString());
    };

    const zoom = d3
      .zoom()
      .scaleExtent([0.8, 3]) // allow zooming between 1x and 5x
      .translateExtent([
        // pan constraint (change as needed)
        [-canvasWidth/2, -canvasHeight/2], // allow dragging beyond edges
        [canvasWidth * 2, canvasHeight * 2],
      ])
      .on("zoom", zoomed);

    zoomBehaviorRef.current = zoom;
    svg.call(zoom);
    

    // Responsive resize using ResizeObserver
    const resizeObserver = new ResizeObserver(() => {
      if (!wrapperRef.current) return;
      const { width, height } = wrapperRef.current.getBoundingClientRect();
      setCanvasWidth(width);
      setCanvasHeight(height);
      svg.attr("viewBox", `0 0 ${width} ${height}`);
      //drawLines();
    });

    resizeObserver.observe(wrapperRef.current);

    return () => {
      resizeObserver.disconnect();
      svg.selectAll("*").remove();
    };
  }, [LineageData,ColorData,canvasWidth, canvasHeight, colorMode]);

  return (
    <div
      ref={wrapperRef}
      className="top-bottom-border"
      style={{
        width: "100%",
        height: "300px",
        borderTop: '1px solid #333',
        borderBottom: '1px solid #333',
        //border: "1px solid #222",
        position: "relative",
      }}
    >
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
      <svg
        ref={svgRef}
        id={`${OriCellID}-SVG`}
        style={{ cursor: "pointer" }}
        viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
        preserveAspectRatio="xMidYMid meet"
      />
    </div>
  );
});
