# Black Scorpions 001 - Suwon Road Interdiction

## Scenario purpose

This is the first generated campaign sortie for the fictional 81st
Fighter-Bomber Squadron, `Black Scorpions`, attached to the 8th
Fighter-Bomber Group. It is intentionally a small validation mission:

- four F-80C aircraft;
- one active ground-attack sector;
- one full operational front-line overlay;
- one attack phase and one egress phase;
- a simple four-target success threshold.

It tests reliable aircraft routing and ground-attack behavior before adding
moving columns, conditional contacts, friendly ground formations, or campaign
state mutation.

## Historical baseline

- Date: 4 July 1950
- Time: 08:30
- Reported front: Suwon-Wonju-Samcheok
- Selected sector: the Suwon-Osan road
- Task: interdict an armored advance guard and its transport echelon moving
  south from Suwon

The U.S. Army Center of Military History states that by 4 July North Korean
forces had reached the Suwon-Wonju-Samchok line. This is treated as an
operational estimate, not a continuous trench line. A local advance guard is
placed south of the Suwon anchor to create the interdiction opportunity.

The National Museum of the U.S. Air Force identifies the F-80C as based in
Japan with the 8th Fighter-Bomber Group at the beginning of the war and notes
its limited range from Japanese bases.

Sources:

- https://history.army.mil/Research/Reference-Topics/Army-Campaigns/Brief-Summaries/Korean-War/
- https://www.nationalmuseum.af.mil/Upcoming/Photos/?igcategory=RC+Air+Show&igpage=21&igsort=Title&igtag=fighter

## Simulator accommodations

1. Itazuke is outside the Korea map. The flight starts airborne over the
   Yellow Sea west-southwest of Suwon after the long overwater leg and exits
   through a waypoint representing the return to Itazuke.
2. The full front uses cataloged Suwon and Wonju coordinates. The Samcheok
   endpoint is an approximate projected map position and should be checked in
   the editor.
3. The verified ISU-122 object from Peter's first manual sample represents the
   armored component. Its exact early-war presence in this formation is not a
   historical claim.
4. The column is halted and dispersed rather than moving. This isolates target
   placement and aircraft attack behavior from unvalidated ground road charts.
5. F-80 payload preset `2` is drawn from Korea mission/default data but its
   exact stores must be confirmed in game.

## Mission package

Project copy:

```text
generated/BlackScorpions_001_Suwon_Road/
  BlackScorpions_001_Suwon_Road.Mission
  BlackScorpions_001_Suwon_Road.eng
```

Playable/editor copy:

```text
C:\Program Files\IL2Series\game\data\Missions\
  BlackScorpions_001_Suwon_Road.Mission
  BlackScorpions_001_Suwon_Road.eng
```

Cooperative project package:

```text
generated/BlackScorpions_001_Suwon_Road_COOP/
  BlackScorpions_001_Suwon_Road.Mission
  BlackScorpions_001_Suwon_Road.eng
  BlackScorpions_001_Suwon_Road.sds
```

Preferred in-game cooperative package:

```text
C:\Program Files\IL2Series\game\data\Multiplayer\Cooperative\
  BlackScorpions_001_Suwon_Road\
    BlackScorpions_001_Suwon_Road.Mission
    BlackScorpions_001_Suwon_Road.eng
    BlackScorpions_001_Suwon_Road.sds
```

Compatibility copies are also installed directly under `data\Multiplayer`
and `data\Multiplayer\COOP`. All three mission paths are registered in the
current profile's cooperative server rotation.

Source identity after generation:

- Mission SHA-256: `9BA45CE17F579D3ED00242615E78C846F2BAE226D2B5957C8439F8FDB64E879C`
- English text SHA-256: `FAFCAC54C2088825037136813534E9D96D2C0FB572F1038A14DF4A2A6CEAA14C`
- COOP Mission SHA-256: `354142A6719D324E140C6A100E36AE2A94D610D04C3C8A3A8AB17F419521E34C`
- COOP SDS SHA-256: `F8BA4D546BC66E3F10FD99DCDA29F9C57BC51141BF350BC84ADFDEBE9D612D1B`

Rebuild and reinstall with:

```powershell
npm run scenario:black-scorpions-001
```

The builder uses `F80_vs_Infantry_And_Armor_1.Mission` as the validated full
landscape source, removes that sample's handmade root layer, and adds this
scenario's independent campaign group.

## Player flight

- Single player: Scorpion 1 is the player leader and Scorpion 2-4 are AI
  wingmen.
- Cooperative: all four Scorpions are selectable player slots. Unoccupied
  positions remain AI-controlled.
- The single-player leader and all four cooperative slots use Korea's
  `PLAYERSQUAD` designation. Cooperative slots also use `AILevel = 0`,
  `CoopStart = 1`, and unique flight numbers.
- Scorpion 2-4 remain formation-linked to the leader entity.
- Start: airborne at approximately `X 45,000 / Z 310,000`, 2,200 meters
- Fuel: 70 percent, representing fuel already consumed from Itazuke
- Payload: preset `2`, pending visual confirmation
- Formation command: issued at mission initialization

## Route and phase graph

```text
Mission Begin
  -> 1-second initialization
       +-> Formation --object-> Scorpion 1
       +-> Coast Ingress WP --object-> Scorpion 1
            -> Suwon Road IP --object-> Scorpion 1
                 +-> Ground Attack Area --object-> Scorpion 1
                 +-> 4-minute attack timer
                      +-> Force Complete --object-> Scorpion 1
                      +-> Egress South WP --object-> Scorpion 1
                           -> Exit to Itazuke WP --object-> Scorpion 1
                                -> 10-second delay
                                -> Mission End
```

All active waypoints are object-linked to the leader and target-linked in
execution order, matching the manual and shipped Korea demo construction.

## Ground force

The hostile group contains nine separately linked, terrain-pinned objects,
all assigned to country `501`/coalition `1`:

- two ISU-122 assault guns;
- two GAZ-63 transports;
- one Studebaker transport;
- one Studebaker fuel tanker;
- two DPRK machine-gun squads;
- one DPRK submachine-gun squad.

Every entity reports destruction to a four-count counter. Reaching four marks
the interdiction objective successful. The mission does not require destroying
the whole formation.

## Front-line overlay

Eight target-linked map icons form the estimated line from the west coast,
through Suwon and Wonju, to the approximate Samcheok endpoint. The overlay is
visible to all coalitions and is labeled as an estimate. Only the western
Suwon-Osan sector receives active units in this scenario.

## Validation completed

- balanced mission braces;
- no unresolved Target, Object, entity, event, or command references;
- unique new IDs in the `80000+` range;
- four aircraft with three formation-member links to Scorpion 1;
- four object-linked route waypoints;
- object-linked Attack Area and Force Complete commands;
- nine hostile entities reporting to the result counter;
- generated and installed files have matching hashes;
- COOP conversion changes only `MissionType` and the four player-flight
  `CoopStart` flags;
- four selectable COOP aircraft slots;
- cooperative server rotation contains the preferred and compatibility paths;
- subtitles use Korea's nested `SubtitleInfo` serialization rather than the
  older flat `LCText`/`Duration` form that causes text-parser Error 1006;
- existing `npm test` regression passes.

## Editor and in-game test checklist

Please record what is observed for each item:

1. Does the mission appear in the single-player mission list?
2. Do all four F-80s spawn airborne and in a stable formation?
3. What weapons are carried by payload preset `2`?
4. Is the target group on or plausibly beside the Suwon-Osan road?
5. Are any targets inside buildings, trees, steep terrain, or other bad
   placements?
6. Does the full front line appear correctly on the briefing map?
7. Does the front reach reasonable positions at Suwon, Wonju, and the east
   coast?
8. Do the wingmen attack ground targets after the IP?
9. Do the hostile infantry and vehicles engage the flight as expected?
10. Does destroying four objects produce the success message/objective?
11. After four minutes, does the flight transition to egress?
12. Does reaching the Itazuke exit end the mission after ten seconds?

For the cooperative version, also check:

13. Does the mission appear in the Cooperative server mission list?
14. Are Scorpion 1 through Scorpion 4 all selectable in the lobby?
15. Do unoccupied aircraft remain available as AI wingmen?
16. With two or more human pilots, do formation, attack, egress, objective,
    and mission-end triggers still behave correctly?

The next revision should respond to observed behavior, not add new complexity
until these fundamentals are confirmed.
