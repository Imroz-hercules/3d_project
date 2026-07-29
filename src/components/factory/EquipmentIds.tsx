import { Nameplate, WarningLabel } from '../machineParts/Nameplate';
import {
  REF,
  packingMachinePosition,
  palletizerPosition,
  warehouseStagingPosition,
  checkWeigherPosition,
  metalDetectorPosition,
  rollerMillPosition,
} from '../layoutConstants';

/**
 * Equipment ID plates on zone heroes that lack a built-in nameplate
 * (packing cell + warehouse), plus deck-level warnings. Machines with
 * manufacturer plates from the style-guide pass are not duplicated here.
 */
export function EquipmentIds() {
  const [pkx, , pkz] = packingMachinePosition();
  const [plx, , plz] = palletizerPosition();
  const [whx, , whz] = warehouseStagingPosition();
  const [cwx, , cwz] = checkWeigherPosition();
  const [mdx, , mdz] = metalDetectorPosition();
  const [rmx, , rmz] = rollerMillPosition();
  const millDeckY = REF.zones.milling.millDeckY;

  return (
    <group>
      <Nameplate
        position={[pkx, REF.packingMachine.height + 0.6, pkz + REF.packingMachine.depth / 2 + 0.02]}
        width={0.6}
        height={0.2}
        title="PACK-01"
        subtitle="FLOUR PACKING STATION"
      />
      <Nameplate
        position={[cwx, 1.7, cwz + REF.checkWeigher.width / 2 + 0.02]}
        width={0.5}
        height={0.18}
        title="CW-01"
        subtitle="CHECK WEIGHER"
      />
      <Nameplate
        position={[mdx, REF.metalDetector.height + REF.metalDetector.tunnelHeight + 0.35, mdz + 0.45]}
        width={0.5}
        height={0.18}
        title="MD-01"
        subtitle="METAL DETECTOR"
      />
      <Nameplate
        position={[plx, 3.4, plz + REF.palletizer.cellSize / 2 + 0.05]}
        width={0.7}
        height={0.24}
        title="PAL-01"
        subtitle="ROBOTIC PALLETIZER"
      />
      <Nameplate
        position={[whx + REF.warehouse.bayCount * REF.warehouse.baySpacingX * 0.5, REF.warehouse.rackHeight + 0.5, whz + 2.0]}
        width={0.9}
        height={0.3}
        title="WH-01"
        subtitle="FINISHED GOODS STAGING"
      />

      {/* Mill deck edge warning */}
      <WarningLabel
        position={[rmx - REF.rollerMill.width / 2 - 0.4, millDeckY + 1.1, rmz + 2.55]}
        title="MOVING MACHINERY"
        subtitle="KEEP CLEAR OF ROLLS"
      />
    </group>
  );
}
