import '../../palladiumStatblock/palladiumStatblock.less';
import '../../statblock/statblock.less';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import request from '../../utils/request-middleware.js';
import { createEmptyPalladiumStatblock } from '@shared/palladiumStatblock/schema.js';

import SplitPane                  from '../../../components/splitPane/splitPane.jsx';
import PalladiumStatblockForm     from '../../palladiumStatblock/palladiumStatblockForm.jsx';
import PalladiumStatblockPreview  from '../../palladiumStatblock/palladiumStatblockPreview.jsx';

import AiGenerateButton      from '../../components/aiGenerate/aiGenerateButton.jsx';
import ComfyuiPortraitButton from '../../components/comfyuiPortrait/comfyuiPortrait.jsx';
import Nav              from '@navbar/nav.jsx';
import Navbar           from '@navbar/navbar.jsx';
import AccountNavItem   from '@navbar/account.navitem.jsx';
import ExportPdfNavItem from '@navbar/exportPdf.navitem.jsx';

const SAVE_TIMEOUT = 3000;

const PalladiumStatblockEditorPage = (props)=>{
	const initial = props.palladiumStatblock || createEmptyPalladiumStatblock();
	const [statblock, setStatblock] = useState(initial);
	const [editId, setEditId] = useState(props.palladiumStatblock?.editId || null);
	const [shareId, setShareId] = useState(props.palladiumStatblock?.shareId || null);
	const [isSaving, setIsSaving] = useState(false);
	const [layout, setLayout] = useState('narrow');
	const [hasChanges, setHasChanges] = useState(false);
	const [error, setError] = useState(null);
	const saveTimeout = useRef(null);
	const [conceptPrompt, setConceptPrompt] = useState('');
	const [aiProvider, setAiProvider] = useState('lmstudio');
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
				const response = await request.put(`/api/palladium-statblock/${editId}`)
					.send(statblock)
					.timeout({ response: 10000 });
				setStatblock(response.body);
				setHasChanges(false);
			} else {
				const response = await request.post('/api/palladium-statblock')
					.send(statblock)
					.timeout({ response: 10000 });
				const saved = response.body;
				setStatblock(saved);
				setEditId(saved.editId);
				setShareId(saved.shareId);
				setHasChanges(false);
				window.history.replaceState(null, '', `/palladium/edit/${saved.editId}`);
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
			const res = await request.post('/api/ai/generate/palladium-flavor')
				.send({ concept: conceptPrompt || statblock.name || `${statblock.game || 'Palladium'} character`, statBlock: statblock, provider: aiProvider !== 'lmstudio' ? aiProvider : undefined })
				.timeout({ response: 180000 });

			const flavor = res.body;
			const updated = { ...statblock };

			if(flavor.description) updated.description = flavor.description;
			if(flavor.lore) updated.notes = (updated.notes ? updated.notes + '\n\n' : '') + flavor.lore;

			if(flavor.ability_flavor && updated.abilities) {
				for (const af of flavor.ability_flavor) {
					const ability = updated.abilities.find((a)=>a.name?.toLowerCase() === af.name?.toLowerCase());
					if(ability) ability.flavor = af.flavor;
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
	}, [statblock, conceptPrompt, aiProvider, isGeneratingFlavor, handleChange]);

	const handlePortraitGenerated = useCallback((imageData)=>{
		handleChange({ ...statblock, portrait: imageData });
	}, [statblock, handleChange]);

	const GAME_PROMPTS = {
		'Rifts'             : 'science fiction post-apocalypse character, power armor, cybernetics, megaversal, dramatic lighting',
		'Palladium Fantasy' : 'dark fantasy character portrait, medieval, painterly style, dramatic lighting',
		'TMNT'              : 'mutant animal character, urban setting, action pose, comic book style',
	};

	const buildPalladiumPrompt = useCallback((sb)=>{
		const parts = [GAME_PROMPTS[sb.game] || GAME_PROMPTS['Palladium Fantasy']];
		if(sb.name) parts.push(sb.name);
		if(sb.race) parts.push(sb.race);
		if(sb.occ) parts.push(sb.occ);
		if(sb.category) parts.push(sb.category);
		if(sb.animalType) parts.push(`mutant ${sb.animalType}`);
		if(sb.description) parts.push(sb.description);
		if(sb.alignment) parts.push(sb.alignment);
		return parts.filter(Boolean).join('. ');
	}, []);

	const [copied, setCopied] = useState(false);
	const toggleLayout = ()=>setLayout((l)=>l === 'narrow' ? 'wide' : 'narrow');

	const copyEmbed = ()=>{
		if(!shareId) return;
		const code = `{{palladium-statblock:${shareId}}}`;
		navigator.clipboard.writeText(code).then(()=>{
			setCopied(true);
			setTimeout(()=>setCopied(false), 2000);
		});
	};

	const gameLabel = statblock.game || 'Palladium';

	return (
		<div className="palladiumStatblockEditorPage">
			<Navbar>
				<Nav.section>
					<Nav.item className="statblockTitle" color="orange">
						{statblock.name || `New ${gameLabel} Stat Block`}
					</Nav.item>
					<Nav.item icon="fas fa-th-list" onClick={()=>{ window.location.href = '/palladium/library'; }}>
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

					{shareId && (
						<Nav.item icon={copied ? 'fas fa-check' : 'fas fa-code'} onClick={copyEmbed}>
							{copied ? 'Copied!' : 'Copy Embed'}
						</Nav.item>
					)}

					{shareId && <ExportPdfNavItem
						url={`/api/pdf/palladium/${shareId}`}
						name={statblock.name || 'palladium-export'}
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
								endpoint="/api/ai/generate/palladium-statblock"
								onGenerated={handleAiGenerate}
								provider={aiProvider}
								onProviderChange={setAiProvider}
								extraData={{ game: statblock.game }}
							/>
							<button
								className="aiGenerateBtn"
								onClick={handleGenerateFlavor}
								disabled={isGeneratingFlavor || !statblock.name}
								title={statblock.name ? 'Generate flavor text' : 'Generate a character first'}
								style={{ background: isGeneratingFlavor ? '#444' : undefined }}
							>
								{isGeneratingFlavor
									? <><i className="fas fa-spinner fa-spin" /> Generating Flavor...</>
									: <><i className="fas fa-feather-alt" /> Generate Flavor</>
								}
							</button>
							<ComfyuiPortraitButton
								character={statblock}
								onPortraitGenerated={handlePortraitGenerated}
								buildPrompt={buildPalladiumPrompt}
							/>
							{flavorError && <span style={{ color: '#ff6b6b', fontSize: '13px' }}>{flavorError}</span>}
						</div>
						<PalladiumStatblockForm statblock={statblock} onChange={handleChange} />
					</div>
					<PalladiumStatblockPreview statblock={statblock} layout={layout} />
				</SplitPane>
			</div>
		</div>
	);
};

export default PalladiumStatblockEditorPage;
