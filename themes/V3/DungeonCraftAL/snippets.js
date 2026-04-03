import EncounterGen        from './snippets/encounter.gen.js';
import AdventureIntroGen   from './snippets/adventureIntro.gen.js';
import MonsterBlock2024Gen from './snippets/monsterblock2024.gen.js';
import dedent              from 'dedent';

export default [
	{
		groupName : 'Adventure Structure',
		icon      : 'fas fa-book-open',
		view      : 'text',
		snippets  : [
			{
				name : 'Adventure Intro',
				icon : 'fas fa-scroll',
				gen  : AdventureIntroGen,
			},
			{
				name : 'Chapter Header',
				icon : 'fas fa-heading',
				gen  : function(){
					return dedent`
						# Chapter Title
						\n`;
				},
			},
			{
				name : 'Section Header',
				icon : 'fas fa-bookmark',
				gen  : function(){
					return dedent`
						## Section Title
						\n`;
				},
			},
		]
	},
	{
		groupName : 'AL Content',
		icon      : 'fas fa-dungeon',
		view      : 'text',
		snippets  : [
			{
				name : 'Encounter Area',
				icon : 'fas fa-map-marker-alt',
				gen  : EncounterGen,
			},
			{
				name : 'Read-Aloud Box',
				icon : 'fas fa-comment-alt',
				gen  : function(){
					return dedent`
						> Read-aloud text goes here. Describe the scene the characters encounter using vivid, sensory language.
						\n`;
				},
			},
			{
				name : 'Sidebar',
				icon : 'fas fa-sticky-note',
				gen  : function(){
					return dedent`
						{{note
						##### Sidebar Title
						Sidebar content goes here. Use sidebars for rules clarifications, tips for the DM, or supplementary information.
						}}
						\n`;
				},
			},
			{
				name : 'Epigraph',
				icon : 'fas fa-quote-right',
				gen  : function(){
					return dedent`
						{{descriptive
						*"A quote or piece of flavor text that sets the mood for this section of the adventure."*

						— Attribution Name
						}}
						\n`;
				},
			},
			{
				name : 'NPC Summary',
				icon : 'fas fa-user',
				gen  : function(){
					return dedent`
						##### NPCs in This Section

						**Aldric Thornwall** (LG male human **veteran**). A gruff but kindhearted militia captain. He wants to protect the village at all costs.

						**Mira Duskhollow** (CN female half-elf **spy**). A traveling merchant with hidden motives. She knows more than she lets on.
						\n`;
				},
			},
			{
				name : 'Treasure & Rewards',
				icon : 'fas fa-gem',
				gen  : function(){
					return dedent`
						##### Treasure & Rewards
						Each character receives the following:

						- **Gold:** 75 gp
						- **Magic Item:** *Potion of healing* (1 per character)
						- **Downtime:** 10 downtime days
						- **Renown:** 1 renown
						\n`;
				},
			},
		]
	},
	{
		groupName : 'Paragraph Styles',
		icon      : 'fas fa-paragraph',
		view      : 'text',
		snippets  : [
			{
				name : 'Core Body',
				icon : 'fas fa-align-left',
				gen  : dedent`\n{{CoreBody
					Body text goes here.
					}}\n`
			},
			{
				name : 'Core Hanging',
				icon : 'fas fa-indent',
				gen  : dedent`\n{{CoreHanging
					**Label.** Description text with hanging indent for wrapped lines.
					}}\n`
			},
			{
				name : 'Core Bulleted',
				icon : 'fas fa-list-ul',
				gen  : dedent`\n{{CoreBulleted
					- Bulleted list item
					- Another item
					}}\n`
			},
			{
				name : 'Hanging Continue',
				icon : 'fas fa-paragraph',
				gen  : dedent`\n{{hangingContinue
					Continuation paragraph under a hanging entry.
					}}\n`
			},
			{
				name : 'Hanging Bullet',
				icon : 'fas fa-list',
				gen  : dedent`\n{{HangingBullet
					- Sub-item under a hanging entry
					- Another sub-item
					}}\n`
			},
			{
				name : 'Core Metadata',
				icon : 'fas fa-info-circle',
				gen  : dedent`\n{{CoreMetadata
					*DC 15 Wisdom (Perception) check; 30 ft. range*
					}}\n`
			},
			{
				name : 'Epigraph',
				icon : 'fas fa-quote-left',
				gen  : dedent`\n{{Epigraph
					*"A quote or piece of flavor text that sets the mood."*
					}}
					{{EpigraphAuthor
					— Attribution Name
					}}\n`
			},
			{
				name : 'List Heading',
				icon : 'fas fa-heading',
				gen  : dedent`\n{{ListHeading
					List Section Title
					}}\n`
			},
			{
				name : 'List Item',
				icon : 'fas fa-minus',
				gen  : dedent`\n{{ListItem
					**Item Label.** Item description text.
					}}\n`
			},
			{
				name : 'Boxed Text (Read-Aloud)',
				icon : 'fas fa-comment-alt',
				gen  : dedent`\n{{BoxedText
					Read-aloud text the DM reads to players. Describe the scene using vivid, sensory language.
					}}\n`
			},
			{
				name : 'Sidebar Heading',
				icon : 'fas fa-sticky-note',
				gen  : dedent`\n{{SidebarHeading
					Sidebar Title
					}}\n`
			},
			{
				name : 'Sidebar Body',
				icon : 'fas fa-align-left',
				gen  : dedent`\n{{SidebarBody
					Sidebar body text goes here.
					}}\n`
			},
			{
				name : 'Sidebar Bulleted',
				icon : 'fas fa-list-ul',
				gen  : dedent`\n{{SidebarBulleted
					- Sidebar bullet item
					- Another item
					}}\n`
			},
			{
				name : 'Table Title',
				icon : 'fas fa-table',
				gen  : dedent`\n{{TableTitle
					Table Name
					}}\n`
			},
			{
				name : 'Page Footer',
				icon : 'fas fa-shoe-prints',
				gen  : dedent`\n{{PageFooter
					Footer content pinned to the bottom of the page.
					}}\n`
			},
			{
				name : 'Credit / Legal',
				icon : 'fas fa-copyright',
				gen  : dedent`\n{{CreditLegal
					Credit or legal boilerplate text in small print.
					}}\n`
			},
		]
	},
	{
		// Override inherited Text Editor to remove Formatting (moved to Layout)
		groupName : 'Text Editor',
		icon      : 'fas fa-pencil-alt',
		view      : 'text',
		snippets  : [
			{ name: 'Formatting', icon: 'fas fa-align-center' }, // no gen/subsnippets → filtered out
		]
	},
	{
		groupName : 'Layout',
		icon      : 'fas fa-columns',
		view      : 'text',
		snippets  : [
			{
				name : 'Wide Block',
				icon : 'fas fa-window-maximize',
				gen  : dedent`\n{{wide
					Content here spans both columns.
					}}\n`
			},
			{
				name : 'Tight',
				icon : 'fas fa-compress-alt',
				gen  : dedent`\n{{tight
					Content with reduced top margin.
					}}\n`
			},
			{
				name        : 'Formatting',
				icon        : 'fas fa-align-center',
				subsnippets : [
					{
						name : 'Center Text',
						icon : 'fas fa-align-center',
						gen  : dedent`\n{{text-align:center
							Your centered text here
							}}\n`
					},
					{
						name : 'Right Align Text',
						icon : 'fas fa-align-right',
						gen  : dedent`\n{{text-align:right
							Your right-aligned text here
							}}\n`
					},
					{
						name : 'Justify Text',
						icon : 'fas fa-align-justify',
						gen  : dedent`\n{{text-align:justify
							Your justified text here
							}}\n`
					},
				]
			},
		]
	},
	{
		groupName : 'Stat Blocks',
		icon      : 'fas fa-dragon',
		view      : 'text',
		snippets  : [
			{
				name : 'Monster Stat Block (2024)',
				icon : 'fas fa-spider',
				gen  : MonsterBlock2024Gen.monster('monster,frame'),
			},
			{
				name : 'Monster Stat Block (2024, unframed)',
				icon : 'fas fa-paw',
				gen  : MonsterBlock2024Gen.monster('monster'),
			},
			{
				name : 'Wide Monster Stat Block (2024)',
				icon : 'fas fa-dragon',
				gen  : MonsterBlock2024Gen.monster('monster,frame,wide'),
			},
		]
	},
	{
		groupName : 'Embed',
		icon      : 'fas fa-puzzle-piece',
		view      : 'text',
		snippets  : [
			{
				name : 'Embed Stat Block',
				icon : 'fas fa-dragon',
				gen  : '{{statblock:SHARE_ID_HERE}}\n'
			},
			{
				name : 'Embed Stat Block (Wide)',
				icon : 'fas fa-dragon',
				gen  : '{{statblock:SHARE_ID_HERE|wide}}\n'
			},
		]
	},
	{
		groupName : 'License',
		icon      : 'fas fa-copyright',
		view      : 'text',
		snippets  : [
			{
				name : 'Wizards of the Coast AL Legal',
				icon : 'fab fa-wizards-of-the-coast',
				gen  : function(){
					const year = new Date().getFullYear();
					return dedent`
						{{legal
						DUNGEONS & DRAGONS, D&D, Wizards of the Coast, Forgotten Realms, the dragon ampersand, Player's Handbook, Monster Manual, Dungeon Master's Guide, D&D Adventurers League, all other Wizards of the Coast product names, and their respective logos are trademarks of Wizards of the Coast in the USA and other countries. All characters and their distinctive likenesses are property of Wizards of the Coast. This material is protected under the copyright laws of the United States of America. Any reproduction or unauthorized use of the materials contained herein is prohibited without the express written permission of Wizards of the Coast.
						:
						©${year} Wizards of the Coast LLC, PO Box 707, Renton, WA 98057-0707, USA.
						}}
						\n`;
				},
			},
			{
				name : 'Not for Resale Footer',
				icon : 'fas fa-ban',
				gen  : dedent`
					{{footnote
					Not for resale. Permission granted to print or photocopy this document for personal use only.

					FR-DC-XXX-XX Adventure Name (v1.0)
					}}
					\n`
			},
		]
	},
	{
		groupName : 'Print',
		icon      : 'fas fa-print',
		view      : 'style',
		snippets  : [
			{
				name : 'Ink Friendly',
				icon : 'fas fa-tint',
				gen  : dedent`
					/* Ink Friendly */
					.page {
						background : white !important;
					}
					.page .note {
						background : #f0f0f0 !important;
					}
					.page img {
						visibility : hidden;
					}\n\n`
			},
		]
	}
];
