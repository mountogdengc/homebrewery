import './comfyuiPortrait.less';
import React, { useState, useEffect, useCallback } from 'react';
import request from '../../utils/request-middleware.js';
import defaultWorkflow from '@shared/comfyui/defaultWorkflow.json';

// Build a portrait prompt from Willowlight character data
function buildPromptFromCharacter(character) {
	const parts = [];

	// Base framing
	parts.push('fantasy character portrait, painterly style, dramatic lighting');

	// Name/concept
	if(character.shortDescription) {
		parts.push(character.shortDescription);
	} else if(character.name) {
		parts.push(character.name);
	}

	// Appearance from flavor
	if(character.appearance) {
		parts.push(character.appearance);
	}

	// Demographics
	const demo = [];
	if(character.gender) demo.push(character.gender);
	if(character.age) demo.push(`${character.age} years old`);
	if(demo.length) parts.push(demo.join(', '));

	// Path / conviction for flavor
	if(character.path) parts.push(`${character.path}`);

	// Description
	if(character.description && !character.appearance) {
		parts.push(character.description);
	}

	return parts.filter(Boolean).join('. ');
}

const ComfyuiPortraitButton = ({ character, onPortraitGenerated, buildPrompt })=>{
	const [showModal, setShowModal] = useState(false);
	const [prompt, setPrompt] = useState('');
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
		// Auto-build prompt from character data (use custom builder if provided)
		const autoPrompt = buildPrompt ? buildPrompt(character) : buildPromptFromCharacter(character);
		setPrompt(autoPrompt);
		setPreviewImage(character?.portrait || null);
		setShowModal(true);
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
				.timeout({ response: 360000 }); // 6 minute timeout for image gen

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
		<button className="comfyPortraitBtn" onClick={handleOpen} disabled={!comfyAvailable}
			title={comfyAvailable ? 'Generate a portrait with ComfyUI' : 'ComfyUI is not running'}>
			<i className="fas fa-image" /> Generate Portrait{!comfyAvailable ? ' (offline)' : ''}
		</button>

		{showModal && (
			<div className="aiModal-overlay" onClick={()=>!isGenerating && setShowModal(false)}>
				<div className="comfyPortraitModal" onClick={(e)=>e.stopPropagation()}>
					<div className="aiModal-header">
						<h3><i className="fas fa-image" /> ComfyUI Portrait</h3>
						{!isGenerating && (
							<button className="aiModal-close" onClick={()=>setShowModal(false)}>✕</button>
						)}
					</div>

					<p className="aiModal-hint">
						Edit the prompt below or use the auto-generated one from your character data. Make sure ComfyUI is running.
					</p>

					<textarea
						className="aiModal-input"
						value={prompt}
						onChange={(e)=>setPrompt(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder="Describe the character portrait you want to generate..."
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
						<div className="comfyPortrait-preview">
							<img src={previewImage} alt="Generated portrait" />
						</div>
					)}

					<div className="aiModal-actions">
						{previewImage && !isGenerating && (
							<button className="comfyPortrait-accept" onClick={handleAccept}>
								<i className="fas fa-check" /> Use This Portrait
							</button>
						)}
						<button
							className="aiModal-generate"
							onClick={handleGenerate}
							disabled={!prompt.trim() || isGenerating}
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
						<p className="aiModal-status">
							Generating with ComfyUI... This may take a minute depending on your GPU.
						</p>
					)}
				</div>
			</div>
		)}
	</>;
};

export default ComfyuiPortraitButton;
