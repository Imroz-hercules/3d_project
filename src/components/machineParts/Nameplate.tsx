import { Text } from "@react-three/drei";

type V3 = [number, number, number];

export function Nameplate({
  position,
  rotation = [0, 0, 0],
  width = 0.35,
  height = 0.14,
  title,
  subtitle,
  bg = "#f0ead8",
  fg = "#1a1a1a",
}: {
  position: V3;
  rotation?: V3;
  width?: number;
  height?: number;
  title: string;
  subtitle?: string;
  bg?: string;
  fg?: string;
}) {
  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color={bg} roughness={0.7} metalness={0.05} />
      </mesh>
      <Text
        position={[0, subtitle ? 0.02 : 0, 0.001]}
        fontSize={0.035}
        color={fg}
        anchorX="center"
        anchorY="middle"
        maxWidth={width * 0.9}
      >
        {title}
      </Text>
      {subtitle && (
        <Text
          position={[0, -0.035, 0.001]}
          fontSize={0.022}
          color={fg}
          anchorX="center"
          anchorY="middle"
          maxWidth={width * 0.9}
        >
          {subtitle}
        </Text>
      )}
    </group>
  );
}

/** Safety / warning plate (yellow field). */
export function WarningLabel({
  position,
  rotation = [0, 0, 0],
  title = "WARNING",
  subtitle = "AUTHORIZED PERSONNEL",
}: {
  position: V3;
  rotation?: V3;
  title?: string;
  subtitle?: string;
}) {
  return (
    <Nameplate
      position={position}
      rotation={rotation}
      width={0.42}
      height={0.18}
      title={title}
      subtitle={subtitle}
      bg="#e0a92c"
      fg="#1a1a1a"
    />
  );
}
