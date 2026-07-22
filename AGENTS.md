# IL-2 Korea Campaign Authoring Rules

These rules apply to every newly generated or revised campaign mission.

## Enhanced briefings are mandatory

Never ship placeholder or one-paragraph briefing text. Every mission briefing
must be written for its particular campaign situation and normally include:

1. date, local time, and current operational situation;
2. the consequence that caused headquarters to assign this sortie;
3. a clear player mission and measurable success condition;
4. execution plan, route sequence, action window, and recovery instructions;
5. player, escort, support, and other package elements;
6. known and possible air, ground, and antiaircraft threats;
7. rules of engagement and friendly-force cautions;
8. weather and visibility relevant to mission execution;
9. the campaign consequence of success, partial success, or failure.

Briefings must communicate uncertainty honestly. Do not reveal an uncertain
contact's exact position or composition merely because the mission source must
place it somewhere.

## Briefing-map requirements

Unless deliberately omitted for a specific operational reason, add localized,
coalition-appropriate map icons for:

- player start or departure location;
- important ingress, rendezvous, and navigation points;
- action/search/target area;
- egress point;
- recovery airfield or off-map exit.

Target-link sequential route icons when a route line helps the player. Use
Korea-verified icon serialization and IDs from the shipped demo missions.

## Localization requirements

- Write `.eng` mission localization as UTF-16LE with an `FF FE` byte-order
  mark, matching Korea's shipped mission files.
- Give every briefing icon and player-facing subtitle valid localized name and
  description entries.
- Validate localization indices and installed/generated file identity.

## Variation

The briefing structure is consistent, but its content must not become a
cookie-cutter template. Details, emphasis, uncertainty, package composition,
route presentation, and tactical warnings must follow the current war state
and the distinctive operational problem of that sortie.

## Terrain and ground-route grounding

Preserve the complete baked landscape, airfield, bridge, settlement, and other
baseline content inherited from the selected Korea mission source. Do not
confuse preservation of that baseline with validation of newly authored unit
placement.

Before describing a moving ground formation as road-following, validate its
start, spacing, and waypoint chain against the active seasonal landscape's
compiled highway network or by direct Mission Editor inspection. Prefer
multiple shorter control legs through real bends over a few long waypoints
that cut across terrain. Validate intended bridge crossings against serialized
baseline bridges and confirm the bridge is usable in the mission state.

Keep the player search/attack geometry synchronized with the verified ground
route. A moving target must remain plausibly acquirable during the assigned
action window. Record the terrain source and validation method in the scenario
learning note, and do not claim that a route follows a road until it has been
checked in the editor or against the installed landscape data. Final in-game
testing must still confirm vehicle pathfinding, spacing, bridge behavior, and
the absence of collisions or stoppages.

## Persistent situation reporting

Treat `campaign/current-situation.json` as the canonical campaign state. After
an adjudicated sortie, update its time, squadron condition, sortie record,
contacts, formation conditions, sector pressure, and front assessment wherever
the result or elapsed time justifies a change. Preserve uncertainty instead of
inventing exact observations.

Keep historical facts, player-reported outcomes, and campaign-reconstructed
estimates distinguishable in `basis`, `note`, and confidence fields. Battalion
values are operational-resolution indices, not claimed historical headcounts.
After changing the state, run both `npm run report:situation` and
`npm run report:campaign` so the printable condition dossier and interactive
campaign map remain synchronized.

Keep the `map` section of `campaign/current-situation.json` synchronized with
the adjudicated war state. Update the estimated front line, sector deployment
zones, active mission route/search area, and last-known contact coordinates
when intelligence or elapsed time justifies a change. Positional dispersion is
deterministic presentation logic; the stored anchors should express the best
campaign estimate without claiming false precision.

## Historical context and campaign divergence

Use `docs/KoreanWarChronology.pdf`, *The U.S. Air Force's First War: Korea,
1950-1953: Significant Events*, as the principal USAF chronology for the wider
air war. Consult it when advancing campaign time or judging plausible theater
tempo, basing, reinforcements, aircraft and weapon employment, support activity,
enemy air activity, and the relationship between air operations and the land
battle. Its dates are Korean local dates.

The chronology is context, not a script for the dynamic campaign. Treat
theater-level events beyond the player's influence as historical anchors unless
the accumulated campaign state supplies a credible reason for divergence.
Treat the local front, unit condition and position, intelligence picture,
sortie results, losses, and follow-on tasking as campaign variables governed by
`campaign/current-situation.json`. Never silently force those variables back
onto their historical outcome.

When the campaign materially departs from a historical anchor, record the
departure and its cause in the relevant `basis`, `note`, confidence, or sortie
fields. Preserve three distinct categories in reports and reasoning:

- documented historical fact;
- player-observed or reported campaign fact;
- campaign reconstruction or estimate.

The mission editor manual and verified demo missions remain authoritative for
mission-file construction. The chronology informs historical plausibility; the
canonical campaign state controls the world the next mission must inherit.
