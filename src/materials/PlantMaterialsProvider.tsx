import { createContext, useContext, useLayoutEffect, useMemo, type ReactNode } from "react";
import { useTexture } from "@react-three/drei";
import { createPlantMaterials, type LoadedTextureGroups } from "./createPlantMaterials";
import { hydrateBridge } from "./bridge";
import { TEX } from "./paths";
import type { PlantMaterials } from "./types";

const Ctx = createContext<PlantMaterials | null>(null);

export function usePlantMaterials(): PlantMaterials {
  const v = useContext(Ctx);
  if (!v) throw new Error("usePlantMaterials requires PlantMaterialsProvider");
  return v;
}

/** Flat materials — no network texture loads (Sprint 1 / fallback). */
function FlatMaterialsInner({ children }: { children: ReactNode }) {
  const materials = useMemo(() => createPlantMaterials({}), []);
  useLayoutEffect(() => {
    hydrateBridge(materials);
  }, [materials]);
  return <Ctx.Provider value={materials}>{children}</Ctx.Provider>;
}

/** PBR materials — textures must exist under public/textures/materials/. */
function TexturedMaterialsInner({ children }: { children: ReactNode }) {
  const concrete = useTexture({ ...TEX.concrete });
  const stainless = useTexture({ ...TEX.stainless });
  const paintedSteel = useTexture({ ...TEX.paintedSteel });
  const galvanized = useTexture({ ...TEX.galvanized });
  const rubber = useTexture({ ...TEX.rubber });

  const groups = useMemo<LoadedTextureGroups>(
    () => ({ concrete, stainless, paintedSteel, galvanized, rubber }),
    [concrete, stainless, paintedSteel, galvanized, rubber]
  );

  const materials = useMemo(() => createPlantMaterials(groups), [groups]);

  useLayoutEffect(() => {
    hydrateBridge(materials);
  }, [materials]);

  return <Ctx.Provider value={materials}>{children}</Ctx.Provider>;
}

type Props = {
  children: ReactNode;
  /** When true, load PBR maps (Sprint 2+). When false, flat placeholders. */
  enableTextures?: boolean;
};

/**
 * Never call useTexture conditionally — split into two inner components.
 */
export function PlantMaterialsProvider({ children, enableTextures = true }: Props) {
  if (enableTextures) {
    return <TexturedMaterialsInner>{children}</TexturedMaterialsInner>;
  }
  return <FlatMaterialsInner>{children}</FlatMaterialsInner>;
}
