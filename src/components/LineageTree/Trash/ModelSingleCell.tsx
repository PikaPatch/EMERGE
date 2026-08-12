// ModelSingleCell.tsx
import { useRef, useEffect, useState, useMemo, Suspense, Component, type ReactNode } from "react";
import * as THREE from "three";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { Canvas } from "@react-three/fiber";
import {
  Html,
  OrbitControls,
  PerspectiveCamera,
} from "@react-three/drei";
import { Loader } from "lucide-react";
import type { OrbitControls as OrbitControlsType } from "three-stdlib";
import type { PerspectiveCamera as PerspectiveCameraType } from "three";
import { API_BASE } from "@/components/utils/API_BASE";

/* ---------- Types ---------- */
interface CellProps {
  SM: string;
  SMType: string;
  TP: string | number;
  CellName: string;
  Color?: string;
  setLoading?: (loading: boolean) => void;
}

/* ---------- UI fallbacks ---------- */
const LoadingFallback = () => (
  <Html center>
    <div
      style={{
        color: "white",
        fontSize: "1em",
        fontWeight: "bold",
        padding: "10px 20px",
        borderRadius: "8px",
      }}
    >
      Loading...
    </div>
  </Html>
);

const NoModelFallback = ({ CellName, TP }: { CellName?: string; TP?: string | number }) => (
  <Html center>
    <div
      style={{
        color: "#fff",
        background: "rgba(0, 0, 0, 0.6)",
        fontSize: "0.95em",
        fontWeight: 500,
        padding: "12px 20px",
        borderRadius: "8px",
        textAlign: "center",
        whiteSpace: "nowrap",
        border: "1px solid rgba(255,255,255,0.15)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div style={{ fontSize: "1.1em", marginBottom: 4 }}> No model available</div>
      {(CellName || TP) && (
        <div style={{ fontSize: "0.8em", opacity: 0.75 }}>
          {/* {CellName ? `Cell: ${CellName}` : ""}
          {CellName && TP ? " · " : ""}
          {TP ? `TP: ${TP}` : ""} */}
          Please select other time point
        </div>
      )}
    </div>
  </Html>
);

/* ---------- Inline ErrorBoundary (no extra deps) ---------- */
interface BoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  resetKey?: string;
}
interface BoundaryState {
  hasError: boolean;
}
class LoaderErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidUpdate(prev: BoundaryProps) {
    if (prev.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  componentDidCatch(error: Error) {
    console.warn("OBJ load failed:", error.message);
  }

  render() {
    if (this.state.hasError) return this.props.fallback ?? null;
    return this.props.children;
  }
}

/* ---------- Helpers ---------- */
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

/* ---------- Inner loader (manual fetch + AbortController) ---------- */
const LoadedEmbryoModel = ({ SM, SMType, TP, CellName, Color, setLoading }: CellProps) => {
  const [obj, setObj] = useState<THREE.Group | null>(null);

  // Fetch OBJ with abort support — cancels in-flight request when TP/CellName changes
  useEffect(() => {
    const controller = new AbortController();
    const loader = new OBJLoader();
    const url = `${API_BASE}/model/SingleCellOBJ?SM=${SM}&SMType=${SMType}&TP=${TP}&CellName=${CellName}`;

    setObj(null);           // clear previous model immediately
    setLoading?.(true);     // show spinner

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
        setLoading?.(false); // hide spinner always
      });

    return () => {
      controller.abort();   // cancel on TP/CellName change
    };
  }, [SM, SMType, TP, CellName]);

  const cloned = useMemo(() => obj?.clone(true) ?? null, [obj]);

  const hasMesh = useMemo(() => {
    if (!cloned) return false;
    let found = false;
    cloned.traverse((c) => {
      if ((c as THREE.Mesh).isMesh) {
        const g = (c as THREE.Mesh).geometry;
        if (g?.attributes?.position) found = true;
      }
    });
    return found;
  }, [cloned]);

  useEffect(() => {
    if (!cloned || !hasMesh) return;
    const created: THREE.Material[] = [];
    cloned.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const mat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(Color),
          metalness: 0.5,
          roughness: 0.5,
          side: THREE.DoubleSide,
        });
        mesh.material = mat;
        created.push(mat);
      }
    });
    return () => {
      created.forEach((m) => m.dispose());
    };
  }, [cloned, Color, hasMesh]);

  const position = useMemo(() => (cloned ? shiftPosi(cloned) : new THREE.Vector3()), [cloned]);

  // All hooks done — safe to conditionally return now
  if (!cloned) return null;
  if (!hasMesh) return <NoModelFallback CellName={CellName} TP={TP} />;

  return <primitive object={cloned} position={position} />;
};

/* ---------- Public component ---------- */
export const ModelSingleCell = ({
  SM,
  SMType,
  TP,
  CellName,
  Color = "#58D6FC",
}: CellProps) => {
  const controlsRef = useRef<OrbitControlsType>(null);
  const cameraRef = useRef<PerspectiveCameraType>(null);
  const [isLoading, setIsLoading] = useState(false);

  const canRender = Boolean(SM && TP && CellName);

  return (
    <div className="flex-1 relative bg-gradient-to-br from-background to-secondary/10">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin">
              <Loader className="w-8 h-8 text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground">Loading model...</p>
          </div>
        </div>
      )}
      <Canvas className="w-full h-full">
        <PerspectiveCamera ref={cameraRef} makeDefault position={[0, 0, 50]} />
        <OrbitControls
          ref={controlsRef}
          autoRotate
          enableZoom
          enablePan
          enableRotate
          zoomSpeed={0.6}
          panSpeed={0.5}
          rotateSpeed={0.4}
          minDistance={1}
          maxDistance={100}
        />

        <ambientLight intensity={1} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} />
        <pointLight position={[0, 0, 10]} intensity={0.3} color="#00d9ff" />

        <axesHelper args={[5]} />

        {canRender ? (
          <LoaderErrorBoundary
            resetKey={`${SM}_${TP}_${CellName}`}
            fallback={<NoModelFallback CellName={CellName} TP={TP} />}
          >
            <LoadedEmbryoModel
              key={`${SM}_${TP}_${CellName}`}
              SM={SM}
              SMType={SMType}
              TP={TP}
              CellName={CellName}
              Color={Color}
              setLoading={setIsLoading}
            />
          </LoaderErrorBoundary>
        ) : (
          <NoModelFallback CellName={CellName} TP={TP} />
        )}
      </Canvas>
    </div>
  );
};