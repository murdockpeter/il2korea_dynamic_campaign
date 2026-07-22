# Black Scorpions 002 - Osan Road Hunt

## Campaign situation

- Date and time: 4 July 1950, 14:30
- Phase: Delaying the North Korean advance
- Sector: Suwon-Osan road
- Player task: armed reconnaissance and moving-column interdiction
- Campaign cause: Sortie 001 inflicted no confirmed damage, so the advance
  guard retained its strength, mobility, and schedule and continued south.

The western portion of the estimated front has moved south under pressure.
The central and eastern portions do not move merely because the Suwon strike
failed; they continue to resolve from their own ground situations.

## Mission character

This is not a duplicate of Sortie 001:

- the hostile column is moving rather than dispersed and stationary;
- the briefing marks a broad last-known search corridor rather than the exact
  target location;
- a linked map route shows airborne start, cover rendezvous, search entry,
  southwest egress, and the Itazuke exit;
- the player has six minutes to search and attack;
- a separate two-ship F-80C flight provides top cover;
- a two-ship Yak-9P patrol has a 50 percent chance of entering the fight;
- verified broken cloud and light afternoon haze affect acquisition;
- three ground kills are sufficient to impose an operational delay.

## Player and escort flights

Scorpion flight contains four F-80C fighter-bombers. In single player,
Scorpion 1 is the player and Scorpions 2-4 are AI formation members. In COOP,
all four use Korea's verified `PLAYERSQUAD`, `AILevel = 0`, and
`CoopStart = 1` construction.

Falcon flight is an independent two-ship F-80C AI formation carrying a
fighter-oriented payload. Its `MCU_CMD_Cover` has:

- Falcon leader entity as the command object;
- Scorpion leader entity as the protected target;
- `CoverGroup = 1` and priority `1`.

Falcon owns its own formation command. It does not borrow Scorpion's route or
attack graph.

## Possible interception

A 140-second timer with `Random = 50` controls the enemy branch. If it fires:

1. an Activate MCU enables both Yak entities;
2. a one-second delay separates activation from command assignment;
3. a Yak formation command and air-only Attack Area begin;
4. a coalition-2 subtitle reports the possible contact;
5. after six minutes, Force Complete clears combat and a withdrawal waypoint
   sends the patrol north.

If the probability check does not fire, no Yak aircraft appear. Their initial
entities are disabled, so the mission does not expose an inactive airborne
formation before the branch resolves.

## Moving ground formation

The target is a seven-vehicle DPRK formation:

- two ISU-122 assault guns;
- two GAZ-63 transports;
- two Studebaker transports, one carrying troops;
- one Studebaker fuel tanker.

Formation-member entities target-link to the column leader entity. Nine
ground waypoints are object-linked to that leader and target-linked in order.
The revised route runs south and southwest at 12 m/s along ten control points
read directly from Korea summer's compiled `ROADS/highways.bin` network. The
vehicles begin aligned with the first road leg at 38-meter spacing. This
replaces the original three broad waypoint legs, which increasingly cut across
open terrain and ended more than five kilometers from the nearest detected
highway control point.

The builder validates all ten full-precision coordinate pairs against the
installed highway binary before it writes or installs either mission mode.
The player search waypoint, attack area, and briefing search icon were moved
north to cover the verified road branch without disclosing the convoy's exact
starting point.

Every vehicle death reports to a three-count counter. Reaching three marks the
mission objective successful and records that the column has been delayed; it
does not claim the whole formation was destroyed.

## Player phase graph

```text
Mission Begin
  -> 1-second initialization
       +-> Scorpion formation
       +-> Rejoin Top Cover waypoint
            -> Osan Search Corridor waypoint
                 +-> six-minute ground Attack Area
                 +-> search message
                 +-> six-minute phase timer
                      +-> Force Complete
                      +-> Egress Southwest
                           -> Exit for Itazuke
                                -> Mission End
       +-> Falcon formation and Cover command
       +-> moving-column first waypoint
       +-> possible Yak interception timer
```

All active Scorpion and convoy waypoints are object-linked to their respective
leaders. Each separate flight owns its own command objects.

## Packages

Single-player project package:

```text
generated/BlackScorpions_002_Osan_Road_Hunt/
```

Cooperative project package:

```text
generated/BlackScorpions_002_Osan_Road_Hunt_COOP/
```

Preferred installed COOP package:

```text
C:\Program Files\IL2Series\game\data\Multiplayer\Cooperative\
  BlackScorpions_002_Osan_Road_Hunt\
```

Rebuild and reinstall both modes with:

```powershell
npm run scenario:black-scorpions-002
```

Hashes after generation:

- Single-player Mission: `2DE559646F7D4D2438EA9CA88F673919700FD0C877AD519F9B44AFCB37F46B03`
- COOP Mission: `FAB858DDCAA1E73B378E6ED23DD668BDB0264DBA2E17A925A8869AB8CE67BFEB`
- English localization: `BCEB975156AFFCB491F37A970C826B5CFED221DCFD9B70217C0121994B6F59E6`

## Static validation

- balanced mission braces;
- 83 unique new mission IDs and no duplicate new IDs;
- no unresolved new Target, Object, event, or command references;
- exactly four COOP player slots;
- two independent AI escort aircraft;
- two disabled-at-start Yak aircraft;
- one 50-percent interception timer;
- nine object-linked convoy waypoints on a validated summer highway branch;
- five localized and target-linked briefing route icons;
- UTF-16LE English localization with the Korea-compatible byte-order mark;
- Korea-compatible field schemas for all new MCU and object types;
- generated and preferred installed files have matching hashes;
- existing `npm test` regression passes.

## Play-test checklist

1. Do the single-player and COOP versions load without Error 1006?
2. Are Scorpion 1-4 visible and selectable as expected?
3. Does Falcon flight appear above/near Scorpion and remain on cover duty?
4. Does the convoy move south and southwest in formation, remain on the visible
   road through all nine waypoints, and avoid collisions or stoppages?
5. Is the broad search marker useful without revealing the exact convoy?
6. Do Scorpion AI wingmen attack moving ground targets in the action area?
7. When Yaks appear, does Falcon engage while Scorpion can remain on task?
8. Across repeated tests, do some runs correctly contain no Yaks?
9. Do the Yaks activate without visibly popping into existence nearby?
10. Does destroying three convoy vehicles produce the success message?
11. Does the six-minute timer force Scorpion to egress cleanly?
12. Record all pilot losses, aircraft losses or damage, ground kills, air
    victories, contact observations, and whether the convoy was delayed.
