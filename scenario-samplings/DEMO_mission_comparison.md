# Korea DEMO Mission Comparison

## Purpose

This comparison reads the two shipped IL-2 Korea demo missions alongside the
canonical Mission Editor manual and Peter's first manual sample. The demos are
authoritative examples of structures serialized by the Korea editor and used
by shipped Korea content. They demonstrate working vocabulary, not mandatory
scenario templates.

## Sources

### `[DEMO]BlackThursday`

- Source: `C:\Program Files\IL2Series\game\data\Missions\[DEMO]BlackThursday.Mission`
- Size: 9,598,197 bytes
- SHA-256: `D772E094589083C65AF18D0DB38FDB3A3380A74A62C04410EB93D2881D44D0B7`
- Player: two-ship MiG-15bis flight, `Eagle Leader`
- Start: runway start at Antung
- Mission: intercept a large B-29 formation and its F-80 escorts

### `[DEMO]InchonStrike`

- Source: `C:\Program Files\IL2Series\game\data\Missions\[DEMO]InchonStrike.Mission`
- Size: 3,259,234 bytes
- SHA-256: `86FF2DF2282434DB55EB137DE488D7EC07898FF7D20BA2D3EEAC7CD4419DF188`
- Player: four-ship F-86A flight, `Eagle 1`
- Start: runway start at Seoul
- Mission: intercept bombers, attack aircraft, and escorts approaching Inchon

The hashes identify the exact sources analyzed. Game updates may replace these
files; recheck the hashes before treating a later copy as structurally
identical.

## Manual baseline

The manual's aircraft-routing procedure on manual pages 60-61 (PDF pages
70-71) requires:

1. formation members target-linked to the leader;
2. Take Off object-linked to the leader;
3. all route waypoints object-linked to the leader;
4. waypoints target-linked in travel order;
5. WP1 triggered only after takeoff;
6. Land object-linked to the leader;
7. the last waypoint target-linked to Land.

Both Korea demos preserve those essential link semantics while building much
more elaborate state transitions around them.

## Black Thursday player routing

The core player graph is:

```text
Mission Begin
  -> 5-second timer
       +-> Take Off --object-> Eagle leader
       +-> formation command --object-> Eagle leader

Take Off completion report
  -> initial waypoint --object-> Eagle leader

campaign combat logic
  -> combat/intercept commands and alternate waypoint branches

bomber-result counter
  -> return timer
  -> RTB waypoint --object-> Eagle leader
  -> landing waypoint --object-> Eagle leader
  -> Land --object-> Eagle leader
```

Important details:

- The wingman entity is target-linked to the player leader entity.
- Take Off and all four player waypoints are object-linked to the leader.
- Land is object-linked to the leader.
- Rather than firing WP1 simultaneously with Take Off, the leader entity has an
  `OnReport` entry tied to the Take Off command and the initial waypoint. This
  delays route execution until the takeoff command reports completion.
- Return and landing are a separate mission phase activated by result logic,
  not merely the unconditional continuation of the outbound route.
- The mission can reposition the player, select alternate continuations, issue
  attack-target or attack-area commands, and force-complete an earlier command.
- Player waypoint areas range from 500 to 5,000 meters. This shows that the
  manual's 200-meter example is guidance, not a universal constant.

The Black Thursday graph is especially useful for learning phase changes:
takeoff, intercept setup, combat, result evaluation, and recovery are separate
command states.

## Inchon Strike player routing

The core player graph is:

```text
Mission Begin
  -> initialization timers
  -> Take Off --object-> Eagle 1

player takeoff event
  -> TakeOff Waypoint --object-> Eagle 1
  -> Action Waypoint --object-> Eagle 1
       +-> player Attack Area
       +-> phase-control checks and messages

enemy-result logic
  -> Force Complete current task
  -> RTB Waypoint --object-> Eagle 1
  -> Land --object-> Eagle 1
```

Important details:

- Three wingman entities are target-linked to the player leader entity.
- Take Off, all three player route waypoints, and Land are object-linked to the
  leader.
- The player entity's serialized takeoff event points to a zero-second timer
  named `OnTookOff`, which starts the first waypoint and takeoff subtitle.
- Check Zones, deactivators, and short timers prevent obsolete route phases
  from remaining active.
- Entering the action phase activates an air-combat Attack Area command.
- Once the enemy-result logic fires, Force Complete clears the current task
  before RTB and Land are triggered.
- The AI reinforcement flight has its own object-linked Attack Area and Land
  commands rather than borrowing the player's command graph.

The mission contains eleven aircraft leaders. Each of the nine main hostile AI
flights has two object-linked waypoints and an object-linked Land command. This
repetition strongly corroborates the manual's all-waypoints-object-linked rule.

## Comparison matrix

| Construction | Editor manual | Black Thursday | Inchon Strike | F80 manual sample |
|---|---|---|---|---|
| Formation members target-link to leader | Required/example | Yes | Yes | Yes |
| Take Off object-links to leader | Required | Yes | Yes | Yes |
| First waypoint waits for takeoff | Required/example | Take Off report | Takeoff event | No; simultaneous |
| Every route waypoint object-links to leader | Required | Yes | Yes | No; WP1 only |
| Route order uses target links | Required | Yes | Yes | Yes |
| Land object-links to leader | Required | Yes | Yes | No |
| Final route phase triggers Land | Required | Yes | Yes | Target link only |
| Phase changes use explicit logic | Optional vocabulary | Extensive | Extensive | No |
| Attack behavior is explicitly commanded | As needed | Yes | Yes | No |

The demos confirm that the F80 sample's missing waypoint and Land object links
must not be generalized into generated AI routing.

## Reusable guidance

The following are safe baseline rules because the manual and shipped Korea
missions agree:

1. Link formation members to their leader, then issue flight commands to the
   leader entity.
2. Object-link every command that acts on the flight, including every active
   waypoint and Land.
3. Target-link waypoints and phase-control MCUs in execution order.
4. Begin WP1 from an actual takeoff event or Take Off completion report.
5. Use Force Complete before switching an aircraft from an active combat task
   to an incompatible RTB or recovery task.
6. Treat takeoff, ingress, action, egress, and recovery as distinct phases that
   may be activated or deactivated independently.
7. Give separate flights their own command ownership even when their timing and
   objectives are coordinated.

## How the demos support variety

The demos should expand the generator's grammar rather than make missions feel
alike. They demonstrate several interchangeable techniques:

- start WP1 from an aircraft event or a Take Off command report;
- use a direct route, a triggered route branch, or an activated RTB phase;
- allow combat to end through counters, elapsed time, proximity, or operational
  withdrawal conditions;
- use Attack Target for a known formation and Attack Area for a search/combat
  region;
- retain normal flight, reposition it, or force-complete it before retasking;
- make landing unconditional, result-driven, delayed, or diverted;
- coordinate independent flights with common timers while preserving separate
  command graphs;
- vary waypoint area, speed, altitude, formation, and priority according to the
  tactical situation.

Do not copy the full logic density of either demo into every sortie. A quiet
armed-reconnaissance mission may need only a reliable route and uncertain
contacts. A major interception may justify counters, branching, media cues,
repositioning, and multiple recovery paths. Complexity should follow the
operational situation.

## Current authority decision

For aircraft pathing, the manual and both shipped demos agree and therefore
define the default construction. A manual sample that differs is still useful
as an experiment or player-specific design, but the difference remains
provisional until its intended and observed in-game behavior is known.

