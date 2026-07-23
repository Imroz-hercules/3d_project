import { Canvas } from "@react-three/fiber";
import { OrbitControls, Sky, Environment } from "@react-three/drei";
import { Suspense } from "react";

import MaterialHandlingLine from "./components/MaterialHandlingLine";

function App() {
  // Hybrid plant spans ~X 0→52 and Z −7→+6; frame the whole twin, not just raw intake.
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ position: [55, 42, 48], fov: 42, near: 0.1, far: 400 }}>
      <ambientLight intensity={0.4} />
      <directionalLight position={[40, 50, 25]} intensity={1.5} castShadow shadow-mapSize={[2048, 2048]} />
      <hemisphereLight args={['#cfe8ff', '#4a4a3f', 0.4]} />
      <Sky sunPosition={[100, 30, 100]} turbidity={6} rayleigh={1} mieCoefficient={0.005} />
      <Suspense fallback={null}>
        <Environment preset="city" />
      </Suspense>

      {/* Ground plane — sized for dual-aisle hybrid plant */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[25, -0.01, 0]}>
        <circleGeometry args={[100, 64]} />
        <meshStandardMaterial color="#9a9a92" roughness={0.95} metalness={0.05} />
      </mesh>
      <gridHelper args={[200, 200, '#5c5c54', '#79796e']} position={[25, 0, 0]} />

      <MaterialHandlingLine />
      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        maxPolarAngle={Math.PI / 2.05}
        target={[28, 4, 0]}
        minDistance={10}
        maxDistance={160}
      />
    </Canvas>
  );
}

export default App;
