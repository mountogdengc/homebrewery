import '../../willowlight/willowlight.less';
import '../../statblock/statblock.less';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import request from '../../utils/request-middleware.js';
import { createEmptyWillowlightCharacter } from '@shared/willowlight/schema.js';

import SplitPane                    from '../../../components/splitPane/splitPane.jsx';
import WillowlightForm             from '../../willowlight/willowlightForm.jsx';
import WillowlightStatblockPreview from '../../willowlight/willowlightStatblockPreview.jsx';
import WillowlightSheetPreview     from '../../willowlight/willowlightSheetPreview.jsx';

import AiGenerateButton from '../../components/aiGenerate/aiGenerateButton.jsx';
import Nav             from '@navbar/nav.jsx';
import Navbar          from '@navbar/navbar.jsx';
import AccountNavItem  from '@navbar/account.navitem.jsx';

const SAVE_TIMEOUT = 3000;

const WillowlightEditorPage = (props)=>{
	const initial = props.willowlightCharacter || createEmptyWillowlightCharacter();
	const [character, setCharacter] = useState(initial);
	const [editId, setEditId] = useState(props.willowlightCharacter?.editId || null);
	const [shareId, setShareId] = useState(props.willowlightCharacter?.shareId || null);
	const [isSaving, setIsSaving] = useState(false);
	const [layout, setLayout] = useState('narrow');
	const [bw, setBw] = useState(false);
	const [previewMode, setPreviewMode] = useState('statblock'); // 'statblock' or 'sheet'
	const [hasChanges, setHasChanges] = useState(false);
	const [error, setError] = useState(null);
	const saveTimeout = useRef(null);
	const [conceptPrompt, setConceptPrompt] = useState('');
	const [isGeneratingFlavor, setIsGeneratingFlavor] = useState(false);
	const [flavorError, setFlavorError] = useState(null);

	const handleChange = useCallback((updated)=>{
		setCharacter(updated);
		setHasChanges(true);
	}, []);

	const save = useCallback(async ()=>{
		if(isSaving) return;
		setIsSaving(true);
		setError(null);

		try {
			if(editId) {
				const response = await request.put(`/api/willowlight/${editId}`)
					.send(character).timeout({ response: 10000 });
				setCharacter(response.body);
				setHasChanges(false);
			} else {
				const response = await request.post('/api/willowlight')
					.send(character).timeout({ response: 10000 });
				const saved = response.body;
				setCharacter(saved);
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
	}, [character, editId, isSaving]);

	useEffect(()=>{
		if(!hasChanges || !editId) return;
		clearTimeout(saveTimeout.current);
		saveTimeout.current = setTimeout(save, SAVE_TIMEOUT);
		return ()=>clearTimeout(saveTimeout.current);
	}, [character, hasChanges, editId]);

	useEffect(()=>{
		const handleKeyDown = (e)=>{
			if((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); save(); }
		};
		document.addEventListener('keydown', handleKeyDown);
		return ()=>document.removeEventListener('keydown', handleKeyDown);
	}, [save]);

	const handleAiGenerate = useCallback((data)=>{
		if(data._conceptPrompt) setConceptPrompt(data._conceptPrompt);
		handleChange({ ...character, ...data });
	}, [character, handleChange]);

	const handleGenerateFlavor = useCallback(async ()=>{
		if(isGeneratingFlavor) return;
		setIsGeneratingFlavor(true);
		setFlavorError(null);

		try {
			const res = await request.post('/api/ai/generate/willowlight-character-flavor')
				.send({ concept: conceptPrompt || character.name || 'Willowlight character', statBlock: character })
				.timeout({ response: 180000 });

			const flavor = res.body;
			const updated = { ...character };

			if(flavor.appearance) updated.appearance = flavor.appearance;
			if(flavor.personality) updated.personality = flavor.personality;
			if(flavor.backstory) updated.backstory = flavor.backstory;

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

			if(flavor.plot_hooks && flavor.plot_hooks.length > 0) {
				const hookText = flavor.plot_hooks.map((h)=>`${h.title}: ${h.description}`).join('\n\n');
				updated.notes = (updated.notes ? updated.notes + '\n\n' : '') + '── Plot Hooks ──\n\n' + hookText;
			}

			handleChange(updated);
		} catch (err) {
			console.error('Flavor generation failed:', err);
			setFlavorError(err?.response?.body?.error || err.message || 'Flavor generation failed');
			setTimeout(()=>setFlavorError(null), 5000);
		} finally {
			setIsGeneratingFlavor(false);
		}
	}, [character, conceptPrompt, isGeneratingFlavor, handleChange]);

	const [copied, setCopied] = useState(false);

	const copyEmbed = ()=>{
		if(!shareId) return;
		const opts = [layout === 'wide' ? 'wide' : '', bw ? 'bw' : ''].filter(Boolean).join(',');
		const code = opts ? `{{willowlight:${shareId}|${opts}}}` : `{{willowlight:${shareId}}}`;
		navigator.clipboard.writeText(code).then(()=>{
			setCopied(true);
			setTimeout(()=>setCopied(false), 2000);
		});
	};

	const PreviewComponent = previewMode === 'sheet' ? WillowlightSheetPreview : WillowlightStatblockPreview;

	return (
		<div className="willowlightEditorPage">
			<Navbar>
				<Nav.logo />
				<Nav.section>
					<Nav.item className="statblockTitle" color="blue">
						{character.name || 'New Willowlight Character'}
					</Nav.item>
					<Nav.item icon="fas fa-th-list" onClick={()=>{ window.location.href = '/willowlight/library'; }}>
						Library
					</Nav.item>
				</Nav.section>

				<Nav.section>
					<Nav.item
						icon={previewMode === 'statblock' ? 'fas fa-id-card' : 'fas fa-file-alt'}
						onClick={()=>setPreviewMode((m)=>m === 'statblock' ? 'sheet' : 'statblock')}
					>
						{previewMode === 'statblock' ? 'Sheet View' : 'Stat Block View'}
					</Nav.item>

					<Nav.item icon={layout === 'narrow' ? 'fas fa-columns' : 'fas fa-align-justify'}
						onClick={()=>setLayout((l)=>l === 'narrow' ? 'wide' : 'narrow')}>
						{layout === 'narrow' ? 'Wide' : 'Narrow'}
					</Nav.item>

					<Nav.item icon={bw ? 'fas fa-palette' : 'fas fa-adjust'} onClick={()=>setBw((b)=>!b)}>
						{bw ? 'Color' : 'B&W'}
					</Nav.item>

					{shareId && (
						<Nav.item icon="fas fa-file-alt" onClick={()=>{ window.location.href = `/willowlight/sheet/${shareId}`; }}>
							Character Sheet
						</Nav.item>
					)}

					{shareId && (
						<Nav.item icon={copied ? 'fas fa-check' : 'fas fa-code'} onClick={copyEmbed}>
							{copied ? 'Copied!' : 'Copy Embed'}
						</Nav.item>
					)}

					{error && <Nav.item color="red">{error}</Nav.item>}

					<Nav.item className="save" icon={isSaving ? 'fas fa-spinner fa-spin' : 'fas fa-save'} onClick={save}>
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
								buttonLabel="AI Generate"
							/>
							{character.name && (
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
						<WillowlightForm character={character} onChange={handleChange} />
					</div>
					<PreviewComponent character={character} layout={layout} bw={bw} />
				</SplitPane>
			</div>
		</div>
	);
};

export default WillowlightEditorPage;
