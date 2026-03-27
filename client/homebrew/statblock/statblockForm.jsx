import React, { useCallback } from 'react';
import {
	SKILLS, CREATURE_TYPES, SIZES, ALIGNMENTS, CR_LIST,
	ABILITIES, ABILITY_LABELS, USAGE_OPTIONS,
	abilityMod, fmtMod, getPB
} from '@shared/statblock/constants.js';

const StatblockForm = ({ statblock, onChange })=>{

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
		if(type === 'checkbox') {
			return <label>
				<span>{label}</span>
				<input type="checkbox" checked={!!val} onChange={(e)=>update(path, e.target.checked)} />
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

	const pb = getPB(statblock.cr);

	// ── Repeat section helper ─────────────────────────────────────────
	const repeatSection = (title, path, items, createItem)=>{
		const addItem = ()=>{
			const updated = JSON.parse(JSON.stringify(statblock));
			const keys = path.split('.');
			let arr = updated;
			for (const k of keys) arr = arr[k];
			arr.push(createItem());
			onChange(updated);
		};
		const removeItem = (idx)=>{
			const updated = JSON.parse(JSON.stringify(statblock));
			const keys = path.split('.');
			let arr = updated;
			for (const k of keys) arr = arr[k];
			arr.splice(idx, 1);
			onChange(updated);
		};
		const moveItem = (idx, dir)=>{
			const newIdx = idx + dir;
			if(newIdx < 0 || newIdx >= items.length) return;
			const updated = JSON.parse(JSON.stringify(statblock));
			const keys = path.split('.');
			let arr = updated;
			for (const k of keys) arr = arr[k];
			[arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
			onChange(updated);
		};

		return <div className="repeatSection">
			{items?.map((item, idx)=>(
				<div className="repeatItem" key={idx}>
					<div className="repeatHeader">
						<strong style={{ color: '#f5e6c8', fontSize: '12px' }}>{title} {idx + 1}</strong>
						<div className="repeatControls">
							<button onClick={()=>moveItem(idx, -1)}>▲</button>
							<button onClick={()=>moveItem(idx, 1)}>▼</button>
							<button onClick={()=>removeItem(idx)}>✕</button>
						</div>
					</div>
					{field('Name', `${path}.${idx}.name`)}
					{field('Description', `${path}.${idx}.description`, 'textarea')}
					{field('Usage', `${path}.${idx}.usage`, 'select', { options: USAGE_OPTIONS })}
				</div>
			))}
			<button className="addButton" onClick={addItem}>+ Add {title}</button>
		</div>;
	};

	return <div className="statblockForm">
		{/* ── Identity ────────────────────────────────────────────────── */}
		<h3>Identity</h3>
		{field('Name', 'name')}
		<div className="formRow">
			{field('Size', 'size', 'select', { options: SIZES })}
			{field('Type', 'type', 'select', { options: CREATURE_TYPES })}
		</div>
		{field('Subtype', 'subtype')}
		{field('Alignment', 'alignment', 'select', { options: ALIGNMENTS })}
		{field('Source', 'source')}

		{/* ── Combat Stats ────────────────────────────────────────────── */}
		<h3>Combat</h3>
		<div className="formRow">
			{field('AC', 'ac.value', 'number')}
			{field('AC Desc', 'ac.description')}
		</div>
		<div className="formRow">
			{field('HP Avg', 'hp.average', 'number')}
			{field('HP Formula', 'hp.formula')}
		</div>
		{field('Initiative Override', 'initiativeOverride', 'number')}
		<div className="formRow">
			{field('Walk', 'speed.walk', 'number')}
			{field('Fly', 'speed.fly', 'number')}
			{field('Swim', 'speed.swim', 'number')}
		</div>
		<div className="formRow">
			{field('Burrow', 'speed.burrow', 'number')}
			{field('Climb', 'speed.climb', 'number')}
			{field('Hover', 'speed.hover', 'checkbox')}
		</div>

		{/* ── Abilities ───────────────────────────────────────────────── */}
		<h3>Ability Scores</h3>
		<div className="abilityGrid">
			{ABILITIES.map((ab)=>{
				const score = statblock.abilities?.[ab] ?? 10;
				const mod = abilityMod(score);
				return <div className="abilityCol" key={ab}>
					<div className="abilLabel">{ABILITY_LABELS[ab]}</div>
					<input type="number" value={score}
						onChange={(e)=>update(`abilities.${ab}`, Number(e.target.value) || 10)} />
					<div className="abilMod">{fmtMod(mod)}</div>
				</div>;
			})}
		</div>

		{/* ── Saving Throws ───────────────────────────────────────────── */}
		<h3>Saving Throws</h3>
		<div className="savesGrid">
			{ABILITIES.map((ab)=>{
				const st = statblock.savingThrows?.[ab] || { proficient: false };
				const mod = abilityMod(statblock.abilities?.[ab] ?? 10);
				const save = st.proficient ? mod + pb : mod;
				return <div className="saveRow" key={ab}>
					<input type="checkbox" checked={!!st.proficient}
						onChange={(e)=>update(`savingThrows.${ab}.proficient`, e.target.checked)} />
					<span className="saveName">{ABILITY_LABELS[ab]}</span>
					<span className="saveBonus">{fmtMod(save)}</span>
				</div>;
			})}
		</div>

		{/* ── Skills ──────────────────────────────────────────────────── */}
		<h3>Skills</h3>
		<div className="skillsGrid">
			{SKILLS.map(({ key, name, ability })=>{
				const sk = statblock.skills?.[key] || { proficient: false, expertise: false };
				const base = abilityMod(statblock.abilities?.[ability] ?? 10);
				const bonus = sk.proficient ? base + pb * (sk.expertise ? 2 : 1) : base;
				return <div className="skillRow" key={key}>
					<input type="checkbox" checked={!!sk.proficient}
						onChange={(e)=>update(`skills.${key}.proficient`, e.target.checked)} />
					<span className="skillName">{name}</span>
					<span className="skillBonus">{fmtMod(bonus)}</span>
				</div>;
			})}
		</div>

		{/* ── CR & Defenses ───────────────────────────────────────────── */}
		<h3>Challenge & Defenses</h3>
		{field('CR', 'cr', 'select', { options: CR_LIST })}
		{field('Gear', 'gear')}
		{field('Vulnerabilities', 'damageVulnerabilities')}
		{field('Resistances', 'damageResistances')}
		{field('Damage Immunities', 'damageImmunities')}
		{field('Condition Immunities', 'conditionImmunities')}
		{field('Senses', 'senses')}
		{field('Languages', 'languages')}

		{/* ── Traits ──────────────────────────────────────────────────── */}
		<h3>Traits</h3>
		{repeatSection('Trait', 'traits', statblock.traits, ()=>({ name: '', description: '', usage: '' }))}

		{/* ── Actions ─────────────────────────────────────────────────── */}
		<h3>Actions</h3>
		{repeatSection('Action', 'actions', statblock.actions, ()=>({ name: '', description: '', usage: '' }))}

		{/* ── Bonus Actions ───────────────────────────────────────────── */}
		<h3>Bonus Actions</h3>
		{repeatSection('Bonus Action', 'bonusActions', statblock.bonusActions, ()=>({ name: '', description: '', usage: '' }))}

		{/* ── Reactions ───────────────────────────────────────────────── */}
		<h3>Reactions</h3>
		{repeatSection('Reaction', 'reactions', statblock.reactions, ()=>({ name: '', description: '', usage: '' }))}

		{/* ── Legendary Actions ───────────────────────────────────────── */}
		<h3>Legendary Actions</h3>
		<div className="formRow">
			{field('Count', 'legendary.count', 'number')}
		</div>
		{field('Preamble', 'legendary.preamble', 'textarea')}
		{repeatSection('Legendary Action', 'legendary.actions', statblock.legendary?.actions,
			()=>({ name: '', description: '', cost: 1, usage: '' }))}
	</div>;
};

export default StatblockForm;
