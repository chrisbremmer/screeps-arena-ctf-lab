// Defend-flag play: a creep parks within range 1 of our flag and defends it.

export function assignDefendFlag(squad, snapshot) {
  squad.advanceTarget = snapshot.myFlag || squad.advanceTarget;
}
