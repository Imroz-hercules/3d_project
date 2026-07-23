import { Canvas } from "@react-three/fiber";
import { OrbitControls, Sky, Environment } from "@react-three/drei";
import { Suspense } from "react";

import MaterialHandlingLine from "./components/MaterialHandlingLine";
import { plantCenter, plantGroundRadius } from "./components/layoutConstants";

function App() {
  const [cx, , cz] = plantCenter();
  const groundR = plantGroundRadius();
  const gridSize = Math.ceil(groundR * 2);

  // Plant is recentered on the ground origin so packing no longer hangs off the apron.
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [groundR * 0.55, groundR * 0.7, groundR * 0.65], fov: 48, near: 0.5, far: 500 }}
    >
      <ambientLight intensity={0.45} />
      <directionalLight position={[40, 55, 30]} intensity={1.45} castShadow shadow-mapSize={[2048, 2048]} />
      <hemisphereLight args={['#cfe8ff', '#4a4a3f', 0.45]} />
      <Sky sunPosition={[100, 30, 100]} turbidity={6} rayleigh={1} mieCoefficient={0.005} />
      <Suspense fallback={null}>
        <Environment preset="city" />
      </Suspense>

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.01, 0]}>
        <circleGeometry args={[groundR, 64]} />
        <meshStandardMaterial color="#9a9a92" roughness={0.95} metalness={0.05} />
      </mesh>
      <gridHelper args={[gridSize, Math.max(40, Math.round(gridSize / 2)), '#5c5c54', '#79796e']} position={[0, 0, 0]} />

      <group position={[-cx, 0, -cz]}>
        <MaterialHandlingLine />
      </group>

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        maxPolarAngle={Math.PI / 2.05}
        target={[0, 2, 0]}
        minDistance={12}
        maxDistance={groundR * 2.5}
      />
    </Canvas>
  );
}

export default App;
