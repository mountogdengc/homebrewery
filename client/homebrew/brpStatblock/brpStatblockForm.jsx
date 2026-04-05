import React, { useCallback, useMemo } from 'react';
import {
	CHARACTERISTICS, CHAR_LABELS, CREATURE_CATEGORIES,
	SKILL_CATEGORIES, HIT_LOCATION_NAMES,
	getDamageBonus, getHitPoints, getMagicPoints
} from '@shared/brpStatblock/constants.js';
import {
	DEFAULT_SKILLS, buildSkillList, resolveBase, SKILL_CATEGORY_ORDER
} from '@shared/brpStatblock/defaultSkills.js';

const BrpStatblockForm = ({ statblock, onChange })=>{
	const isCharacter = statblock.characterType === 'character';

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

	// ── Skills: full list with train toggles (character mode) ──────
	const fullSkillList = useMemo(()=>{
		return buildSkillList(statblock.skills, chars);
	}, [statblock.skills, chars]);

	const toggleSkillTrained = useCallback((skillName, currentlyTrained)=>{
		const updated = JSON.parse(JSON.stringify(statblock));
		if(currentlyTrained) {
			// Remove from trained skills
			updated.skills = updated.skills.filter((s)=>s.name !== skillName);
		} else {
			// Add to trained skills with current base value
			const def = DEFAULT_SKILLS.find((d)=>d.name === skillName);
			const baseVal = def ? resolveBase(def.base, chars) : 0;
			updated.skills.push({ name: skillName, value: baseVal, category: def?.category || '', trained: true });
		}
		onChange(updated);
	}, [statblock, chars, onChange]);

	const updateSkillValue = useCallback((skillName, newValue)=>{
		const updated = JSON.parse(JSON.stringify(statblock));
		const skill = updated.skills.find((s)=>s.name === skillName);
		if(skill) {
			skill.value = newValue;
		} else {
			// Auto-train when value is changed
			const def = DEFAULT_SKILLS.find((d)=>d.name === skillName);
			updated.skills.push({ name: skillName, value: newValue, category: def?.category || '', trained: true });
		}
		onChange(updated);
	}, [statblock, chars, onChange]);

	return <div className="statblockForm">
		{/* ── Character Type Toggle ──────────────────────────────── */}
		<div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
			<button
				className={`addButton ${!isCharacter ? 'active' : ''}`}
				style={{ flex: 1, background: !isCharacter ? '#4a3520' : '#2e3d4e', border: 'none', cursor: 'pointer', padding: '8px', fontSize: '13px', fontWeight: 600, color: '#f5e6c8' }}
				onClick={()=>update('characterType', 'creature')}
			>Creature / NPC</button>
			<button
				className={`addButton ${isCharacter ? 'active' : ''}`}
				style={{ flex: 1, background: isCharacter ? '#4a3520' : '#2e3d4e', border: 'none', cursor: 'pointer', padding: '8px', fontSize: '13px', fontWeight: 600, color: '#f5e6c8' }}
				onClick={()=>update('characterType', 'character')}
			>Player Character</button>
		</div>

		{/* ── Identity ─────────────────────────────────────────────── */}
		<h3>Identity</h3>
		{field('Name', 'name')}
		{isCharacter && field('Player', 'player')}
		<div className="formRow">
			{isCharacter ? field('Occupation', 'occupation') : null}
			{field('Category', 'category', 'select', { options: CREATURE_CATEGORIES })}
			{field('Subtype', 'subtype')}
		</div>
		{field('Description', 'description', 'textarea')}
		{field('Source', 'source')}

		{/* ── Character Demographics ───────────────────────────────── */}
		{isCharacter && <>
			<h3>Demographics</h3>
			<div className="formRow">
				{field('Age', 'age')}
				{field('Gender', 'gender')}
			</div>
			<div className="formRow">
				{field('Nationality', 'nationality')}
			</div>
			{field('Appearance', 'appearance', 'textarea')}
		</>}

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

		{/* ── Sanity (character mode) ──────────────────────────────── */}
		{isCharacter && <>
			<div className="formRow" style={{ marginTop: '8px' }}>
				<label>
					<span>Sanity (auto: {(chars.pow || 0) * 5})</span>
					<input type="number" value={statblock.sanity ?? ''}
						placeholder={(chars.pow || 0) * 5}
						onChange={(e)=>update('sanity', e.target.value === '' ? null : Number(e.target.value))} />
				</label>
				<label>
					<span>Max Sanity</span>
					<input type="number" value={statblock.sanityMax ?? ''}
						placeholder="99"
						onChange={(e)=>update('sanityMax', e.target.value === '' ? null : Number(e.target.value))} />
				</label>
			</div>
		</>}

		{/* ── Skills ───────────────────────────────────────────────── */}
		<h3>Skills {isCharacter && <span style={{ fontSize: '11px', color: '#888', fontWeight: 400 }}>(check to train, only trained show on stat block)</span>}</h3>

		{isCharacter ? (
			/* Character mode: show all default skills with train toggles */
			<div className="skillGrid">
				{SKILL_CATEGORY_ORDER.map((cat)=>{
					const catSkills = fullSkillList.filter((s)=>s.category === cat);
					if(catSkills.length === 0) return null;
					return <div key={cat} className="skillCategory">
						<div className="skillCatTitle">{cat}</div>
						{catSkills.map((s)=>(
							<div className="skillRow" key={s.name}>
								<label className="skillCheck">
									<input type="checkbox" checked={s.trained}
										onChange={()=>toggleSkillTrained(s.name, s.trained)} />
									<span className={s.trained ? 'trained' : ''}>{s.name}</span>
								</label>
								<span className="skillBase">({s.base})</span>
								<input type="number" className="skillValue"
									value={s.trained ? s.value : ''}
									placeholder={s.base}
									onChange={(e)=>{
										const val = e.target.value === '' ? s.base : Number(e.target.value);
										updateSkillValue(s.name, val);
									}}
									disabled={!s.trained}
								/>
								<span className="skillPct">%</span>
							</div>
						))}
					</div>;
				})}

				{/* Custom skills not in default list */}
				{fullSkillList.filter((s)=>!SKILL_CATEGORY_ORDER.includes(s.category) || !DEFAULT_SKILLS.find((d)=>d.name === s.name)).length > 0 && (
					<div className="skillCategory">
						<div className="skillCatTitle">Custom</div>
						{fullSkillList.filter((s)=>!DEFAULT_SKILLS.find((d)=>d.name === s.name)).map((s, idx)=>(
							<div className="skillRow" key={s.name || idx}>
								<span className="skillCheck" style={{ flex: 1 }}>
									<input type="checkbox" checked={true} disabled />
									<span className="trained">{s.name}</span>
								</span>
								<input type="number" className="skillValue"
									value={s.value}
									onChange={(e)=>updateSkillValue(s.name, Number(e.target.value) || 0)}
								/>
								<span className="skillPct">%</span>
								<button className="skillRemove" onClick={()=>{
									const updated = JSON.parse(JSON.stringify(statblock));
									updated.skills = updated.skills.filter((sk)=>sk.name !== s.name);
									onChange(updated);
								}}>✕</button>
							</div>
						))}
					</div>
				)}

				<button className="addButton" onClick={()=>{
					const name = prompt('Custom skill name:');
					if(!name) return;
					addItem('skills', { name, value: 0, category: '', trained: true });
				}}>+ Add Custom Skill</button>
			</div>
		) : (
			/* Creature mode: simple skill list (original behavior) */
			<>
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
			</>
		)}

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

		{/* ── Passions (character mode) ─────────────────────────────── */}
		{isCharacter && <>
			<h3>Passions</h3>
			{(statblock.passions || []).map((passion, idx)=>(
				<div className="repeatItem" key={idx}>
					<div className="repeatHeader">
						<strong style={{ color: '#f5e6c8', fontSize: '12px' }}>Passion {idx + 1}</strong>
						<div className="repeatControls">
							<button onClick={()=>moveItem('passions', idx, -1)}>▲</button>
							<button onClick={()=>moveItem('passions', idx, 1)}>▼</button>
							<button onClick={()=>removeItem('passions', idx)}>✕</button>
						</div>
					</div>
					<div className="formRow">
						{field('Name', `passions.${idx}.name`)}
						{field('Value %', `passions.${idx}.value`, 'number')}
					</div>
				</div>
			))}
			<button className="addButton" onClick={()=>addItem('passions', { name: '', value: 60 })}>+ Add Passion</button>
		</>}

		{/* ── Allegiances (character mode) ──────────────────────────── */}
		{isCharacter && <>
			<h3>Allegiances</h3>
			{(statblock.allegiances || []).map((a, idx)=>(
				<div className="repeatItem" key={idx}>
					<div className="repeatHeader">
						<strong style={{ color: '#f5e6c8', fontSize: '12px' }}>Allegiance {idx + 1}</strong>
						<div className="repeatControls">
							<button onClick={()=>moveItem('allegiances', idx, -1)}>▲</button>
							<button onClick={()=>moveItem('allegiances', idx, 1)}>▼</button>
							<button onClick={()=>removeItem('allegiances', idx)}>✕</button>
						</div>
					</div>
					<div className="formRow">
						{field('Name', `allegiances.${idx}.name`)}
						{field('Value', `allegiances.${idx}.value`, 'number')}
					</div>
				</div>
			))}
			<button className="addButton" onClick={()=>addItem('allegiances', { name: '', value: 0 })}>+ Add Allegiance</button>
		</>}

		{/* ── Equipment (character mode) ────────────────────────────── */}
		{isCharacter && <>
			<h3>Equipment &amp; Gear</h3>
			{field('Wealth', 'wealth')}
			{(statblock.equipment || []).map((item, idx)=>(
				<div className="repeatItem" key={idx}>
					<div className="repeatHeader">
						<strong style={{ color: '#f5e6c8', fontSize: '12px' }}>Item {idx + 1}</strong>
						<div className="repeatControls">
							<button onClick={()=>moveItem('equipment', idx, -1)}>▲</button>
							<button onClick={()=>moveItem('equipment', idx, 1)}>▼</button>
							<button onClick={()=>removeItem('equipment', idx)}>✕</button>
						</div>
					</div>
					<div className="formRow">
						{field('Name', `equipment.${idx}.name`)}
						{field('Qty', `equipment.${idx}.quantity`, 'number')}
					</div>
					{field('Notes', `equipment.${idx}.notes`)}
				</div>
			))}
			<button className="addButton" onClick={()=>addItem('equipment', { name: '', quantity: 1, notes: '' })}>+ Add Equipment</button>
		</>}

		{/* ── Experience (character mode) ───────────────────────────── */}
		{isCharacter && <>
			<h3>Experience</h3>
			{field('Experience Points', 'experiencePoints', 'number')}
		</>}

		{/* ── Background (character mode) ──────────────────────────── */}
		{isCharacter && <>
			<h3>Background</h3>
			{field('Background', 'background', 'textarea')}
		</>}

		{/* ── Notes ─────────────────────────────────────────────────── */}
		<h3>Notes</h3>
		{field('Notes', 'notes', 'textarea')}
	</div>;
};

export default BrpStatblockForm;
