// Per-match CostMatrix. Built once on first access, cached for the rest of
// the match. The default findPath uses terrain only — it does not see
// StructureRoad tiles as cheaper. We override road tiles to cost 1 (vs the
// default plain cost 2) so paths prefer roads when available.
//
// Walls and swamps are left at 0 in the matrix, which means the pathfinder
// falls back to terrain costs (plainCost / swampCost in PATH_OPTS).

import { prototypes, utils } from "game";
import { CostMatrix } from "game/path-finder";

let _cached = null;
let _attempted = false;

export function getCostMatrix() {
  if (_attempted) return _cached;
  _attempted = true;
  try {
    if (!CostMatrix) return null;
    const cm = new CostMatrix();
    if (prototypes?.StructureRoad && utils?.getObjectsByPrototype) {
      const roads = utils.getObjectsByPrototype(prototypes.StructureRoad) || [];
      for (const r of roads) cm.set(r.x, r.y, 1);
    }
    _cached = cm;
    return cm;
  } catch {
    return null;
  }
}

export function _resetCostMatrixCache() {
  _cached = null;
  _attempted = false;
}
