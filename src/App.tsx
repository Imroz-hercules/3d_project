import { Canvas } from "@react-three/fiber";
import { OrbitControls, Sky, Stats, Environment, ContactShadows } from "@react-three/drei";
import { Suspense, useState, type CSSProperties } from "react";

import MaterialHandlingLine from "./components/MaterialHandlingLine";
import { BuildingEnvelope } from "./components/factory/BuildingEnvelope";
import { IndustrialFloor } from "./components/factory/IndustrialFloor";
import { plantCenter, plantGroundRadius } from "./components/layoutConstants";
import { PlantMaterialsProvider } from "./materials";
import { HDRI_FACTORY } from "./materials/paths";
import { TwinHud } from "./twin/TwinHud";

function App() {
  const [cx, , cz] = plantCenter();
  const groundR = plantGroundRadius();
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
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          toneMappingExposure: 1.05,
        }}
        camera={{
          position: [groundR * 0.55, groundR * 0.7, groundR * 0.65],
          fov: 48,
          near: 0.5,
          far: 500,
        }}
      >
        {import.meta.env.DEV && <Stats />}
        <ambientLight intensity={0.28} />
        <hemisphereLight args={["#dfe7f2", "#6a6a5e", 0.35]} />
        <directionalLight position={[30, 50, 20]} intensity={1.85} />
        <Sky sunPosition={[100, 40, 100]} turbidity={3} rayleigh={0.6} mieCoefficient={0.003} />

        <Suspense fallback={null}>
          <Environment files={HDRI_FACTORY} environmentIntensity={0.55} background={false} />
          <PlantMaterialsProvider enableTextures>
            <IndustrialFloor radius={groundR} />
            <group position={[-cx, 0, -cz]}>
              <MaterialHandlingLine />
              {showBuilding && <BuildingEnvelope cutaway={cutaway} showLights={false} />}
            </group>
            <ContactShadows
              position={[0, 0.01, 0]}
              opacity={0.35}
              scale={groundR * 2.2}
              blur={2.5}
              far={40}
              resolution={512}
              frames={1}
            />
          </PlantMaterialsProvider>
        </Suspense>

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
