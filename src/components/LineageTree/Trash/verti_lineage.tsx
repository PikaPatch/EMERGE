import  { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Loader } from "lucide-react";
import * as d3 from "d3";
// import { ColorScaler} from "@/components/utils/ColorScaler";
import { FateColor } from "@/config/FateColor";
import { LineageColor,LineageColor2 } from '@/config/LineageColor';
import { klist,squzlist,labellist,ticksArr } from "@/config/LineageTreeSetting";
import { expCol,shapeCol,getLineageColor } from "@/components/utils/LineageTreeFunctions"
import { API_BASE } from "@/components/utils/API_BASE";

// helper functions
const range = (start: number, end: number): number[] => {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
};


// main 
interface ColorData {
  Range?: [number, number];
  [key: string]: any;
}
interface VertiLineageProps {
  SM:string;
  GID:string;
  ScDataSet?:string;
  ScGene?:string;
  colorMode?: "default"|"fate" | "expression" | "shape";
  ExpressionType?: string;
  Fac?:string;
  setTP: (TP: number) => void;
  setCellName: (CellName: string) => void;
  setCellID: (CellID: string) => void;
  setScalingRange: (range: [number,number]) => void;
}

export const Verti_lineage = forwardRef<{ resetZoom: () => void }, VertiLineageProps>(({
  SM,
  GID,
  ScDataSet,
  ScGene,
  ExpressionType,
  Fac,
  colorMode = "default",
  setTP,
  setCellName,
  setCellID,
  setScalingRange,
}, ref) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [canvasWidth, setCanvasWidth] = useState(600);
  const [canvasHeight, setCanvasHeight] = useState(400);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  const [LineageData, setLineageData] = useState<object>(null);
  const [ColorData, setColorData] = useState<ColorData>({});

  const [ExpLoading, setExpLoading] = useState<boolean>(false);

  // load LineageData
  useEffect(() => {
      const fetchData = async () => {
        try {
          const url = `${API_BASE}/CellDats/LineageTree?SM=${SM}`;
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const jsonData = await response.json();
          setLineageData(jsonData);
        } catch (err) {
          setLineageData({});
        }
      };
      fetchData();
    }, [SM]);

  // load reporter Expression Data
    useEffect(() => {
      if(colorMode !== 'expression' || ExpressionType !== 'Reporters' || !GID){
        setColorData({});
        return;
      }
      const fetchData = async () => {
        try {
          setExpLoading(true);
          const url = `${API_BASE}/Exp/LineageExpressionData?SM=${SM}&CMOSGID=${GID}`;
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const jsonData = await response.json();
          setColorData(jsonData);
          setScalingRange(jsonData.Range)
        } catch (err) {
          setColorData({});
        } finally {
          setExpLoading(false);
        }
      };
      fetchData();
    }, [colorMode,ExpressionType,GID,SM]);
  
    // load single cell Expression Data
    useEffect(() => {
      if(colorMode !== 'expression' || ExpressionType !== 'SingleCell' || !ScGene){
        setColorData({});
        return;
      }
      const fetchData = async () => {
        try {
          setExpLoading(true);
          const url = `${API_BASE}/scExp/ForLineageTree?DataSet=${ScDataSet}&Gene=${ScGene}`;
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const jsonData = await response.json();
          setColorData(jsonData);
          setScalingRange(jsonData.Range)
        } catch (err) {
          setColorData({});
        } finally {
          setExpLoading(false);
        }
      };
      fetchData();
    },[colorMode,ExpressionType,ScGene,SM])
  
    // load Shape Data
    useEffect(() => {
      if(colorMode !== 'shape' || !Fac){
        setColorData({});
        return;
      }
      const fetchData = async () => {
        try {
          setExpLoading(true);
          const url = `${API_BASE}/Shape/LineageShapeData?SM=${SM}&Fac=${Fac}`;
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const jsonData = await response.json();
          setColorData(jsonData);
          setScalingRange(jsonData.Range)
        } catch (err) {
          setColorData({});
        } finally {
          setExpLoading(false);
        }
      };
      fetchData();
    }, [colorMode,Fac,SM]);

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
  const long_scale = canvasWidth * 0.003;
  const line_width = 1.5;
  const line_col = "#ccc";
  const stepping = 600;
  const OriCellID = 'Z'


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

  useEffect(() => {
    if(!LineageData){
      return
    }
    // helper function that needs LineageData
    const longestAP = (id, ap) => {
      const rap = ap == "p" ? "a" : "p";
      return Object.keys(LineageData)
        .filter((c) => c.includes(id))
        .filter((c) => !c.replace(id, "").includes(rap))
        .reduce((a, b) => (b.length > a.length ? b : a), "");
    };

    const y = 70 - CellX1(longestAP("Z", "a"));
    const x = canvasWidth * 0.073;

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

    const keys = Object.keys(LineageData);

    // container group to apply zoom + pan
    const g_verti = svg.append("g").attr("class", "lines-cell");
    const g_verti_exp = svg.append("g").attr("class", "lines-tp");
    const g_hori = svg.append("g").attr("class", "lines-link");
    const g_label = svg.append("g").attr("class", "lines-label");
    const g_celllabel = svg.append("g").attr("class", "lines-clab");
    const g_axis = svg.append("g").attr("class", "g-axis");

    // Define an arrowhead marker
    svg
      .append("defs")
      .append("marker")
      .attr("id", "arrowhead")
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
      .attr("id", "arrowLine")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", 0)
      .attr("y2", 1)
      .attr("stroke", "red")
      .attr("stroke-width", 1)
      .attr("marker-end", "url(#arrowhead)");

    // axis
    svg
      .append("line")
      .attr("class", "g-axis")
      .attr("y1", (d) => y + CellX1(longestAP("Z", "a")) - 20)
      .attr("y2", (d) => y + CellX1(longestAP("Z", "a")) - 20)
      .attr("x1", (d) => x + LineageData["Z"].Start * long_scale)
      .attr(
        "x2",
        (d) => x + (230 + 1) * long_scale,
      )
      .attr("stroke", line_col)
      .attr("stroke-width", 2);

    // Timepoint
    svg
      .append("text")
      .attr("class", "g-axis")
      .attr("x", (d) => x + (LineageData["Z"].Start - 10) * long_scale)
      .attr("y", (d) => y + CellX1(longestAP("Z", "a")) - 40)
      .text("Time point")
      .attr("font-size", "17px")
      .attr("fill", "white");

    // ticks
    g_axis
      .selectAll("line")
      .attr("class", "g-axis")
      .data(ticksArr)
      .join("line")
      .attr("y1", (d) => y + CellX1(longestAP("Z", "a")) - 20)
      .attr("y2", (d) => y + CellX1(longestAP("Z", "a")) - 25)
      .attr("x1", (d) => x + d * long_scale)
      .attr("x2", (d) => x + d * long_scale)
      .attr("stroke", line_col)
      .attr("stroke-width", 2);

    // number
    g_axis
      .selectAll("text")
      .attr("class", "g-axis")
      .data(ticksArr)
      .join("text")
      .attr("x", (d) => x + (d + 2) * long_scale)
      .attr("y", (d) => y + CellX1(longestAP("Z", "a")) - 27)
      .text((d) => d)
      .style("writing-mode", "sideways-lr") // top-to-bottom
      .attr("font-size", "7px")
      .attr("fill", "white");

    g_hori
      .selectAll("line")
      .data(keys)
      .join("line")
      .attr(
        "y1",
        (d) =>
          y + CellX1(d) + (d.endsWith("a") ? line_width / 2 : -line_width / 2),
      )
      .attr(
        "y2",
        (d) =>
          y + CellX2(d) + (d.endsWith("a") ? line_width / 2 : -line_width / 2),
      )
      .attr(
        "x1",
        (d) => x + (LineageData[parentCell(d)].End + 1) * long_scale + line_width/2,
      )
      .attr(
        "x2",
        (d) => x + (LineageData[parentCell(d)].End + 1) * long_scale + line_width/2,
      )
      .attr("stroke", line_col)
      .attr("stroke-width", line_width);

    g_label
      .selectAll("line")
      .data(labellist)
      .join("line")
      .attr("id", (d) => {
        return `label1l${d}`;
      })
      .attr("y1", (d) => y + CellX1(longestAP(d, "a")))
      .attr("y2", (d) => y + CellX1(longestAP(d, "p")))
      .attr(
        "x1",
        (d) =>
          x +
          (LineageData[longestAP(d, "p")].End + 5 + line_width / 2) * long_scale,
      )
      .attr(
        "x2",
        (d) =>
          x +
          (LineageData[longestAP(d, "p")].End + 5 + line_width / 2) * long_scale,
      )
      .attr("stroke", "white")
      .attr("stroke-width", line_width * 3);

    g_label
      .selectAll("text")
      .data(labellist)
      .join("text")
      .attr("id", (d) => {
        return `label1t${d}`;
      })
      .attr(
        "x",
        (d) =>
          x +
          (LineageData[longestAP(d, "p")].End + 5 + line_width * 5) * long_scale,
      )
      .attr("y", (d) => y + CellX1(d))
      .text((d) => `${LineageData[d].CellName}`)
      .attr("font-size", "24px")
      .attr("fill", "white");

    // g_verti
    //   .selectAll("line")
    //   .data(keys)
    //   .join("line")
    //   .attr("id", (d) => {
    //     return `whole${d}`;
    //   })
    //   .attr("y1", (d) => y + CellX1(d))
    //   .attr("y2", (d) => y + CellX1(d))
    //   .attr("x1", (d) => x + LineageData[d].Start * long_scale)
    //   .attr("x2", (d) => x + (LineageData[d].End + 1) * long_scale)
    //   .attr("stroke", (d) => getLineageColor(d))
    //   .attr("stroke-width", line_width);

    g_celllabel
      .selectAll("text")
      .data(keys.filter((str) => str.length < 8))
      .join("text")
      .attr("id", (d) => {
        return `label${d}`;
      })
      .attr("x", (d) => x + LineageData[d].Start * long_scale)
      .attr(
        "y",
        (d) =>
          y + CellX1(d) + (d.endsWith("a") ? line_width * 10 : line_width * 10),
      )
      .text((d) => LineageData[d].CellName)
      .attr("font-size", "7px")
      .attr("fill", "white");

    keys.forEach((key) => {
      const exp_verti = g_verti_exp.append("g").attr("class", `lines-${key}`);
      exp_verti
        .selectAll("line")
        .data(range(LineageData[key].Start, LineageData[key].End))
        .join("line")
        .attr("id", (d) => d)
        .attr("y1", () => y + CellX1(key))
        .attr("y2", () => y + CellX1(key))
        .attr("x1", (d) => x + d * long_scale)
        .attr("x2", (d) => x + (d + 1) * long_scale)
        .attr(
          "stroke",
          (d) => {
            switch (colorMode) {
              case "fate":
                return FateColor[LineageData[key].Fate];
              case "expression":
                return expCol(key, d,ColorData);
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
          setCellID(key);
          setTP(d);
          d3.select("#arrowLine")
            .attr("y1", () => y + CellX1(key) - 6)
            .attr("y2", () => y + CellX1(key) - 5)
            .attr("x1", () => x + (d + 0.5) * long_scale)
            .attr("x2", () => x + (d + 0.5) * long_scale);
        });
    });

    // Zoom behavior: pan + zoom + constrain translation
    const zoomed = (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
      g_verti.attr("transform", event.transform.toString());
      g_hori.attr("transform", event.transform.toString());
      g_verti_exp.attr("transform", event.transform.toString());
      g_label.attr("transform", event.transform.toString());
      g_celllabel.attr("transform", event.transform.toString());
      svg.selectAll(".g-axis").attr("transform", event.transform.toString());
      svg.select("#arrowLine").attr("transform", event.transform.toString());
    };

    const zoom = d3
      .zoom()
      .scaleExtent([1, 15]) // allow zooming between 1x and 5x
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
      style={{ width: "100%", height: "235vh", border: "1px solid #333" }}
    >
      {ExpLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10 rounded-lg">
                        <div className="flex flex-col items-center gap-3">
                          <div className="animate-spin">
                            <Loader className="w-8 h-8 text-primary" />
                          </div>
                          <p className="text-sm font-medium text-foreground">
                            Loading data...
                          </p>
                        </div>
                      </div>
                    )}
      <svg
        ref={svgRef}
        style={{ cursor: "pointer" }} // visually indicates draggable area
        viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
        preserveAspectRatio="xMidYMid meet"
      />
    </div>
  );
});
