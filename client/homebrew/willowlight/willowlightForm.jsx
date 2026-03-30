import React, { useCallback } from 'react';
import {
	ATTRIBUTE_GROUPS, ATTRIBUTE_LABELS, ALL_ATTRIBUTES,
	ATTACK_DOMAINS, DOMAIN_LABELS,
	HEALTH_TRACKS, getTrackBoxes
} from '@shared/willowlight/constants.js';

const WillowlightForm = ({ character, onChange })=>{

	const update = useCallback((path, value)=>{
		const updated = JSON.parse(JSON.stringify(character));
		const keys = path.split('.');
		let obj = updated;
		for (let i = 0; i < keys.length - 1; i++) {
			if(keys[i].match(/^\d+$/)) keys[i] = parseInt(keys[i]);
			obj = obj[keys[i]];
		}
		const lastKey = keys[keys.length - 1].match(/^\d+$/) ? parseInt(keys[keys.length - 1]) : keys[keys.length - 1];
		obj[lastKey] = value;
		onChange(updated);
	}, [character, onChange]);

	const field = (label, path, type = 'text', opts = {})=>{
		const keys = path.split('.');
		let val = character;
		for (const k of keys) val = val?.[k];

		if(type === 'select') {
			return <label>
				<span>{label}</span>
				<select value={val || ''} onChange={(e)=>update(path, e.target.value)}>
					{opts.allowEmpty && <option value="">—</option>}
					{opts.options?.map((o)=>{
						const optVal = typeof o === 'object' ? o.value : o;
						const optLabel = typeof o === 'object' ? o.label : o;
						return <option key={optVal} value={optVal}>{optLabel}</option>;
					})}
				</select>
			</label>;
		}
		if(type === 'textarea') {
			return <label style={{ alignItems: 'flex-start' }}>
				<span>{label}</span>
				<textarea value={val || ''} onChange={(e)=>update(path, e.target.value)} />
			</label>;
		}
		if(type === 'checkbox') {
			return <label>
				<span>{label}</span>
				<input type="checkbox" checked={!!val} onChange={(e)=>update(path, e.target.checked)} />
			</label>;
		}
		return <label>
			<span>{label}</span>
			<input type={type} value={val ?? ''} onChange={(e)=>{
				update(path, type === 'number' ? (e.target.value === '' ? null : Number(e.target.value)) : e.target.value);
			}} />
		</label>;
	};

	const attrs = character.attributes || {};

	const addItem = (path, item)=>{
		const updated = JSON.parse(JSON.stringify(character));
		const keys = path.split('.');
		let arr = updated;
		for (const k of keys) arr = arr[k];
		arr.push(item);
		onChange(updated);
	};

	const removeItem = (path, idx)=>{
		const updated = JSON.parse(JSON.stringify(character));
		const keys = path.split('.');
		let arr = updated;
		for (const k of keys) arr = arr[k];
		arr.splice(idx, 1);
		onChange(updated);
	};

	const moveItem = (path, idx, dir)=>{
		const updated = JSON.parse(JSON.stringify(character));
		const keys = path.split('.');
		let arr = updated;
		for (const k of keys) arr = arr[k];
		const newIdx = idx + dir;
		if(newIdx < 0 || newIdx >= arr.length) return;
		[arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
		onChange(updated);
	};

	const attrOptions = ALL_ATTRIBUTES.map((a)=>({ value: a, label: ATTRIBUTE_LABELS[a] }));

	const DotSelector = ({ path, max = 5 })=>{
		const keys = path.split('.');
		let val = character;
		for (const k of keys) val = val?.[k];
		val = val || 0;
		return <div className="wlDotSelector">
			{Array.from({ length: max }, (_, i)=>(
				<button key={i}
					className={`wlDotBtn ${i < val ? 'filled' : ''}`}
					onClick={()=>update(path, i < val ? i : i + 1)}
				/>
			))}
		</div>;
	};

	return <div className="statblockForm">
		{/* ── Identity ─────────────────────────────────────────────── */}
		<h3>Identity</h3>
		{field('Name', 'name')}
		{field('Player', 'player')}
		<div className="formRow">
			{field('Conviction', 'conviction')}
			{field('Path', 'path')}
		</div>
		<div className="formRow">
			{field('Age', 'age')}
			{field('Gender', 'gender')}
			{field('Height', 'height')}
			{field('Weight', 'weight')}
		</div>
		{field('Short Description', 'shortDescription')}
		{field('Description', 'description', 'textarea')}
		{field('Source', 'source')}

		{/* ── Attributes ───────────────────────────────────────────── */}
		<h3>Attributes</h3>
		{Object.entries(ATTRIBUTE_GROUPS).map(([groupKey, group])=>(
			<div key={groupKey} style={{ marginBottom: '12px' }}>
				<div style={{ color: '#8a8aad', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
					{group.label}
				</div>
				{group.attrs.map((attr)=>(
					<div key={attr} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
						<span style={{ width: '90px', color: '#c0c0d8', fontSize: '13px' }}>{ATTRIBUTE_LABELS[attr]}</span>
						<DotSelector path={`attributes.${attr}`} />
						<span style={{ color: '#666', fontSize: '12px', minWidth: '16px' }}>{attrs[attr] || 0}</span>
					</div>
				))}
			</div>
		))}

		{/* ── Scale ────────────────────────────────────────────────── */}
		<h3>Scale</h3>
		<div className="formRow">
			{field('Physical', 'scale.physical')}
			{field('Mental', 'scale.mental')}
			{field('Social', 'scale.social')}
		</div>

		{/* ── Health Tracks ─────────────────────────────────────────── */}
		<h3>Health Tracks</h3>
		{HEALTH_TRACKS.map((track)=>{
			const attrVal = attrs[track.baseAttr] || 0;
			const derived = getTrackBoxes(track.base, attrVal);
			const overrideKey = `${track.key}Override`;
			return <div key={track.key} style={{ marginBottom: '8px', padding: '6px 8px', background: '#252538', borderRadius: '4px' }}>
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
					<span style={{ color: '#c0c0d8', fontWeight: 600, fontSize: '13px' }}>{track.label}</span>
					<span style={{ color: '#666', fontSize: '12px' }}>{derived} boxes</span>
				</div>
				<label style={{ marginTop: '4px' }}>
					<span>Override Boxes</span>
					<input type="number" value={character[overrideKey] ?? ''}
						placeholder={derived}
						onChange={(e)=>update(overrideKey, e.target.value === '' ? null : Number(e.target.value))} />
				</label>
			</div>;
		})}

		{/* ── Luck / Corruption / XP ───────────────────────────────── */}
		<h3>Luck / Corruption / XP</h3>
		<div className="formRow">
			<label>
				<span>Luck Rating</span>
				<DotSelector path="luckRating" max={3} />
			</label>
			{field('Luck Tokens', 'luckTokens', 'number')}
		</div>
		<div className="formRow">
			{field('Corruption', 'corruption', 'number')}
			{field('Hearth Trigger', 'hearthTrigger')}
		</div>
		<div className="formRow">
			{field('Session XP', 'sessionXP', 'number')}
			{field('Total XP', 'totalXP', 'number')}
			{field('XP Spent', 'xpSpent', 'number')}
			{field('Unspent XP', 'unspentXP', 'number')}
		</div>
		<div className="formRow">
			{field('Wealth Points', 'wealthPoints', 'number')}
			<label>
				<span>Lifestyle</span>
				<DotSelector path="lifestyle" />
			</label>
		</div>
		{field('Downtime', 'downtime')}

		{/* ── Skills ───────────────────────────────────────────────── */}
		<h3>Skills</h3>
		<div style={{ marginBottom: '8px' }}>
			<div style={{ color: '#8a8aad', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Vocation</div>
			<div className="formRow">
				{field('Name', 'vocation.name')}
				{field('Bonus', 'vocation.bonus', 'number')}
			</div>
			{field('Domain Focus', 'domainFocus')}
		</div>
		<div style={{ color: '#8a8aad', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Interests (+2)</div>
		{character.interests?.map((_, idx)=>(
			<div className="repeatItem" key={idx}>
				<div className="repeatHeader">
					<strong style={{ color: '#f5e6c8', fontSize: '12px' }}>Interest {idx + 1}</strong>
					<div className="repeatControls"><button onClick={()=>removeItem('interests', idx)}>&#10005;</button></div>
				</div>
				{field('Name', `interests.${idx}.name`)}
			</div>
		))}
		<button className="addButton" onClick={()=>addItem('interests', { name: '', bonus: 2 })}>+ Add Interest</button>

		<div style={{ color: '#8a8aad', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px', marginTop: '8px' }}>Hobbies (+1)</div>
		{character.hobbies?.map((_, idx)=>(
			<div className="repeatItem" key={idx}>
				<div className="repeatHeader">
					<strong style={{ color: '#f5e6c8', fontSize: '12px' }}>Hobby {idx + 1}</strong>
					<div className="repeatControls"><button onClick={()=>removeItem('hobbies', idx)}>&#10005;</button></div>
				</div>
				{field('Name', `hobbies.${idx}.name`)}
			</div>
		))}
		<button className="addButton" onClick={()=>addItem('hobbies', { name: '', bonus: 1 })}>+ Add Hobby</button>

		{/* ── Attacks ──────────────────────────────────────────────── */}
		<h3>Attacks</h3>
		{character.attacks?.map((_, idx)=>(
			<div className="repeatItem" key={idx}>
				<div className="repeatHeader">
					<strong style={{ color: '#f5e6c8', fontSize: '12px' }}>Attack {idx + 1}</strong>
					<div className="repeatControls">
						<button onClick={()=>moveItem('attacks', idx, -1)}>&#9650;</button>
						<button onClick={()=>moveItem('attacks', idx, 1)}>&#9660;</button>
						<button onClick={()=>removeItem('attacks', idx)}>&#10005;</button>
					</div>
				</div>
				{field('Name', `attacks.${idx}.name`)}
				<div className="formRow">
					{field('Domain', `attacks.${idx}.domain`, 'select', {
						options: ATTACK_DOMAINS.map((d)=>({ value: d, label: DOMAIN_LABELS[d] })),
						allowEmpty: true
					})}
					{field('Attribute', `attacks.${idx}.attribute`, 'select', { options: attrOptions, allowEmpty: true })}
				</div>
				<div className="formRow">
					{field('Skill', `attacks.${idx}.skill`)}
					{field('Modifier', `attacks.${idx}.modifier`, 'number')}
					{field('Rating', `attacks.${idx}.rating`)}
				</div>
			</div>
		))}
		<button className="addButton" onClick={()=>addItem('attacks', { name: '', domain: 'P', attribute: '', skill: '', modifier: 0, rating: '' })}>+ Add Attack</button>

		{/* ── Edges ────────────────────────────────────────────────── */}
		<h3>Edges</h3>
		{character.edges?.map((edge, idx)=>(
			<div className="repeatItem" key={idx}>
				<div className="repeatHeader">
					<strong style={{ color: '#f5e6c8', fontSize: '12px' }}>Edge {idx + 1}</strong>
					<div className="repeatControls"><button onClick={()=>removeItem('edges', idx)}>&#10005;</button></div>
				</div>
				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<label style={{ flex: 1 }}>
						<span>Name</span>
						<input type="text" value={edge.name || ''} onChange={(e)=>update(`edges.${idx}.name`, e.target.value)} />
					</label>
					<DotSelector path={`edges.${idx}.dots`} />
				</div>
			</div>
		))}
		<button className="addButton" onClick={()=>addItem('edges', { name: '', dots: 1 })}>+ Add Edge</button>

		{/* ── Aspects ──────────────────────────────────────────────── */}
		<h3>Aspects</h3>
		{character.aspects?.map((aspect, idx)=>(
			<div className="repeatItem" key={idx}>
				<div className="repeatHeader">
					<strong style={{ color: '#f5e6c8', fontSize: '12px' }}>Aspect {idx + 1}</strong>
					<div className="repeatControls"><button onClick={()=>removeItem('aspects', idx)}>&#10005;</button></div>
				</div>
				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<label style={{ flex: 1 }}>
						<span>Name</span>
						<input type="text" value={aspect.name || ''} onChange={(e)=>update(`aspects.${idx}.name`, e.target.value)} />
					</label>
					<DotSelector path={`aspects.${idx}.dots`} />
				</div>
			</div>
		))}
		<button className="addButton" onClick={()=>addItem('aspects', { name: '', dots: 1 })}>+ Add Aspect</button>

		{/* ── Burdens ──────────────────────────────────────────────── */}
		<h3>Burdens</h3>
		{character.burdens?.map((burden, idx)=>(
			<div className="repeatItem" key={idx}>
				<div className="repeatHeader">
					<strong style={{ color: '#f5e6c8', fontSize: '12px' }}>Burden {idx + 1}</strong>
					<div className="repeatControls"><button onClick={()=>removeItem('burdens', idx)}>&#10005;</button></div>
				</div>
				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<label style={{ flex: 1 }}>
						<span>Name</span>
						<input type="text" value={burden.name || ''} onChange={(e)=>update(`burdens.${idx}.name`, e.target.value)} />
					</label>
					<DotSelector path={`burdens.${idx}.dots`} />
				</div>
			</div>
		))}
		<button className="addButton" onClick={()=>addItem('burdens', { name: '', dots: 1 })}>+ Add Burden</button>

		{/* ── Milestones ───────────────────────────────────────────── */}
		<h3>Milestones</h3>
		<div style={{ color: '#8a8aad', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Conviction Milestones</div>
		{character.convictionMilestones?.map((m, idx)=>(
			<div className="formRow" key={idx} style={{ alignItems: 'center' }}>
				<input type="checkbox" checked={!!m.completed}
					onChange={(e)=>update(`convictionMilestones.${idx}.completed`, e.target.checked)}
					style={{ width: 'auto' }} />
				<label style={{ flex: 1 }}>
					<input type="text" value={m.text || ''} placeholder={`Milestone ${idx + 1}`}
						onChange={(e)=>update(`convictionMilestones.${idx}.text`, e.target.value)} />
				</label>
			</div>
		))}

		<div style={{ color: '#8a8aad', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px', marginTop: '8px' }}>Path Milestones</div>
		{character.pathMilestones?.map((m, idx)=>(
			<div className="formRow" key={idx} style={{ alignItems: 'center' }}>
				<input type="checkbox" checked={!!m.completed}
					onChange={(e)=>update(`pathMilestones.${idx}.completed`, e.target.checked)}
					style={{ width: 'auto' }} />
				<label style={{ flex: 1 }}>
					<input type="text" value={m.text || ''} placeholder={`Milestone ${idx + 1}`}
						onChange={(e)=>update(`pathMilestones.${idx}.text`, e.target.value)} />
				</label>
			</div>
		))}

		{/* ── Contacts ─────────────────────────────────────────────── */}
		<h3>Contacts / Enemies / Allies</h3>
		{character.contacts?.map((contact, idx)=>(
			<div className="repeatItem" key={idx}>
				<div className="repeatHeader">
					<strong style={{ color: '#f5e6c8', fontSize: '12px' }}>Contact {idx + 1}</strong>
					<div className="repeatControls">
						<button onClick={()=>moveItem('contacts', idx, -1)}>&#9650;</button>
						<button onClick={()=>moveItem('contacts', idx, 1)}>&#9660;</button>
						<button onClick={()=>removeItem('contacts', idx)}>&#10005;</button>
					</div>
				</div>
				<div className="formRow">
					{field('Name', `contacts.${idx}.name`)}
					{field('Type', `contacts.${idx}.type`, 'select', {
						options: ['Contact', 'Enemy', 'Ally', 'Retainer'],
						allowEmpty: true
					})}
				</div>
				{field('Relationship', `contacts.${idx}.relationship`)}
				<div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '4px' }}>
					<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
						<span style={{ color: '#c0c0d8', fontSize: '12px' }}>Rating</span>
						<DotSelector path={`contacts.${idx}.rating`} />
					</div>
					<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
						<span style={{ color: '#c0c0d8', fontSize: '12px' }}>Health</span>
						<DotSelector path={`contacts.${idx}.health`} />
					</div>
				</div>
				{field('Note', `contacts.${idx}.note`)}
			</div>
		))}
		<button className="addButton" onClick={()=>addItem('contacts', { name: '', health: 1, rating: 1, type: 'Contact', relationship: '', note: '' })}>+ Add Contact</button>

		{/* ── Secrets ──────────────────────────────────────────────── */}
		<h3>Secrets</h3>
		{character.secrets?.map((secret, idx)=>(
			<div className="repeatItem" key={idx}>
				<div className="repeatHeader">
					<strong style={{ color: '#f5e6c8', fontSize: '12px' }}>Secret {idx + 1}</strong>
					<div className="repeatControls">
						<button onClick={()=>removeItem('secrets', idx)}>&#10005;</button>
					</div>
				</div>
				{field('Name', `secrets.${idx}.name`)}
				<div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
					<span style={{ color: '#c0c0d8', fontSize: '12px' }}>Weight</span>
					<DotSelector path={`secrets.${idx}.weight`} max={3} />
				</div>
				<div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
					<span style={{ color: '#c0c0d8', fontSize: '12px' }}>Spread</span>
					{[0, 1, 2].map((si)=>(
						<input key={si} type="checkbox"
							checked={!!(secret.spread && secret.spread[si])}
							onChange={(e)=>{
								const updated = JSON.parse(JSON.stringify(character));
								if(!updated.secrets[idx].spread) updated.secrets[idx].spread = [false, false, false];
								updated.secrets[idx].spread[si] = e.target.checked;
								onChange(updated);
							}}
							style={{ width: 'auto' }} />
					))}
				</div>
				{field('Containment Plan', `secrets.${idx}.containmentPlan`, 'textarea')}
				{field('Contacts', `secrets.${idx}.contacts`)}
			</div>
		))}
		<button className="addButton" onClick={()=>addItem('secrets', { name: '', weight: 1, spread: [false, false, false], containmentPlan: '', contacts: '' })}>+ Add Secret</button>

		{/* ── Afflictions ──────────────────────────────────────────── */}
		<h3>Afflictions &amp; Conditions</h3>
		<div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', marginBottom: '8px' }}>
			{['terrified', 'discredited', 'stunned', 'prone', 'blinded', 'disoriented', 'restrained', 'slowed', 'disarmed', 'dying'].map((aff)=>(
				<label key={aff} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
					<input type="checkbox" checked={!!(character.afflictions && character.afflictions[aff])}
						onChange={(e)=>update(`afflictions.${aff}`, e.target.checked)}
						style={{ width: 'auto' }} />
					<span style={{ textTransform: 'capitalize', color: '#c0c0d8', fontSize: '12px' }}>{aff}</span>
				</label>
			))}
		</div>
		{field('Other Conditions', 'afflictions.other')}

		{/* ── Equipment ────────────────────────────────────────────── */}
		<h3>Equipment &amp; Gear</h3>
		{character.equipment?.map((item, idx)=>(
			<div className="repeatItem" key={idx}>
				<div className="repeatHeader">
					<strong style={{ color: '#f5e6c8', fontSize: '12px' }}>Item {idx + 1}</strong>
					<div className="repeatControls"><button onClick={()=>removeItem('equipment', idx)}>&#10005;</button></div>
				</div>
				{field('Name', `equipment.${idx}.name`)}
			</div>
		))}
		<button className="addButton" onClick={()=>addItem('equipment', { name: '' })}>+ Add Item</button>

		{/* ── Notes ─────────────────────────────────────────────────── */}
		<h3>Notes</h3>
		{field('Notes', 'notes', 'textarea')}
	</div>;
};

export default WillowlightForm;
