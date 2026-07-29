import { Canvas } from "@react-three/fiber";
import { Sky, Stats, Environment, ContactShadows } from "@react-three/drei";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";

import MaterialHandlingLine from "./components/MaterialHandlingLine";
import { BuildingEnvelope } from "./components/factory/BuildingEnvelope";
import { IndustrialFloor } from "./components/factory/IndustrialFloor";
import { plantCenter, plantGroundRadius } from "./components/layoutConstants";
import { PlantMaterialsProvider } from "./materials";
import { HDRI_FACTORY } from "./materials/paths";
import { CameraRig } from "./navigation/CameraRig";
import { NavFocusController } from "./navigation/NavFocusController";
import { PostFX, usePostFxEnabled } from "./perf/PostFX";
import { MeasureTool } from "./tools/MeasureTool";
import { XRayMode } from "./tools/XRayMode";
import { OperatorShell } from "./shell";
import { useVisibilityLayers } from "./shell/services/visibility";
import {
  ThemeRoot,
  ThemeSceneBridge,
  useTheme,
  type SceneFrameValues,
} from "./theme";

function App() {
  const [cx, , cz] = plantCenter();
  const groundR = plantGroundRadius();
  const vis = useVisibilityLayers();
  const { tokens } = useTheme();
  const postFx = usePostFxEnabled();
  const [envIntensity, setEnvIntensity] = useState(tokens.scene.environment.environmentIntensity);
  const [shadowOpacity, setShadowOpacity] = useState(tokens.scene.rendering.contactShadowOpacity);
  const lastSceneUi = useRef({ env: envIntensity, shadow: shadowOpacity });

  useEffect(() => {
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
        <OperatorShell />

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

          {/* Subtle depth haze: distant zones fade, foreground stays crisp */}
          <fog attach="fog" args={[tokens.scene.environment.clearColor, groundR * 1.4, groundR * 4.2]} />

          <Suspense fallback={null}>
            <Environment files={HDRI_FACTORY} environmentIntensity={envIntensity} background={false} />
            <PlantMaterialsProvider enableTextures>
              <IndustrialFloor radius={groundR} />
              <group position={[-cx, 0, -cz]}>
                <MaterialHandlingLine />
                <XRayMode />
                {vis.building && (
                  <BuildingEnvelope cutaway={vis.cutaway} showLights={false} />
                )}
              </group>
              <MeasureTool />
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

          {postFx && <PostFX />}

          <NavFocusController />
          <CameraRig maxDistance={groundR * 2.5} />
        </Canvas>
      </div>
    </ThemeRoot>
  );
}

export default App;
