# Scenario Samplings

This directory is the learning library for scenarios created manually in the
IL-2 Korea Mission Editor. These samples are authoritative examples of Peter's
mission-building intent, but they are not templates to clone wholesale.

The canonical reference for editor and MCU semantics is the
[IL-2 Sturmovik Mission Editor and Multiplayer Server Manual](../docs/IL-2%20Sturmovik%20Mission%20Editor%20and%20Multiplayer%20Server%20Manual.pdf).
Sample analyses must use the manual to interpret serialized constructions and
must clearly label any behavior that remains unverified in IL-2 Korea.

The purpose of each analysis is to separate:

- **engine-safe invariants**: link structure, entity ownership, activation
  order, formation membership, and other mechanics that must remain reliable;
- **scenario grammar**: reusable techniques that can be recombined;
- **authored choices**: route, force mix, timing, weather, task, and narrative;
- **open questions**: behavior that must be confirmed in the simulator before
  it becomes guidance.

## Adding a sample

Put each future sample in its own directory when practical:

```text
scenario-samplings/
  <scenario-id>/
    NOTES.md
    <scenario-id>.Mission
    <scenario-id>.eng
    <other sidecars as useful>
```

`NOTES.md` is especially valuable. It only needs to say:

1. what the scenario was intended to do;
2. what actually happened in play;
3. which editor construction was deliberate;
4. anything that was experimental or known to be unfinished.

Compiled `.msnbin` files and the full language set are not normally needed for
structural analysis. Large mission sources may instead remain in the game's
Missions directory and be recorded by path, timestamp, and SHA-256 in the
analysis, as with the first sample.

## Variation policy

Samples define a vocabulary, not a house-shaped cookie cutter. New scenarios
should preserve only mechanics demonstrated to be necessary. They should vary
the operational problem and several experiential dimensions at once:

- route topology and approach direction;
- altitude, speed, spacing, and formation;
- force composition, posture, concealment, and movement;
- target certainty and whether the reported target is still present;
- activation time and event sequencing;
- weather, visibility, time, and terrain;
- opposition, air defenses, distractions, and friendly activity;
- success conditions and campaign consequence;
- ingress, attack, egress, diversion, and recovery behavior.

Do not introduce variation merely by swapping vehicle types at unchanged
coordinates. The operational situation should be the source of variation.

## Current analyses

- [F80_vs_Infantry_And_Armor_1](F80_vs_Infantry_And_Armor_1.md)
- [Shipped Korea DEMO mission comparison](DEMO_mission_comparison.md)
- [Black Scorpions 001 - Suwon Road Interdiction](BlackScorpions_001_Suwon_Road.md)
- [Black Scorpions 002 - Osan Road Hunt](BlackScorpions_002_Osan_Road_Hunt.md)
