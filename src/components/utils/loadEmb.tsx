import * as THREE from "three";
import { Text,Html} from "@react-three/drei";


export const m2C = (mat) => {
  const C = mat.split("_");
  return C[1];
};

export const SampleConvert = {
    '200113plc1p2':'WT_Sample1',
    '200322plc1p2':'WT_Sample2',
    '200323plc1p1':'WT_Sample3',
    '200326plc1p3':'WT_Sample4',
    '200326plc1p4':'WT_Sample5',
    '191108plc1p1':'WT_Sample6',
    '200109plc1p1':'WT_Sample7',
    '200113plc1p3':'WT_Sample8'
}

export const SampleConvert2 = {
    'WT_Sample1':'200113plc1p2',
    'WT_Sample2':'200322plc1p2',
    'WT_Sample3':'200323plc1p1',
    'WT_Sample4':'200326plc1p3',
    'WT_Sample5':'200326plc1p4',
    'WT_Sample6':'191108plc1p1',
    'WT_Sample7':'200109plc1p1',
    'WT_Sample8':'200113plc1p3'
}

export const m2C2 = (mat) => {
  const C = mat.split("_");
  return C[0];
};


// export const getOBJcenter = (m) => {
//     const box = new THREE.Box3().setFromObject(m);
//     const center = new THREE.Vector3();
//     box.getCenter(center);
//     return center;
// };

export const getMeshcenter = (mesh): THREE.Vector3 => {
  const box = new THREE.Box3().setFromObject(mesh);
  return box.getCenter(new THREE.Vector3());
};

export const shiftPosi = (obj,center?) => {
  const OldPosi = obj.position
  const OBJCenter = center ? new THREE.Vector3(...center) : getMeshcenter(obj)
  const shiftedPosi = new THREE.Vector3(
    OldPosi.x - OBJCenter.x,
    OldPosi.y - OBJCenter.y,
    OldPosi.z - OBJCenter.z,
  );
  return shiftedPosi;
};

// export const shiftPosi2 = (posi1,posi2) => {
//   const posi1V = new THREE.Vector3(...posi1)
//   const posi2V = new THREE.Vector3(...posi2)
//   const shiftedPosi = new THREE.Vector3(
//     posi1V.x - posi2V.x,
//     posi1V.y - posi2V.y,
//     posi1V.z - posi2V.z,
//   );
//   return shiftedPosi;
// };

export const DBSide = (m) => {
  for (const materialName in m) {
    const mat = m[materialName];
    mat.side = THREE.DoubleSide;
  }
};

// export const centerOBJ = (obj) => {
//     const center = getMeshcenter(obj);
//         obj.position.x -= center.x;
//         obj.position.y -= center.y;
//         obj.position.z -= center.z;
// }


export const MapMono = (m: Record<string, THREE.Material>, options: { col?: string } = {}) => {
  const col = options.col || '#58D6FC';
  for (const materialName in m) {
    const mat = m[materialName];
    (mat as THREE.MeshStandardMaterial).color = new THREE.Color(col);
  }
};

export const Maptrans = (m,Opa?) => {
    const CellOpacity = Opa ?? 1;
    for (const materialName in m) {
      const mat = m[materialName];
      (mat as THREE.MeshStandardMaterial).transparent = true;
      (mat as THREE.MeshStandardMaterial).opacity = CellOpacity
    }
}

export const MapDefault = (m) => {
    MapMono(m)
    Maptrans(m)
}

export const MapCell = (m, CenterCell,ContactedCell?) => {
  const COL_BG = '#58D6FC'
  const COL_Center = 'red'
  const COL_Con = 'yellow'

  const OPA_BG = .03
  const OPA_Center = 1
  const OPA_Con = .5
  console.log(m)
  for (const materialName in m) {
    const mat = m[materialName] as THREE.MeshStandardMaterial;
    const CellName = m2C(materialName);
    mat.transparent = true;

    mat.color.set(CellName == CenterCell ? COL_Center : ContactedCell.includes(CellName) ? COL_Con : COL_BG);
    mat.opacity = CellName == CenterCell ? OPA_Center : ContactedCell.includes(CellName) ? OPA_Con : OPA_BG;
  }
};

export const MapCellglb = (m, CenterCell,ContactedCell?) => {
  const COL_BG = '#58D6FC'
  const COL_Center = 'red'
  const COL_Con = 'yellow'

  const OPA_BG = .03
  const OPA_Center = 1
  const OPA_Con = .5
  for (const materialName in m) {
    const mat = m[materialName] as THREE.MeshStandardMaterial;
    const CellName = m2C(mat.name);
    mat.transparent = true;

    mat.color.set(CellName == CenterCell ? COL_Center : ContactedCell.includes(CellName) ? COL_Con : COL_BG);
    mat.opacity = CellName == CenterCell ? OPA_Center : ContactedCell.includes(CellName) ? OPA_Con : OPA_BG;
  }
};

export const meshSphere = (posi, color) => {
  return (
    <mesh position={posi}>
      <sphereGeometry args={[2, 16, 16]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
};


export const LoadingFallback = () => {
  return (
      <Html position={[0, 0, 0]} center>
        <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
            Loading...
        </div>
      </Html>
  );
};