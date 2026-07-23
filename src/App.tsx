import { Canvas } from "@react-three/fiber";
import { OrbitControls, Sky, Environment, Stats } from "@react-three/drei";
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
        dpr={[1, 1.5]}
        camera={{
          position: [groundR * 0.55, groundR * 0.7, groundR * 0.65],
          fov: 48,
          near: 0.5,
          far: 500,
        }}
      >
        <Stats />
        <ambientLight intensity={0.45} />
        <directionalLight
          position={[40, 55, 30]}
          intensity={1.45}
          // castShadow
          // shadow-mapSize={[2048, 2048]}
        />
        <hemisphereLight args={["#cfe8ff", "#4a4a3f", 0.45]} />
        <Sky sunPosition={[100, 30, 100]} turbidity={6} rayleigh={1} mieCoefficient={0.005} />
        <Suspense fallback={null}>
          <Environment preset="city" />
        </Suspense>

        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.01, 0]}>
          <circleGeometry args={[groundR, 64]} />
          <meshStandardMaterial color="#9a9a92" roughness={0.95} metalness={0.05} />
        </mesh>
        <gridHelper
          args={[gridSize, Math.max(40, Math.round(gridSize / 2)), "#5c5c54", "#79796e"]}
          position={[0, 0, 0]}
        />

        <group position={[-cx, 0, -cz]}>
          <MaterialHandlingLine />
          {showBuilding && <BuildingEnvelope cutaway={cutaway} showLights />}
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
