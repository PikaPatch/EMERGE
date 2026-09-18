import { useRef, useEffect, useState, Suspense, useMemo, memo, useLayoutEffect } from "react";
import { ColorScaler, PowerColorScaler, ColorScalerShape } from "@/components/utils/ColorScaler";
import { Canvas, Vector3, invalidate } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import LegendBox from "./LegendBox";
import { ViewerBox } from "./ViewerBox";
import type { OrbitControls as OrbitControlsType } from "three-stdlib";
import type { PerspectiveCamera as PerspectiveCameraType } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import { FateColor } from "@/config/FateColor";
import { LineageColorMap } from "@/config/LineageColor";
import { Loader } from "lucide-react";
import { m2C, m2C2 } from "@/components/utils/loadEmb";
import { OBJCenter,FlipYDirection } from "@/components/utils/usefulobject";
import { API_BASE } from "@/components/utils/API_BASE";


interface CellData {
  CellID: string;
  Fate: string;
  nucLoc: [number, number, number] | null;
}


interface Emb3DProps {
  TP: number;
  SM: string;
  Resolution:"High" | "Low";
  EmbMode: "EMBobj" | "ContactNet";
  MonoColor?: string;
  MonoFate?: "mono" | "fate" | "lineage" | "expression" | "shape";
  Fac?: string;
  ShapeDataRange?:[number, number, number, number];
  setShapeDataRange?: (r: [number, number, number, number]) => void;
  HighligtCells?: string[];
  CenterCell?: string;
  cameraPosition?: [number, number, number];
  ShowLabel?: boolean;
  BinaryScaling?: boolean;
  ExpressionType?: "Reporters" | "SingleCell";
  GID?: string;
  GID2?: string;
  Gene1N2?:[string,string]
  ScGene?: string;
  ScGene2?: string;
  setExpLoading?: (loading: boolean) => void;
  expressionCutoff?: number;
  expressionEnabled?: boolean;
  ShowNuclei?: boolean;
}


const unCellOpacity = 0.05;


const getOBJcenter = (m) => {
  const box = new THREE.Box3().setFromObject(m);
  const center = new THREE.Vector3();
  box.getCenter(center);
  return center;
};


const LoadedEmbryoModel = ({
  EmbMode,
  MonoColor,
  MonoFate = "mono",
  HighligtCells,
  CenterCell,
  TP,
  SM,
  Resolution,
  ShowLabel = false,
  Gene1N2,
  ExpressionType,
  ScGene,
  ScGene2,
  //ScDataSet,
  GID,
  GID2,
  Fac,
  setShapeDataRange,
  setExpLoading,
  setGlbProgress,         // ← new: reports 0–100 download progress to parent
  expressionCutoff,
  expressionEnabled,
  ShowNuclei,
}: Emb3DProps & { setGlbProgress: (p: number) => void }) => {
  const [CDLoad, setCDLoad] = useState<string>("");
  const [CData, setCData] = useState<CellData | null>(null);
  const [GIDLoad, setGIDLoad] = useState<string>("");
  const [ScGeneLoad, setScGeneLoad] = useState<string>("");
  const [ExpData, setExpData] = useState<any>(null);
  const [ShapeLoad, setShapeLoad] = useState<string>("");
  const [ShapeData, setShapeData] = useState<any>(null);
  const [ConCells, setConCells] = useState<string[]>([]);
  


  const ShapeColorScaler = useMemo(
    () =>
      ShapeData?.Range
        ? ColorScalerShape(ShapeData.Range)
        : (v: number) => "green",
    [ShapeData]
  );

  const ExpColorScaler = ColorScaler([0, 1]);

  const DualExpColorScaler = (v: number) => {
    switch (v) {
      case 0: return "grey";
      case 1: return "blue";
      case 2: return "red";
      case 3: return "purple";
      default: return "grey";
    }
  };


  // ─── Load GLB model with streaming progress ───────────────────────────────
  const [obj, setObj] = useState<THREE.Group | null>(null);

  useEffect(() => {
  const controller = new AbortController();
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder); // ← required for EXT_meshopt_compression
  const url = Resolution === 'High' ? `${API_BASE}/Model/GLB?SM=${SM}&TP=${TP}` : `${API_BASE}/Model/GLBC?SM=${SM}&TP=${TP}` ;

  setObj(null);
  setGlbProgress(0);

  fetch(url, { signal: controller.signal })
    .then(async (res) => {
      if (!res.ok) throw new Error(`HTTP error: ${res.status}`);

      const contentLength = res.headers.get("Content-Length");
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      const reader = res.body!.getReader();
      const chunks: Uint8Array[] = [];
      let received = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.byteLength;
        if (total > 0) setGlbProgress(Math.round((received / total) * 100));
      }

      const assembled = new Uint8Array(received);
      let offset = 0;
      for (const chunk of chunks) {
        assembled.set(chunk, offset);
        offset += chunk.byteLength;
      }
      return assembled.buffer;
    })
    .then(
      (buffer) =>
        new Promise<THREE.Group>((resolve, reject) => {
          loader.parse(buffer, "", (gltf) => resolve(gltf.scene), reject);
        })
    )
    .then((scene) => {
      setObj(scene);
      setGlbProgress(100);
    })
    .catch((err) => {
      if (err.name === "AbortError") {
        console.log(`GLB fetch aborted for TP=${TP}`);
      } else {
        console.error("GLB load failed:", err);
      }
    })
    .finally(() => {
      // setExpLoading(false);
    });

  return () => {
    controller.abort();
  };
}, [SM, TP,Resolution]);
  // ─────────────────────────────────────────────────────────────────────────


  // load {"CellNam":{"CellID":"","Fate":"","nucLoc":[146.5,68.5,51.5]}
  useEffect(() => {
    if (!TP || !SM) return;
    const controller = new AbortController();
    const fetchData = async () => {
      try {
        const url = `${API_BASE}/CellDats/EmbCDLoc?SM=${SM}&TP=${TP}`;
        console.log("Fetching Embryo Cell Data:", url);
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const CData = await response.json();
        setCDLoad(`${TP}${SM}`);
        setCData(CData);
      } catch (err) {
        if (err.name === "AbortError") return;
        setCDLoad("");
        setCData(null);
      }
    };
    fetchData();
    return () => controller.abort();
  }, [SM, TP]);


  // load reporter cell expression data
  useEffect(() => {
    if (ExpressionType !== "Reporters" || !GID) {
      setExpData(null);
      return;
    }
    const controller = new AbortController();
    const fetchData = async () => {
      try {
        setExpLoading(true);
        const url = GID2
          ? `${API_BASE}/Exp/DualEene?SM=${SM}&TP=${TP}&ExpColName=${GID},${GID2}`
          : `${API_BASE}/Exp/Eene?SM=${SM}&ExpColName=${GID}&TP=${TP}`;
        console.log(url);
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const jsonData = await response.json();
        setGIDLoad(`${GID}${GID2}`);
        console.log("Loaded SingleCell expression data:", { url, jsonData });
        setExpData(jsonData);
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("Failed to load Reporters expression:", err);
        setGIDLoad("");
        setExpData(null);
      } finally {
        setExpLoading(false);
      }
    };
    fetchData();
    return () => controller.abort();
  }, [GID, GID2,TP, SM]);


  // load single cell expression data
  useEffect(() => {
    if (ExpressionType !== "SingleCell" || !ScGene) {
      setExpData(null);
      return;
    }
    const controller = new AbortController();
    const fetchData = async () => {
      try {
        setExpLoading(true);
        const url = ScGene2
          ? `${API_BASE}/scExp/DualExp?DataSet=P009D01S&Gene=${ScGene},${ScGene2}`
          : `${API_BASE}/scExp?DataSet=P009D01S&Gene=${ScGene}`;
        const response = await fetch(url, { signal: controller.signal });
        console.log("Fetching SingleCell expression data:", url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const jsonData = await response.json();
        setScGeneLoad(`P009D01S|${ScGene}|${ScGene2}`);
        setExpData(jsonData);
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("Failed to load SingleCell expression:", err);
        setExpData(null);
      } finally {
        setExpLoading(false);
      }
    };
    fetchData();
    return () => controller.abort();
  }, [ScGene, ScGene2,TP,SM]);


  // Load ShapeData
  useEffect(() => {
    if (MonoFate !== "shape") return;
    if (!Fac || !SM || !TP) {
      setShapeData(null);
      console.log("No Fac no SM no TP!!!");
      return;
    }
    const controller = new AbortController();
    const fetchData = async () => {
      try {
        setExpLoading(true);
        const url = `${API_BASE}/Shape/TP?SM=${SM}&Fac=${Fac}&TP=${TP}`;
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const jsonData = await response.json();
        setShapeLoad(Fac);
        setShapeData(jsonData);
        console.log(jsonData)
        setShapeDataRange(jsonData.Range);
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("Failed to load shape data:", err);
        setShapeLoad("");
        setShapeData(null);
      } finally {
        setExpLoading(false);
      }
    };
    fetchData();
    return () => controller.abort();
  }, [SM, TP, Fac]);


  // for CenterCell only load an array of ConCells
  useEffect(() => {
    if (!TP || !SM || !CenterCell) {
      setConCells([]);
      return;
    }
    const controller = new AbortController();
    const fetchData = async () => {
      try {
        const url = `${API_BASE}/CellDats/ConCells?SM=${SM}&TP=${TP}&CellName=${CenterCell}`;
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const Arr = await response.json();
        setConCells(Arr);
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("Failed to load ConCells array:", err);
        setConCells([]);
      }
    };
    fetchData();
    return () => controller.abort();
  }, [SM, TP, CenterCell]);


  // MEMOIZE: extract materials once per new scene
  const { materials } = useMemo(() => {
    const mats: THREE.Material[] = [];
    if (!obj) return { materials: mats };
    obj.traverse((child) => {
      if ((child as THREE.Mesh).isMesh && (child as THREE.Mesh).material) {
        const mesh = child as THREE.Mesh;
        const childMats = Array.isArray(mesh.material)
          ? mesh.material
          : [mesh.material];
        childMats.forEach((m) => {
          m.side = THREE.DoubleSide;
          mats.push(m);
        });
      }
    });
    return { materials: mats };
  }, [obj]);


  // CenterCell color and opacity (ContactNet mode)
useEffect(() => {
  if (!materials.length || EmbMode !== "ContactNet") return;

  if (CenterCell.length === 0) {
    materials.forEach((mat: THREE.MeshStandardMaterial) => {
      mat.transparent = true;
      mat.opacity = 1;
      mat.color = new THREE.Color(MonoColor);
    });
  } else if (CenterCell.length > 0 && ConCells.length === 0) {
    materials.forEach((mat: THREE.MeshStandardMaterial) => {
      mat.transparent = true;
      const CellName = m2C(mat.name || "");
      mat.opacity = CellName === CenterCell ? 1 : unCellOpacity;
      mat.color = CellName === CenterCell
        ? new THREE.Color("red")
        : new THREE.Color(MonoColor); 
    });
  } else if (CenterCell.length > 0 && ConCells.length > 0) {
    materials.forEach((mat: THREE.MeshStandardMaterial) => {
      mat.transparent = true;
      const CellName = m2C(mat.name || "");
      mat.opacity =
        CellName === CenterCell ? 1
        : ConCells.includes(CellName) ? 0.5
        : unCellOpacity;
      mat.color =
        CellName === CenterCell
          ? new THREE.Color("red")
          : ConCells.includes(CellName)
          ? new THREE.Color("GreenYellow")
          : new THREE.Color(MonoColor);
    });
  }

  invalidate();
}, [CenterCell, ConCells, MonoColor, materials, EmbMode]); 

// useEffect(() => {
//   console.log(HighligtCells)
// },[HighligtCells]);

  // Per-cell color + opacity (EMBobj mode)
  useLayoutEffect(() => {
    if (!materials.length || EmbMode !== "EMBobj") return;
    setExpLoading(true);
    const monoC = new THREE.Color(MonoColor);
    const fallback = new THREE.Color("#999999");
    
    for (const mat of materials as THREE.MeshStandardMaterial[]) {
      const cell = m2C(mat.name || "");
      mat.transparent = true;

      switch (MonoFate) {
        case "mono":
          mat.color.copy(monoC);
          mat.opacity =
            HighligtCells.includes(cell) || HighligtCells.includes("All")
              ? 1
              : unCellOpacity;
          break;

        case "fate":
          mat.color.set(C2FateColorMap.get(cell) ?? fallback);
          mat.opacity =
            HighligtCells.includes(cell) || HighligtCells.includes("All")
              ? 1
              : unCellOpacity;
          break;

        case "lineage":
          mat.color.copy(C2LineageColorMap.get(cell) ?? fallback);
          mat.opacity =
            HighligtCells.includes(cell) || HighligtCells.includes("All")
              ? 1
              : unCellOpacity;
          break;

        case "expression": {
          if (ExpData === null) {
            mat.color.copy(fallback);
            mat.opacity =
              HighligtCells.includes(cell) || HighligtCells.includes("All")
                ? 1
                : unCellOpacity;
            break;
          }
          const exp = ExpData?.[cell];
          const isHighlighted =
            HighligtCells.includes(cell) || HighligtCells.includes("All");
          if (typeof exp === "number" && exp >= 0) {
            mat.color.set(
              GID2 || ScGene2 ? DualExpColorScaler(exp) : ExpColorScaler(exp)
            );
            const isExpressed = expressionEnabled
              ? exp >= expressionCutoff
              : true;
            mat.opacity = isHighlighted && isExpressed ? 1 : unCellOpacity;
          } else {
            mat.color.copy(fallback);
            mat.opacity = isHighlighted ? 1 : unCellOpacity;
            if (expressionEnabled) {
              mat.opacity = 0;
            }
          }
          break;
        }

        case "shape": {
          const s = ShapeData?.[cell];
          if (typeof s === "number") mat.color.set(ShapeColorScaler(s));
          else mat.color.copy(fallback);
          mat.opacity =
            HighligtCells.includes(cell) || HighligtCells.includes("All")
              ? 1
              : unCellOpacity;
          break;
        }
      }
    }

    setExpLoading(false);
    invalidate();
  }, [
    MonoFate, MonoColor, materials, CData, ExpData, ShapeData,
    GID2, ScGene2, HighligtCells, expressionEnabled, expressionCutoff,
  ]);


  // Build per-cell color maps + nucleus locations from CData
  const { C2LineageColorMap, C2FateColorMap, nucLocs } = useMemo(() => {
    if (!CData) {
      return {
        C2LineageColorMap: new Map<string, THREE.Color>(),
        C2FateColorMap: new Map<string, THREE.Color>(),
        nucLocs: [] as [number, number, number][],
      };
    }
    const fateMap = new Map<string, THREE.Color>();
    const lineageMap = new Map<string, THREE.Color>();
    const locations: [number, number, number][] = [];

    Object.entries(CData).forEach(([C, data]) => {
      fateMap.set(C, new THREE.Color(FateColor[data.Fate] || "#cccccc"));
      lineageMap.set(C, new THREE.Color(LineageColorMap(data.CellID)));
      if (data.nucLoc && Array.isArray(data.nucLoc) && data.nucLoc.length === 3) {
        locations.push(data.nucLoc);
      }
    });

    return {
      C2FateColorMap: fateMap,
      C2LineageColorMap: lineageMap,
      nucLocs: locations,
    };
  }, [CData]);

  if (!obj) return null;

  return (
    <>
      {nucLocs.map((coord, index) => {
        const [x, y, z] = coord;
        let position;
        
        switch (SM) {
          // case 'Sample9':
          //   position = [
          //     x * 2 * 0.465378 + 4.573794 - OBJCenter[SM][0],
          //     y * 2 * 0.338243 + 7.124704 - OBJCenter[SM][1],
          //     z * 2 * -0.893312 + 152.677429 - OBJCenter[SM][2],
          //   ] as Vector3;
          //   break;
          // case 'Sample10':
          //   position = [
          //     x * 2 * 0.465734 + 4.852338  - OBJCenter[SM][0],
          //     y * 2 * 0.433497 + 6.795137 - OBJCenter[SM][1],
          //     z * 2 * -0.673869 + 114.789888 - OBJCenter[SM][2],
          //   ] as Vector3;
          //   break;
          // case 'Sample28':
          //   position = [
          //     x * 2 * 0.471200 + 4.530744  - OBJCenter[SM][0],
          //     y * 2 * 0.455257 + 5.172297 - OBJCenter[SM][1],
          //     z * 2 * -0.545823 + 95.367722 - OBJCenter[SM][2],
          //   ] as Vector3;
          //   break;
          // case 'Sample29':
          //   position = [
          //     x * 2 * 0.480790 + 1.787336  - OBJCenter[SM][0],
          //     y * 2 * 0.457739 + 4.040036 - OBJCenter[SM][1],
          //     z * 2 * -0.609847 + 105.440226 - OBJCenter[SM][2],
          //   ] as Vector3;
          //   break;
          // case 'Sample30':
          //   position = [
          //     x * 2 * 0.479763 + 2.385425  - OBJCenter[SM][0],
          //     y * 2 * 0.469143 + 2.911434 - OBJCenter[SM][1],
          //     z * 2 * -0.350397 + 65.346255 - OBJCenter[SM][2],
          //   ] as Vector3;
          //   break;
          // case 'Sample31':
          //   position = [
          //     x * 2 * 0.464858 + 6.130477  - OBJCenter[SM][0],
          //     y * 2 * 0.456178 + 4.749222 - OBJCenter[SM][1],
          //     z * 2 * -0.533541 + 90.549319 - OBJCenter[SM][2],
          //   ] as Vector3;
          //   break;
          default:
            position = [
              x - OBJCenter[SM][0],
              y - OBJCenter[SM][1],
              z - OBJCenter[SM][2],
            ] as Vector3;
            break;
        }
        
        return (
          <mesh key={index} position={position}>
            <sphereGeometry args={[.7, 16, 16]} />
            <meshStandardMaterial
              color="yellow"
              opacity={ShowNuclei ? 1 : 0}
              transparent
            />
          </mesh>
        );
      })}
      <primitive
        object={obj}
        position={[
          0 - OBJCenter[SM][0],
          0 - OBJCenter[SM][1],
          0 - OBJCenter[SM][2],
        ] as Vector3}
      />
      {ShowLabel &&
        HighligtCells.length > 0 &&
        !HighligtCells.includes("All") &&
        obj.children.map((child, index) => {
          if ((child as THREE.Mesh).geometry) {
            const mesh = child as THREE.Mesh;
            const CellName = m2C2(mesh.name);
            return HighligtCells.includes("All") ||
              HighligtCells.length === 0 ||
              HighligtCells.includes(CellName) ? (
              <Html key={index} position={getOBJcenter(mesh)} center>
                <div style={{ fontSize: "18px", fontWeight: "bold", cursor: "default" }}>
                  {CellName}
                </div>
              </Html>
            ) : null;
          }
        })}
      {ShowLabel &&
        CenterCell &&
        obj.children.map((child, index) => {
          if ((child as THREE.Mesh).geometry) {
            const mesh = child as THREE.Mesh;
            const CellName = m2C2(mesh.name);
            return CenterCell === CellName ? (
              <Html key={index} position={getOBJcenter(mesh)} center>
                <div className="select-none text-primary font-bold text-3xl cursor-default">
                  {CellName}
                </div>
              </Html>
            ) : null;
          }
        })}
      {ShowLabel &&
        ConCells.length > 0 &&
        obj.children.map((child, index) => {
          if ((child as THREE.Mesh).geometry) {
            const mesh = child as THREE.Mesh;
            const CellName = m2C2(mesh.name);
            return ConCells.includes(CellName) ? (
              <Html key={index} position={getOBJcenter(mesh)} center>
                <div className="select-none font-bold text-[12px] cursor-default">
                  {CellName}
                </div>
              </Html>
            ) : null;
          }
        })}
    </>
  );
};


export const EMB3D: React.FC<
  Emb3DProps & { onSceneReady?: (scene: THREE.Scene) => void }
> = memo(
  ({
    EmbMode,
    TP,
    SM,
    Resolution,
    MonoFate = "mono",
    MonoColor = "red",
    HighligtCells = [],
    CenterCell = "",
    cameraPosition = [0, 0, 200] as [number, number, number],
    ShowLabel = false,
    BinaryScaling = false,
    ExpressionType,
    GID,
    GID2,
    //ScDataSet,
    Gene1N2,
    ScGene,
    ScGene2,
    onSceneReady,
    Fac,
    ShapeDataRange,
    setShapeDataRange,
    expressionCutoff,
    expressionEnabled,
    ShowNuclei,
  }) => {
    const controlsRef = useRef<OrbitControlsType>(null);
    const cameraRef = useRef<PerspectiveCameraType>(null);
    const sceneRef = useRef<THREE.Scene>(null);

    const [ExpLoading, setExpLoading] = useState<boolean>(false);
    // 0 = idle / complete, 1–99 = downloading GLB, 100 = done
    const [glbProgress, setGlbProgress] = useState<number>(0);

    // const [Dual, Gene1N2] = useMemo<[boolean, [string, string]]>(() => {
    //   if (Gene && Gene2) {
    //     return [true, [Gene, Gene]];
    //   } else if (ScGene && ScGene2) {
    //     return [true, [ScGene, ScGene2]];
    //   } else {
    //     return [false, ['', '']];
    //   }
    // }, [Gene, Gene2, ScGene, ScGene2]);

    useEffect(() => {
      if (sceneRef.current && onSceneReady) {
        onSceneReady(sceneRef.current);
      }
    }, [onSceneReady, SM]);

    // Show download progress overlay only while GLB is actively downloading
    const isDownloading = glbProgress > 0 && glbProgress < 100;
    // Show generic data overlay for expression / shape fetches
    const isLoadingData = ExpLoading && !isDownloading;

    return (
      <div className="w-full h-full relative">

        {/* ── GLB download progress bar ─────────────────────────────── */}
        {isDownloading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10">
            <div className="flex flex-col items-center gap-3 w-52">
              <p className="text-sm font-medium text-foreground">
                Loading model... {glbProgress}%
              </p>
              <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-150"
                  style={{ width: `${glbProgress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Generic data spinner (expression / shape) ─────────────── */}
        {isLoadingData && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10">
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

        <Canvas
          //className="bg-white"
          className="bg-background"
          frameloop="demand"
          dpr={[1, Math.min(window.devicePixelRatio, 1.5)]}
          performance={{ min: 0.5 }}
          gl={{ antialias: false, powerPreference: "high-performance" }}
          onCreated={({ scene }) => {
            sceneRef.current = scene;
            if (onSceneReady) onSceneReady(scene);
          }}
        >
          <PerspectiveCamera ref={cameraRef} 
          makeDefault 
          position={cameraPosition} 
          up={FlipYDirection[SM] ? [0, -1, 0] : [0, 1, 0]}
          />
          <OrbitControls
            ref={controlsRef}
            enableZoom={true}
            enablePan={true}
            enableRotate={true}
            minDistance={100}
            maxDistance={1300}
          />

          {/* <ambientLight intensity={1} /> */}
          {/* <directionalLight position={[10, 0, 5]} intensity={1} /> */}
          {/* <directionalLight position={[-10, 0, -5]} intensity={1} /> */}

          {/* Low ambient so shadows read clearly */}
          <ambientLight intensity={0.3} />

          {/* Key light — main illumination from top-front-right */}
          <directionalLight
            position={FlipYDirection[SM] ? [80, -120, 80] : [80, 120, 80]}
            intensity={1.2}
          />

          {/* Fill light — softer, from opposite side to reduce harsh shadows */}
          <directionalLight
            position={FlipYDirection[SM] ? [-80, -40, -60] : [-80, 40, -60]}
            intensity={0.7}
          />

          {/* Rim/back light — separates cells from background */}
          <directionalLight
            position={FlipYDirection[SM] ? [0, -80, -100] : [0, 80, -100]}
            intensity={0.9}
          />

          {/* <axesHelper args={[100]} /> */}

          <Suspense fallback={null}>
            <LoadedEmbryoModel
              Resolution={Resolution}
              EmbMode={EmbMode}
              ExpressionType={ExpressionType}
              GID={GID}
              GID2={GID2}
              //ScDataSet={ScDataSet}
              ScGene={ScGene}
              ScGene2={ScGene2}
              MonoFate={MonoFate}
              HighligtCells={HighligtCells}
              CenterCell={CenterCell}
              SM={SM}
              TP={TP}
              MonoColor={MonoColor}
              Fac={Fac}
              ShowLabel={ShowLabel}
              BinaryScaling={BinaryScaling}
              setExpLoading={setExpLoading}
              setGlbProgress={setGlbProgress}
              ShapeDataRange={ShapeDataRange}
              setShapeDataRange={setShapeDataRange}
              expressionCutoff={expressionCutoff}
              expressionEnabled={expressionEnabled}
              ShowNuclei={ShowNuclei}
            />
          </Suspense>
        </Canvas>

        {HighligtCells.length === 1 && !HighligtCells.includes("All") && (
          <div className="absolute top-4 left-4">
            <ViewerBox
              SM={SM}
              TP={TP}
              CellName={HighligtCells[0]}
            />
          </div>
        )}
        <LegendBox MonoFate={MonoFate} range={ShapeDataRange} Gene1N2={Gene1N2}  />
      </div>
    );
  }
);
