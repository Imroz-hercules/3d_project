import { Canvas } from "@react-three/fiber";
import { OrbitControls, Sky, Environment } from "@react-three/drei";
import { Suspense } from "react";

import MaterialHandlingLine from "./components/MaterialHandlingLine";

function App() {
  // Overview camera: plant spans roughly X 0→55, Z −2→+6 — frame both aisles + packing.
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ position: [42, 58, 52], fov: 48, near: 0.5, far: 500 }}>
      <ambientLight intensity={0.45} />
      <directionalLight position={[40, 55, 30]} intensity={1.45} castShadow shadow-mapSize={[2048, 2048]} />
      <hemisphereLight args={['#cfe8ff', '#4a4a3f', 0.45]} />
      <Sky sunPosition={[100, 30, 100]} turbidity={6} rayleigh={1} mieCoefficient={0.005} />
      <Suspense fallback={null}>
        <Environment preset="city" />
      </Suspense>

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[28, -0.01, 1]}>
        <circleGeometry args={[110, 64]} />
        <meshStandardMaterial color="#9a9a92" roughness={0.95} metalness={0.05} />
      </mesh>
      <gridHelper args={[220, 220, '#5c5c54', '#79796e']} position={[28, 0, 1]} />

      <MaterialHandlingLine />
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        maxPolarAngle={Math.PI / 2.05}
        target={[30, 2, 1]}
        minDistance={12}
        maxDistance={220}
      />
    </Canvas>
  );
}

export default App;
