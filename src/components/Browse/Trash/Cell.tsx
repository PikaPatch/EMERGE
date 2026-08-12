import { useRef, Suspense, useState, useEffect } from "react";
import * as THREE from "three";
import { useLoader } from "@react-three/fiber";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { Canvas } from "@react-three/fiber";
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

const LoadedEmbryoModel = ({ SM, TP, CellName,Color }) => {
    if(!TP) { return null;} 
    if(!CellName) { return null;} 

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

export const OneCell = ({ SM, TP, CellName, Color = '#58D6FC' }) => {
  const controlsRef = useRef<OrbitControlsType>(null);
  const cameraRef = useRef<PerspectiveCameraType>(null);
  return (
    <Canvas className="w-full h-full">
            <PerspectiveCamera
              ref={cameraRef}
              makeDefault
              position={[0, 0, 100]}
            />
            <OrbitControls
              ref={controlsRef}
              autoRotate={true}
              enableZoom={false}
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
  );
};