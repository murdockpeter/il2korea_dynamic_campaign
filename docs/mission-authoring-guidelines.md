# Campaign Mission Authoring Guidelines

## Briefing standard

Every campaign sortie receives a complete operational briefing rather than
placeholder text. The briefing should let a player understand why the mission
exists, what to do, how to navigate it, what support and opposition may be
present, and how the result will affect the persistent campaign.

The normal briefing structure is:

```text
DATE AND TIME
SITUATION
MISSION
EXECUTION
PACKAGE
THREATS
RULES OF ENGAGEMENT
WEATHER
RECOVERY
CAMPAIGN EFFECT
```

Sections may be combined or omitted when that better fits a particular
sortie, but the player must still receive the operational information needed
to fly it. Intelligence uncertainty must remain uncertainty; briefing text and
map markings should distinguish confirmed, reported, estimated, and suspected
information.

## Briefing map

The normal route presentation includes an airborne start or departure icon,
important ingress/rendezvous points, the action-area entry, an egress point,
and recovery or map-exit location. Sequential route icons may be target-linked
with `LineType = 14`, following the shipped Korea demos.

Current verified icon roles include:

- `903`: start/departure;
- `901`: navigation/route point;
- `902`: action point;
- `511`: reported target or search-area marker.

Map information belongs only to appropriate coalitions. Exact target icons
must not undermine an armed-reconnaissance or uncertain-contact mission.

## Localization file format

IL-2 Korea localization sidecars use UTF-16LE with an `FF FE` byte-order mark.
Writing handcrafted `.eng` files as UTF-8 can cause placeholder briefing text
or corrupt non-ASCII characters even though the mission itself loads.

Before delivery, verify:

- the `.eng` file begins with `FF FE`;
- Options `LCName`, `LCDesc`, and `LCAuthor` resolve;
- every icon and subtitle localization index resolves;
- generated and installed localization files have matching hashes.

## Persistence and variety

The briefing is written from the campaign state, not from a generic target
template. It should explain the consequence of earlier sorties, evolving front
and intelligence estimates, available squadron resources, and the intended
state change produced by the current task.

Consistency means every mission is well briefed. It does not mean every
briefing has identical prose, route markings, certainty, or tactical texture.

