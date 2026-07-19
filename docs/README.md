# Project References

## Canonical editor reference

[IL-2 Sturmovik Mission Editor and Multiplayer Server Manual](IL-2%20Sturmovik%20Mission%20Editor%20and%20Multiplayer%20Server%20Manual.pdf)
is the primary source of truth for how the IL-2 Great Battles Mission Editor,
mission objects, links, commands, triggers, translators, and multiplayer mission
features are intended to work. Peter has confirmed that the guide remains
substantially accurate for the editor supplied with IL-2 Korea.

Reference identity:

- author: Jim Allison (`JimTM`);
- document date: 24 November 2016;
- length: 350 PDF pages;
- size: 3,338,317 bytes;
- SHA-256: `C89E8928ECEC1EFCEFE9AA6A52FC786565B7F54A5D41290353E6C377F854B4EE`.

Before adding or changing mission-generation behavior, consult the relevant
manual section. Do not assign semantics to an MCU field merely by guessing from
its serialized name or from one mission example.

## Evidence hierarchy

Use the sources together:

1. **The editor manual and shipped Korea demo missions** form the construction
   baseline. The manual defines intended semantics; the demos show how the
   Korea developers serialized those semantics in real scenarios.
2. **Observed IL-2 Korea play/editor tests** establish actual runtime behavior
   and arbitrate any version-specific incompatibility.
3. **Peter's manually authored scenario samplings** define the desired mission
   style and provide new constructions or experiments to validate.
4. **Extracted catalogs** establish available objects and landscape content.
5. **Source-text inference** is provisional and must not silently become a
   generation rule.

If Korea behavior conflicts with the manual, record the conflict as a specific
Korea compatibility finding. Preserve the manual's rule as the documented
baseline and the tested workaround as a version-specific accommodation.

## Other project documentation

- [Campaign mission authoring guidelines](mission-authoring-guidelines.md)
- [Scenario samplings](../scenario-samplings/README.md)
- [Shipped Korea DEMO comparison](../scenario-samplings/DEMO_mission_comparison.md)
- [Current application guide](UserGuide.html)
