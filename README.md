# IL-2 Korea Dynamic Campaign

Electron-based scenario generator for **IL-2 Korea**.

Current scope:
- generate a single playable mission from a small UI
- export single-player missions directly into the game install
- export COOP-ready missions into the multiplayer cooperative layout that Korea accepts

The generator currently works by **cloning a stock mission template** and then patching the parts we control:
- player aircraft
- support aircraft
- target/briefing profile
- weather
- time of day
- starting airfield
- light apron ambiance near the start
- COOP packaging and registration

## Running

```bash
npm install
npm start
```

Minimal verification:

```bash
npm test
```

## What The UI Fields Do

This section describes the fields as they work **right now**, not as planned future behavior.

### `Player Aircraft`

What it does:
- selects the player-flyable aircraft type used for the player flight in the generated mission
- determines the player's coalition
- determines the default enemy coalition
- limits the available starting airfields
- influences which friendly support aircraft may be generated
- influences the airfield ambiance mix near the spawn

Current flyable aircraft list:
- `f51d`
- `f80c10`
- `f84e`
- `f86a5`
- `il10`
- `la11`
- `mig15bis`
- `yak9p`

Coalition mapping:
- `f51d`, `f80c10`, `f84e`, `f86a5` -> `UN/US-aligned`
- `il10`, `la11`, `mig15bis`, `yak9p` -> `DPRK/PRC/Soviet-aligned`

What it does not do:
- it does not build a mission graph from scratch
- it does not yet change payload presets intelligently by aircraft role

### `Target Type`

What it does:
- filters the internal catalog to one target category
- selects the briefing text profile
- determines the mission role bucket used for support logic

Current target types:
- `Airfield Strike`
- `Bridge Strike`
- `Ground Attack`
- `Harbor Strike`
- `Industrial Strike`
- `Rail Interdiction`
- `Troop Area Strike`

Target selection behavior:
- the generator filters the catalog to valid objects matching this type
- it then chooses up to 3 targets from that filtered pool using a deterministic seed
- briefing text and map text are updated to match the selected mission type

Mission role mapping:
- any type containing `Strike` or `Attack` is treated as an `attack` role for support generation

What it does not do:
- it does not yet place a brand-new target complex into the mission world
- it does not yet move the objective geographically to the chosen catalog target; the mission still uses a stock template mission area and briefing profile

### `Landscape`

What it does:
- selects the map template metadata used for mission options
- patches these mission settings:
  - `HMap`
  - `Textures`
  - `Forests`
  - `GuiMap`
  - `SeasonPrefix`
  - `Date`
  - `Temperature`

What it does not do:
- it does not currently relocate the stock mission graph to a new theater region based on terrain choice alone

### `Enemy Faction`

What it does in the UI:
- currently auto-locks to the **opposite coalition of the selected player aircraft**

Current behavior:
- if the selected aircraft is `UN/US-aligned`, enemy is forced to `DPRK/PRC/Soviet-aligned`
- if the selected aircraft is `DPRK/PRC/Soviet-aligned`, enemy is forced to `UN/US-aligned`

What it affects:
- target filtering against catalog faction guesses
- briefing text

What it does not do:
- it does not currently let the player force a same-side or arbitrary enemy selection from the UI

### `Weather`

What it does:
- patches mission weather options directly

Current presets:

`Clear`
- `CloudLevel = 1300`
- `CloudHeight = 6000`
- `PrecLevel = 0`
- `PrecType = 0`
- `CloudConfig = summer\00_Clear_00\sky.ini`
- `Haze = 0`
- `LayerFog = 0`

`Broken Cloud`
- `CloudLevel = 1500`
- `CloudHeight = 2800`
- `PrecLevel = 2`
- `PrecType = 1`
- `CloudConfig = summer\02_Medium_06\sky.ini`
- `Haze = 0.08`
- `LayerFog = 0`

`Overcast`
- `CloudLevel = 1400`
- `CloudHeight = 1800`
- `PrecLevel = 5`
- `PrecType = 1`
- `CloudConfig = summer\03_Heavy_08\sky.ini`
- `Haze = 0.12`
- `LayerFog = 0`

`Poor Visibility`
- `CloudLevel = 1100`
- `CloudHeight = 1500`
- `PrecLevel = 4`
- `PrecType = 1`
- `CloudConfig = summer\02_Medium_09\sky.ini`
- `Haze = 0.32`
- `LayerFog = 1`

What it does not do:
- it does not currently change AI behavior or mission routing based on weather

### `Start Time`

What it does:
- patches the mission `Time` option directly
- updates briefing text with takeoff time

Current choices:
- `Dawn 05:30`
- `Morning 08:00`
- `Noon 12:00`
- `Afternoon 15:00`
- `Dusk 18:30`

Default:
- `Morning 08:00`

What it does not do:
- it does not currently rebuild mission lighting logic beyond the mission time value itself

### `Starting Airfield`

What it does:
- picks the departure field for the player flight
- moves the player start package from the template airfield to the selected one
- moves the local apron ambiance package with it
- updates briefing text

Current choices by coalition:

All aircraft:
- `Auto`

`UN/US-aligned` aircraft:
- `Seoul (K-16)`
- `Kimpo (K-14)`
- `Yangsu-ri (K-49)`
- `Suwon (K-13)`

`DPRK/PRC/Soviet-aligned` aircraft:
- `Antung`

Default behavior:
- `Auto` resolves to the stock template field
- blue-side template default is `Seoul (K-16)`
- red-side template default is `Antung`

What it does not do:
- it does not yet validate runway suitability or front-line historical date per aircraft
- red-side currently only has a curated `Antung` option

### `COOP-friendly player flight`

What it does:
- enables COOP export mode
- converts the generated multiplayer mission copy to `MissionType = 1`
- marks the player flight for multiplayer coop use
- writes multiplayer package files into the game install
- registers the mission path into Korea's local cooperative server setup

Current export behavior when checked:
- still writes the normal single-player export
- additionally writes multiplayer copies to:
  - `data\Multiplayer\Cooperative\<MissionName>\`
  - `data\Multiplayer\COOP\`
  - `data\Multiplayer\`
- writes `.sds` files for multiplayer package paths
- appends multiplayer mission references into:
  - `data\NSData\UserData\<profile>\LocalServerSetup.json`
  - `mode2.rotationMissions`

Current package written under the preferred cooperative layout:
- `<MissionName>.Mission`
- `<MissionName>.eng`
- `<MissionName>.sds`

What it does not do:
- it does not currently generate `.list` or `.msbin` sidecars
- it does not yet create dedicated-server rotation bundles beyond `.sds` and local server registration

## Generation Behavior

### Template Base

The generator does not create a mission graph from zero.

It clones one of these stock missions:
- `UN/US-aligned` player aircraft -> `[DEMO]InchonStrike`
- `DPRK/PRC/Soviet-aligned` player aircraft -> `[DEMO]BlackThursday`

This is the current playability strategy because hand-built missions were not reliable enough in Korea's current parser.

### Friendly Support Aircraft

The generator retargets friendly non-player support flights to a support aircraft appropriate to the player's coalition and role.

Support pools:
- blue strike: `f80c10`, `f84e`, `f86a5`
- blue fighter: `f51d`, `f80c10`, `f84e`, `f86a5`
- red strike: `la11`, `yak9p`, `mig15bis`
- red fighter: `la11`, `yak9p`, `mig15bis`

Preferred pairings:
- `il10` prefers `la11` or `yak9p`
- `mig15bis` prefers `mig15bis` or `yak9p`
- `f51d` prefers `f80c10` or `f84e`
- `f86a5` prefers `f86a5` or `f84e`

### Airfield Ambiance

The generator now preserves a light stock-template airfield atmosphere and varies it by seed.

Current ambiance behavior:
- shifts a curated local apron package with the selected start field
- varies nearby parked static aircraft by coalition
- toggles some non-critical support vehicles and parked aircraft on/off by seed

This is intentionally conservative:
- it avoids changing takeoff-chain objects
- it avoids inventing new mission logic blocks

## Output Files

The app always writes local copies into:
- `generated/`

Single-player export target:
- `C:\Program Files\IL2Series\game\data\Missions\CodexGenerated`

When `COOP-friendly player flight` is enabled, additional exports are written to:
- `C:\Program Files\IL2Series\game\data\Multiplayer\Cooperative\<MissionName>\`
- `C:\Program Files\IL2Series\game\data\Multiplayer\COOP`
- `C:\Program Files\IL2Series\game\data\Multiplayer`

## Current Limits

Important current limits:
- objective geography is still template-based, not fully catalog-driven
- mission logic is template-derived, not procedurally authored
- payload/loadout logic is still basic
- blue-side and red-side start fields are curated, not exhaustive
- COOP support is working by known-good package layout, but still intentionally conservative

## Why It Works This Way

The current design optimizes for:
- missions that load
- missions that can be flown immediately
- a reliable export path into Korea's current single-player and cooperative mission flow

That is why the generator prefers:
- stock template cloning
- targeted patching
- explicit multiplayer packaging

instead of a fully synthetic mission builder at this stage.
