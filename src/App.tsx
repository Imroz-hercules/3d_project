import { Canvas } from "@react-three/fiber";
import { OrbitControls, Sky, Environment } from "@react-three/drei";
import { Suspense } from "react";

import MaterialHandlingLine from "./components/MaterialHandlingLine";

function App() {
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ position: [9, 5.5, 9], fov: 50, near: 0.1, far: 120 }}>
      <ambientLight intensity={0.4} />
      <directionalLight position={[15, 20, 15]} intensity={1.5} castShadow />
      <hemisphereLight args={['#cfe8ff', '#4a4a3f', 0.4]} />
      <Sky sunPosition={[100, 30, 100]} turbidity={6} rayleigh={1} mieCoefficient={0.005} />
      <Suspense fallback={null}>
        <Environment preset="city" />
      </Suspense>

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.01, 0]}>
        <circleGeometry args={[45, 64]} />
        <meshStandardMaterial color="#9a9a92" roughness={0.95} metalness={0.05} />
      </mesh>
      <gridHelper args={[90, 90, '#5c5c54', '#79796e']} />

      <MaterialHandlingLine />
      <OrbitControls enableDamping dampingFactor={0.08} maxPolarAngle={Math.PI / 2.05} />
    </Canvas>
  );
}

export default App;