import '../../brpStatblock/brpStatblock.less';
import '../../statblock/statblock.less';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import request from '../../utils/request-middleware.js';
import { createEmptyBrpStatblock } from '@shared/brpStatblock/schema.js';

import SplitPane           from '../../../components/splitPane/splitPane.jsx';
import BrpStatblockForm    from '../../brpStatblock/brpStatblockForm.jsx';
import BrpStatblockPreview from '../../brpStatblock/brpStatblockPreview.jsx';
import BrpSheetPreview     from '../../brpStatblock/brpSheetPreview.jsx';

import AiGenerateButton from '../../components/aiGenerate/aiGenerateButton.jsx';
import Nav             from '@navbar/nav.jsx';
import Navbar          from '@navbar/navbar.jsx';
import AccountNavItem  from '@navbar/account.navitem.jsx';
import ExportPdfNavItem from '@navbar/exportPdf.navitem.jsx';

const SAVE_TIMEOUT = 3000;

const BrpStatblockEditorPage = (props)=>{
	const initial = props.brpStatblock || createEmptyBrpStatblock();
	const [statblock, setStatblock] = useState(initial);
	const [editId, setEditId] = useState(props.brpStatblock?.editId || null);
	const [shareId, setShareId] = useState(props.brpStatblock?.shareId || null);
	const [isSaving, setIsSaving] = useState(false);
	const [layout, setLayout] = useState('narrow');
	const [bw, setBw] = useState(false);
	const [previewMode, setPreviewMode] = useState('statblock'); // 'statblock' or 'sheet'
	const [hasChanges, setHasChanges] = useState(false);
	const [error, setError] = useState(null);
	const saveTimeout = useRef(null);
	const [conceptPrompt, setConceptPrompt] = useState('');
	const [aiProvider, setAiProvider] = useState('lmstudio');
	const [isGeneratingFlavor, setIsGeneratingFlavor] = useState(false);
	const [flavorError, setFlavorError] = useState(null);

	const isCharacter = statblock.characterType === 'character';

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
				const response = await request.put(`/api/brp-statblock/${editId}`)
					.send(statblock)
					.timeout({ response: 10000 });
				setStatblock(response.body);
				setHasChanges(false);
			} else {
				const response = await request.post('/api/brp-statblock')
					.send(statblock)
					.timeout({ response: 10000 });
				const saved = response.body;
				setStatblock(saved);
				setEditId(saved.editId);
				setShareId(saved.shareId);
				setHasChanges(false);
				window.history.replaceState(null, '', `/brp/edit/${saved.editId}`);
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
			const res = await request.post('/api/ai/generate/brp-flavor')
				.send({ concept: conceptPrompt || statblock.name || (isCharacter ? 'BRP character' : 'BRP creature'), statBlock: statblock, provider: aiProvider === 'claude' ? 'claude' : undefined })
				.timeout({ response: 180000 });

			const flavor = res.body;
			const updated = { ...statblock };

			if(flavor.description) updated.description = flavor.description;
			if(flavor.lore) updated.lore = flavor.lore;

			// Character-specific flavor fields
			if(flavor.appearance) updated.appearance = flavor.appearance;
			if(flavor.personality) updated.personality = flavor.personality;
			if(flavor.backstory) updated.background = flavor.backstory;

			if(flavor.trait_flavor && updated.traits) {
				for (const tf of flavor.trait_flavor) {
					const trait = updated.traits.find((t)=>t.name?.toLowerCase() === tf.name?.toLowerCase());
					if(trait) trait.flavor = tf.flavor;
				}
			}

			// Encounter hooks (creature) or plot hooks (character)
			const hooks = flavor.encounter_hooks || flavor.plot_hooks;
			if(hooks && hooks.length > 0) {
				const label = isCharacter ? '── Plot Hooks ──' : '── Encounter Hooks ──';
				const hookText = hooks.map((h)=>`${h.title}: ${h.description}`).join('\n\n');
				updated.notes = (updated.notes ? updated.notes + '\n\n' : '') + label + '\n\n' + hookText;
			}

			handleChange(updated);
		} catch (err) {
			console.error('Flavor generation failed:', err);
			setFlavorError(err?.response?.body?.error || err.message || 'Flavor generation failed');
			setTimeout(()=>setFlavorError(null), 5000);
		} finally {
			setIsGeneratingFlavor(false);
		}
	}, [statblock, conceptPrompt, aiProvider, isCharacter, isGeneratingFlavor, handleChange]);

	const [copied, setCopied] = useState(false);
	const [copiedSheet, setCopiedSheet] = useState(false);

	const titleLabel = isCharacter ? 'BRP Character' : 'BRP Stat Block';

	const copyEmbed = ()=>{
		if(!shareId) return;
		const opts = [layout === 'wide' ? 'wide' : '', bw ? 'bw' : ''].filter(Boolean).join(',');
		const code = opts ? `{{brp:${shareId}|${opts}}}` : `{{brp:${shareId}}}`;
		navigator.clipboard.writeText(code).then(()=>{
			setCopied(true);
			setTimeout(()=>setCopied(false), 2000);
		});
	};

	const copySheetEmbed = ()=>{
		if(!shareId) return;
		const bwOpt = bw ? ',bw' : '';
		const code = `{{brp-sheet:${shareId}|p1${bwOpt}}}\n\n\\page\n\n{{brp-sheet:${shareId}|p2${bwOpt}}}`;
		navigator.clipboard.writeText(code).then(()=>{
			setCopiedSheet(true);
			setTimeout(()=>setCopiedSheet(false), 2000);
		});
	};

	const PreviewComponent = previewMode === 'sheet' ? BrpSheetPreview : BrpStatblockPreview;

	return (
		<div className="brpStatblockEditorPage">
			<Navbar>
				<Nav.section>
					<Nav.item className="statblockTitle" color="orange">
						{statblock.name || `New ${titleLabel}`}
					</Nav.item>
					<Nav.item icon="fas fa-th-list" onClick={()=>{ window.location.href = '/brp/library'; }}>
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

					<Nav.item icon="fas fa-print" onClick={()=>window.print()}>
						Print
					</Nav.item>

					{shareId && (
						<Nav.item icon="fas fa-file-alt" onClick={()=>{ window.location.href = `/brp/sheet/${shareId}`; }}>
							Character Sheet
						</Nav.item>
					)}

					{shareId && <>
						<Nav.item icon={copied ? 'fas fa-check' : 'fas fa-code'} onClick={copyEmbed}>
							{copied ? 'Copied!' : 'Embed Statblock'}
						</Nav.item>
						<Nav.item icon={copiedSheet ? 'fas fa-check' : 'fas fa-file-alt'} onClick={copySheetEmbed}>
							{copiedSheet ? 'Copied!' : 'Embed Sheet (2 pages)'}
						</Nav.item>
					</>}

					{shareId && <ExportPdfNavItem
						url={`/api/pdf/brp/${shareId}?view=${previewMode}`}
						name={statblock.name || 'brp-export'}
					/>}

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
								endpoint="/api/ai/generate/brp-statblock"
								onGenerated={handleAiGenerate}
								provider={aiProvider}
								onProviderChange={setAiProvider}
								extraData={{ characterType: statblock.characterType }}
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
						<BrpStatblockForm statblock={statblock} onChange={handleChange} />
					</div>
					<PreviewComponent statblock={statblock} layout={layout} bw={bw} />
				</SplitPane>
			</div>
		</div>
	);
};

export default BrpStatblockEditorPage;
