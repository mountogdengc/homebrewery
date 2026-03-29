import '../../willowlightStatblock/willowlightStatblock.less';
import '../../statblock/statblock.less';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import request from '../../utils/request-middleware.js';
import { createEmptyWillowlightStatblock } from '@shared/willowlightStatblock/schema.js';

import SplitPane                    from '../../../components/splitPane/splitPane.jsx';
import WillowlightStatblockForm     from '../../willowlightStatblock/willowlightStatblockForm.jsx';
import WillowlightStatblockPreview  from '../../willowlightStatblock/willowlightStatblockPreview.jsx';

import AiGenerateButton from '../../components/aiGenerate/aiGenerateButton.jsx';
import Nav             from '@navbar/nav.jsx';
import Navbar          from '@navbar/navbar.jsx';
import AccountNavItem  from '@navbar/account.navitem.jsx';

const SAVE_TIMEOUT = 3000;

const WillowlightStatblockEditorPage = (props)=>{
	const initial = props.willowlightStatblock || createEmptyWillowlightStatblock();
	const [statblock, setStatblock] = useState(initial);
	const [editId, setEditId] = useState(props.willowlightStatblock?.editId || null);
	const [shareId, setShareId] = useState(props.willowlightStatblock?.shareId || null);
	const [isSaving, setIsSaving] = useState(false);
	const [layout, setLayout] = useState('narrow');
	const [hasChanges, setHasChanges] = useState(false);
	const [error, setError] = useState(null);
	const saveTimeout = useRef(null);
	const [conceptPrompt, setConceptPrompt] = useState('');
	const [isGeneratingFlavor, setIsGeneratingFlavor] = useState(false);
	const [flavorError, setFlavorError] = useState(null);

	const handleChange = useCallback((updated)=>{
		setStatblock(updated);
		setHasChanges(true);
	}, []);

	const save = useCallback(async ()=>{
		if(isSaving) return;
		setIsSaving(true);
		setError(null);

		try {
			if(editId) {
				const response = await request.put(`/api/willowlight-statblock/${editId}`)
					.send(statblock)
					.timeout({ response: 10000 });
				setStatblock(response.body);
				setHasChanges(false);
			} else {
				const response = await request.post('/api/willowlight-statblock')
					.send(statblock)
					.timeout({ response: 10000 });
				const saved = response.body;
				setStatblock(saved);
				setEditId(saved.editId);
				setShareId(saved.shareId);
				setHasChanges(false);
				window.history.replaceState(null, '', `/willowlight/edit/${saved.editId}`);
			}
		} catch (err) {
			console.error('Save error:', err);
			setError(err?.response?.body?.error || err.message || 'Save failed');
		} finally {
			setIsSaving(false);
		}
	}, [statblock, editId, isSaving]);

	useEffect(()=>{
		if(!hasChanges || !editId) return;
		clearTimeout(saveTimeout.current);
		saveTimeout.current = setTimeout(save, SAVE_TIMEOUT);
		return ()=>clearTimeout(saveTimeout.current);
	}, [statblock, hasChanges, editId]);

	useEffect(()=>{
		const handleKeyDown = (e)=>{
			if((e.ctrlKey || e.metaKey) && e.key === 's') {
				e.preventDefault();
				save();
			}
		};
		document.addEventListener('keydown', handleKeyDown);
		return ()=>document.removeEventListener('keydown', handleKeyDown);
	}, [save]);

	const handleAiGenerate = useCallback((data)=>{
		if(data._conceptPrompt) setConceptPrompt(data._conceptPrompt);
		handleChange({ ...statblock, ...data });
	}, [statblock, handleChange]);

	const handleGenerateFlavor = useCallback(async ()=>{
		if(isGeneratingFlavor) return;
		setIsGeneratingFlavor(true);
		setFlavorError(null);

		try {
			const res = await request.post('/api/ai/generate/willowlight-flavor')
				.send({ concept: conceptPrompt || statblock.name || 'Willowlight character', statBlock: statblock })
				.timeout({ response: 180000 });

			const flavor = res.body;
			const updated = { ...statblock };

			if(flavor.description) updated.description = flavor.description;
			if(flavor.lore) updated.lore = flavor.lore;

			if(flavor.edge_flavor && updated.edges) {
				for (const ef of flavor.edge_flavor) {
					const edge = updated.edges.find((e)=>e.name?.toLowerCase() === ef.name?.toLowerCase());
					if(edge) edge.flavor = ef.flavor;
				}
			}
			if(flavor.aspect_flavor && updated.aspects) {
				for (const af of flavor.aspect_flavor) {
					const aspect = updated.aspects.find((a)=>a.name?.toLowerCase() === af.name?.toLowerCase());
					if(aspect) aspect.flavor = af.flavor;
				}
			}
			if(flavor.burden_flavor && updated.burdens) {
				for (const bf of flavor.burden_flavor) {
					const burden = updated.burdens.find((b)=>b.name?.toLowerCase() === bf.name?.toLowerCase());
					if(burden) burden.flavor = bf.flavor;
				}
			}

			if(flavor.encounter_hooks && flavor.encounter_hooks.length > 0) {
				const hookText = flavor.encounter_hooks.map((h)=>`${h.title}: ${h.description}`).join('\n\n');
				updated.notes = (updated.notes ? updated.notes + '\n\n' : '') + '── Encounter Hooks ──\n\n' + hookText;
			}

			handleChange(updated);
		} catch (err) {
			console.error('Flavor generation failed:', err);
			setFlavorError(err?.response?.body?.error || err.message || 'Flavor generation failed');
			setTimeout(()=>setFlavorError(null), 5000);
		} finally {
			setIsGeneratingFlavor(false);
		}
	}, [statblock, conceptPrompt, isGeneratingFlavor, handleChange]);

	const [copied, setCopied] = useState(false);
	const [bw, setBw] = useState(false);
	const toggleLayout = ()=>setLayout((l)=>l === 'narrow' ? 'wide' : 'narrow');
	const toggleBw = ()=>setBw((b)=>!b);

	const copyEmbed = ()=>{
		if(!shareId) return;
		const opts = [layout === 'wide' ? 'wide' : '', bw ? 'bw' : ''].filter(Boolean).join(',');
		const code = opts ? `{{willowlight-statblock:${shareId}|${opts}}}` : `{{willowlight-statblock:${shareId}}}`;
		navigator.clipboard.writeText(code).then(()=>{
			setCopied(true);
			setTimeout(()=>setCopied(false), 2000);
		});
	};

	return (
		<div className="willowlightStatblockEditorPage">
			<Navbar>
				<Nav.logo />
				<Nav.section>
					<Nav.item className="statblockTitle" color="blue">
						{statblock.name || 'New Willowlight Stat Block'}
					</Nav.item>
					<Nav.item icon="fas fa-th-list" onClick={()=>{ window.location.href = '/willowlight/library'; }}>
						Library
					</Nav.item>
				</Nav.section>

				<Nav.section>
					<Nav.item
						className="layoutToggle"
						icon={layout === 'narrow' ? 'fas fa-columns' : 'fas fa-align-justify'}
						onClick={toggleLayout}
					>
						{layout === 'narrow' ? 'Wide' : 'Narrow'}
					</Nav.item>

					<Nav.item
						icon={bw ? 'fas fa-palette' : 'fas fa-adjust'}
						onClick={toggleBw}
					>
						{bw ? 'Color' : 'B&W'}
					</Nav.item>

					{shareId && (
						<Nav.item icon={copied ? 'fas fa-check' : 'fas fa-code'} onClick={copyEmbed}>
							{copied ? 'Copied!' : 'Copy Embed'}
						</Nav.item>
					)}

					{error && <Nav.item color="red">{error}</Nav.item>}

					<Nav.item
						className="save"
						icon={isSaving ? 'fas fa-spinner fa-spin' : 'fas fa-save'}
						onClick={save}
					>
						{isSaving ? 'Saving...' : (hasChanges ? 'Save' : 'Saved')}
					</Nav.item>

					<AccountNavItem />
				</Nav.section>
			</Navbar>

			<div className="content">
				<SplitPane showDividerButtons={false}>
					<div style={{ overflow: 'auto', height: '100%' }}>
						<div style={{ padding: '12px 12px 0', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
							<AiGenerateButton
								endpoint="/api/ai/generate/willowlight-statblock"
								onGenerated={handleAiGenerate}
							/>
							{statblock.name && (
								<button
									className="aiGenerateBtn"
									onClick={handleGenerateFlavor}
									disabled={isGeneratingFlavor}
									style={{ background: isGeneratingFlavor ? '#444' : undefined }}
								>
									{isGeneratingFlavor
										? <><i className="fas fa-spinner fa-spin" /> Generating Flavor...</>
										: <><i className="fas fa-feather-alt" /> Generate Flavor</>
									}
								</button>
							)}
							{flavorError && <span style={{ color: '#ff6b6b', fontSize: '13px' }}>{flavorError}</span>}
						</div>
						<WillowlightStatblockForm statblock={statblock} onChange={handleChange} />
					</div>
					<WillowlightStatblockPreview statblock={statblock} layout={layout} bw={bw} />
				</SplitPane>
			</div>
		</div>
	);
};

export default WillowlightStatblockEditorPage;
