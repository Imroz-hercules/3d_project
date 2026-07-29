import { useEffect, useMemo, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useVisibilityLayers } from '../shell/services/visibility';

type V3 = [number, number, number];

/**
 * Two-point distance measurement. Enable via the Measure Tool visibility
 * toggle; click any two surfaces to get a metre readout. A third click
 * starts a new measurement; Escape clears. Mount once inside the Canvas
 * (world space).
 */
export function MeasureTool() {
  const { measure } = useVisibilityLayers();
  const { gl, camera, scene } = useThree();
  const [points, setPoints] = useState<THREE.Vector3[]>([]);

  useEffect(() => {
    if (!measure) {
      setPoints([]);
      return;
    }
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const rect = gl.domElement.getBoundingClientRect();
      ndc.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObjects(scene.children, true);
      const hit = hits.find((h) => {
        const mesh = h.object as THREE.Mesh;
        if (!mesh.isMesh || !mesh.visible) return false;
        if (mesh.userData.measureIgnore) return false;
        const mat = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material) as
          | THREE.Material
          | undefined;
        // Skip invisible click-target boxes and near-invisible overlays
        if (mat && mat.transparent && mat.opacity <= 0.05) return false;
        return true;
      });
      if (!hit) return;
      setPoints((prev) => (prev.length >= 2 ? [hit.point.clone()] : [...prev, hit.point.clone()]));
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPoints([]);
    };

    gl.domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      gl.domElement.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [measure, gl, camera, scene]);

  const segment = useMemo(() => {
    if (points.length < 2) return null;
    const [a, b] = points;
    const dir = new THREE.Vector3().subVectors(b, a);
    const len = dir.length();
    const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
    const quat = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.clone().normalize()
    );
    return { len, mid, quat };
  }, [points]);

  if (!measure || points.length === 0) return null;

  return (
    <group>
      {points.map((p, i) => (
        <mesh key={i} position={p.toArray() as V3} userData={{ measureIgnore: true }} raycast={() => null}>
          <sphereGeometry args={[0.07, 10, 10]} />
          <meshBasicMaterial color="#00d4ff" depthTest={false} transparent opacity={0.95} />
        </mesh>
      ))}
      {segment && (
        <>
          <mesh
            position={segment.mid.toArray() as V3}
            quaternion={segment.quat}
            userData={{ measureIgnore: true }}
            raycast={() => null}
          >
            <cylinderGeometry args={[0.014, 0.014, segment.len, 6]} />
            <meshBasicMaterial color="#00d4ff" depthTest={false} transparent opacity={0.85} />
          </mesh>
          <Billboard position={[segment.mid.x, segment.mid.y + 0.35, segment.mid.z]}>
            <mesh userData={{ measureIgnore: true }} raycast={() => null}>
              <planeGeometry args={[1.1, 0.34]} />
              <meshBasicMaterial color="#10161c" transparent opacity={0.85} depthTest={false} />
            </mesh>
            <Text
              position={[0, 0, 0.001]}
              fontSize={0.16}
              color="#00d4ff"
              anchorX="center"
              anchorY="middle"
            >
              {`${segment.len.toFixed(2)} m`}
            </Text>
          </Billboard>
        </>
      )}
    </group>
  );
}
