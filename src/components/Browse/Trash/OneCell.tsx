import { useRef, Suspense, useEffect } from "react";
import * as THREE from "three";
import { useLoader } from "@react-three/fiber";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { Canvas } from "@react-three/fiber";
import { Html, OrbitControls, PerspectiveCamera } from "@react-three/drei";
import type { OrbitControls as OrbitControlsType } from "three-stdlib";
import type { PerspectiveCamera as PerspectiveCameraType } from "three";
import { API_BASE } from "@/components/utils/API_BASE";

const LoadingFallback = () => (
  <Html center>
    <div className="text-foreground text-sm font-bold p-2 rounded-lg">
      Loading...
    </div>
  </Html>
);

const getOBJcenter = (m: THREE.Object3D) => {
  const box = new THREE.Box3().setFromObject(m);
  const center = new THREE.Vector3();
  box.getCenter(center);
  return center;
};

const shiftPosi = (obj: THREE.Object3D) => {
  const OldPosi = obj.position;
  const OBJCenter = getOBJcenter(obj);
  return new THREE.Vector3(
    OldPosi.x - OBJCenter.x,
    OldPosi.y - OBJCenter.y,
    OldPosi.z - OBJCenter.z
  );
};

interface LoadedModelProps {
  SM: string;
  SMType: string;
  TP: number;
  CellName: string;
  Color: string;
  groupRef: React.RefObject<THREE.Group>;
}

const LoadedEmbryoModel = ({ SM,SMType, TP, CellName, Color, groupRef }: LoadedModelProps) => {
  if (!TP || !CellName) return null;

  const objPath = `${API_BASE}/model/SingleCellOBJ?SM=${SM}&SMType=${SMType}&TP=${TP}&CellName=${CellName}`;
  const obj = useLoader(OBJLoader, objPath);

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

  useEffect(() => {
    if (groupRef.current) {
      // Clear previous children
      while (groupRef.current.children.length > 0) {
        const child = groupRef.current.children[0];
        groupRef.current.remove(child);
        if (child instanceof THREE.Mesh) {
          child.geometry?.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((mat) => mat.dispose());
          } else {
            child.material?.dispose();
          }
        }
      }

      // Add new model
      const clonedObj = obj.clone();
      clonedObj.position.copy(shiftPosi(clonedObj));
      groupRef.current.add(clonedObj);
    }

    return () => {
      if (groupRef.current && groupRef.current.children.length > 0) {
        const child = groupRef.current.children[0];
        groupRef.current.remove(child);
        if (child instanceof THREE.Mesh) {
          child.geometry?.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((mat) => mat.dispose());
          } else {
            child.material?.dispose();
          }
        }
      }
    };
  }, [obj, groupRef]);

  return null;
};

interface CellViewerProps {
  SM: string;
  SMType: string;
  TP: number;
  CellName: string;
  Color?: string;
  CameraPosi?:[x: number, y: number, z: number];
}

/**
 * Simple 3D cell viewer component - just the Canvas with 3D model
 * TP buttons and Card wrapper should be handled by parent component
 */
export const OneCell = ({
  SM,
  SMType,
  TP,
  CellName,
  Color = "#58D6FC",
  CameraPosi = [0, 0, 50],
}: CellViewerProps) => {
  const controlsRef = useRef<OrbitControlsType>(null);
  const cameraRef = useRef<PerspectiveCameraType>(null);
  const groupRef = useRef<THREE.Group>(new THREE.Group());

  return (
    <Canvas className="w-full h-full">
      <PerspectiveCamera ref={cameraRef} makeDefault position={CameraPosi} />
      <OrbitControls
        ref={controlsRef}
        autoRotate
        enableZoom={true}
        enablePan
        enableRotate
        zoomSpeed={0.6}
        panSpeed={0.5}
        rotateSpeed={0.4}
        minDistance={50}
        maxDistance={100}
      />

      <ambientLight intensity={1} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <directionalLight position={[-10, -10, -5]} intensity={0.5} />
      <pointLight position={[0, 0, 10]} intensity={0.3} color="#00d9ff" />

      <axesHelper args={[5]} />

      <group ref={groupRef} />

      <Suspense fallback={<LoadingFallback />}>
        <LoadedEmbryoModel
          key={`${SM}_${TP}`}
          SM={SM}
          SMType={SMType}
          TP={TP}
          CellName={CellName}
          Color={Color}
          groupRef={groupRef}
        />
      </Suspense>
    </Canvas>
  );
};
