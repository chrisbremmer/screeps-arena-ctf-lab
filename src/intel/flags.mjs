// Flag identification helpers. Pure — given a snapshot, return flag references.
//
// "Home" flag = the one we've owned since tick 1. It's adjacent to our home
// tower, which never moves. We identify home by Chebyshev distance to the
// home tower, which is robust because no captured flag could ever land near
// our home tower (the map's other flags are 80+ tiles away).

export function findHomeFlag(snapshot) {
  const tower = snapshot.myTowers?.[0];
  if (!tower || !snapshot.myFlags?.length) return null;
  return [...snapshot.myFlags].sort((a, b) => cheb(a, tower) - cheb(b, tower))[0];
}

// The "captured" flag = a flag we own that is not home. With our current
// strategy this is the close neutral. Returns null if we don't yet own a
// non-home flag.
export function findCapturedFlag(snapshot) {
  if (!snapshot.myFlags || snapshot.myFlags.length < 2) return null;
  const tower = snapshot.myTowers?.[0];
  if (!tower) return null;
  // Farthest of our flags from the home tower.
  return [...snapshot.myFlags].sort((a, b) => cheb(b, tower) - cheb(a, tower))[0];
}

function cheb(a, b) {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}
