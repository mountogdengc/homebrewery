import '../../willowlight/willowlight.less';
import '../../statblock/statblock.less';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import request from '../../utils/request-middleware.js';
import { createEmptyEnemy, ENEMY_TIERS, TIER_LABELS } from '@shared/willowlight/bestiarySchema.js';

import SplitPane from '../../../components/splitPane/splitPane.jsx';
import Nav from '@navbar/nav.jsx';
import Navbar from '@navbar/navbar.jsx';
import AccountNavItem from '@navbar/account.navitem.jsx';
import { npcToFoundry, npcFromFoundry } from '@shared/willowlight/foundryConverter.js';

const SAVE_TIMEOUT = 3000;

const DOMAIN_ORDER = ['mental', 'physical', 'social'];
const DOMAIN_LABELS = { mental: 'Mental', physical: 'Physical', social: 'Social' };

const BestiaryEditorPage = (props)=>{
	const initial = props.willowlightBestiary || createEmptyEnemy();
	const [enemy, setEnemy] = useState(initial);
	const [editId, setEditId] = useState(props.willowlightBestiary?.editId || null);
	const [shareId, setShareId] = useState(props.willowlightBestiary?.shareId || null);
	const [isSaving, setIsSaving] = useState(false);
	const [hasChanges, setHasChanges] = useState(false);
	const [error, setError] = useState(null);
	const saveTimeout = useRef(null);

	const handleChange = useCallback((updated)=>{
		setEnemy(updated);
		setHasChanges(true);
	}, []);

	const update = useCallback((path, value)=>{
		const updated = JSON.parse(JSON.stringify(enemy));
		const keys = path.split('.');
		let obj = updated;
		for (let i = 0; i < keys.length - 1; i++) {
			if(keys[i].match(/^\d+$/)) keys[i] = parseInt(keys[i]);
			obj = obj[keys[i]];
		}
		const lastKey = keys[keys.length - 1].match(/^\d+$/) ? parseInt(keys[keys.length - 1]) : keys[keys.length - 1];
		obj[lastKey] = value;
		handleChange(updated);
	}, [enemy, handleChange]);

	const field = (label, path, type = 'text', opts = {})=>{
		const keys = path.split('.');
		let val = enemy;
		for (const k of keys) val = val?.[k];
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

	const save = useCallback(async ()=>{
		if(isSaving) return;
		setIsSaving(true);
		setError(null);
		try {
			if(editId) {
				const response = await request.put(`/api/willowlight-bestiary/${editId}`)
					.send(enemy).timeout({ response: 10000 });
				setEnemy(response.body);
				setHasChanges(false);
			} else {
				const response = await request.post('/api/willowlight-bestiary')
					.send(enemy).timeout({ response: 10000 });
				const saved = response.body;
				setEnemy(saved);
				setEditId(saved.editId);
				setShareId(saved.shareId);
				setHasChanges(false);
				window.history.replaceState(null, '', `/willowlight/bestiary/edit/${saved.editId}`);
			}
		} catch (err) {
			console.error('Save error:', err);
			setError(err?.response?.body?.error || err.message || 'Save failed');
		} finally {
			setIsSaving(false);
		}
	}, [enemy, editId, isSaving]);

	useEffect(()=>{
		if(!hasChanges || !editId) return;
		clearTimeout(saveTimeout.current);
		saveTimeout.current = setTimeout(save, SAVE_TIMEOUT);
		return ()=>clearTimeout(saveTimeout.current);
	}, [enemy, hasChanges, editId]);

	useEffect(()=>{
		const handleKeyDown = (e)=>{
			if((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); save(); }
		};
		document.addEventListener('keydown', handleKeyDown);
		return ()=>document.removeEventListener('keydown', handleKeyDown);
	}, [save]);

	const addTrait = ()=>{
		const updated = { ...enemy, traits: [...(enemy.traits || []), { name: '', desc: '' }] };
		handleChange(updated);
	};

	const removeTrait = (idx)=>{
		const updated = { ...enemy, traits: enemy.traits.filter((_, i)=>i !== idx) };
		handleChange(updated);
	};

	const tier = enemy.tier || 'mook';
	const isMook = tier === 'mook';
	const hasMultipleTracks = tier === 'boss' || tier === 'legend';
	const hasSingleTrack = tier === 'elite';

	// Simple preview
	const renderPreview = ()=>{
		const e = enemy;
		const scaleStr = DOMAIN_ORDER.map((d)=>`${DOMAIN_LABELS[d].slice(0,4)} ${e.scale?.[d] || 0}`).join(' / ');

		let healthHtml = '';
		if(isMook) {
			healthHtml = `<div style="margin:6px 0"><strong>Group Size:</strong> ${e.size || 0} &nbsp; <strong>Threshold:</strong> ${e.threshold || 0}</div>`;
		} else {
			const tracks = hasMultipleTracks ? ['willpower', 'vitality', 'composure'] : ['composure'];
			healthHtml = tracks.map((t)=>{
				const max = e.health?.[t] || 0;
				if(!max) return '';
				const label = t.charAt(0).toUpperCase() + t.slice(1);
				const boxes = Array(max).fill('&#9633;').join('');
				return `<div style="margin:2px 0"><strong>${label}:</strong> ${boxes} (${max})</div>`;
			}).join('');
		}

		let traitsHtml = '';
		if(isMook && e.trait) {
			traitsHtml = `<div style="margin:6px 0"><strong>Trait:</strong> ${e.trait}</div>`;
		} else if(e.traits?.length) {
			traitsHtml = e.traits.map((t)=>`<div style="margin:4px 0"><strong>${t.name || 'Unnamed'}:</strong> ${t.desc || ''}</div>`).join('');
		}

		return `
			<div class="wl-statblock wl-narrow">
				<div class="wl-header">
					<div class="wl-name">${e.name || 'Unnamed'}</div>
					${e.subtitle ? `<div class="wl-subtitle">${e.subtitle}</div>` : ''}
					<div class="wl-description">${TIER_LABELS[tier]} &nbsp;·&nbsp; ${scaleStr}</div>
				</div>
				<div class="wl-divider"></div>
				<div class="wl-section">
					<div class="wl-section-title">Target Numbers</div>
					<table class="wl-attacks">
						<thead><tr><th>Domain</th><th>Atk TN</th><th>Def TN</th></tr></thead>
						<tbody>${DOMAIN_ORDER.map((d)=>`<tr><td>${DOMAIN_LABELS[d]}</td><td>${e.atkTN?.[d] || 0}</td><td>${e.defTN?.[d] || 0}</td></tr>`).join('')}</tbody>
					</table>
				</div>
				<div class="wl-divider"></div>
				${healthHtml}
				${traitsHtml ? `<div class="wl-section"><div class="wl-section-title">Traits</div>${traitsHtml}</div>` : ''}
				${e.goal ? `<div class="wl-section"><div class="wl-section-title">Goal</div><div class="wl-notes">${e.goal}</div></div>` : ''}
				${e.notes ? `<div class="wl-section"><div class="wl-section-title">Notes</div><div class="wl-notes">${e.notes}</div></div>` : ''}
			</div>`;
	};

	const [showFoundryImport, setShowFoundryImport] = useState(false);
	const [foundryImportText, setFoundryImportText] = useState('');

	const exportFoundryJson = ()=>{
		const foundryData = npcToFoundry(enemy);
		const blob = new Blob([JSON.stringify(foundryData, null, 2)], { type: 'application/json' });
		const link = document.createElement('a');
		link.href = URL.createObjectURL(blob);
		link.download = `${enemy.name || 'willowlight-npc'}-foundry.json`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(link.href);
	};

	const importFoundryJson = ()=>{
		if(!foundryImportText.trim()) return;
		try {
			const data = JSON.parse(foundryImportText);
			const converted = npcFromFoundry(data);
			handleChange({ ...enemy, ...converted });
			setShowFoundryImport(false);
			setFoundryImportText('');
		} catch (e) {
			alert(`Import failed: ${e.message}`);
		}
	};

	return (
		<div className="willowlightEditorPage">
			<Navbar>
				<Nav.section>
					<Nav.item className="statblockTitle" color="blue">
						{enemy.name || 'New Enemy'}
					</Nav.item>
					<Nav.item icon="fas fa-th-list" onClick={()=>{ window.location.href = '/willowlight/bestiary'; }}>
						Bestiary
					</Nav.item>
					<Nav.item icon="fas fa-th-list" onClick={()=>{ window.location.href = '/willowlight/library'; }}>
						Characters
					</Nav.item>
				</Nav.section>
				<Nav.section>
					<Nav.item icon="fas fa-download" onClick={exportFoundryJson}>
						Export Foundry
					</Nav.item>
					<Nav.item icon="fas fa-upload" onClick={()=>setShowFoundryImport(!showFoundryImport)}>
						Import Foundry
					</Nav.item>
					{error && <Nav.item color="red">{error}</Nav.item>}
					<Nav.item className="save" icon={isSaving ? 'fas fa-spinner fa-spin' : 'fas fa-save'} onClick={save}>
						{isSaving ? 'Saving...' : (hasChanges ? 'Save' : 'Saved')}
					</Nav.item>
					<AccountNavItem />
				</Nav.section>
			</Navbar>

			{showFoundryImport && (
				<div style={{ background: '#252538', border: '1px solid #3a3a54', padding: '12px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
					<textarea
						value={foundryImportText}
						onChange={(e)=>setFoundryImportText(e.target.value)}
						placeholder="Paste Foundry VTT NPC JSON here..."
						style={{ flex: 1, minHeight: '80px', background: '#1e1e2e', border: '1px solid #3a3a54', borderRadius: '4px', color: '#e0e0f0', padding: '8px', fontFamily: 'monospace', fontSize: '12px', resize: 'vertical' }}
					/>
					<div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
						<button style={{ background: '#2e7d32', color: '#fff', border: 'none', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer' }} onClick={importFoundryJson}>Import</button>
						<button style={{ background: '#3a3a54', color: '#aaa', border: 'none', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer' }} onClick={()=>{ setShowFoundryImport(false); setFoundryImportText(''); }}>Cancel</button>
					</div>
				</div>
			)}

			<div className="content">
				<SplitPane showDividerButtons={false}>
					<div style={{ overflow: 'auto', height: '100%' }}>
						<div className="statblockForm">
							{/* Identity */}
							<h3>Identity</h3>
							{field('Name', 'name')}
							{field('Subtitle', 'subtitle')}
							<label>
								<span>Tier</span>
								<select value={tier} onChange={(e)=>update('tier', e.target.value)}>
									{ENEMY_TIERS.map((t)=><option key={t} value={t}>{TIER_LABELS[t]}</option>)}
								</select>
							</label>
							{field('Source', 'source')}

							{/* TNs */}
							<h3>Target Numbers</h3>
							{DOMAIN_ORDER.map((d)=>(
								<div className="formRow" key={d}>
									<label style={{ flex: 0, minWidth: '70px', color: '#8a8aad', fontSize: '12px', fontWeight: 600 }}>
										{DOMAIN_LABELS[d]}
									</label>
									{field('Atk', `atkTN.${d}`, 'number')}
									{field('Def', `defTN.${d}`, 'number')}
								</div>
							))}

							{/* Scale */}
							<h3>Scale</h3>
							<div className="formRow">
								{DOMAIN_ORDER.map((d)=>(
									<React.Fragment key={d}>
										{field(DOMAIN_LABELS[d], `scale.${d}`, 'number')}
									</React.Fragment>
								))}
							</div>

							{/* Mook-specific */}
							{isMook && <>
								<h3>Mook Group</h3>
								<div className="formRow">
									{field('Group Size', 'size', 'number')}
									{field('Threshold', 'threshold', 'number')}
								</div>
								{field('Trait', 'trait', 'textarea')}
							</>}

							{/* Health tracks for non-mooks */}
							{(hasSingleTrack || hasMultipleTracks) && <>
								<h3>Health Tracks</h3>
								{hasMultipleTracks && <>
									{field('Willpower', 'health.willpower', 'number')}
									{field('Vitality', 'health.vitality', 'number')}
								</>}
								{field('Composure', 'health.composure', 'number')}
							</>}

							{/* Traits for non-mooks */}
							{!isMook && <>
								<h3>Traits</h3>
								{(enemy.traits || []).map((t, idx)=>(
									<div className="repeatItem" key={idx}>
										<div className="repeatHeader">
											<strong style={{ color: '#f5e6c8', fontSize: '12px' }}>Trait {idx + 1}</strong>
											<div className="repeatControls">
												<button onClick={()=>removeTrait(idx)}>&#10005;</button>
											</div>
										</div>
										{field('Name', `traits.${idx}.name`)}
										{field('Description', `traits.${idx}.desc`, 'textarea')}
									</div>
								))}
								<button className="addButton" onClick={addTrait}>+ Add Trait</button>
							</>}

							{/* Goal & Notes */}
							<h3>Behavior</h3>
							{field('Goal', 'goal', 'textarea')}
							{field('Notes', 'notes', 'textarea')}
						</div>
					</div>
					<div className="willowlightStatblockPreview">
						<div dangerouslySetInnerHTML={{ __html: renderPreview() }} />
					</div>
				</SplitPane>
			</div>
		</div>
	);
};

export default BestiaryEditorPage;
