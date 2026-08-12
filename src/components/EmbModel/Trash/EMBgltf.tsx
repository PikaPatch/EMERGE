import { useRef, useEffect, useState, Suspense, useMemo, memo,useLayoutEffect } from "react";
import { ColorScaler,PowerColorScaler,ColorScalerShape } from "@/components/utils/ColorScaler";
import { Canvas, Vector3,invalidate } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, useProgress } from "@react-three/drei";
import LegendBox from "./LegendBox";
import { ViewerBox } from "./ViewerBox";
import type { OrbitControls as OrbitControlsType } from "three-stdlib";
import type { PerspectiveCamera as PerspectiveCameraType } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import { FateColor } from "@/config/FateColor";
import { LineageColorMap } from "@/config/LineageColor";
import { Loader } from "lucide-react";
import { m2C,m2C2 } from "@/components/utils/loadEmb";
import { OBJCenter } from "@/components/utils/usefulobject";
import { API_BASE } from "@/components/utils/API_BASE";

// Enhanced loading fallback with progress
const LoadingWithProgress = () => {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="animate-spin">
          <Loader className="w-8 h-8 text-primary" />
        </div>
        <p className="text-sm font-medium text-foreground">
          Loading Model... {progress.toFixed(0)}%
        </p>
      </div>
    </Html>
  );
};


interface CellData {
  CellID: string;
  Fate: string;
  nucLoc: [number, number, number] | null; 
}


interface Emb3DProps {
  TP: number;
  SM: string;
  SMType: "CMap8" | "CShaper17" | "EmbSAM4567" | "EmbSAM89" | "MT_lag1" | "MT_pop1" | "MT_wee" ;
  EmbMode: "EMBobj" | "ContactNet";
  MonoColor?: string;             // Optional
  MonoFate?: "mono" | "fate" | "lineage" | "expression" | "shape";              // Optional
  Fac?:string;
  setShapeDataRange?: (r:[number,number,number,number]) => void; // Optional
  HighligtCells?: string[];       // Optional
  CenterCell?:string; // Optional
  cameraPosition?: [number, number, number]; // Optional
  ShowLabel?: boolean;            // Optional
  BinaryScaling?: boolean;        // Optional
  ExpressionType?: "Reporters" | "SingleCell"; // Optional
  GID?: string;                   // Optional
  GID2?: string;
  ScDataSet?: string;             // Optional
  ScGene?: string;                // Optional
  ScGene2?: string;                // Optional
  setExpLoading?: (loading: boolean) => void; // Optional
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
  MonoFate = 'mono',
  HighligtCells,
  CenterCell,
  TP,
  SM,
  SMType,
  ShowLabel = false,
  BinaryScaling = false,
  ExpressionType,
  ScGene,
  ScGene2,
  ScDataSet,
  GID,
  GID2,
  Fac,
  setShapeDataRange,
  setExpLoading,
  expressionCutoff,
  expressionEnabled,
  ShowNuclei,
}: Emb3DProps) => {
  const [CDLoad,setCDLoad] = useState<string>('');
  const [CData, setCData] = useState<CellData | null>(null);
  const [GIDLoad,setGIDLoad] = useState<string>('');
  const [ScGeneLoad,setScGeneLoad] = useState<string>('');
  const [ExpData, setExpData] = useState<any>(null);
  const [ShapeLoad,setShapeLoad] = useState<string>('');
  const [ShapeData,setShapeData] = useState<any>(null);
  const [ConCells,setConCells] = useState<string[]>([]);



  const ShapeColorScaler = useMemo(
    () => ShapeData?.Range ? ColorScalerShape(ShapeData.Range) : (v: number) => {return 'green'},
    [ShapeData]
  );


  const ExpColorScaler = PowerColorScaler([0,1])


  const DualExpColorScaler = (v: number) => {
    switch (v) {
      case 0:
        return 'grey'
      case 1:
        return 'blue'
      case 2:
        return 'red'
      case 3:
        return 'purple'
      default:
        return 'grey'
    }
  }


  // Load OBJ model
  //const objPath = `${API_BASE}/Model/OBJ?SM=${SM}&TP=${TP}&SMType=${SMType}`;
  //const obj = useLoader(GLTFLoader, objPath);

  const [obj, setObj] = useState<THREE.Group | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const loader = new GLTFLoader();
    const url = `${API_BASE}/Model/GLTF?SM=${SM}&TP=${TP}`;

    setObj(null);         // clear previous model immediately
    setExpLoading(true);  // show spinner while GLTF is downloading

    fetch(url, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
        return res.arrayBuffer();
      })
      .then((buffer) => {
        return new Promise<THREE.Group>((resolve, reject) => {
          loader.parse(buffer, "", (gltf) => resolve(gltf.scene), reject);
        });
      })
      .then((scene) => {
        setObj(scene);
      })
      .catch((err) => {
        if (err.name === "AbortError") {
          console.log(`GLTF fetch aborted for TP=${TP}`);
        } else {
          console.error("GLTF load failed:", err);
        }
      })
      .finally(() => {
        setExpLoading(false); // hide spinner whether success, error, or abort
      });

    return () => {
      controller.abort();
    };
  }, [SM, TP, SMType]);

  // load {"CellNam":{"CellID":"","Fate":"","nucLoc":[146.5,68.5,51.5]}
  useEffect(() => {
    if (!TP || !SM || !SMType) return;
    const controller = new AbortController();

    const fetchData = async () => {
      try {
        const url = `${API_BASE}/CellDats/EmbCDLoc?SM=${SM}&SMType=${SMType}&TP=${TP}`;
        const response = await fetch(url, { signal: controller.signal }); // ← add signal
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const CData = await response.json();
        setCDLoad(`${TP}${SM}`);
        setCData(CData);
      } catch (err) {
        if (err.name === "AbortError") return; // ← silently ignore cancelled requests
        setCDLoad("");
        setCData(null);
      }
    };
    fetchData();

    return () => controller.abort(); // ← cancel on cleanup
  }, [SM, SMType, TP]);

  // load reporter cell expression data
  useEffect(() => {
    if (ExpressionType !== 'Reporters' || !GID) {
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
        setExpData(jsonData);
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error('Failed to load Reporters expression:', err);
        setGIDLoad('');
        setExpData(null);
      } finally {
        setExpLoading(false);
      }
    };
    fetchData();
    return () => controller.abort();
  }, [GID, GID2])

  // load single cell expression data
  useEffect(() => {
    if (ExpressionType !== 'SingleCell' || !ScDataSet || !ScGene) {
      setExpData(null);
      return;
    }
    const controller = new AbortController();
    const fetchData = async () => {
      try {
        setExpLoading(true);
        const url = ScGene2
          ? `${API_BASE}/scExp/DualExp?DataSet=${ScDataSet}&Gene=${ScGene},${ScGene2}`
          : `${API_BASE}/scExp?DataSet=${ScDataSet}&Gene=${ScGene}`;
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const jsonData = await response.json();
        setScGeneLoad(`${ScDataSet}|${ScGene}|${ScGene2}`);
        setExpData(jsonData);
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error('Failed to load SingleCell expression:', err);
        setExpData(null);
      } finally {
        setExpLoading(false);
      }
    };
    fetchData();
    return () => controller.abort();
  }, [ScGene, ScGene2])

  // Load ShapeData
  useEffect(() => {
    if (MonoFate !== 'shape') return;
    if (!Fac || !SM || !TP) {
      setShapeData(null);
      console.log('No Fac no SM no TP!!!');
      return;
    }
    const controller = new AbortController();
    const fetchData = async () => {
      try {
        setExpLoading(true);
        const url = `${API_BASE}/Shape/TP?SM=${SM}&SMType=${SMType}&Fac=${Fac}&TP=${TP}`;
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const jsonData = await response.json();
        setShapeLoad(Fac);
        setShapeData(jsonData);
        setShapeDataRange(jsonData.Range);
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error('Failed to load shape data:', err);
        setShapeLoad('');
        setShapeData(null);
      } finally {
        setExpLoading(false);
      }
    };
    fetchData();
    return () => controller.abort();
  }, [SM, SMType, TP, Fac])

  // for CenterCell only load an array of ConCells
  useEffect(() => {
    if (!TP || !SM || !SMType || !CenterCell) {
      setConCells([]);
      return;
    }
    const controller = new AbortController();
    const fetchData = async () => {
      try {
        const url = `${API_BASE}/CellDats/ConCells?SM=${SM}&SMType=${SMType}&TP=${TP}&CellName=${CenterCell}`;
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const Arr = await response.json();
        setConCells(Arr);
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error('Failed to load ConCells array:', err);
        setConCells([]);
      }
    };
    fetchData();
    return () => controller.abort();
  }, [SM, TP, CenterCell]);


  // MEMOIZE: Clone scene only once, not on every render
    const { materials } = useMemo(() => {
        const mats: THREE.Material[] = [];
        if (!obj) return { materials: mats };
        obj.traverse((child) => {
            if ((child as THREE.Mesh).isMesh && (child as THREE.Mesh).material) {
            const mesh = child as THREE.Mesh;
            // Normalize to array to handle both single and array materials uniformly
            const childMats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            
            childMats.forEach(m => {
                m.side = THREE.DoubleSide;
                mats.push(m);
            });
            }
        });
        return { materials: mats };
    }, [obj]);


  // Opacity HighligtCells
  // useLayoutEffect(() => {
  //       if (!materials.length || EmbMode !== 'EMBobj') {
  //         return;
  //       }
  //       materials.forEach((mat: THREE.MeshStandardMaterial) => {
  //           mat.transparent = true;
  //           const CellName = m2C(mat.name || "");
  //           mat.opacity = HighligtCells.includes(CellName) || HighligtCells.includes('All')
  //                   ? 1
  //                   : unCellOpacity
  //       })
  //   invalidate();
  //   },[HighligtCells,TP])
  //  CenterCell color and opacity
  useEffect(() => {
    if (!materials.length || EmbMode !== 'ContactNet') {
      return;
    }
    if (CenterCell.length === 0) {
      materials.forEach((mat: THREE.MeshStandardMaterial) => {
        mat.transparent = true;
        mat.opacity = 1;
        mat.color = new THREE.Color(MonoColor);
      });
    }
    if (CenterCell.length > 0 && ConCells.length > 0) {
      materials.forEach((mat: THREE.MeshStandardMaterial) => {
        mat.transparent = true;
        const CellName = m2C(mat.name || "");
        mat.opacity =
          CellName === CenterCell
            ? 1
            : ConCells.includes(CellName)
              ? 0.5
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
  }, [CenterCell, ConCells]);

    useLayoutEffect(() => {
      if (!materials.length || EmbMode !== 'EMBobj') {
        return;
      }
      setExpLoading(true);
      const monoC = new THREE.Color(MonoColor);
      const fallback = new THREE.Color('#999999');

      for (const mat of materials as THREE.MeshStandardMaterial[]) {
        const cell = m2C(mat.name || "");

        mat.transparent = true;

        switch (MonoFate) {
          case "mono":
            mat.color.copy(monoC);
            mat.opacity = HighligtCells.includes(cell) || HighligtCells.includes('All')
              ? 1
              : unCellOpacity;
            break;

          case "fate":
            mat.color.set(C2FateColorMap.get(cell) ?? fallback);
            mat.opacity = HighligtCells.includes(cell) || HighligtCells.includes('All')
              ? 1
              : unCellOpacity;
            break;

          case "lineage":
            mat.color.copy(C2LineageColorMap.get(cell) ?? fallback);
            mat.opacity = HighligtCells.includes(cell) || HighligtCells.includes('All')
              ? 1
              : unCellOpacity;
            break;

          case "expression": {
            if(ExpData === null){
              mat.color.copy(fallback);
              mat.opacity = HighligtCells.includes(cell) || HighligtCells.includes('All') ? 1 : unCellOpacity;
              break;
            }
            const exp = ExpData?.[cell];
            const isHighlighted = HighligtCells.includes(cell) || HighligtCells.includes('All');
            if (typeof exp === "number") {
              mat.color.set((GID2 || ScGene2) ? DualExpColorScaler(exp) : ExpColorScaler(exp));
              //const isExpressed = exp >= expressionCutoff;
              const isExpressed = expressionEnabled ? exp >= expressionCutoff : true;
              mat.opacity = (isHighlighted && isExpressed) ? 1 : unCellOpacity;
            } else {
              mat.color.copy(fallback);
              mat.opacity = isHighlighted ? 1 : unCellOpacity;
            }
            break;
          }

          case "shape": {
            const s = ShapeData?.[cell];
            if (typeof s === "number") mat.color.set(ShapeColorScaler(s));
            else mat.color.copy(fallback);
            mat.opacity = HighligtCells.includes(cell) || HighligtCells.includes('All')
              ? 1
              : unCellOpacity;
            break;
          }
        }
      }

      setExpLoading(false);
      invalidate();
    }, [MonoFate, MonoColor, materials, CData, ExpData, ShapeData, GID2, ScGene2, HighligtCells,expressionEnabled, expressionCutoff]);

    // input CellName and get the lineage color
    const { C2LineageColorMap, C2FateColorMap, nucLocs } = useMemo(() => {
        // Return empty defaults if no data
        if (!CData) {
            return {
                C2LineageColorMap: new Map<string, THREE.Color>(),
                C2FateColorMap: new Map<string, THREE.Color>(),
                nucLocs: [] as [number, number, number][]
            };
        }
        
        // Process everything in one pass for efficiency (optional, but cleaner)
        const fateMap = new Map<string, THREE.Color>();
        const lineageMap = new Map<string, THREE.Color>();
        const locations: [number, number, number][] = [];

        Object.entries(CData).forEach(([C, data]) => {
            // Build Maps
            fateMap.set(C, new THREE.Color(FateColor[data.Fate] || '#cccccc')); // Added fallback
            lineageMap.set(C, new THREE.Color(LineageColorMap(data.CellID)));

            // Build Location Array (Only if nucLoc exists)
            if (data.nucLoc && Array.isArray(data.nucLoc) && data.nucLoc.length === 3) {
                locations.push(data.nucLoc);
            }
        });
        

        return {
            C2FateColorMap: fateMap,
            C2LineageColorMap: lineageMap,
            nucLocs: locations
        };
    }, [CData]);

  if (!obj) return null;

  return (
    <>
    {nucLocs.map((coord, index) => {
        const [x, y, z] = coord;
        const position = [x - OBJCenter[SM][0], y - OBJCenter[SM][1] , z - OBJCenter[SM][2]] as Vector3;
        
        return (
          <mesh key={index} position={position}>
            <sphereGeometry args={[.7, 16, 16]} />
            <meshStandardMaterial 
            color="yellow" 
            opacity={ShowNuclei ? 1 : 0} transparent 
            />
          </mesh>
        );
      })}
    <primitive object={obj} 
        position={[0 - OBJCenter[SM][0],0 - OBJCenter[SM][1],0 - OBJCenter[SM][2]] as Vector3} 
    />
    {ShowLabel && HighligtCells.length > 0 && !HighligtCells.includes('All') &&
        obj.children.map((child, index) => {
        if ((child as THREE.Mesh).geometry) {
            const mesh = child as THREE.Mesh;
            const CellName = m2C2(mesh.name);
            return HighligtCells.includes('All') || HighligtCells.length === 0 || HighligtCells.includes(CellName)  ? (
            <Html key={index} position={getOBJcenter(mesh)} center>
                <div
                style={{
                    fontSize: "18px",
                    fontWeight: "bold",
                    cursor: "default",
                }}
                >
                {CellName}
                </div>
            </Html>
            ) : null;
        }
        })}
      {ShowLabel && CenterCell &&
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
        {ShowLabel && ConCells.length > 0 &&
            obj.children.map((child, index) => {
            if ((child as THREE.Mesh).geometry) {
                const mesh = child as THREE.Mesh;
                const CellName = m2C2(mesh.name);
                return ConCells.includes(CellName)  ? (
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


export const EMB3D: React.FC<Emb3DProps & { onSceneReady?: (scene: THREE.Scene) => void }> = memo(({
  EmbMode,
  TP,
  SM,
  SMType,
  MonoFate = "mono", 
  MonoColor = "red",
  HighligtCells = [],
  CenterCell = '',
  cameraPosition = [0, 0, 100] as [number, number, number],
  ShowLabel = false,
  BinaryScaling = false,
  ExpressionType,
  GID,
  GID2,
  ScDataSet,
  ScGene,
  ScGene2,
  onSceneReady,
  Fac,
  setShapeDataRange,
  expressionCutoff,
  expressionEnabled,
  ShowNuclei,
}) => {
  const controlsRef = useRef<OrbitControlsType>(null);
  const cameraRef = useRef<PerspectiveCameraType>(null);
  const sceneRef = useRef<THREE.Scene>(null);
  // loading
  const [ExpLoading, setExpLoading] = useState<boolean>(false);


  // Expose scene to parent when ready
  useEffect(() => {
    if (sceneRef.current && onSceneReady) {
      onSceneReady(sceneRef.current);
    }
  }, [onSceneReady,SM]);

  return (
    <div className="w-full h-full relative">
        {ExpLoading && (
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
              className="bg-background"
              frameloop="demand"          // 👈 only render when invalidated
              dpr={[1, Math.min(window.devicePixelRatio, 1.5)]}
              performance={{ min: 0.5 }}
              gl={{ antialias: false, powerPreference: "high-performance" }}
              onCreated={({ scene }) => { sceneRef.current = scene; if (onSceneReady) onSceneReady(scene); }}
            >
            <PerspectiveCamera ref={cameraRef} makeDefault position={cameraPosition} />
            <OrbitControls
            ref={controlsRef}
            enableZoom={true}
            enablePan={true}
            enableRotate={true}
            minDistance={100}
            maxDistance={1300}
            />


            {/* Lighting setup */}
            <ambientLight intensity={1} />
            <directionalLight position={[10, 0, 5]} intensity={1} />
            <directionalLight position={[-10, 0, -5]} intensity={1} />


            <axesHelper args={[100]} />


            <Suspense fallback={<LoadingWithProgress />}>
            <LoadedEmbryoModel
                EmbMode={EmbMode}
                ExpressionType={ExpressionType}
                GID={GID}
                GID2={GID2}
                ScDataSet={ScDataSet}
                ScGene={ScGene}
                ScGene2={ScGene2}
                MonoFate={MonoFate}
                HighligtCells={HighligtCells}
                CenterCell={CenterCell}
                SM={SM}
                SMType={SMType}
                TP={TP}
                MonoColor={MonoColor}
                Fac={Fac}
                ShowLabel={ShowLabel}
                BinaryScaling={BinaryScaling}
                setExpLoading={setExpLoading}
                setShapeDataRange={setShapeDataRange}
                expressionCutoff={expressionCutoff}
                expressionEnabled={expressionEnabled}
                ShowNuclei={ShowNuclei}
            />
            </Suspense>
        </Canvas>


        {HighligtCells.length == 1 && !HighligtCells.includes('All') && (
          <div className="absolute top-4 left-4">
            <ViewerBox 
            SM={SM}
            SMType={SMType}
            TP={TP}
            CellName={HighligtCells[0]}
            />
          </div>
        )}
        <LegendBox MonoFate={MonoFate} />
    </div>
  );
});
