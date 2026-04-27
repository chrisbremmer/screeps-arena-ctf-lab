// Defend-flag play: park the squad on or adjacent to one of our flags.
// v0 always defends the first flag we own (which is the home flag at match start).

export function assignDefendFlag(squad, snapshot) {
  const flag = snapshot.myFlags[0];
  if (!flag) {
    squad.advanceTarget = null;
    return;
  }
  squad.advanceTarget = flag;
  squad.objective = { kind: "defend-flag", flag };
}
