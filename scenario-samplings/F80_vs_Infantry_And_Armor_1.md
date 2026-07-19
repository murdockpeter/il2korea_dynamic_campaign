# F80_vs_Infantry_And_Armor_1

## Source identity

- Source: `C:\Program Files\IL2Series\game\data\Missions\F80_vs_Infantry_And_Armor_1.Mission`
- Saved: 2026-07-14 22:46 local time
- Mission source size: 36,563,346 bytes
- SHA-256: `B072DECFAA14E78D32C8E682A01EE1BA9BAC577AE7F6A4F6740DCC5358B7F0D6`
- Compiled sidecar: `F80_vs_Infantry_And_Armor_1.msnbin`
- Landscape: Korea spring; 24 April 1951; 09:00; clear
- Briefing title: `F80_Target_Practice1`

This record describes the observed source. It does not modify or copy the
original scenario.

## What is actually authored above the landscape

The first roughly 1.54 million lines are baked landscape and airfield content.
The compact root-level mission layer appended after that content contains:

- two F-80C-10 aircraft;
- three DPRK infantry squad models (two MG and one SMG);
- one GAZ-55 vehicle;
- one ISU-122;
- one map icon;
- Mission Begin, Timer, and Take Off MCUs;
- five Waypoint MCUs;
- one Land command.

There is no ground movement path in this sample. All five ground objects are
stationary, separately placed, pinned to terrain, and have no command or
waypoint links.

## Flight membership

The lead F-80 is object `70945` with entity `70946`. It has `AILevel = 0` and
`NumberInFormation = 0`.

The second F-80 is object `70948` with entity `70949`. It has `AILevel = 2`,
`NumberInFormation = 1`, and its entity target-links to leader entity `70946`.
This agrees with the manual's formation construction: AI formation members are
target-linked to the formation leader.

Both aircraft use:

- `StartType = 1`;
- `PayloadId = 0` and `ModMask = 1`;
- limited ammunition and full fuel;
- country `601`, which the mission maps to coalition `2`.

## Command and path graph

```text
Mission Begin 70970
  -> Timer 70969 (3 seconds; Random = 100)
       +-> Take Off 70971 --object-> lead entity 70946
       +-> WP1 70967 ------object-> lead entity 70946
              -> WP2 70972
              -> WP3 70974
              -> WP4 70976
              -> WP5 70978
              -> Land 70980
```

Only Take Off and the first waypoint carry an explicit object link to the lead
entity. The later route nodes are target-linked into a command sequence but
have no object links. The wingman is not linked individually because formation
membership is expressed through its entity-to-leader link.

The three-second gate keeps mission initialization separate from the first
aircraft commands. Take Off and WP1 are dispatched together after that gate,
so the first waypoint is triggered while takeoff begins. This is an observation
of the serialized graph, not yet a recommended routing pattern.

## Route geometry

All waypoints have:

- `Area = 100` meters;
- `Speed = 100` m/s;
- `Priority = 1`;
- `YPos = 25.824` in the mission source.

| Leg | Distance | Approx. heading | Nominal time at 100 m/s |
|---|---:|---:|---:|
| Start to WP1 | 5.565 km | 183.9 deg | 55.7 s |
| WP1 to WP2 | 2.319 km | 124.4 deg | 23.2 s |
| WP2 to WP3 | 3.378 km | 49.5 deg | 33.8 s |
| WP3 to WP4 | 3.221 km | 348.1 deg | 32.2 s |
| WP4 to WP5 | 3.825 km | 324.4 deg | 38.3 s |
| WP5 to Land | 0.722 km | 293.0 deg | 7.2 s |

The command route is about 19.0 km long before takeoff and landing behavior are
included. It forms a compact loop rather than a direct out-and-back track.

The five ground objects form a tight cluster centered at approximately
`X 271294.158 / Z 184294.706`. WP4 is the closest route node, approximately
0.709 km from that centroid. Thus, the route brings the flight near the target
area but does not make the target objects part of the waypoint graph.

The aircraft start coordinates fall inside the cataloged landscape bounds for
K-24 Pyongyang, not K-23 Pyongyang. WP2 falls inside the K-23 area. The route
therefore appears to depart K-24, pass through the neighboring Pyongyang
airfield area, loop past the target cluster, and return toward K-24. The Land
MCU is beyond the static-object bounds recorded for K-24, so its precise
relationship to the runway/approach must be confirmed visually in the editor
rather than inferred from the catalog alone.

## Target behavior

There is no Attack Area command, Attack command, damage event, objective
counter, or mission-success trigger. The target group is therefore a free-form
player attack opportunity rather than an AI task or scored objective.

The icon at the cluster uses localized name `DPRK Infantry`, icon ID `511`, and
is visible to coalitions `[1, 2, 0]`.

All five ground objects currently use `Country = 0`. The mission's country map
places country `0` in coalition `0`, while the F-80 is in coalition `2`.
Despite the DPRK model names and briefing label, the source therefore does not
assign these objects to the mission's coalition `1`. This may be intentional
for non-firing target practice. It must be tested before this sample is used as
evidence for hostile ground-unit behavior.

## Manual cross-check of the flight path

The canonical editor manual gives a more complete construction for aircraft
routing on manual pages 60-61 (PDF pages 70-71):

1. target-link each waypoint to the next waypoint;
2. object-link **all** route waypoints to the plane;
3. trigger the first waypoint from the aircraft's `OnPlaneTookOff` event;
4. object-link the Land command to the plane;
5. target-link the last waypoint to the Land command.

The worked airfield example on manual page 63 (PDF page 73) also uses a short
mission-start timer before Take Off, an `OnPlaneTookOff` message link to the
first waypoint, and an object-linked Land command.

This sample aligns with the manual on formation linking, the delayed Take Off
command, and the target-linked waypoint sequence. It differs in three important
ways:

- only WP1 is object-linked to the lead aircraft;
- WP1 is triggered at the same time as Take Off rather than by
  `OnPlaneTookOff`;
- the Land command has no object link to the aircraft.

Consequently, this sample is **not yet authoritative evidence for a reliable AI
takeoff-route-landing graph**. The missing links may be acceptable for the
specific player-led test, may serialize differently than expected in Korea, or
may leave parts of the route ineffective. The manual construction is the
default guidance until the sample's actual in-game behavior is reported.

## Guidance extracted from this sample

These observed patterns also align with the manual:

1. Bind formation members to the flight leader with target links.
2. Object-link flight commands to the leader rather than every formation
   member.
3. Use a short Mission Begin delay before Take Off.
4. Target-link waypoints in travel order.
5. Keep manually placed target objects independent of the navigation graph
   when the player is meant to choose how and whether to attack.
6. Pin infantry and ground targets to terrain.
7. Keep the authored mission layer compact even when the saved source embeds
   the full landscape.

For generated AI routes, follow the manual by object-linking every waypoint and
the Land command to the leader and using `OnPlaneTookOff` to start WP1, unless a
Korea test deliberately proves another construction reliable.

Do **not** generalize these sample-specific choices into defaults:

- five waypoints;
- a 100 m waypoint radius;
- 100 m/s at every waypoint;
- a two-ship flight;
- a stationary five-object target cluster;
- clear weather at 09:00;
- a visible target icon;
- a target pass approximately 0.7 km from the cluster;
- a fixed three-second delay;
- no scoring or campaign result logic.

## Variation derived from the same grammar

Future scenarios can retain the proven link pattern while changing the lived
problem. Examples include:

- a moving armor column whose lead vehicle owns a road waypoint chain;
- dispersed infantry hidden along a ridgeline rather than a compact cluster;
- an incorrect map icon with the real force displaced along its route;
- a target that activates only after reconnaissance or proximity detection;
- alternative ingress branches selected by weather or threat state;
- separate egress and divert logic instead of an immediate landing chain;
- a timed withdrawal, reinforcement, or concealment response;
- an attack-area command for AI flights while the player remains untasked;
- uncertain or partial success based on which operational entities survive.

## Questions requiring play validation

Before converting observations into compiler rules, verify:

1. whether the takeoff-plus-WP1 simultaneous dispatch works as intended and
   why it was chosen instead of the manual's `OnPlaneTookOff` event;
2. whether the low waypoint Y values are intentionally terrain-following or
   only editor defaults for this test;
3. whether WP2-WP5 command either aircraft despite lacking the object links
   required by the manual;
4. whether the final Land command affects the aircraft despite lacking the
   object link required by the manual;
5. how country `0` targets react to and are treated by coalition `2` aircraft;
6. whether the briefing icon's all-coalition visibility is intentional;
7. whether the flight follows all five nodes before or after a player attack,
   and how the AI wingman behaves during an unscripted attack pass.
