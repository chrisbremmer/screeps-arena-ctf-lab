// harvest-river play: send the harvester squad toward the highest-priority
// body part on the river, picked per-creep.
//
// Ranger micro handles combat-while-walking (kite if too close, shoot
// in-range enemies). Healer micro handles healing. We just steer the squad's
// advance target toward body parts.
//
// We use a per-creep "preferred target" approach: each member picks its own
// nearest high-priority part. The squad's advance target is the centroid of
// those individual targets — coarse but enough for cohesion-aware movement.

import { pickHarvestTarget } from "../../intel/harvest.mjs";

export function assignHarvestRiver(squad, snapshot) {
  if (!squad.members || squad.members.length === 0) {
    squad.advanceTarget = null;
    return;
  }

  const parts = snapshot.bodyParts ?? [];
  if (parts.length === 0) {
    // No parts to harvest — keep squad near captured neutral as fallback.
    squad.advanceTarget = squad.members[0];
    squad.objective = { kind: "harvest-idle" };
    return;
  }

  // For squad-level navigation, target the part nearest the squad's centroid
  // (or the first member if no centroid yet). Individual members will diverge
  // toward their own preferred parts via their micro fall-through, which
  // already walks toward squad.advanceTarget by default.
  const anchor = squad.centroid ?? squad.members[0];
  const target = pickHarvestTarget(anchor, parts);
  squad.advanceTarget = target;
  squad.objective = { kind: "harvest-river", part: target?.type ?? null };
}
