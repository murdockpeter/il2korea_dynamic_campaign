# IL-2 Korea Dynamic Campaign Framework

A bring-your-own-LLM framework for creating and tracking persistent,
human-directed campaigns in **IL-2 Korea**.

This repository is not primarily a packaged campaign application. It is a
mission-authoring workspace that gives a capable coding LLM the references,
examples, campaign context, validation rules, and local builders needed to
collaborate with a player over a continuing war.

You bring the LLM or coding agent. The repository does not require or bundle a
particular model provider, API, subscription, or hosted service.

## The central idea

The persistent war situation and the playable sortie are separate layers.

The war situation tracks what exists before a mission is assigned:

- campaign date, time, phase, weather, and intelligence confidence;
- estimated and actual front-line conditions by sector;
- airbases, air units, pilots, aircraft, and serviceability;
- operational ground formations rather than every individual soldier;
- bridges, railways, airfields, supply routes, and persistent damage;
- confirmed, reported, suspected, and aging contacts;
- consequences of earlier sorties.

A mission is an overlay created in response to that situation. It selects the
relevant forces, task area, player package, route, threats, uncertainty, and
success logic without manufacturing an unrelated war around a desired target.

After the player flies the mission, the debrief changes the persistent state.
Time continues to pass whether the sortie succeeds or fails.

## Bring-your-own-LLM workflow

Use the repository with a coding LLM or agent that can read and modify local
files and run the project tools. Codex, Claude, and comparable tools can all be
used; none is required by the framework.

A normal campaign turn is:

1. Review the current campaign situation and unresolved contacts.
2. Report the preceding sortie result, including unknown or uncertain facts.
3. Let the LLM advance time, ground movement, intelligence, squadron state,
   and the front where justified.
4. Have headquarters assign a mission because of the resulting war state.
5. Generate and validate the IL-2 mission and localization files.
6. Install single-player and/or COOP packages into the game directories.
7. Fly the sortie and return with a human debrief.
8. Record the outcome and begin the next turn.

The player remains the campaign director and final authority. The LLM helps
reason about the evolving situation, authors mission files, maintains records,
and learns from editor and in-game test results.

## Current example campaign

The active working example is the fictional:

```text
81st Fighter-Bomber Squadron, "Black Scorpions"
Attached to the 8th Fighter-Bomber Group
Aircraft: F-80C Shooting Star
Initial base: Itazuke Air Base, Japan
Opening period: July 1950
```

The fictional identity permits persistent pilot losses, replacement aircraft,
marking changes, transfers, and alternate deployment timing without claiming
to reproduce the exact daily history of a real squadron.

Current authored sorties include:

- **Black Scorpions 001 - Suwon Road Interdiction**: an initial four-ship
  ground-attack validation sortie.
- **Black Scorpions 002 - Osan Road Hunt**: armed reconnaissance caused by the
  first sortie's failure to delay the column, with moving ground forces,
  dedicated top cover, and a possible Yak-9 interception.

The campaign skeleton and operating concept are maintained in the
[campaign design document](https://docs.google.com/document/d/1XAE0tv5kd3I2kY3hjLNFcWVIlDITr30Hpou71J4KvRA/edit?usp=sharing).

### Current situation dossier

The canonical machine-readable situation is
[`campaign/current-situation.json`](campaign/current-situation.json). It records
the current front estimate, sector pressure, squadron state, contacts, air
forces, sortie results, and ground formations. Historical anchor points and
campaign-reconstructed conditions are labeled separately so uncertain detail
does not become accidental fact.

Build the standalone, printable HTML intelligence dossier with:

```powershell
npm run report:situation
```

The output is `reports/current-situation.html`. It embeds its styling and
interactive filters and loads Google Maps for the geographic base beneath the
campaign front, advance axes, mission route, and unit overlays. Regiments are
expanded into individually tracked battalion equivalents in the report; their
0–100 condition values are campaign-resolution indices rather than literal
personnel counts.

The map builder reads its credential from `GOOGLE_MAPS_API_KEY`; the key is
never stored in source files. In PowerShell, set it for only the current shell,
build the report, then remove it:

```powershell
$env:GOOGLE_MAPS_API_KEY = '<your Google Maps key>'
npm run report:situation
Remove-Item Env:\GOOGLE_MAPS_API_KEY
npm run report:serve
```

The environment variable is required for the first local map build. Afterward,
the builders can reuse the credential already embedded in any existing
Git-ignored report. This prevents a routine no-environment rebuild from
silently overwriting a working map with the no-key fallback. If all generated
reports are deleted, set the environment variable once again for the next
build.

Open `http://localhost:4173/` while the local server is running. Serving over
localhost is more reliable than a `file:` URL for Google Maps website
restrictions. The generated HTML is ignored by Git because a browser-side Maps
key is necessarily present in the built file and its network requests. Restrict
the key in Google Cloud to the **Maps JavaScript API** and, when supported by
the key type, the local website origin used for this report. Do not publish or
email a key-bearing generated report.

### Historical front-line atlas

The separate historical atlas follows the mobile front from the invasion on
25 June through the UN crossing of the 38th Parallel on 7 October 1950. Its
Google terrain map has a playable date slider, broad front-line
reconstructions, initiative shading, dated viability states for Itazuke and
the principal early Korean K-bases, and 98 campaign-tracked battalion
equivalents derived from the 4 July situation ledger.

Battalion symbols use a blue UN/ROK or red DPRK outer ring. Their inner core
shows campaign-estimated combat effectiveness: green for effective, amber for
degraded, orange for fragile, and red for critical. Side toggles can declutter
the map. Positions have deterministic formation and battalion offsets around
dated sector anchors; this provides realistic dispersion while ensuring the
same unit does not jump randomly whenever the page is loaded.

The historical source data is
[`campaign/historical-frontline.json`](campaign/historical-frontline.json).
Build the ignored, key-bearing HTML alongside the current-situation report:

```powershell
$env:GOOGLE_MAPS_API_KEY = '<your Google Maps key>'
npm run report:history
Remove-Item Env:\GOOGLE_MAPS_API_KEY
npm run report:serve
```

Open `http://localhost:4173/history`. The displayed lines are deliberately
operational-scale estimates: the opening campaign frequently consisted of
road-bound columns, local delaying positions, bypassed units, and gaps rather
than one continuous front. Battalion positions before and after the campaign's
4 July baseline are reconstructions, not claimed historical coordinates or an
exhaustive theater order of battle.

### Black Scorpions campaign tracker

The live campaign operations board is generated directly from
[`campaign/current-situation.json`](campaign/current-situation.json). It uses
the historical atlas presentation for the evolving fictional campaign and
shows:

- the current estimated front and DPRK-controlled-area shading;
- all campaign-tracked battalions with allegiance rings and effectiveness
  cores;
- deterministic formation dispersion and intelligence-confidence opacity;
- last-known contact diamonds, current K-base status, and the active sortie
  route and search area;
- focus controls for the full front, each operational sector, and the Black
  Scorpions' home station;
- squadron readiness, current mission, sector pressure, force balance, contacts,
  and sortie history.

Build it with the same temporary Maps environment variable:

```powershell
$env:GOOGLE_MAPS_API_KEY = '<your Google Maps key>'
npm run report:campaign
Remove-Item Env:\GOOGLE_MAPS_API_KEY
npm run report:serve
```

Open `http://localhost:4173/campaign`. After each adjudicated sortie, update
the canonical state and rebuild both `report:situation` and `report:campaign`.

## Mission quality standard

Every delivered campaign mission should include:

- a complete, situation-specific operational briefing;
- the consequence that caused headquarters to assign the sortie;
- a clear task, success condition, execution plan, threats, ROE, weather, and
  recovery instructions;
- localized map markings for the start, important route points, action area,
  egress, and recovery or map exit unless deliberately withheld;
- honest intelligence uncertainty rather than omniscient target disclosure;
- single-player and COOP packaging when both are requested;
- Korea-compatible UTF-16LE localization files;
- structural and reference validation before in-game testing.

Consistent quality does not mean identical missions. Routes, force mixes,
target certainty, timing, weather, opposition, support, objectives, and
campaign consequences should follow the operational situation rather than a
fixed template.

See the [mission authoring guidelines](docs/mission-authoring-guidelines.md)
and [scenario learning library](scenario-samplings/README.md).

## Sources of truth

Mission work uses the following evidence hierarchy:

1. The included IL-2 Mission Editor manual and shipped Korea demo missions.
2. Observed IL-2 Korea editor and in-game behavior.
3. Player-authored scenario samples and play-test reports.
4. Extracted local object, airfield, and landscape catalogs.
5. Source-text inference, clearly marked as provisional.

The canonical editor reference is the included
[IL-2 Sturmovik Mission Editor and Multiplayer Server Manual](docs/IL-2%20Sturmovik%20Mission%20Editor%20and%20Multiplayer%20Server%20Manual.pdf).
The Great Battles manual remains substantially applicable to Korea, while the
shipped Korea missions and live tests identify version-specific differences.

For historical air-war context, the repository also includes the USAF
chronology [*The U.S. Air Force's First War: Korea, 1950-1953: Significant
Events*](docs/KoreanWarChronology.pdf). It supplies Korean-local dates, monthly
operational summaries, and daily significant events for judging plausible
theater tempo, basing, reinforcements, capabilities, and threats. It is not a
fixed event script: adjudicated mission results and
[`campaign/current-situation.json`](campaign/current-situation.json) control
the dynamic campaign's local front, force condition, intelligence, and next
sortie. Material departures from historical anchors should be identified as
campaign divergences rather than silently corrected.

## Repository layout

```text
catalog/                 Extracted IL-2 object, landscape, and airfield data
campaign/                Canonical persistent situation state
docs/                    Editor references and project authoring rules
generated/               Locally generated mission packages
reports/                 Generated standalone campaign intelligence dossier
scenario-samplings/      Manual samples, generated examples, and test findings
src/                     Shared generator and legacy UI code
tools/                   Catalog and scenario builders
AGENTS.md                 Persistent instructions for LLM-assisted mission work
```

Large source missions may remain in the local IL-2 installation rather than
being duplicated in Git. Their path, timestamp, and hash should be recorded in
the corresponding scenario analysis.

## Requirements

- IL-2 Korea installed locally.
- Node.js and npm for the current JavaScript builders and validation scripts.
- A coding LLM/agent capable of working with the repository, or a human willing
  to perform the same authoring steps manually.
- The IL-2 Mission Editor for visual inspection and corrective editing.

The current builders assume the default installation location:

```text
C:\Program Files\IL2Series\game
```

Builders that expose path arguments can be directed to another installation.

## Current commands

Install JavaScript dependencies:

```powershell
npm install
```

Run the general regression check:

```powershell
npm test
```

Rebuild and install the current Black Scorpions sorties:

```powershell
npm run scenario:black-scorpions-001
npm run scenario:black-scorpions-002
```

Rebuild the current campaign situation dossier:

```powershell
npm run report:situation
```

Rebuild the historical front-line atlas:

```powershell
npm run report:history
```

Rebuild the live Black Scorpions campaign tracker:

```powershell
npm run report:campaign
```

Serve the dossier locally after building it:

```powershell
npm run report:serve
```

Rebuild derived airfield-start findings:

```powershell
npm run airfields
```

## Mission output

Project copies are written under:

```text
generated/
```

Handcrafted campaign builders currently install single-player missions under:

```text
C:\Program Files\IL2Series\game\data\Missions
```

Preferred COOP packages are written under:

```text
C:\Program Files\IL2Series\game\data\Multiplayer\Cooperative\<MissionName>\
```

Compatibility copies and `.sds` server definitions may also be written under
`data\Multiplayer` and `data\Multiplayer\COOP`. COOP builders register mission
paths in the current profile's local cooperative-server rotation.

## Human debriefs and campaign state

The framework deliberately keeps a human in the loop. After a sortie, report
what is actually known:

```text
Pilots returned:
Aircraft returned:
Aircraft damaged:
Confirmed air victories:
Confirmed ground kills:
Mission objective:
Contacts seen or not found:
Notable observations:
```

Unknown information should remain unknown. A pilot surviving does not prove an
aircraft is serviceable, and failing to find a column does not prove the column
was absent. This distinction drives later reconnaissance, contact confidence,
ground movement, and mission assignments.

## Legacy Electron prototype

The repository still contains the earlier Electron scenario-generator UI and
its template-patching code. It can currently be launched with:

```powershell
npm start
```

That UI is retained as experimental and reference tooling. It is not the
primary project direction and should not be understood as a polished,
fully-supported end-user application. Current campaign development is centered
on the BYO-LLM workspace, persistent situation reasoning, handcrafted or
LLM-authored mission builders, player debriefs, and iterative in-game testing.

## Current limitations

- Campaign-state files and result ingestion are still evolving.
- Mission results are currently interpreted from human debriefs rather than an
  automatic game-log importer.
- Not every generated construction has completed in-game validation.
- Ground road paths and terrain placement still require editor and play checks.
- The framework does not make every LLM automatically knowledgeable about the
  IL-2 mission format; the included evidence and rules must be followed.
- IL-2 Korea is still changing, so parser, asset, and editor behavior may need
  version-specific accommodations.

This is intentionally a collaborative campaign laboratory: preserve what is
proven, record what fails, update the guidance, and let the evolving war state
create the next mission.
