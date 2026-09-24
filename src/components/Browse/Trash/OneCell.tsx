import { useRef, useState, useEffect, useMemo } from "react";
import * as THREE from "three";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { Canvas, useThree } from "@react-three/fiber";
import { Html, OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Loader } from "lucide-react";
import type { OrbitControls as OrbitControlsType } from "three-stdlib";
import type { PerspectiveCamera as PerspectiveCameraType } from "three";
import { API_BASE } from "@/components/utils/API_BASE";

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
  TP: number;
  CellName: string;
  Color: string;
  setLoading: (loading: boolean) => void;
}

const LoadedEmbryoModel = ({ SM, TP, CellName, Color, setLoading }: LoadedModelProps) => {
  const [obj, setObj] = useState<THREE.Group | null>(null);

  useEffect(() => {
    if (!TP || !CellName) return;

    const controller = new AbortController();
    const loader = new OBJLoader();
    const url = `${API_BASE}/model/SingleCellOBJ?SM=${SM}&TP=${TP}&CellName=${CellName}`;

    setObj(null);
    setLoading(true);

    fetch(url, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
        return res.text();
      })
      .then((text) => {
        const parsed = loader.parse(text);
        setObj(parsed);
      })
      .catch((err) => {
        if (err.name === "AbortError") {
          console.log(`OBJ fetch aborted for ${CellName} TP=${TP}`);
        } else {
          console.warn("OBJ load failed:", err.message);
          setObj(null);
        }
      })
      .finally(() => {
        setLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [SM, TP, CellName]);

  const cloned = useMemo(() => {
    if (!obj) return null;
    const c = obj.clone(true);
    c.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = new THREE.MeshStandardMaterial({
          color: new THREE.Color(Color),
          metalness: 0.5,
          roughness: 0.5,
          side: THREE.DoubleSide,
        });
      }
    });
    c.position.copy(shiftPosi(c));
    return c;
  }, [obj, Color]);

  if (!cloned) return null;

  return <primitive object={cloned} />;
};

// Inner component that has access to the R3F camera via useThree
interface ZoomControllerProps {
  zoom: number;
  initialZ: number;
}

const ZoomController = ({ zoom, initialZ }: ZoomControllerProps) => {
  const { camera } = useThree();
  useEffect(() => {
    // zoom is 1–100; map to camera Z: zoom=100 → close (initialZ * 0.2), zoom=1 → far (initialZ * 2)
    const newZ = initialZ * (2 - (zoom / 100) * 1.8);
    camera.position.setZ(newZ);
  }, [zoom, camera, initialZ]);
  return null;
};

interface CellViewerProps {
  SM: string;
  TP: number;
  CellName: string;
  Color?: string;
  CameraPosi?: [x: number, y: number, z: number];
}

/**
 * Simple 3D cell viewer component - just the Canvas with 3D model
 * TP buttons and Card wrapper should be handled by parent component
 */
export const OneCell = ({
  SM,
  TP,
  CellName,
  Color = "#58D6FC",
  CameraPosi = [0, 0, 50],
}: CellViewerProps) => {
  const controlsRef = useRef<OrbitControlsType>(null);
  const cameraRef = useRef<PerspectiveCameraType>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [zoom, setZoom] = useState(50); // default midpoint

  return (
    <div style={{ position: "relative", width: "100%", height: "400px", flexShrink: 0 }}>
      {/* Zoom slider overlay */}
      <div
        style={{
          position: "absolute",
          bottom: "12px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: "rgba(0,0,0,0.45)",
          borderRadius: "8px",
          padding: "4px 12px",
          userSelect: "none",
        }}
      >
        <span style={{ color: "#fff", fontSize: "12px" }}>🔍</span>
        <input
          type="range"
          min={1}
          max={100}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          style={{ width: "120px", cursor: "pointer" }}
        />
        <span style={{ color: "#aaa", fontSize: "11px", minWidth: "28px" }}>
          {zoom}%
        </span>
      </div>

      {isLoading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 5,
            pointerEvents: "none",
          }}
        >
          <Loader className="animate-spin" />
          Loading model...
        </div>
      )}

      <Canvas style={{ width: "100%", height: "100%" }}>
        <PerspectiveCamera
          ref={cameraRef}
          makeDefault
          position={CameraPosi}
        />
        <ZoomController zoom={zoom} initialZ={CameraPosi[2]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 10]} intensity={1} />
        <LoadedEmbryoModel
          SM={SM}
          TP={TP}
          CellName={CellName}
          Color={Color}
          setLoading={setIsLoading}
        />
        <OrbitControls
          ref={controlsRef}
          enableZoom={false}
        />
      </Canvas>
    </div>
  );
};
