import { useRef, Suspense, useState, useEffect } from "react";
import * as THREE from "three";
import { useLoader, ThreeEvent } from "@react-three/fiber";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
// import { MTLLoader } from "three/addons/loaders/MTLLoader.js";
// import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Canvas } from "@react-three/fiber";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {Shapefac} from '@/components/utils/usefulobject'
import { Button } from "@/components/ui/button";
import {
  BlendIcon,
  Download
} from "lucide-react";
import {
  Text,
  Html,
  OrbitControls,
  PerspectiveCamera,
} from "@react-three/drei";
import type { OrbitControls as OrbitControlsType } from "three-stdlib";
import type { PerspectiveCamera as PerspectiveCameraType } from "three";
import { API_BASE } from "@/components/utils/API_BASE";

const LoadingFallback = () => {
  return (
    <Html center>
      <div style={{
        color: 'white',
        fontSize: '1em',
        fontWeight: 'bold',
        padding: '10px 20px',
        borderRadius: '8px',
      }}>
        Loading...
      </div>
    </Html>
  );
};

// const m2C = (mat) => {
//   const C = mat.split("_");
//   return C[1];
// };

// const m2C2 = (mat) => {
//   const C = mat.split("_");
//   return C[0];
// };

const getOBJcenter = (m) => {
  const box = new THREE.Box3().setFromObject(m);
  const center = new THREE.Vector3();
  box.getCenter(center);
  return center;
};

const shiftPosi = (obj) => {
  const OldPosi = obj.position;
  const OBJCenter = getOBJcenter(obj);
  //const OBJCenter = new THREE.Vector3(0,0,0)
  const shiftedPosi = new THREE.Vector3(
    OldPosi.x - OBJCenter.x,
    OldPosi.y - OBJCenter.y,
    OldPosi.z - OBJCenter.z,
  );
  return shiftedPosi;
};

// const DBSide = (m) => {
//   for (const materialName in m) {
//     const mat = m[materialName];
//     mat.side = THREE.DoubleSide;
//   }
// };

// const MapCol = (m, Color) => {
//   for (const materialName in m) {
//     const mat = m[materialName];
//     (mat as THREE.MeshStandardMaterial).color = new THREE.Color(Color);
//   }
// };

//const [cameraPosition, setCameraPosition] = useState<[number, number, number]>([0, 0, 1]);

const LoadedEmbryoModel = ({ SM, TP, CellName,Color }) => {
    if(!TP) { return null;} 
    if(!CellName) { return null;} 

  //const ZeroTP = TP.toString().padStart(3, "0");



  // Load GLB file
    // const glbPath = `${API_BASE}/model/SingleFile?OBJMTL=ABa_2.glb`
    // const gltf = useLoader(GLTFLoader, glbPath);
    // const scene = gltf.scene.clone();

    // scene.traverse((child) => {
    //   if (child instanceof THREE.Mesh) {
    //     // Keep original material properties
    //     if (child.material) {
    //       child.material.color = new THREE.Color('green'); // Use color name
    //       child.material.side = THREE.DoubleSide;
    //       child.material.needsUpdate = true;
    //     }
    //   }
    // });

    const objPath = `${API_BASE}/model/SingleCellOBJ?SM=${SM}&TP=${TP}&CellName=${CellName}`
    const obj = useLoader(OBJLoader, objPath);
  
    // Apply color to all meshes in the group
    obj.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = new THREE.MeshStandardMaterial({
          color: new THREE.Color(Color),
          metalness: 0.5,
          roughness: 0.5,
          side: THREE.DoubleSide,
        });
      }
    });



  
  return(
    <primitive
            object={obj}
            position={shiftPosi(obj)}
          />
  )
};

export const ModelCell = ({ SM, TP, CellName, Color }) => {
  const controlsRef = useRef<OrbitControlsType>(null);
  const cameraRef = useRef<PerspectiveCameraType>(null);
  const [CellData, setCellData] = useState<any>(null);
  const [ShapeData, setShapeData] = useState<object>({});


      // load Shape Data for a cell
  useEffect(() => {
    if(!CellName || !TP){
      setCellData(null);
      return;
    }
    const fetchData = async () => {
      try {
        const url = `${API_BASE}/CellDats/Cell?SM=${SM}&CellName=${CellName}&TP=${TP}`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const jsonData = await response.json();
        setCellData(jsonData);
      } catch (err) {
        setCellData(null);
      }
    };
    fetchData();
  }, [SM,TP,CellName]);

  // load Shape Data for a cell
  useEffect(() => {
    if(!CellName || !TP){
      setShapeData({});
      return;
    }
    const fetchData = async () => {
      try {
        const url = `${API_BASE}/Shape?SM=${SM}&TP=${TP}&CellName=${CellName}`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const jsonData = await response.json();
        setShapeData(jsonData);
      } catch (err) {
        setShapeData({});
      }
    };
    fetchData();
  }, [SM,TP,CellName]);

  return (
    <div className="w-full h-full relative">
      <Card className="flex flex-col h-full overflow-hidden shadow-lg">
        {/* Canvas Container */}
        <div className="flex-1 relative bg-gradient-to-br from-background to-secondary/10">
          <Canvas className="w-full h-full">
            <PerspectiveCamera
              ref={cameraRef}
              makeDefault
              position={[0, 0, 100]}
            />
            <OrbitControls
              ref={controlsRef}
              autoRotate={true}
              enableZoom={true}
              enablePan={true}
              enableRotate={true}
              zoomSpeed={0.6}
              panSpeed={0.5}
              rotateSpeed={0.4}
              minDistance={1}
              maxDistance={100}
            />

            {/* Lighting setup */}
            <ambientLight intensity={1} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            <directionalLight position={[-10, -10, -5]} intensity={0.5} />
            <pointLight position={[0, 0, 10]} intensity={0.3} color="#00d9ff" />

            {/* AxesHelper */}
            <axesHelper args={[5]} />

            <Suspense fallback={<LoadingFallback />}>
              <LoadedEmbryoModel
                key={`${SM}_${TP}`}
                SM={SM}
                TP={TP}
                CellName={CellName}
                Color={Color}
              />
            </Suspense>
          </Canvas>
        </div>

        {/* Info Section */}
        {CellName && <CardContent className="border-t bg-card/50 backdrop-blur-sm p-4">
          <div className="space-y-6">
  {/* Cell Information Section */}
  <div>
    <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
      <BlendIcon className="w-5 h-5 text-primary" />
      Cell Information
    </h3>

    



    <div className="grid grid-cols-2 gap-4 bg-muted/30 rounded-lg p-4 border border-border/50">
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Cell Name
        </p>
        <p className="text-sm font-semibold text-foreground">
          {CellData?.CellName || "—"}
        </p>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Fate
        </p>
        <p className="text-sm font-semibold text-foreground">
          {CellData?.Fate || "—"}
        </p>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Time Point
        </p>
        <p className="text-sm font-semibold text-foreground">
          {TP || "—"}
        </p>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Life Span
        </p>
        <p className="text-sm font-semibold text-foreground">
          {CellData?.Range && CellData?.Range.length == 2 ? `${CellData.Range[0]} ~ ${CellData.Range[1]}` : "—"}
        </p>
      </div>
    </div>

    <Button
        onClick={() => {
            if (!SM || !TP) {
              alert("Please a sample and time point");
              return;
            }
            window.location.href = `${API_BASE}/Model/SingleCellOBJFile?SM=${SM}&TP=${TP}&CellName=${CellName}`;
          }}
        className="w-full"
        variant="secondary"
      >
        <Download className="mr-2 h-4 w-4" />
        Download Cell Model (.obj)
      </Button>
  </div>

  {/* Shape Information Section */}
  <div>
    <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
      <BlendIcon className="w-5 h-5 text-primary" />
      Morphology Data
    </h3>
    <div className="space-y-3">
      {/* Basic measurements */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
            Volume
          </p>
          <p className="text-sm font-semibold text-foreground">
            {CellData && CellData?.Vol.toFixed(2) || "—"} <span className="text-xs text-muted-foreground">μm³</span>
          </p>
        </div>
        <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
            Surface Area
          </p>
          <p className="text-sm font-semibold text-foreground">
            {CellData && CellData?.Sur.toFixed(2) || "—"} <span className="text-xs text-muted-foreground">μm²</span>
          </p>
        </div>
      </div>

      {/* Shape factors */}
      {ShapeData[CellName] && (
        <div className="grid grid-cols-2 gap-3">
          {Object.keys(Shapefac).map((fac) => (
            <div key={fac} className="bg-muted/40 rounded-lg p-3 border border-border/50">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                {Shapefac[fac]}
              </p>
              <p className="text-sm font-semibold text-foreground">
                {ShapeData[CellName][fac]?.toFixed(3) || "—"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
</div>

        </CardContent>}
      </Card>
    </div>
  );
};
