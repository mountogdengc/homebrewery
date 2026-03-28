import React, { useCallback } from 'react';
import {
	CHARACTERISTICS, CHAR_LABELS, CREATURE_CATEGORIES,
	SKILL_CATEGORIES, HIT_LOCATION_NAMES,
	getDamageBonus, getHitPoints, getMagicPoints
} from '@shared/brpStatblock/constants.js';

const BrpStatblockForm = ({ statblock, onChange })=>{

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

	const chars = statblock.characteristics || {};
	const derivedHP = getHitPoints(chars.con, chars.siz);
	const derivedMP = getMagicPoints(chars.pow);
	const derivedDB = getDamageBonus(chars.str, chars.siz);

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

	return <div className="statblockForm">
		{/* ── Identity ─────────────────────────────────────────────── */}
		<h3>Identity</h3>
		{field('Name', 'name')}
		<div className="formRow">
			{field('Category', 'category', 'select', { options: CREATURE_CATEGORIES })}
			{field('Subtype', 'subtype')}
		</div>
		{field('Description', 'description', 'textarea')}
		{field('Source', 'source')}

		{/* ── Characteristics ──────────────────────────────────────── */}
		<h3>Characteristics</h3>
		<div className="abilityGrid">
			{CHARACTERISTICS.map((c)=>{
				const val = chars[c] ?? 10;
				return <div className="abilityCol" key={c}>
					<div className="abilLabel">{CHAR_LABELS[c]}</div>
					<input type="number" value={val}
						onChange={(e)=>update(`characteristics.${c}`, Number(e.target.value) || 0)} />
				</div>;
			})}
		</div>

		{/* ── Derived Values ───────────────────────────────────────── */}
		<h3>Derived Values</h3>
		<div className="formRow">
			<label>
				<span>HP (auto: {derivedHP})</span>
				<input type="number" value={statblock.hitPointsOverride ?? ''}
					placeholder={derivedHP}
					onChange={(e)=>update('hitPointsOverride', e.target.value === '' ? null : Number(e.target.value))} />
			</label>
			<label>
				<span>MP (auto: {derivedMP})</span>
				<input type="number" value={statblock.magicPointsOverride ?? ''}
					placeholder={derivedMP}
					onChange={(e)=>update('magicPointsOverride', e.target.value === '' ? null : Number(e.target.value))} />
			</label>
		</div>
		<div className="formRow">
			<label>
				<span>DB (auto: {derivedDB})</span>
				<input type="text" value={statblock.damageBonusOverride ?? ''}
					placeholder={derivedDB}
					onChange={(e)=>update('damageBonusOverride', e.target.value || null)} />
			</label>
			{field('Move', 'moveRate', 'number')}
		</div>
		<div className="formRow">
			{field('Armor Points', 'armorPoints', 'number')}
			{field('Armor Description', 'armorDescription')}
		</div>

		{/* ── Skills ───────────────────────────────────────────────── */}
		<h3>Skills</h3>
		{statblock.skills?.map((skill, idx)=>(
			<div className="repeatItem" key={idx}>
				<div className="repeatHeader">
					<strong style={{ color: '#f5e6c8', fontSize: '12px' }}>Skill {idx + 1}</strong>
					<div className="repeatControls">
						<button onClick={()=>moveItem('skills', idx, -1)}>▲</button>
						<button onClick={()=>moveItem('skills', idx, 1)}>▼</button>
						<button onClick={()=>removeItem('skills', idx)}>✕</button>
					</div>
				</div>
				<div className="formRow">
					{field('Name', `skills.${idx}.name`)}
					{field('Value %', `skills.${idx}.value`, 'number')}
				</div>
				{field('Category', `skills.${idx}.category`, 'select', { options: ['', ...SKILL_CATEGORIES] })}
			</div>
		))}
		<button className="addButton" onClick={()=>addItem('skills', { name: '', value: 0, category: '' })}>+ Add Skill</button>

		{/* ── Weapons ──────────────────────────────────────────────── */}
		<h3>Weapons</h3>
		{statblock.weapons?.map((weapon, idx)=>(
			<div className="repeatItem" key={idx}>
				<div className="repeatHeader">
					<strong style={{ color: '#f5e6c8', fontSize: '12px' }}>Weapon {idx + 1}</strong>
					<div className="repeatControls">
						<button onClick={()=>moveItem('weapons', idx, -1)}>▲</button>
						<button onClick={()=>moveItem('weapons', idx, 1)}>▼</button>
						<button onClick={()=>removeItem('weapons', idx)}>✕</button>
					</div>
				</div>
				<div className="formRow">
					{field('Name', `weapons.${idx}.name`)}
					{field('Skill %', `weapons.${idx}.skill`, 'number')}
				</div>
				<div className="formRow">
					{field('Damage', `weapons.${idx}.damage`)}
					{field('Range', `weapons.${idx}.range`)}
				</div>
				<div className="formRow">
					{field('Rate', `weapons.${idx}.rate`)}
					{field('Parry %', `weapons.${idx}.parry`, 'number')}
					{field('HP', `weapons.${idx}.hp`, 'number')}
				</div>
			</div>
		))}
		<button className="addButton" onClick={()=>addItem('weapons', { name: '', skill: 0, damage: '', range: '', rate: '', parry: 0, hp: 0 })}>+ Add Weapon</button>

		{/* ── Spells ───────────────────────────────────────────────── */}
		<h3>Spells &amp; Powers</h3>
		{statblock.spells?.map((spell, idx)=>(
			<div className="repeatItem" key={idx}>
				<div className="repeatHeader">
					<strong style={{ color: '#f5e6c8', fontSize: '12px' }}>Spell {idx + 1}</strong>
					<div className="repeatControls">
						<button onClick={()=>moveItem('spells', idx, -1)}>▲</button>
						<button onClick={()=>moveItem('spells', idx, 1)}>▼</button>
						<button onClick={()=>removeItem('spells', idx)}>✕</button>
					</div>
				</div>
				{field('Name', `spells.${idx}.name`)}
				{field('Cost', `spells.${idx}.cost`)}
				{field('Description', `spells.${idx}.description`, 'textarea')}
			</div>
		))}
		<button className="addButton" onClick={()=>addItem('spells', { name: '', cost: '', description: '' })}>+ Add Spell</button>

		{/* ── Traits / Special Abilities ────────────────────────────── */}
		<h3>Special Abilities</h3>
		{statblock.traits?.map((trait, idx)=>(
			<div className="repeatItem" key={idx}>
				<div className="repeatHeader">
					<strong style={{ color: '#f5e6c8', fontSize: '12px' }}>Ability {idx + 1}</strong>
					<div className="repeatControls">
						<button onClick={()=>moveItem('traits', idx, -1)}>▲</button>
						<button onClick={()=>moveItem('traits', idx, 1)}>▼</button>
						<button onClick={()=>removeItem('traits', idx)}>✕</button>
					</div>
				</div>
				{field('Name', `traits.${idx}.name`)}
				{field('Description', `traits.${idx}.description`, 'textarea')}
			</div>
		))}
		<button className="addButton" onClick={()=>addItem('traits', { name: '', description: '' })}>+ Add Ability</button>

		{/* ── Hit Locations ─────────────────────────────────────────── */}
		<h3>Hit Locations (Optional)</h3>
		{statblock.hitLocations?.map((loc, idx)=>(
			<div className="repeatItem" key={idx}>
				<div className="repeatHeader">
					<strong style={{ color: '#f5e6c8', fontSize: '12px' }}>Location {idx + 1}</strong>
					<div className="repeatControls">
						<button onClick={()=>moveItem('hitLocations', idx, -1)}>▲</button>
						<button onClick={()=>moveItem('hitLocations', idx, 1)}>▼</button>
						<button onClick={()=>removeItem('hitLocations', idx)}>✕</button>
					</div>
				</div>
				<div className="formRow">
					{field('Name', `hitLocations.${idx}.name`)}
					{field('HP Override', `hitLocations.${idx}.hpOverride`, 'number')}
					{field('AP Override', `hitLocations.${idx}.armorOverride`, 'number')}
				</div>
			</div>
		))}
		<div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
			<button className="addButton" onClick={()=>addItem('hitLocations', { name: '', hpOverride: null, armorOverride: null })}>+ Add Location</button>
			{statblock.hitLocations?.length === 0 && (
				<button className="addButton" style={{ background: '#2e5d4e' }}
					onClick={()=>{
						const updated = JSON.parse(JSON.stringify(statblock));
						updated.hitLocations = HIT_LOCATION_NAMES.map((name)=>({ name, hpOverride: null, armorOverride: null }));
						onChange(updated);
					}}>
					Populate Standard Locations
				</button>
			)}
		</div>

		{/* ── Notes ─────────────────────────────────────────────────── */}
		<h3>Notes</h3>
		{field('Notes', 'notes', 'textarea')}
	</div>;
};

export default BrpStatblockForm;
