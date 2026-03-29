# Feature Backlog

Planned features, improvements, and ideas. Items are roughly grouped by area. Check an item off when it ships.

---

## BESM Builder
- [ ] BESM stat block renderer — compact stat block view for saved characters (like the InDesign Corpse Light/Spectral Warrior format), embeddable in brews via `{{besm-statblock:shareId}}`
- [ ] Dedicated fields for plot hooks (currently stored in notes as stopgap)
- [ ] Derived values (HP, EP, ACV, DCV) not recalculating on AI-generated character load — investigate builder initialization
- [ ] "View as Stat Block" button on the character builder page

## Willowlight Engine
- [ ] Willowlight character sheet print/PDF layout
- [ ] Contacts health track rendering in character sheet preview

## AI Generation
- [ ] Add Claude API as alternative generator (toggle between local and cloud)
- [ ] Server-side post-processing to validate and fix LLM output (force save count, cap ability scores, recalculate HP formulas)
- [ ] AI Generate for Willowlight character builder
- [ ] AI Generate for BRP stat blocks — refine prompt with BRP-specific math rules
- [ ] ComfyUI image generation pipeline — character/creature portraits from descriptions
- [ ] Scene illustration generation for Brew Editor
- [ ] Token generator for VTT from creature/NPC descriptions
- [ ] Prompt refinement: 5e stat blocks still occasionally overshoot on skills/saves
- [ ] Model selector in UI (pick which loaded LM Studio model to use)
- [ ] Download SRD monster data locally instead of live API calls for offline use

## Stat Block Builders (General)
- [ ] B&W mode for BRP stat blocks
- [ ] B&W mode for 5e stat blocks
- [ ] Embed rendering for BRP and Willowlight stat blocks in brews (like `{{statblock:id}}`)
- [ ] Batch export stat blocks as JSON from library pages

## Brew Editor
- [ ] Brew content assistant — sidebar or slash command for generating boxed text, encounter descriptions, room descriptions from bullet points
- [ ] In-editor stat block picker for BRP and Willowlight (like the existing 5e picker)

## Character System Converter

- [ ] Cross-system character converter — take a character from any system and convert to another (BESM ↔ D&D 5e ↔ BRP ↔ Willowlight)
- [ ] Converter should handle stat mapping, ability/skill approximation, and power/attribute translation
- [ ] Support future systems as they're added

## Playtest Tool

- [ ] Willowlight Engine playtest table — integrated GM tool for running sessions
- [ ] Three-panel layout: Party (left), Character Detail (center), Encounters (right)
- [ ] Party cards with health track boxes (Vitality/Willpower/Composure), Luck, Corruption
- [ ] Enemy cards with tier system: Mook (group size pips), Elite, Boss, Legend
- [ ] Dice roller with 2d6+Luck die, attribute/skill/TN config
- [ ] Luck swap mechanic — player can swap luck die with a result die (costs a luck token)
- [ ] SG Taint swap mechanic — SG can force a swap (increases taint pool, adds corruption)
- [ ] Roll log with character attribution
- [ ] Bottom tabs: Dice Roller, Party Management (anchor, connections, secrets, downtime), Storyguide (tides, SG notes)
- [ ] Tides tracker with pip-based progress tracks
- [ ] Import characters from saved Willowlight character sheets
- [ ] First draft HTML/JS prototype exists (see conversation history for full code)

## Landing Page / Navigation
- [ ] Per-row quick-create buttons on landing page
- [ ] Recent items section on landing page
- [ ] Replace Homebrewery/NaturalCrit branding in top menu bar with better UX

## Infrastructure
- [ ] Cover logo positioning still has column-layout issues in some cases
- [ ] Consider HeroQuest theme for the formatter
- [ ] Additional game systems: Starfinder 2e/PF2e, Palladium
