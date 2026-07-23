import { Canvas } from "@react-three/fiber";
import { OrbitControls, Sky, Environment } from "@react-three/drei";
import { Suspense } from "react";

import MaterialHandlingLine from "./components/MaterialHandlingLine";

function App() {
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ position: [28, 18, 22], fov: 45, near: 0.1, far: 250 }}>
      <ambientLight intensity={0.4} />
      <directionalLight position={[25, 35, 20]} intensity={1.5} castShadow shadow-mapSize={[2048, 2048]} />
      <hemisphereLight args={['#cfe8ff', '#4a4a3f', 0.4]} />
      <Sky sunPosition={[100, 30, 100]} turbidity={6} rayleigh={1} mieCoefficient={0.005} />
      <Suspense fallback={null}>
        <Environment preset="city" />
      </Suspense>

      {/* Ground plane — sized for dual-aisle hybrid plant */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.01, 0]}>
        <circleGeometry args={[80, 64]} />
        <meshStandardMaterial color="#9a9a92" roughness={0.95} metalness={0.05} />
      </mesh>
      <gridHelper args={[160, 160, '#5c5c54', '#79796e']} />

      <MaterialHandlingLine />
      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        maxPolarAngle={Math.PI / 2.05}
        target={[12, 3, 0]}
        minDistance={8}
        maxDistance={90}
      />
    </Canvas>
  );
}

export default App;
