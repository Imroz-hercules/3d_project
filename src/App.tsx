import { Canvas } from "@react-three/fiber";
import { Sky, Stats, Environment, ContactShadows } from "@react-three/drei";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";

import MaterialHandlingLine from "./components/MaterialHandlingLine";
import { BuildingEnvelope } from "./components/factory/BuildingEnvelope";
import { IndustrialFloor } from "./components/factory/IndustrialFloor";
import { plantCenter, plantGroundRadius } from "./components/layoutConstants";
import { PlantMaterialsProvider } from "./materials";
import { HDRI_FACTORY } from "./materials/paths";
import { TwinHud } from "./twin/TwinHud";
import { CameraRig } from "./navigation/CameraRig";
import { NavFocusController } from "./navigation/NavFocusController";
import { ZonePresetBar } from "./navigation/ZonePresetBar";
import { MachineSearch } from "./navigation/MachineSearch";
import { NavHistoryButtons } from "./navigation/NavHistoryButtons";
import { NavBreadcrumb } from "./navigation/NavBreadcrumb";
import { Minimap } from "./navigation/Minimap";
import { toggleDebugOrbit } from "./navigation/navStore";
import { useDebugOrbit } from "./navigation/useNavState";
import {
  ThemeRoot,
  ThemeToggle,
  ThemeSceneBridge,
  useTheme,
  type SceneFrameValues,
} from "./theme";

function App() {
  const [cx, , cz] = plantCenter();
  const groundR = plantGroundRadius();
  const [showBuilding, setShowBuilding] = useState(true);
  const [cutaway, setCutaway] = useState(true);
  const debugOrbit = useDebugOrbit();
  const { tokens } = useTheme();
  const [envIntensity, setEnvIntensity] = useState(tokens.scene.environment.environmentIntensity);
  const [shadowOpacity, setShadowOpacity] = useState(tokens.scene.rendering.contactShadowOpacity);
  const lastSceneUi = useRef({ env: envIntensity, shadow: shadowOpacity });

  useEffect(() => {
    // Ensure React-side env/shadow targets track theme even if bridge remounts
    lastSceneUi.current = {
      env: tokens.scene.environment.environmentIntensity,
      shadow: tokens.scene.rendering.contactShadowOpacity,
    };
  }, [tokens.name]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSceneFrameValues = useCallback((v: SceneFrameValues) => {
    const prev = lastSceneUi.current;
    const envChanged = Math.abs(prev.env - v.environmentIntensity) > 0.02;
    const shadowChanged = Math.abs(prev.shadow - v.contactShadowOpacity) > 0.02;
    if (!envChanged && !shadowChanged) return;
    lastSceneUi.current = { env: v.environmentIntensity, shadow: v.contactShadowOpacity };
    if (envChanged) setEnvIntensity(v.environmentIntensity);
    if (shadowChanged) setShadowOpacity(v.contactShadowOpacity);
  }, []);

  return (
    <ThemeRoot>
      <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
        <div className="stwin-toolbar">
          <ThemeToggle />
          <button
            type="button"
            className="stwin-btn"
            onClick={() => setShowBuilding((v) => !v)}
          >
            {showBuilding ? "Hide building" : "Show building"}
          </button>
          {showBuilding && (
            <button
              type="button"
              className="stwin-btn"
              onClick={() => setCutaway((v) => !v)}
            >
              {cutaway ? "Full walls" : "Cutaway"}
            </button>
          )}
          <button type="button" className="stwin-btn" onClick={() => toggleDebugOrbit()}>
            {debugOrbit ? "Controls: Orbit" : "Controls: Camera"}
          </button>
          <NavHistoryButtons />
          <MachineSearch />
        </div>

        <NavBreadcrumb />
        <TwinHud />
        <ZonePresetBar />
        <Minimap />

        <Canvas
          shadows={false}
          dpr={[1, 1.5]}
          gl={{
            antialias: true,
            powerPreference: "high-performance",
            toneMappingExposure: tokens.scene.rendering.exposure,
          }}
          camera={{
            position: [groundR * 0.55, groundR * 0.7, groundR * 0.65],
            fov: 48,
            near: 0.5,
            far: 500,
          }}
          onCreated={({ gl }) => {
            gl.setClearColor(tokens.scene.environment.clearColor);
          }}
        >
          {import.meta.env.DEV && <Stats />}
          <ThemeSceneBridge
            scene={tokens.scene}
            motion={tokens.motion}
            onFrameValues={onSceneFrameValues}
          />
          <Sky sunPosition={[100, 40, 100]} turbidity={3} rayleigh={0.6} mieCoefficient={0.003} />

          <Suspense fallback={null}>
            <Environment files={HDRI_FACTORY} environmentIntensity={envIntensity} background={false} />
            <PlantMaterialsProvider enableTextures>
              <IndustrialFloor radius={groundR} />
              <group position={[-cx, 0, -cz]}>
                <MaterialHandlingLine />
                {showBuilding && <BuildingEnvelope cutaway={cutaway} showLights={false} />}
              </group>
              <ContactShadows
                key={tokens.name}
                position={[0, 0.01, 0]}
                opacity={shadowOpacity}
                scale={groundR * 2.2}
                blur={2.5}
                far={40}
                resolution={512}
                frames={1}
              />
            </PlantMaterialsProvider>
          </Suspense>

          <NavFocusController />
          <CameraRig maxDistance={groundR * 2.5} />
        </Canvas>
      </div>
    </ThemeRoot>
  );
}

export default App;
