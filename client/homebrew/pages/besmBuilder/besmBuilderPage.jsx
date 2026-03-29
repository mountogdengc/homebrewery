import './besmBuilder.css';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import request from '../../utils/request-middleware.js';
import { ToastProvider } from './besm/contexts/ToastContext.tsx';
import { PowProvider } from './besm/components/PowEffect.tsx';
import { CharacterBuilder } from './besm/components/CharacterBuilder.tsx';
import AiGenerateButton from '../../components/aiGenerate/aiGenerateButton.jsx';
import { ATTRIBUTES_LIBRARY } from './besm/data/attributesLibrary.ts';
import { DEFECTS_LIBRARY } from './besm/data/defectsLibrary.ts';

const SAVE_TIMEOUT = 3000;

function mapAiToBesmCharacter(aiData) {
	const mapped = {
		name        : aiData.name || '',
		identity    : aiData.identity || '',
		description : aiData.description || '',
		selectedGenre    : aiData.selectedGenre || 'Multi-Genre',
		selectedSubgenre : null,
		totalCP     : aiData.totalCP || 200,
		availableCP : 0,
		stats       : aiData.stats || { body: 4, mind: 4, soul: 4 },
		templates   : { class: null, race: null, size: null },
		characterClass : null,
		attributes  : [],
		defects     : [],
		skills      : [],
		personality : aiData.personality || '',
		appearance  : aiData.appearance || '',
		background  : aiData.background || '',
		notes       : '',
	};

	// Map AI attributes to real templates
	if(aiData.attributes) {
		for (const aiAttr of aiData.attributes) {
			const template = ATTRIBUTES_LIBRARY.find((t)=>
				t.name.toLowerCase() === aiAttr.name?.toLowerCase()
			);
			if(template) {
				const level = Math.max(1, Math.min(aiAttr.level || 1, 10));
				mapped.attributes.push({
					id           : `ai-attr-${Math.random().toString(36).slice(2, 10)}`,
					template,
					level,
					cpCost       : (template.baseCost || template.cost_per_level || 1) * level,
					notes        : aiAttr.notes || '',
					source       : 'base',
					isCustom     : false,
					customInputs : {},
					enhancements : [],
					defects      : [],
					limiters     : [],
				});
			}
		}
	}

	// Map AI defects to real templates
	if(aiData.defects) {
		for (const aiDef of aiData.defects) {
			const template = DEFECTS_LIBRARY.find((t)=>
				t.name.toLowerCase() === aiDef.name?.toLowerCase()
			);
			if(template) {
				const rank = Math.max(1, Math.min(aiDef.rank || 1, template.max_rank || 3));
				mapped.defects.push({
					id           : `ai-def-${Math.random().toString(36).slice(2, 10)}`,
					template,
					rank,
					cpRefund     : template.cp_refund * rank,
					notes        : aiDef.notes || '',
					source       : 'base',
				});
			}
		}
	}

	// Map AI skills
	if(aiData.skills) {
		for (const aiSkill of aiData.skills) {
			mapped.skills.push({
				id          : `ai-skill-${Math.random().toString(36).slice(2, 10)}`,
				name        : aiSkill.name || 'Unknown',
				description : '',
				level       : Math.max(1, Math.min(aiSkill.level || 1, 6)),
				cpCost      : (aiSkill.level || 1) * 2, // approximate; real cost depends on genre
				attribute   : 'Body',
				notes       : '',
				source      : 'base',
			});
		}
	}

	return mapped;
}

const BesmBuilderPage = (props)=>{
	const initial = props.besmCharacter || null;
	const [character, setCharacter] = useState(initial);
	const [builderKey, setBuilderKey] = useState(0);
	const [editId, setEditId] = useState(props.besmCharacter?.editId || null);
	const [shareId, setShareId] = useState(props.besmCharacter?.shareId || null);
	const [isSaving, setIsSaving] = useState(false);
	const [hasChanges, setHasChanges] = useState(false);
	const [error, setError] = useState(null);
	const saveTimeout = useRef(null);
	const [conceptPrompt, setConceptPrompt] = useState('');
	const [isGeneratingFlavor, setIsGeneratingFlavor] = useState(false);
	const [flavorError, setFlavorError] = useState(null);

	const handleCharacterChange = useCallback((updated)=>{
		setCharacter(updated);
		setHasChanges(true);
	}, []);

	const save = useCallback(async ()=>{
		if(isSaving || !character) return;
		setIsSaving(true);
		setError(null);

		try {
			if(editId) {
				const response = await request.put(`/api/besm/${editId}`)
					.send(character)
					.timeout({ response: 10000 });
				setHasChanges(false);
			} else {
				const response = await request.post('/api/besm')
					.send(character)
					.timeout({ response: 10000 });
				const saved = response.body;
				setEditId(saved.editId);
				setShareId(saved.shareId);
				setHasChanges(false);
				window.history.replaceState(null, '', `/besm/edit/${saved.editId}`);
			}
		} catch (err) {
			console.error('Save error:', err);
			setError(err?.response?.body?.error || err.message || 'Save failed');
		} finally {
			setIsSaving(false);
		}
	}, [character, editId, isSaving]);

	// Auto-save on changes (debounced)
	useEffect(()=>{
		if(!hasChanges || !editId) return;
		clearTimeout(saveTimeout.current);
		saveTimeout.current = setTimeout(save, SAVE_TIMEOUT);
		return ()=>clearTimeout(saveTimeout.current);
	}, [character, hasChanges, editId]);

	// Ctrl+S to save
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

	const handleAiGenerate = useCallback((aiData, prompt)=>{
		const mapped = mapAiToBesmCharacter(aiData);
		setCharacter(mapped);
		setEditId(null);
		setShareId(null);
		setHasChanges(true);
		setBuilderKey((k)=>k + 1);
		// Store the concept for the flavor pass
		if(aiData._conceptPrompt) setConceptPrompt(aiData._conceptPrompt);
	}, []);

	const handleGenerateFlavor = useCallback(async ()=>{
		if(!character || isGeneratingFlavor) return;
		setIsGeneratingFlavor(true);
		setFlavorError(null);

		// Build a simplified stat block for the flavor prompt
		const statBlock = {
			name       : character.name,
			identity   : character.identity,
			genre      : character.selectedGenre,
			totalCP    : character.totalCP,
			stats      : character.stats,
			attributes : (character.attributes || []).map((a)=>({
				name  : a.template?.name || a.name,
				level : a.level,
				notes : a.notes
			})),
			defects : (character.defects || []).map((d)=>({
				name  : d.template?.name || d.name,
				rank  : d.rank,
				notes : d.notes
			})),
			skills : (character.skills || []).map((s)=>({
				name  : s.name,
				level : s.level
			}))
		};

		try {
			const res = await request.post('/api/ai/generate/besm-flavor')
				.send({ concept: conceptPrompt || character.name || 'BESM character', statBlock })
				.timeout({ response: 180000 });

			const flavor = res.body;

			// Merge flavor into character
			const updated = JSON.parse(JSON.stringify(character));
			if(flavor.appearance) updated.appearance = flavor.appearance;
			if(flavor.personality) updated.personality = flavor.personality;
			if(flavor.backstory) updated.background = flavor.backstory;

			// Update attribute notes with flavor
			if(flavor.attribute_flavor) {
				for (const af of flavor.attribute_flavor) {
					const attr = updated.attributes?.find((a)=>
						(a.template?.name || '').toLowerCase() === af.name?.toLowerCase()
					);
					if(attr) attr.notes = af.flavor;
				}
			}

			// Update defect notes with flavor
			if(flavor.defect_flavor) {
				for (const df of flavor.defect_flavor) {
					const def = updated.defects?.find((d)=>
						(d.template?.name || '').toLowerCase() === df.name?.toLowerCase()
					);
					if(def) def.notes = df.flavor;
				}
			}

			// Store plot hooks in notes
			if(flavor.plot_hooks && flavor.plot_hooks.length > 0) {
				const hookText = flavor.plot_hooks.map((h)=>`${h.title}: ${h.description}`).join('\n\n');
				updated.notes = (updated.notes ? updated.notes + '\n\n' : '') + '── Plot Hooks ──\n\n' + hookText;
			}

			setCharacter(updated);
			setHasChanges(true);
			setBuilderKey((k)=>k + 1);
		} catch (err) {
			console.error('Flavor generation failed:', err);
			setFlavorError(err?.response?.body?.error || err.message || 'Flavor generation failed');
			setTimeout(()=>setFlavorError(null), 5000);
		} finally {
			setIsGeneratingFlavor(false);
		}
	}, [character, conceptPrompt, isGeneratingFlavor]);

	const saveLabel = isSaving ? 'Saving...' : (hasChanges ? 'Save' : (editId ? 'Saved' : 'Save'));
	const saveIcon = isSaving ? 'fas fa-spinner fa-spin' : 'fas fa-save';

	return (
		<div className="besm-builder">
			<div className="besm-toolbar" style={{
				padding: '8px 16px',
				background: 'rgba(0,0,0,0.3)',
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'center',
				flexWrap: 'wrap',
				gap: '8px'
			}}>
				<div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
					<a href="/" className="besm-back-link">
						<i className="fas fa-arrow-left" /> Toolkit
					</a>
					<a href="/besm/library" className="besm-back-link">
						<i className="fas fa-th-list" /> Library
					</a>
					<a href="/besm/new" className="besm-back-link">
						<i className="fas fa-plus" /> New
					</a>
					<AiGenerateButton
						endpoint="/api/ai/generate/besm-character"
						onGenerated={handleAiGenerate}
						buttonLabel="AI Generate"
					/>
					{character && character.attributes?.length > 0 && (
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
				</div>

				<div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
					{shareId && (
						<>
							<a
								href={`/besm/sheet/${shareId}`}
								className="besm-back-link"
								style={{ fontSize: '0.95rem' }}
							>
								<i className="fas fa-file-alt" /> Character Sheet
							</a>
							<a
								href={`/besm/share/${shareId}`}
								className="besm-back-link"
								style={{ fontSize: '0.95rem' }}
							>
								<i className="fas fa-id-card" /> Stat Block
							</a>
						</>
					)}
					{flavorError && (
						<span style={{ color: '#ff6b6b', fontSize: '13px' }}>{flavorError}</span>
					)}
					{error && (
						<span style={{ color: '#ff6b6b', fontSize: '13px' }}>{error}</span>
					)}
					<button
						onClick={save}
						disabled={isSaving}
						style={{
							background: hasChanges ? 'var(--besm-pink, #e93a7d)' : 'rgba(255,255,255,0.15)',
							color: 'white',
							border: 'none',
							borderRadius: '6px',
							padding: '6px 14px',
							cursor: isSaving ? 'wait' : 'pointer',
							fontFamily: "'Bangers', cursive",
							fontSize: '1rem',
							letterSpacing: '0.5px',
							display: 'flex',
							alignItems: 'center',
							gap: '6px',
							transition: 'background 0.2s'
						}}
					>
						<i className={saveIcon} /> {saveLabel}
					</button>
				</div>
			</div>

			<ToastProvider>
				<PowProvider>
					<CharacterBuilder
						key={builderKey}
						initialCharacter={character || initial}
						onCharacterChange={handleCharacterChange}
					/>
				</PowProvider>
			</ToastProvider>
		</div>
	);
};

export default BesmBuilderPage;
