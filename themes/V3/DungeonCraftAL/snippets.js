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
				name : 'Credit / Legal',
				icon : 'fas fa-copyright',
				gen  : dedent`\n{{CreditLegal
					Credit or legal boilerplate text in small print.
					}}\n`
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
