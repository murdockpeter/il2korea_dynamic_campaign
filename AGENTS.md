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

