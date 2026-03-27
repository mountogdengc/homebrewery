import dedent from 'dedent';

export default {

	monster : function(classes){
		return dedent`
			{{${classes}
			## Creature Name
			*Medium Beast, Unaligned*
			___
			**AC** :: 13 (natural armor) | **Initiative** :: +1 (11)
			**HP** :: 27 (5d8 + 5)
			**Speed** :: 30 ft., Swim 20 ft.
			___
			| | | MOD | SAVE | | | MOD | SAVE |
			|:--|:-:|:-:|:-:|:--|:-:|:-:|:-:|
			| **STR** | 14 | +2 | +2 | **INT** | 3 | −4 | −4 |
			| **DEX** | 12 | +1 | +1 | **WIS** | 14 | +2 | +3 |
			| **CON** | 12 | +1 | +1 | **CHA** | 5 | −3 | −3 |
			___
			**Skills** :: Perception +5, Stealth +3
			**Immunities** :: Poison; Poisoned
			**Senses** :: Darkvision 60 ft.; Passive Perception 15
			**Languages** :: —
			**CR** :: 1 (XP 200; PB +2)
			___
			***Keen Smell.*** The creature has Advantage on Wisdom (Perception) checks that rely on smell.
			### Actions
			***Bite.*** *Melee Attack Roll:* +4, reach 5 ft. *Hit:* 7 (1d10 + 2) Piercing damage.
			:
			***Claws.*** *Melee Attack Roll:* +4, reach 5 ft. *Hit:* 5 (1d6 + 2) Slashing damage.
			### Reactions
			***Retaliate.*** *Trigger:* A creature within 5 feet hits the creature with an attack. *Response:* The creature makes one Claws attack against the triggering creature.
			}}
			\n`;
	}
};
