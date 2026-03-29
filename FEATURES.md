# Feature Backlog

Planned features, improvements, and ideas. Items are roughly grouped by area. Check an item off when it ships.

---

## BESM Builder
- [x] BESM stat block renderer — compact stat block view for saved characters (like the InDesign Corpse Light/Spectral Warrior format), embeddable in brews via `{{besm-statblock:shareId}}`
- [ ] Dedicated fields for plot hooks (currently stored in notes as stopgap)
- [x] Derived values (HP, EP, ACV, DCV) not recalculating on AI-generated character load — fixed: builder now pushes recalculated values on initial load, renderer recomputes from stats when DB values are zero
- [x] "View as Stat Block" button on the character builder page
- [ ] BESM character sheet PDF — replacement for current PDF export with derived values and full layout

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

- [x] Willowlight Engine playtest table — integrated GM tool for running sessions
- [x] Three-panel layout: Party (left), Character Detail (center), Encounters (right)
- [x] Party cards with health track boxes (Vitality/Willpower/Composure), Luck, Corruption
- [x] Enemy cards with tier system: Mook (group size pips), Elite, Boss, Legend
- [x] Dice roller with 2d6+Luck die, attribute/skill/TN config
- [x] Luck swap mechanic — player can swap luck die with a result die (costs a luck token)
- [x] SG Taint swap mechanic — SG can force a swap (increases taint pool, adds corruption)
- [x] Roll log with character attribution
- [x] Bottom tabs: Dice Roller, Party Management (anchor, connections, secrets, downtime), Storyguide (tides, SG notes)
- [x] Tides tracker with pip-based progress tracks
- [x] First draft HTML/JS prototype exists (see conversation history for full code)
- [x] Roll against target NPC — select enemy + domain, auto-populate TN for attack or defense
- [x] NPCs have offensive TN (player defends) and defensive TN (player attacks) per domain
- [x] Playtest tool accessible from landing page card and `/playtest` route
- [x] Home link in top bar to return to landing page
- [ ] Import characters from saved Willowlight character sheets

### Session Management
- [ ] Sessions are named and have a system type (Willowlight, 5e, BRP, BESM)
- [ ] Session metadata: name, system, brief description, long-form description, created/modified timestamps
- [ ] Save/load sessions to database — full state (party, enemies, tides, taint, notes, settings)
- [ ] Roll logs are retained per session and reviewable on load
- [ ] Load screen: list of saved sessions showing name, system, date/time, brief description
- [ ] Multiple sessions can exist side-by-side (e.g. different playtest scenarios for the same system)

## Playtest Tool — Other Systems
- [ ] D&D 5e playtest table — initiative tracker, HP/AC, roll d20 vs AC/DC, condition tracking
- [ ] BRP playtest table — skill rolls (d100 vs skill%), hit location, resistance table
- [ ] BESM playtest table — 2d6 roll-under stats, combat value rolls, energy point tracking
- [ ] System-agnostic playtest features — shared timer, turn order, generic notes
- [ ] System-specific modules: each system defines its own dice mechanics, stat shapes, track types, and roll interpretation — the playtest shell loads the right module based on session system type

### Analytics & Balance Testing
- [ ] Roll analytics panel — aggregate stats from session roll log (success/cost/fail rates per character, per domain, per enemy)
- [ ] Margin tracking — average roll margin above/below TN, broken down by domain and skill tier
- [ ] Aspect/edge usage tracking — tag rolls with which aspect or edge was invoked, show frequency and impact on outcomes
- [ ] Before/after comparison — show how success rates shift when a specific aspect or edge is active vs not
- [ ] Damage efficiency — rolls-to-drop per enemy tier, broken down by attacker and domain
- [ ] AI balance analysis — send session stats + roll log + character data to LLM for interpretive feedback (toggle local LLM vs Claude API, reuses existing AI generation infrastructure)

## Playtest Tool — Open Questions
These need design decisions before implementation:
- Is the playtest tool solo-GM-only, or should players have a view (e.g. share link showing their character + dice)?
- Should enemy/NPC stat blocks be saveable/loadable from a library (like character sheets)?

## Landing Page / Navigation
- [ ] Per-row quick-create buttons on landing page
- [ ] Recent items section on landing page
- [ ] Replace Homebrewery/NaturalCrit branding in top menu bar with better UX
- [ ] Standardize navigation buttons across all tools — consistent home/back button, save/load, library link in the same position and style on every tool page

## Infrastructure
- [ ] Cover logo positioning still has column-layout issues in some cases
- [ ] Consider HeroQuest theme for the formatter
- [ ] Additional game systems: Starfinder 2e/PF2e, Palladium
