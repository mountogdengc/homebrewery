import React, { useCallback } from 'react';
import {
	ATTRIBUTE_GROUPS, ATTRIBUTE_LABELS, ALL_ATTRIBUTES,
	ATTACK_DOMAINS, DOMAIN_LABELS,
	HEALTH_TRACKS, getTrackBoxes, getDefTN
} from '@shared/willowlightStatblock/constants.js';

const WillowlightStatblockForm = ({ statblock, onChange })=>{

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
		return <label>
			<span>{label}</span>
			<input type={type} value={val ?? ''} onChange={(e)=>{
				update(path, type === 'number' ? (e.target.value === '' ? null : Number(e.target.value)) : e.target.value);
			}} />
		</label>;
	};

	const attrs = statblock.attributes || {};

	// ── Repeat helpers ─────────────────────────────────────────────
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

	const attrOptions = ALL_ATTRIBUTES.map((a)=>({ value: a, label: ATTRIBUTE_LABELS[a] }));

	// Dot selector component
	const DotSelector = ({ path, max = 5 })=>{
		const keys = path.split('.');
		let val = statblock;
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
		<div className="formRow">
			{field('Path', 'path')}
			{field('Conviction', 'conviction')}
		</div>
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

		{/* ── Health Tracks ─────────────────────────────────────────── */}
		<h3>Health Tracks</h3>
		{HEALTH_TRACKS.map((track)=>{
			const attrVal = attrs[track.baseAttr] || 0;
			const derived = getTrackBoxes(track.base, attrVal);
			const defTN = getDefTN(attrVal);
			const overrideKey = `${track.key}Override`;
			return <div key={track.key} style={{ marginBottom: '8px', padding: '6px 8px', background: '#252538', borderRadius: '4px' }}>
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
					<span style={{ color: '#c0c0d8', fontWeight: 600, fontSize: '13px' }}>{track.label}</span>
					<span style={{ color: '#666', fontSize: '12px' }}>
						{derived} boxes | DEF TN {defTN}
					</span>
				</div>
				<label style={{ marginTop: '4px' }}>
					<span>Override Boxes</span>
					<input type="number" value={statblock[overrideKey] ?? ''}
						placeholder={derived}
						onChange={(e)=>update(overrideKey, e.target.value === '' ? null : Number(e.target.value))} />
				</label>
			</div>;
		})}

		{/* ── Skills ───────────────────────────────────────────────── */}
		<h3>Skills</h3>
		<div style={{ marginBottom: '8px' }}>
			<div style={{ color: '#8a8aad', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Vocation</div>
			<div className="formRow">
				{field('Name', 'vocation.name')}
				{field('Bonus', 'vocation.bonus', 'number')}
			</div>
		</div>

		<div style={{ color: '#8a8aad', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Interests (+2)</div>
		{statblock.interests?.map((interest, idx)=>(
			<div className="repeatItem" key={idx}>
				<div className="repeatHeader">
					<strong style={{ color: '#f5e6c8', fontSize: '12px' }}>Interest {idx + 1}</strong>
					<div className="repeatControls">
						<button onClick={()=>removeItem('interests', idx)}>✕</button>
					</div>
				</div>
				{field('Name', `interests.${idx}.name`)}
			</div>
		))}
		<button className="addButton" onClick={()=>addItem('interests', { name: '', bonus: 2 })}>+ Add Interest</button>

		<div style={{ color: '#8a8aad', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px', marginTop: '8px' }}>Hobbies (+1)</div>
		{statblock.hobbies?.map((hobby, idx)=>(
			<div className="repeatItem" key={idx}>
				<div className="repeatHeader">
					<strong style={{ color: '#f5e6c8', fontSize: '12px' }}>Hobby {idx + 1}</strong>
					<div className="repeatControls">
						<button onClick={()=>removeItem('hobbies', idx)}>✕</button>
					</div>
				</div>
				{field('Name', `hobbies.${idx}.name`)}
			</div>
		))}
		<button className="addButton" onClick={()=>addItem('hobbies', { name: '', bonus: 1 })}>+ Add Hobby</button>

		{/* ── Attacks ──────────────────────────────────────────────── */}
		<h3>Attacks</h3>
		{statblock.attacks?.map((attack, idx)=>(
			<div className="repeatItem" key={idx}>
				<div className="repeatHeader">
					<strong style={{ color: '#f5e6c8', fontSize: '12px' }}>Attack {idx + 1}</strong>
					<div className="repeatControls">
						<button onClick={()=>moveItem('attacks', idx, -1)}>▲</button>
						<button onClick={()=>moveItem('attacks', idx, 1)}>▼</button>
						<button onClick={()=>removeItem('attacks', idx)}>✕</button>
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
		{statblock.edges?.map((edge, idx)=>(
			<div className="repeatItem" key={idx}>
				<div className="repeatHeader">
					<strong style={{ color: '#f5e6c8', fontSize: '12px' }}>Edge {idx + 1}</strong>
					<div className="repeatControls">
						<button onClick={()=>removeItem('edges', idx)}>✕</button>
					</div>
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
		{statblock.aspects?.map((aspect, idx)=>(
			<div className="repeatItem" key={idx}>
				<div className="repeatHeader">
					<strong style={{ color: '#f5e6c8', fontSize: '12px' }}>Aspect {idx + 1}</strong>
					<div className="repeatControls">
						<button onClick={()=>removeItem('aspects', idx)}>✕</button>
					</div>
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
		{statblock.burdens?.map((burden, idx)=>(
			<div className="repeatItem" key={idx}>
				<div className="repeatHeader">
					<strong style={{ color: '#f5e6c8', fontSize: '12px' }}>Burden {idx + 1}</strong>
					<div className="repeatControls">
						<button onClick={()=>removeItem('burdens', idx)}>✕</button>
					</div>
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

		{/* ── Notes ─────────────────────────────────────────────────── */}
		<h3>Notes</h3>
		{field('Notes', 'notes', 'textarea')}
	</div>;
};

export default WillowlightStatblockForm;
