import React, { useCallback } from 'react';
import {
	ATTRIBUTES, ATTR_LABELS,
	ALIGNMENTS, CATEGORIES, OCC_TYPES,
	SKILL_CATEGORIES, FANTASY_SKILL_CATEGORIES,
	PSIONIC_CATEGORIES, SPELL_LEVELS,
	TMNT_ANIMAL_TYPES, TMNT_MUTATION_CATEGORIES, TMNT_ANIMAL_SIZES,
	usesMDC
} from '@shared/palladiumStatblock/constants.js';
import { PALLADIUM_GAMES } from '@shared/palladiumStatblock/schema.js';

const PalladiumStatblockForm = ({ statblock, onChange })=>{

	const update = useCallback((path, value)=>{
		const updated = JSON.parse(JSON.stringify(statblock));
		const keys = path.split('.');
		let obj = updated;
		for (let i = 0; i < keys.length - 1; i++) {
			if(keys[i].match(/^\d+$/)) keys[i] = parseInt(keys[i]);
			obj = obj[keys[i]];
		}
		const lastKey = keys[keys.length - 1].match(/^\d+$/) ? parseInt(keys[keys.length - 1]) : keys[keys.length - 1];
		obj[lastKey] = value;
		onChange(updated);
	}, [statblock, onChange]);

	const field = (label, path, type = 'text', opts = {})=>{
		const keys = path.split('.');
		let val = statblock;
		for (const k of keys) val = val?.[k];

		if(type === 'select') {
			return <label>
				<span>{label}</span>
				<select value={val || ''} onChange={(e)=>update(path, e.target.value)}>
					{opts.options?.map((o)=><option key={o} value={o}>{o}</option>)}
				</select>
			</label>;
		}
		if(type === 'textarea') {
			return <label style={{ alignItems: 'flex-start' }}>
				<span>{label}</span>
				<textarea value={val || ''} onChange={(e)=>update(path, e.target.value)} />
			</label>;
		}
		return <label>
			<span>{label}</span>
			<input type={type} value={val ?? ''} onChange={(e)=>{
				update(path, type === 'number' ? (e.target.value === '' ? null : Number(e.target.value)) : e.target.value);
			}} />
		</label>;
	};

	// ── Repeat section helpers ─────────────────────────────────────
	const addItem = (path, item)=>{
		const updated = JSON.parse(JSON.stringify(statblock));
		const keys = path.split('.');
		let arr = updated;
		for (const k of keys) arr = arr[k];
		arr.push(item);
		onChange(updated);
	};

	const removeItem = (path, idx)=>{
		const updated = JSON.parse(JSON.stringify(statblock));
		const keys = path.split('.');
		let arr = updated;
		for (const k of keys) arr = arr[k];
		arr.splice(idx, 1);
		onChange(updated);
	};

	const moveItem = (path, idx, dir)=>{
		const updated = JSON.parse(JSON.stringify(statblock));
		const keys = path.split('.');
		let arr = updated;
		for (const k of keys) arr = arr[k];
		const newIdx = idx + dir;
		if(newIdx < 0 || newIdx >= arr.length) return;
		[arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
		onChange(updated);
	};

	const game       = statblock.game || 'Rifts';
	const categories = CATEGORIES[game] || CATEGORIES['Rifts'];
	const occTypes   = OCC_TYPES[game] || OCC_TYPES['Rifts'];
	const isMDC      = usesMDC(game, statblock.category);
	const skillCats  = game === 'Palladium Fantasy' ? FANTASY_SKILL_CATEGORIES : SKILL_CATEGORIES;

	return <div className="statblockForm">
		{/* ── Game & Identity ──────────────────────────────────────── */}
		<h3>Game &amp; Identity</h3>
		{field('Game', 'game', 'select', { options: PALLADIUM_GAMES })}
		<div className="formRow">
			{field('Name', 'name')}
			{field('Race', 'race')}
		</div>
		<div className="formRow">
			{field('Category', 'category', 'select', { options: categories })}
			{field('Alignment', 'alignment', 'select', { options: ['', ...ALIGNMENTS] })}
		</div>
		<div className="formRow">
			{field(`${statblock.occType || 'OCC'} Name`, 'occ')}
			{field('Type', 'occType', 'select', { options: occTypes })}
			{field('Level', 'level', 'number')}
		</div>
		{field('Description', 'description', 'textarea')}
		{field('Source', 'source')}

		{/* ── Attributes ──────────────────────────────────────────── */}
		<h3>Attributes</h3>
		<div className="abilityGrid">
			{ATTRIBUTES.map((a)=>{
				const val = statblock.attributes?.[a] ?? 10;
				return <div className="abilityCol" key={a}>
					<div className="abilLabel">{ATTR_LABELS[a]}</div>
					<input type="number" value={val}
						onChange={(e)=>update(`attributes.${a}`, Number(e.target.value) || 0)} />
				</div>;
			})}
		</div>

		{/* ── Durability ──────────────────────────────────────────── */}
		<h3>Durability</h3>
		{isMDC ? (
			<div className="formRow">
				{field('M.D.C.', 'mdc', 'number')}
				{field('MDC Override', 'mdcOverride', 'number')}
			</div>
		) : (
			<>
				<div className="formRow">
					{field('Hit Points', 'hp', 'number')}
					{field('HP Override', 'hpOverride', 'number')}
				</div>
				<div className="formRow">
					{field('S.D.C.', 'sdc', 'number')}
					{field('SDC Override', 'sdcOverride', 'number')}
				</div>
			</>
		)}
		<div className="formRow">
			{field('Natural A.R.', 'ar', 'number')}
			{field('P.P.E.', 'ppeMagic', 'number')}
			{field('I.S.P.', 'isp', 'number')}
		</div>

		{/* ── Combat ──────────────────────────────────────────────── */}
		<h3>Combat</h3>
		<div className="formRow">
			{field('Attacks/Melee', 'combat.attacks', 'number')}
			{field('Initiative', 'combat.initiative', 'number')}
		</div>
		<div className="formRow">
			{field('Strike', 'combat.strike', 'number')}
			{field('Parry', 'combat.parry', 'number')}
			{field('Dodge', 'combat.dodge', 'number')}
		</div>
		<div className="formRow">
			{field('Roll w/ Punch', 'combat.rollWithPunch', 'number')}
			{field('Pull Punch', 'combat.pull', 'number')}
		</div>
		<div className="formRow">
			{field('Damage Bonus', 'combat.damage')}
			{field('Critical On', 'combat.criticalOn')}
		</div>

		{/* ── Movement ────────────────────────────────────────────── */}
		<h3>Movement</h3>
		<div className="formRow">
			{field('Run', 'movement.run')}
			{field('Fly', 'movement.fly')}
		</div>
		<div className="formRow">
			{field('Swim', 'movement.swim')}
			{field('Leap', 'movement.leap')}
		</div>

		{/* ── Skills ──────────────────────────────────────────────── */}
		<h3>Skills</h3>
		{statblock.skills?.map((skill, idx)=>(
			<div className="repeatItem" key={idx}>
				<div className="repeatHeader">
					<strong style={{ color: '#f5e6c8', fontSize: '12px' }}>Skill {idx + 1}</strong>
					<div className="repeatControls">
						<button onClick={()=>moveItem('skills', idx, -1)}>&#9650;</button>
						<button onClick={()=>moveItem('skills', idx, 1)}>&#9660;</button>
						<button onClick={()=>removeItem('skills', idx)}>&#10005;</button>
					</div>
				</div>
				<div className="formRow">
					{field('Name', `skills.${idx}.name`)}
					{field('Value %', `skills.${idx}.value`, 'number')}
				</div>
				{field('Category', `skills.${idx}.category`, 'select', { options: ['', ...skillCats] })}
			</div>
		))}
		<button className="addButton" onClick={()=>addItem('skills', { name: '', value: 0, category: '' })}>+ Add Skill</button>

		{/* ── Weapons ─────────────────────────────────────────────── */}
		<h3>Weapons</h3>
		{statblock.weapons?.map((weapon, idx)=>(
			<div className="repeatItem" key={idx}>
				<div className="repeatHeader">
					<strong style={{ color: '#f5e6c8', fontSize: '12px' }}>Weapon {idx + 1}</strong>
					<div className="repeatControls">
						<button onClick={()=>moveItem('weapons', idx, -1)}>&#9650;</button>
						<button onClick={()=>moveItem('weapons', idx, 1)}>&#9660;</button>
						<button onClick={()=>removeItem('weapons', idx)}>&#10005;</button>
					</div>
				</div>
				<div className="formRow">
					{field('Name', `weapons.${idx}.name`)}
					{field('Damage', `weapons.${idx}.damage`)}
				</div>
				<div className="formRow">
					{field('Range', `weapons.${idx}.range`)}
					{field('Rate of Fire', `weapons.${idx}.rof`)}
				</div>
				<div className="formRow">
					{field('Payload', `weapons.${idx}.payload`)}
					{field('Bonus', `weapons.${idx}.bonus`)}
				</div>
				{field('Notes', `weapons.${idx}.notes`)}
			</div>
		))}
		<button className="addButton" onClick={()=>addItem('weapons', { name: '', damage: '', range: '', rof: '', payload: '', bonus: '', notes: '' })}>+ Add Weapon</button>

		{/* ── Armor ───────────────────────────────────────────────── */}
		<h3>Armor</h3>
		{statblock.armor?.map((a, idx)=>(
			<div className="repeatItem" key={idx}>
				<div className="repeatHeader">
					<strong style={{ color: '#f5e6c8', fontSize: '12px' }}>Armor {idx + 1}</strong>
					<div className="repeatControls">
						<button onClick={()=>moveItem('armor', idx, -1)}>&#9650;</button>
						<button onClick={()=>moveItem('armor', idx, 1)}>&#9660;</button>
						<button onClick={()=>removeItem('armor', idx)}>&#10005;</button>
					</div>
				</div>
				<div className="formRow">
					{field('Name', `armor.${idx}.name`)}
					{field(isMDC ? 'M.D.C.' : 'S.D.C.', `armor.${idx}.${isMDC ? 'mdc' : 'sdc'}`, 'number')}
					{field('A.R.', `armor.${idx}.ar`, 'number')}
				</div>
				{field('Notes', `armor.${idx}.notes`)}
			</div>
		))}
		<button className="addButton" onClick={()=>addItem('armor', { name: '', mdc: 0, sdc: 0, ar: 0, notes: '' })}>+ Add Armor</button>

		{/* ── Magic ───────────────────────────────────────────────── */}
		<h3>Magic</h3>
		{statblock.magic?.map((spell, idx)=>(
			<div className="repeatItem" key={idx}>
				<div className="repeatHeader">
					<strong style={{ color: '#f5e6c8', fontSize: '12px' }}>Spell {idx + 1}</strong>
					<div className="repeatControls">
						<button onClick={()=>moveItem('magic', idx, -1)}>&#9650;</button>
						<button onClick={()=>moveItem('magic', idx, 1)}>&#9660;</button>
						<button onClick={()=>removeItem('magic', idx)}>&#10005;</button>
					</div>
				</div>
				<div className="formRow">
					{field('Name', `magic.${idx}.name`)}
					{field('Level', `magic.${idx}.level`, 'select', { options: ['', ...SPELL_LEVELS.map(String)] })}
					{field('PPE', `magic.${idx}.ppe`, 'number')}
				</div>
				<div className="formRow">
					{field('Range', `magic.${idx}.range`)}
					{field('Duration', `magic.${idx}.duration`)}
				</div>
				{field('Description', `magic.${idx}.description`, 'textarea')}
			</div>
		))}
		<button className="addButton" onClick={()=>addItem('magic', { name: '', level: '', ppe: 0, range: '', duration: '', description: '' })}>+ Add Spell</button>

		{/* ── Psionics ────────────────────────────────────────────── */}
		<h3>Psionics</h3>
		{statblock.psionics?.map((psi, idx)=>(
			<div className="repeatItem" key={idx}>
				<div className="repeatHeader">
					<strong style={{ color: '#f5e6c8', fontSize: '12px' }}>Psionic {idx + 1}</strong>
					<div className="repeatControls">
						<button onClick={()=>moveItem('psionics', idx, -1)}>&#9650;</button>
						<button onClick={()=>moveItem('psionics', idx, 1)}>&#9660;</button>
						<button onClick={()=>removeItem('psionics', idx)}>&#10005;</button>
					</div>
				</div>
				<div className="formRow">
					{field('Name', `psionics.${idx}.name`)}
					{field('Category', `psionics.${idx}.category`, 'select', { options: ['', ...PSIONIC_CATEGORIES] })}
					{field('ISP', `psionics.${idx}.isp`, 'number')}
				</div>
				<div className="formRow">
					{field('Range', `psionics.${idx}.range`)}
					{field('Duration', `psionics.${idx}.duration`)}
				</div>
				{field('Description', `psionics.${idx}.description`, 'textarea')}
			</div>
		))}
		<button className="addButton" onClick={()=>addItem('psionics', { name: '', category: '', isp: 0, range: '', duration: '', description: '' })}>+ Add Psionic</button>

		{/* ── Special Abilities ────────────────────────────────────── */}
		<h3>Special Abilities</h3>
		{statblock.abilities?.map((ability, idx)=>(
			<div className="repeatItem" key={idx}>
				<div className="repeatHeader">
					<strong style={{ color: '#f5e6c8', fontSize: '12px' }}>Ability {idx + 1}</strong>
					<div className="repeatControls">
						<button onClick={()=>moveItem('abilities', idx, -1)}>&#9650;</button>
						<button onClick={()=>moveItem('abilities', idx, 1)}>&#9660;</button>
						<button onClick={()=>removeItem('abilities', idx)}>&#10005;</button>
					</div>
				</div>
				{field('Name', `abilities.${idx}.name`)}
				{field('Description', `abilities.${idx}.description`, 'textarea')}
			</div>
		))}
		<button className="addButton" onClick={()=>addItem('abilities', { name: '', description: '' })}>+ Add Ability</button>

		{/* ── TMNT: Mutations ─────────────────────────────────────── */}
		{game === 'TMNT' && <>
			<h3>Mutant Animal</h3>
			<div className="formRow">
				{field('Animal Type', 'animalType', 'select', { options: ['', ...TMNT_ANIMAL_TYPES] })}
				{field('Size', 'animalSize', 'select', { options: ['', ...TMNT_ANIMAL_SIZES] })}
				{field('Bio-E', 'bioE', 'number')}
			</div>

			{statblock.mutations?.map((mut, idx)=>(
				<div className="repeatItem" key={idx}>
					<div className="repeatHeader">
						<strong style={{ color: '#f5e6c8', fontSize: '12px' }}>Mutation {idx + 1}</strong>
						<div className="repeatControls">
							<button onClick={()=>moveItem('mutations', idx, -1)}>&#9650;</button>
							<button onClick={()=>moveItem('mutations', idx, 1)}>&#9660;</button>
							<button onClick={()=>removeItem('mutations', idx)}>&#10005;</button>
						</div>
					</div>
					<div className="formRow">
						{field('Name', `mutations.${idx}.name`)}
						{field('Bio-E Cost', `mutations.${idx}.cost`, 'number')}
					</div>
					{field('Description', `mutations.${idx}.description`, 'textarea')}
				</div>
			))}
			<button className="addButton" onClick={()=>addItem('mutations', { name: '', cost: 0, description: '' })}>+ Add Mutation</button>
		</>}

		{/* ── Equipment ───────────────────────────────────────────── */}
		<h3>Equipment</h3>
		{field('Equipment', 'equipment', 'textarea')}

		{/* ── Notes ───────────────────────────────────────────────── */}
		<h3>Notes</h3>
		{field('Notes', 'notes', 'textarea')}
	</div>;
};

export default PalladiumStatblockForm;
