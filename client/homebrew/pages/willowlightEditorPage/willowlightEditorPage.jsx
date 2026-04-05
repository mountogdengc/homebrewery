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
import Nav              from '@navbar/nav.jsx';
import Navbar           from '@navbar/navbar.jsx';
import AccountNavItem   from '@navbar/account.navitem.jsx';
import ExportPdfNavItem from '@navbar/exportPdf.navitem.jsx';
import { toFoundry, fromFoundry } from '@shared/willowlight/foundryConverter.js';

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
	const [aiProvider, setAiProvider] = useState('lmstudio');
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
				.send({ concept: conceptPrompt || character.name || 'Willowlight character', statBlock: character, provider: aiProvider === 'claude' ? 'claude' : undefined })
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
	const [copiedSheet, setCopiedSheet] = useState(false);
	const [showFoundryImport, setShowFoundryImport] = useState(false);
	const [foundryImportText, setFoundryImportText] = useState('');

	const exportFoundryJson = ()=>{
		const foundryData = toFoundry(character);
		const blob = new Blob([JSON.stringify(foundryData, null, 2)], { type: 'application/json' });
		const link = document.createElement('a');
		link.href = URL.createObjectURL(blob);
		link.download = `${character.name || 'willowlight-character'}-foundry.json`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(link.href);
	};

	const importFoundryJson = ()=>{
		if(!foundryImportText.trim()) return;
		try {
			const data = JSON.parse(foundryImportText);
			const converted = fromFoundry(data, character);
			handleChange(converted);
			setShowFoundryImport(false);
			setFoundryImportText('');
		} catch (e) {
			alert(`Import failed: ${e.message}`);
		}
	};

	const copyEmbed = ()=>{
		if(!shareId) return;
		const opts = [layout === 'wide' ? 'wide' : '', bw ? 'bw' : ''].filter(Boolean).join(',');
		const code = opts ? `{{willowlight:${shareId}|${opts}}}` : `{{willowlight:${shareId}}}`;
		navigator.clipboard.writeText(code).then(()=>{
			setCopied(true);
			setTimeout(()=>setCopied(false), 2000);
		});
	};

	const copySheetEmbed = ()=>{
		if(!shareId) return;
		const bwOpt = bw ? ',bw' : '';
		const code = `{{willowlight-sheet:${shareId}|p1${bwOpt}}}\n\n\\page\n\n{{willowlight-sheet:${shareId}|p2${bwOpt}}}`;
		navigator.clipboard.writeText(code).then(()=>{
			setCopiedSheet(true);
			setTimeout(()=>setCopiedSheet(false), 2000);
		});
	};

	const PreviewComponent = previewMode === 'sheet' ? WillowlightSheetPreview : WillowlightStatblockPreview;

	return (
		<div className="willowlightEditorPage">
			<Navbar>
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

					{shareId && <>
						<Nav.item icon={copied ? 'fas fa-check' : 'fas fa-code'} onClick={copyEmbed}>
							{copied ? 'Copied!' : 'Embed Statblock'}
						</Nav.item>
						<Nav.item icon={copiedSheet ? 'fas fa-check' : 'fas fa-file-alt'} onClick={copySheetEmbed}>
							{copiedSheet ? 'Copied!' : 'Embed Sheet (2 pages)'}
						</Nav.item>
					</>}

					{shareId && <ExportPdfNavItem
						url={`/api/pdf/willowlight/${shareId}`}
						name={character.name || 'willowlight-export'}
					/>}

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
						placeholder="Paste Foundry VTT character JSON here..."
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
						<div style={{ padding: '12px 12px 0', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
							<AiGenerateButton
								endpoint="/api/ai/generate/willowlight-statblock"
								onGenerated={handleAiGenerate}
								buttonLabel="AI Generate"
								provider={aiProvider}
								onProviderChange={setAiProvider}
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
