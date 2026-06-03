# Homebrewery App Features

This document compiles all implemented and planned features of the Homebrewery application, organized by major feature categories.

---

## Brew Editor (Markdown-Based Content)

### Core Editing
- Markdown-based document editing for D&D content
- Real-time preview rendering of brew documents
- Split-pane interface (editor + preview)
- Full-screen editing mode
- Code editor with syntax highlighting

### Content Creation
- Create new brew documents from scratch
- Edit existing brew documents
- Markdown formatting support for all D&D 5e PHB styles
- Support for custom HTML/CSS

### Publishing & Sharing
- Save brews to database
- Generate shareable links for published brews
- Share brews with other users
- View publicly shared brews

### Collaboration
- Lock notifications when another user is editing
- Author tracking and management
- Ownership and permissions management

---

## D&D 5e System

### 5e Stat Block Creation & Management
- Visual stat block editor with form fields
- 5e-compliant creature stat block rendering
- Monster stat block templates
- Ability scores, skills, and saves configuration
- Hit points and armor class management
- Actions, legendary actions, and reactions
- Spellcasting configuration
- Challenge rating (CR) calculation

### 5e Stat Block Library
- Save stat blocks to personal library
- Browse and search saved stat blocks
- Edit existing stat blocks
- Delete stat blocks
- Export stat blocks
- Organize stat blocks by category

### 5e Stat Block Sharing
- Generate shareable stat block links
- Render stat blocks in standalone view
- Embed stat blocks in other content

### AI Features for 5e
- Generate flavor text and descriptions using local LM Studio
- Auto-generate lore and background for creatures
- Generate action descriptions

### Stat Block Import
- Import from D&D Beyond using bookmarklet
- Parse and convert external stat blocks
- Auto-populate stat block fields from imports

---

## Big Eyes Small Mouth (BESM) System

### BESM Character Builder
- Comprehensive character creation form
- Stat and attribute tracking
- Character portrait support
- Power/ability system
- Character development and progression tracking
- Save characters to library

### BESM Stat Block Rendering
- Compact stat block view for saved characters
- BESM-specific formatting
- Printable stat block layout
- Embeddable stat blocks in brews

### BESM Character Library
- Save and organize BESM characters
- Browse character library
- Edit character stats and attributes
- Character sharing capabilities

### BESM Character Sheet
- 4-page printable character sheet (character, narrative, reference, companions)
- Load from saved character data
- Print/PDF export

---

## Basic Role-Playing (BRP) System

### BRP Stat Block Creation
- BRP-specific creature editor
- Skill-based system configuration
- Damage and resistance tracking
- Sanity and health mechanics
- Weapon and armor management

### BRP Stat Block Library
- Save BRP stat blocks to library
- Browse and search saved blocks
- Edit and manage stat blocks
- Share BRP blocks with others

### BRP Stat Block Sharing
- Generate shareable BRP stat block links
- Standalone rendering view

---

## Willowlight Engine System

### Willowlight Character Builder
- Comprehensive character creation system
- Demographics and lifestyle configuration
- Domain focus and skill selection
- Experience point tracking (session/total/spent)
- Relationships and contacts management
- Afflictions and health tracking
- Connection rating system
- Hearth trigger configuration
- Equipment management
- Appearance, personality, and backstory fields
- Edge, aspect, and burden system

### Willowlight Character Library
- Save characters to library
- Browse all saved characters
- Edit character details
- Search and filter characters
- Character organization and management

### Willowlight Character Sheet
- 2-page landscape printable character sheet
- Populated from saved character data
- Contacts health track rendering
- Print/PDF export capability

### Willowlight Stat Block System
- Stat block view for characters/NPCs
- Compact combat-ready format
- Embeddable in other content

### Willowlight Bestiary
- Create and manage NPC/creature entries
- Tier system: Mook, Elite, Boss, Legend
- Group size tracking for Mooks
- Creature library with full CRUD operations
- Import creatures into playtest tool
- Creature stat blocks with Willowlight mechanics

### Willowlight Sharing
- Share individual characters as stat blocks
- Public character/NPC sharing links
- Render stat blocks in standalone view

### AI Features for Willowlight
- Generate character flavor (appearance, personality, backstory)
- Generate edge/aspect/burden flavor text
- Generate plot hooks from character concept
- LM Studio integration for offline generation

---

## AI Generation System

### General AI Features
- Integration with local LM Studio for offline generation
- AI flavor text generation for stat blocks
- Generate detailed descriptions and lore
- Generate trait and action flavor text
- Generate encounter hooks and scenarios

### Supported Systems
- D&D 5e flavor generation
- BESM flavor generation
- BRP flavor generation
- Willowlight character and stat block generation

### AI Capabilities (Planned)
- Claude API integration as alternative generator (togglable between local and cloud)
- Server-side post-processing to validate and fix LLM output
- ComfyUI image generation pipeline for portraits
- Scene illustration generation for Brew Editor
- Token generator for VTT from descriptions
- Flavor generation guidance prompts
- Model selector for choosing between loaded LM Studio models

---

## Playtest & GM Tools (Willowlight Engine)

### Playtest Table Interface
- Three-panel layout: Party (left), Character Detail (center), Encounters (right)
- Session creation and management
- Save/load sessions with full state persistence

### Party Management
- Party cards display with health tracking
- Vitality, Willpower, Composure health tracks (with box pips)
- Luck token tracking and management
- Corruption tracking
- Character anchoring and connection management
- Character secrets management
- Downtime activity tracking

### Enemy/NPC Management
- Enemy card creation and management
- Tier system: Mook (group size pips), Elite, Boss, Legend
- Import enemies from Willowlight Bestiary
- Edit enemy stats on-the-fly
- Remove enemies from encounter

### Combat & Rolling System
- Dice roller with 2d6 + Luck die
- Attribute, skill, and target number (TN) configuration
- Roll against specific enemies (auto-populate TN)
- Luck swap mechanic (player swaps luck die with result die for cost)
- SG Taint swap mechanic (SG can force swap, costs taint)
- Roll log with character attribution
- Complete roll history per session

### Conflict Simulation
- Simulate multi-round conflicts between party and enemies
- Physical, Mental, Social, Mixed conflict types
- Mixed mode: characters use strongest conflict domain
- Win/loss/stalemate rate calculation
- Average rounds calculation
- Per-character damage dealt/taken/KO rates
- Per-enemy damage taken/defeated rates

### Rules Configuration & Customization
- Configurable rules engine with 13 tunable parameters
- Health base configuration
- Success/cost/crit threshold adjustment
- Dice configuration
- Skill bonus configuration
- Change log interspersed in roll log

### Simulation & Analysis Tools
- Quick Sim: run N rolls (up to 100k) with given parameters
- Outcome distribution percentages
- Color-coded histogram charts
- Parameter sweep: sweep any parameter across a range
- SVG line chart visualization
- Two-variable sweep: heat map generation
- Red-gold-green color scale with tooltips
- Scenario snapshots: save/load named rule+party configurations
- Side-by-side scenario comparison with SVG charts

### Session Management
- Named sessions with system type
- Session metadata (name, system, description, timestamps)
- Multiple concurrent sessions
- Full state persistence (party, enemies, tides, taint, notes, settings)
- Roll log retention per session

### Storyguide Tools
- Tides tracker with pip-based progress tracks
- SG-only notes panel
- Taint pool management
- Encounter management from right panel

### UI & Navigation
- Bottom toolbar with fixed position
- Flyout panels instead of pushing content
- Help file/guide with comprehensive documentation
- Import characters from saved library
- Blank character creation
- Character removal

---

## User & Account Management

### User Accounts
- User registration and login
- Account creation and authentication
- User profile management
- Email/password management

### Vault System
- Personal vault for saving content
- Organize saved items
- Search and filter vault contents
- Access saved brews, characters, and stat blocks

### User Library Access
- View own published content
- Manage personal collections
- Sharing and access control
- Privacy settings per item

---

## Landing Page & Navigation

### Landing Page
- System tiles for each game system
- Quick navigation to system tools
- Links to character builders
- Links to stat block editors
- Links to libraries
- Links to playtest tools
- Library-first design pattern

### Navigation Bar
- Top navigation with home link
- System-specific navigation buttons
- Rebranded to MOGC
- Access to libraries from any page
- Quick access to tools

### System Homepages (Libraries)
- D&D 5e library homepage
- BRP system homepage
- BESM system homepage
- Willowlight system homepage
- Toolbar nav buttons for new/character/stat blocks/playtest

---

## Import & Export System

### D&D Beyond Import
- Bookmarklet for importing D&D Beyond creatures
- Automatic field parsing
- Stat block creation from imports
- Batch import capability

### Export Capabilities
- Export stat blocks as JSON
- PDF export for character sheets
- PDF export for stat blocks
- Batch export from library pages

---

## Content Formatting & Themes

### Themes
- Player's Handbook (PHB) theme
- Adventure League (AL) Homebrewery theme
- Editor theme selection
- Custom CSS support

### Standalone Stylesheet
- phb.standalone.css for styling custom content
- Can be used independently from Homebrewery

### Formatting Instructions
- WL_Homebrewery_Formatting_Instructions.md
- AL_Homebrewery_Formatting_Instructions.md
- Comprehensive guides for markdown formatting

---

## Administration & Infrastructure

### Admin Tools
- Database administration
- Content moderation tools
- User lock/unlock tools
- Author and permission management
- Notification utilities
- Brew utility functions

### Infrastructure
- Node.js and MongoDB backend
- Docker support
- FreeBSD/FreeNAS deployment options
- CircleCI continuous integration
- Environment configuration (local, staging, production)
- Session/database persistence

### Development Tools
- Vite build system
- ESLint for code quality
- Babel for JavaScript transpilation
- StyleLint for CSS quality

---

## Miscellaneous Features

### Error Handling
- Error page with helpful messages
- Graceful handling of 404s
- Render warnings and validation

### Documentation
- Comprehensive README
- Docker installation guide
- FreeBSD installation guide
- Windows/Ubuntu installation guides
- FAQ with troubleshooting
- Contributing guidelines
- Changelog tracking all updates

### Performance
- Code splitting with Vite
- Image optimization
- Database indexing
- Caching strategies

### Security
- User authentication and sessions
- Permission-based access control
- Brew locking for collaboration
- Author verification

---

# Planned Features (Feature Backlog)

*The following features are planned but not yet implemented. Check items indicate completed features.*

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
- [x] Help file / guide for the simulation tools — Help button in toolbar opens comprehensive guide covering all panels, dice mechanics, sim tools, conflict sim, sessions
- [x] Move bottom toolbar to fixed bottom position; open sections as flyout panels instead of pushing content (buttons stay in place)
- [x] Convert PC and NPC side panels to flyout windows; center view now full-width for character detail / future dashboard
- [ ] Center dashboard view — replace character detail with a full analytics dashboard (heat maps, bar graphs, party summary, live stats)
- [x] Conflict simulation buttons on bottom toolbar — Physical, Mental, Social, Mixed — run N simulated multi-round combats between party and enemies using current rules config
  - [x] Mixed mode: each character uses their strongest conflict domain
  - [x] Results: win/loss/stalemate rates, avg rounds, per-character damage dealt/taken/KO rates, per-enemy damage taken/defeated rates
  - [ ] Later: scenario presets per conflict type (e.g. court battle with leverage/knowledge modifiers, ambush with surprise round, siege with scale advantages)

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
