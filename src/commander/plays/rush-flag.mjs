// Rush-flag play: the squad's advance target is the enemy flag. That's it.
// This is the v0 play — intentionally crude. Future plays (river-control,
// defend-flag) will live alongside this one.

export function assignRushFlag(squad, snapshot) {
  squad.advanceTarget = snapshot.enemyFlag || squad.advanceTarget;
}
