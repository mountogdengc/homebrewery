# Feature Backlog

Planned features, improvements, and ideas. Items are roughly grouped by area. Check an item off when it ships.

---

## BESM Builder
- [x] BESM stat block renderer — compact stat block view for saved characters (like the InDesign Corpse Light/Spectral Warrior format), embeddable in brews via `{{besm-statblock:shareId}}`
- [ ] Dedicated fields for plot hooks (currently stored in notes as stopgap)
- [x] Derived values (HP, EP, ACV, DCV) not recalculating on AI-generated character load — fixed: builder now pushes recalculated values on initial load, renderer recomputes from stats when DB values are zero
- [x] "View as Stat Block" button on the character builder page
- [x] BESM character sheet — 4-page printable sheet (character, narrative, reference, companions) loaded from saved character data
- [ ] Companion sheet — wire to alternate forms / minions data from builder (currently renders blank cards)
- [ ] Character sheet tab consolidation — too many tabs to click through for a single character; consider combining profile + narrative into one page, or a single scrollable "full sheet" view that prints as multiple pages

## Willowlight Engine
- [x] Willowlight character sheet print/PDF layout — 2-page landscape sheet at `/willowlight/sheet/:id`, populated from saved character data
- [x] Character builder schema expanded — demographics, domain focus, lifestyle, downtime, session/total/spent XP, hearth trigger, afflictions, equipment, connection rating/relationship
- [x] Contacts health track rendering in character sheet preview
- [x] Unified character/NPC/creature model — one builder, one library, one DB collection; every entity gets both a compact stat block view (for books) and a full character sheet view; stat block and character routes consolidated under `/willowlight/*`

## AI Generation
- [ ] Add Claude API as alternative generator (toggle between local and cloud)
- [ ] Server-side post-processing to validate and fix LLM output (force save count, cap ability scores, recalculate HP formulas)
- [x] Generate Flavor button for all stat block editors (5e, BRP, Willowlight) — second-pass AI that writes descriptions, lore, trait/action flavor, and encounter hooks
- [x] Generate Flavor button for Willowlight character editor — appearance, personality, backstory, edge/aspect/burden flavor, plot hooks
- [ ] AI Generate for Willowlight character builder — full character generation from prompt
- [ ] AI Generate for BRP stat blocks — refine prompt with BRP-specific math rules
- [ ] ComfyUI image generation pipeline — character/creature portraits from descriptions
- [ ] Scene illustration generation for Brew Editor
- [ ] Token generator for VTT from creature/NPC descriptions
- [ ] Flavor generation guidance prompt — pop-up window before generating flavor that lets the user provide direction (e.g. "young and compassionate, NOT gaunt/undead-looking") so the LLM doesn't make unwanted assumptions from the character concept
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
- [x] Import characters from saved Willowlight character sheets — modal fetches from library API, maps schema to playtest format; also supports blank character creation and removal

### Session Management
- [x] Sessions are named and have a system type (Willowlight, 5e, BRP, BESM)
- [x] Session metadata: name, system, brief description, long-form description, created/modified timestamps
- [x] Save/load sessions to database — full state (party, enemies, tides, taint, notes, settings)
- [x] Roll logs are retained per session and reviewable on load
- [x] Load screen: list of saved sessions showing name, system, date/time, brief description
- [x] Multiple sessions can exist side-by-side (e.g. different playtest scenarios for the same system)

## Playtest Tool — Other Systems
- [ ] D&D 5e playtest table — initiative tracker, HP/AC, roll d20 vs AC/DC, condition tracking
- [ ] BRP playtest table — skill rolls (d100 vs skill%), hit location, resistance table
- [ ] BESM playtest table — 2d6 roll-under stats, combat value rolls, energy point tracking
- [ ] System-agnostic playtest features — shared timer, turn order, generic notes
- [ ] System-specific modules: each system defines its own dice mechanics, stat shapes, track types, and roll interpretation — the playtest shell loads the right module based on session system type

### Rules Config & Simulation
- [x] Configurable rules engine — 13 tunable parameters (health base, success/cost/crit thresholds, dice, skill bonuses) with change log interspersed in roll log
- [x] Quick Sim — run N rolls (up to 100k) with given attr/skill/TN, shows outcome distribution percentages and color-coded histogram chart
- [x] Parameter sweep — sweep any roll parameter (attr, skill, TN) or rule config variable across a range; SVG line chart shows outcome percentages at each step
- [x] Two-variable sweep — heat map showing any metric (success%, failure%, crit%, etc.) across two variables; red-gold-green color scale with per-cell tooltips
- [x] Scenario snapshots — save named snapshots of rules+party+enemies, load to restore, compare two snapshots side-by-side with SVG chart showing success/failure curves across TN range

### Playtest UX Overhaul
- [ ] Help file / guide for the simulation tools (quick sim, sweep, heat map, snapshots)
- [ ] Move bottom toolbar to fixed bottom position; open sections as flyout panels instead of pushing content (buttons stay in place)
- [ ] Convert PC and NPC side panels to flyout windows; free up center view for a dashboard with heat maps, bar graphs, and live analytics
- [ ] Conflict simulation buttons on bottom toolbar — Physical, Mental, Social, Mixed — run a simulated multi-round combat between party and enemies using the current rules config
  - Mixed mode: each character uses their strongest conflict domain
  - Show round-by-round breakdown, average rounds to resolve, casualty rates
  - Later: scenario presets per conflict type (e.g. court battle with leverage/knowledge modifiers, ambush with surprise round, siege with scale advantages)

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
- [x] Should enemy/NPC stat blocks be saveable/loadable from a library (like character sheets)? — YES: Willowlight Bestiary added with full CRUD, tier-adaptive editor, library, and import into playtest tool

## Landing Page / Navigation
- [ ] Per-row quick-create buttons on landing page
- [ ] Recent items section on landing page
- [x] Replace Homebrewery/NaturalCrit branding in top menu bar with better UX — rebranded to MOGC, removed NaturalCrit/Patreon/version/help links
- [ ] Standardize navigation buttons across all tools — consistent home/back button, save/load, library link in the same position and style on every tool page
- [x] Landing page cards for character tools should link to library, not blank new — new character button is already on the library page
- [x] Consider the same library-first pattern for stat block tools — done: all homepage cards now link to system libraries
- [x] Consolidate landing page cards by game system — one tile per system (D&D 5e, BRP, BESM 4e, Willowlight) instead of separate stat block / character tiles
- [x] Library pages as system homepages — toolbar nav buttons for each system's tools (new, character builder, stat blocks, playtest)

## Infrastructure
- [ ] Cover logo positioning still has column-layout issues in some cases
- [ ] Consider HeroQuest theme for the formatter
- [ ] Additional game systems: Starfinder 2e/PF2e, Palladium
