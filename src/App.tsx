import { Canvas } from "@react-three/fiber";
import { OrbitControls, Sky, Stats, Environment } from "@react-three/drei";
import { Suspense, useState, type CSSProperties } from "react";

import MaterialHandlingLine from "./components/MaterialHandlingLine";
import { BuildingEnvelope } from "./components/factory/BuildingEnvelope";
import { plantCenter, plantGroundRadius } from "./components/layoutConstants";
import { TwinHud } from "./twin/TwinHud";

function App() {
  const [cx, , cz] = plantCenter();
  const groundR = plantGroundRadius();
  const gridSize = Math.ceil(groundR * 2);
  const [showBuilding, setShowBuilding] = useState(true);
  const [cutaway, setCutaway] = useState(true);

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <div
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          zIndex: 10,
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          onClick={() => setShowBuilding((v) => !v)}
          style={btnStyle}
        >
          {showBuilding ? "Hide building" : "Show building"}
        </button>
        {showBuilding && (
          <button
            type="button"
            onClick={() => setCutaway((v) => !v)}
            style={btnStyle}
          >
            {cutaway ? "Full walls" : "Cutaway"}
          </button>
        )}
      </div>

      <TwinHud />

      <Canvas
        shadows={false}
        dpr={[1, 1]}
        gl={{ antialias: false, powerPreference: "high-performance" }}
        camera={{
          position: [groundR * 0.55, groundR * 0.7, groundR * 0.65],
          fov: 48,
          near: 0.5,
          far: 500,
        }}
      >
        {import.meta.env.DEV && <Stats />}
        <ambientLight intensity={1.05} />
        <directionalLight position={[40, 55, 30]} intensity={0.95} />
        <hemisphereLight args={["#e8f0ff", "#8a8a7a", 0.75]} />
        <Sky sunPosition={[100, 40, 100]} turbidity={4} rayleigh={0.8} mieCoefficient={0.004} />
        {/* Lightweight IBL so metal materials are not black; warehouse is cheaper than city */}
        <Suspense fallback={null}>
          <Environment preset="warehouse" environmentIntensity={0.4} resolution={256} />
        </Suspense>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
          <circleGeometry args={[groundR, 48]} />
          <meshStandardMaterial color="#c0c0b6" roughness={0.95} metalness={0} />
        </mesh>
        <gridHelper
          args={[gridSize, Math.min(32, Math.max(16, Math.round(gridSize / 5))), "#9a9a90", "#b0b0a6"]}
          position={[0, 0.02, 0]}
        />

        <group position={[-cx, 0, -cz]}>
          <MaterialHandlingLine />
          {showBuilding && <BuildingEnvelope cutaway={cutaway} showLights={false} />}
        </group>

        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.05}
          rotateSpeed={0.8}
          zoomSpeed={1}
          panSpeed={1}
          maxPolarAngle={Math.PI / 2.05}
          target={[0, 2, 0]}
          minDistance={12}
          maxDistance={groundR * 2.5}
        />
      </Canvas>
    </div>
  );
}

const btnStyle: CSSProperties = {
  background: "rgba(30, 36, 42, 0.88)",
  color: "#e8e4d4",
  border: "1px solid #6a7278",
  borderRadius: 6,
  padding: "8px 12px",
  fontSize: 13,
  fontFamily: "system-ui, sans-serif",
  cursor: "pointer",
};

export default App;
