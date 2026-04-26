import './besmPortrait.less';
import React, { useState, useEffect, useCallback } from 'react';
import request from '../../utils/request-middleware.js';
import defaultWorkflow from '@shared/comfyui/defaultWorkflow.json';

const ANIME_STYLES = [
	{ key: 'standard',     label: 'Standard Anime' },
	{ key: 'shonen',       label: 'Shonen' },
	{ key: 'shojo',        label: 'Shojo' },
	{ key: 'seinen',       label: 'Seinen' },
	{ key: 'josei',        label: 'Josei' },
	{ key: 'chibi',        label: 'Chibi' },
	{ key: 'moe',          label: 'Moe' },
	{ key: 'kawaii',        label: 'Kawaii' },
	{ key: 'kemonomimi',   label: 'Kemonomimi' },
	{ key: 'kodomo',       label: 'Kodomo' },
	{ key: 'cartoonish',   label: 'Cartoonish Anime' },
	{ key: '1980s',        label: '1980s Retro' },
	{ key: '1990s',        label: '1990s Classic' },
	{ key: 'realistic',    label: 'Realistic Anime' },
	{ key: 'fantastical',  label: 'Fantastical' },
	{ key: 'cyberpunk',    label: 'Cyberpunk / Mechanical' },
];

// Style-specific prompt fragments for Stable Diffusion
const STYLE_PROMPTS = {
	standard:    'anime-style illustration in a Standard anime aesthetic',
	shonen:      'anime-style illustration in a Shonen aesthetic, bold dynamic lines, intense action poses',
	shojo:       'anime-style illustration in a Shojo aesthetic, soft sparkles, flowing hair, delicate features',
	seinen:      'anime-style illustration in a Seinen aesthetic, detailed realism, mature tones, sharp linework',
	josei:       'anime-style illustration in a Josei aesthetic, elegant, refined detail, warm palette',
	chibi:       'anime-style illustration in a Chibi style, super-deformed proportions, cute oversized head',
	moe:         'anime-style illustration in a Moe aesthetic, adorable, soft round features, pastel tones',
	kawaii:      'anime-style illustration in a Kawaii aesthetic, cute, bright colors, endearing expression',
	kemonomimi:  'anime-style illustration in a Kemonomimi aesthetic, animal ears and tail, expressive',
	kodomo:      'anime-style illustration in a Kodomo aesthetic, simple shapes, bright primary colors, child-friendly',
	cartoonish:  'anime-style illustration in a Cartoonish anime style, exaggerated features, vibrant',
	'1980s':     'anime-style illustration in 1980s retro aesthetic, cel-shaded, nostalgic palette, bold outlines',
	'1990s':     'anime-style illustration in 1990s classic aesthetic, mid-detail, clean linework, iconic 90s anime style',
	realistic:   'anime-style illustration in a Realistic aesthetic, semi-realistic anatomy, detailed shading',
	fantastical: 'anime-style illustration in a Fantastical aesthetic, magical glow, ethereal atmosphere, rich fantasy detail',
	cyberpunk:   'anime-style illustration in a Cyberpunk and detailed mechanical aesthetic, neon glow, chrome accents, tech overlays',
};

// Build a portrait prompt from BESM character data + selected anime style
function buildBesmPrompt(character, styleKey) {
	const parts = [];

	// Anime style prefix
	parts.push(STYLE_PROMPTS[styleKey] || STYLE_PROMPTS.standard);

	// Character concept
	if(character.identity) {
		parts.push(character.identity);
	} else if(character.name) {
		parts.push(character.name);
	}

	// Appearance text from the builder
	if(character.appearance) {
		parts.push(character.appearance);
	}

	// Demographics
	const demo = [];
	if(character.gender) demo.push(character.gender);
	if(character.age) demo.push(`${character.age} years old`);
	if(character.hairColor) demo.push(`${character.hairColor} hair`);
	if(character.eyeColor) demo.push(`${character.eyeColor} eyes`);
	if(demo.length) parts.push(demo.join(', '));

	// Genre for flavoring
	if(character.selectedGenre && character.selectedGenre !== 'Multi-Genre') {
		parts.push(`${character.selectedGenre} setting`);
	}

	// Class/race for character type
	const className = character.characterClass?.name || character.templates?.class?.name;
	const raceName = character.race?.name || character.templates?.race?.name;
	if(className) parts.push(className);
	if(raceName) parts.push(raceName);

	// Description as fallback
	if(character.description && !character.appearance) {
		parts.push(character.description);
	}

	// Portrait framing
	parts.push('character portrait, upper body, detailed face');

	return parts.filter(Boolean).join('. ');
}

const BesmPortraitButton = ({ character, onPortraitGenerated })=>{
	const [showModal, setShowModal] = useState(false);
	const [prompt, setPrompt] = useState('');
	const [selectedStyle, setSelectedStyle] = useState('standard');
	const [isGenerating, setIsGenerating] = useState(false);
	const [error, setError] = useState(null);
	const [comfyStatus, setComfyStatus] = useState(null);
	const [previewImage, setPreviewImage] = useState(character?.portrait || null);
	const [workflowJson, setWorkflowJson] = useState(null);
	const [showWorkflow, setShowWorkflow] = useState(false);

	// Check ComfyUI availability
	useEffect(()=>{
		request.get('/api/comfyui/status')
			.then((res)=>setComfyStatus(res.body))
			.catch(()=>setComfyStatus({ available: false }));
	}, []);

	const comfyAvailable = comfyStatus?.available;

	const handleOpen = ()=>{
		const autoPrompt = buildBesmPrompt(character, selectedStyle);
		setPrompt(autoPrompt);
		setPreviewImage(character?.portrait || null);
		setShowModal(true);
	};

	const handleStyleChange = (styleKey)=>{
		setSelectedStyle(styleKey);
		// Rebuild prompt with new style
		const autoPrompt = buildBesmPrompt(character, styleKey);
		setPrompt(autoPrompt);
	};

	const handleGenerate = async ()=>{
		if(!prompt.trim() || isGenerating) return;
		setIsGenerating(true);
		setError(null);

		try {
			const workflow = workflowJson || defaultWorkflow;

			const res = await request.post('/api/comfyui/generate')
				.send({
					workflow,
					positivePrompt : prompt.trim(),
					width          : 768,
					height         : 1024
				})
				.timeout({ response: 360000 });

			const imageData = res.body.image;
			setPreviewImage(imageData);
		} catch (err) {
			console.error('ComfyUI generation failed:', err);
			setError(err?.response?.body?.error || err.message || 'Image generation failed');
		} finally {
			setIsGenerating(false);
		}
	};

	const handleAccept = ()=>{
		if(previewImage && onPortraitGenerated) {
			onPortraitGenerated(previewImage);
		}
		setShowModal(false);
	};

	const handleWorkflowUpload = (e)=>{
		const file = e.target.files?.[0];
		if(!file) return;
		const reader = new FileReader();
		reader.onload = (ev)=>{
			try {
				const json = JSON.parse(ev.target.result);
				setWorkflowJson(json);
			} catch (err) {
				setError('Invalid workflow JSON file');
			}
		};
		reader.readAsText(file);
	};

	const handleKeyDown = (e)=>{
		if(e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleGenerate();
		}
	};

	return <>
		<button className="besmPortraitBtn" onClick={handleOpen} disabled={!comfyAvailable}
			title={comfyAvailable ? 'Generate an anime portrait with ComfyUI' : 'ComfyUI is not running'}>
			<i className="fas fa-image" /> Generate Portrait{!comfyAvailable ? ' (offline)' : ''}
		</button>

		{showModal && (
			<div className="aiModal-overlay" onClick={()=>!isGenerating && setShowModal(false)}>
				<div className="besmPortraitModal" onClick={(e)=>e.stopPropagation()}>
					<div className="aiModal-header">
						<h3><i className="fas fa-image" style={{ color: '#e93a7d' }} /> Anime Portrait Generator</h3>
						{!isGenerating && (
							<button className="aiModal-close" onClick={()=>setShowModal(false)}>✕</button>
						)}
					</div>

					<p className="aiModal-hint">
						Select an anime style, then edit the prompt or use the auto-generated one from your character. Make sure ComfyUI is running.
					</p>

					{/* Anime style selector */}
					<div className="besmPortrait-styleLabel">Anime Style</div>
					<div className="besmPortrait-styleGrid">
						{ANIME_STYLES.map((style)=>(
							<button
								key={style.key}
								className={`besmPortrait-styleChip${selectedStyle === style.key ? ' active' : ''}`}
								onClick={()=>handleStyleChange(style.key)}
								disabled={isGenerating}
							>
								{style.label}
							</button>
						))}
					</div>

					<textarea
						className="aiModal-input"
						value={prompt}
						onChange={(e)=>setPrompt(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder="Describe the anime character portrait you want to generate..."
						disabled={isGenerating}
						autoFocus
					/>

					{/* Workflow controls */}
					<div className="comfyPortrait-workflow">
						<button
							className="comfyPortrait-workflowToggle"
							onClick={()=>setShowWorkflow(!showWorkflow)}
						>
							<i className={`fas fa-${showWorkflow ? 'chevron-up' : 'chevron-down'}`} />
							{' '}Workflow {workflowJson ? '(custom loaded)' : '(using default)'}
						</button>
						{showWorkflow && (
							<div className="comfyPortrait-workflowPanel">
								<label className="comfyPortrait-uploadLabel">
									<i className="fas fa-upload" /> Load Custom Workflow (API format JSON)
									<input
										type="file"
										accept=".json"
										onChange={handleWorkflowUpload}
										style={{ display: 'none' }}
									/>
								</label>
								{workflowJson && (
									<button
										className="comfyPortrait-resetWorkflow"
										onClick={()=>setWorkflowJson(null)}
									>
										<i className="fas fa-undo" /> Reset to Default
									</button>
								)}
							</div>
						)}
					</div>

					{error && <div className="aiModal-error">{error}</div>}

					{/* Preview area */}
					{previewImage && (
						<div className="besmPortrait-preview">
							<img src={previewImage} alt="Generated anime portrait" />
						</div>
					)}

					<div className="aiModal-actions">
						{previewImage && !isGenerating && (
							<button className="besmPortrait-accept" onClick={handleAccept}>
								<i className="fas fa-check" /> Use This Portrait
							</button>
						)}
						<button
							className="aiModal-generate"
							onClick={handleGenerate}
							disabled={!prompt.trim() || isGenerating}
							style={{ background: 'linear-gradient(135deg, #c2185b, #880e4f)', borderColor: '#e93a7d' }}
						>
							{isGenerating ? (
								<><i className="fas fa-spinner fa-spin" /> Generating...</>
							) : (
								<><i className="fas fa-image" /> {previewImage ? 'Regenerate' : 'Generate'}</>
							)}
						</button>
						{!isGenerating && (
							<button className="aiModal-cancel" onClick={()=>setShowModal(false)}>
								Cancel
							</button>
						)}
					</div>

					{isGenerating && (
						<p className="aiModal-status" style={{ color: '#e93a7d' }}>
							Generating anime portrait with ComfyUI... This may take a minute depending on your GPU.
						</p>
					)}
				</div>
			</div>
		)}
	</>;
};

export default BesmPortraitButton;
