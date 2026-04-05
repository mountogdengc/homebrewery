import './aiGenerate.less';
import React, { useState, useEffect } from 'react';
import request from '../../utils/request-middleware.js';

const AiGenerateButton = ({ endpoint, onGenerated, buttonLabel = 'AI Generate', provider: externalProvider, onProviderChange, extraData })=>{
	const [showModal, setShowModal] = useState(false);
	const [prompt, setPrompt] = useState('');
	const [isGenerating, setIsGenerating] = useState(false);
	const [error, setError] = useState(null);
	const [aiStatus, setAiStatus] = useState(null); // { available, lmStudio, claude }
	const [internalProvider, setInternalProvider] = useState('lmstudio'); // 'lmstudio' or 'claude'

	// Support controlled (external) or uncontrolled (internal) provider state
	const provider = externalProvider ?? internalProvider;
	const setProvider = (p)=>{
		setInternalProvider(p);
		if(onProviderChange) onProviderChange(p);
	};

	useEffect(()=>{
		request.get('/api/ai/status')
			.then((res)=>{
				setAiStatus(res.body);
				// Default to claude if LM Studio isn't available but Claude is
				if(!res.body.lmStudio?.available && res.body.claude?.available) {
					setProvider('claude');
				}
			})
			.catch(()=>setAiStatus({ available: false }));
	}, []);

	if(!aiStatus || aiStatus.available === false) return null;

	const lmAvailable = aiStatus.lmStudio?.available;
	const claudeAvailable = aiStatus.claude?.available;
	const bothAvailable = lmAvailable && claudeAvailable;

	const handleGenerate = async ()=>{
		if(!prompt.trim() || isGenerating) return;
		setIsGenerating(true);
		setError(null);

		try {
			const body = { prompt: prompt.trim(), ...extraData };
			if(provider === 'claude') body.provider = 'claude';
			const res = await request.post(endpoint)
				.send(body)
				.timeout({ response: 180000 });
			res.body._conceptPrompt = prompt.trim();
			onGenerated(res.body);
			setShowModal(false);
			setPrompt('');
		} catch (err) {
			console.error('AI generation failed:', err);
			setError(err?.response?.body?.error || err.message || 'Generation failed');
		} finally {
			setIsGenerating(false);
		}
	};

	const handleKeyDown = (e)=>{
		if(e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleGenerate();
		}
	};

	return <>
		<button className="aiGenerateBtn" onClick={()=>setShowModal(true)}>
			<i className="fas fa-magic" /> {buttonLabel}
		</button>

		{showModal && (
			<div className="aiModal-overlay" onClick={()=>!isGenerating && setShowModal(false)}>
				<div className="aiModal" onClick={(e)=>e.stopPropagation()}>
					<div className="aiModal-header">
						<h3><i className="fas fa-magic" /> AI Generate</h3>
						{!isGenerating && (
							<button className="aiModal-close" onClick={()=>setShowModal(false)}>✕</button>
						)}
					</div>

					{/* Provider toggle */}
					{bothAvailable && (
						<div className="aiModal-provider">
							<button
								className={`aiModal-providerBtn ${provider === 'lmstudio' ? 'active' : ''}`}
								onClick={()=>setProvider('lmstudio')}
								disabled={isGenerating}
							>
								<i className="fas fa-server" /> Local (LM Studio)
							</button>
							<button
								className={`aiModal-providerBtn ${provider === 'claude' ? 'active' : ''}`}
								onClick={()=>setProvider('claude')}
								disabled={isGenerating}
							>
								<i className="fas fa-cloud" /> Claude API
							</button>
						</div>
					)}
					{!bothAvailable && claudeAvailable && !lmAvailable && (
						<div className="aiModal-providerNote">
							<i className="fas fa-cloud" /> Using Claude API
						</div>
					)}

					<p className="aiModal-hint">
						Describe what you want to create. The more detail, the better the result.
					</p>

					<textarea
						className="aiModal-input"
						value={prompt}
						onChange={(e)=>setPrompt(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder="e.g. A cunning vampire lord who commands shadow magic, CR 13..."
						disabled={isGenerating}
						autoFocus
					/>

					{error && <div className="aiModal-error">{error}</div>}

					<div className="aiModal-actions">
						<button
							className="aiModal-generate"
							onClick={handleGenerate}
							disabled={!prompt.trim() || isGenerating}
						>
							{isGenerating ? (
								<><i className="fas fa-spinner fa-spin" /> Generating...</>
							) : (
								<><i className="fas fa-magic" /> Generate</>
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
							{provider === 'claude'
								? 'Generating with Claude API...'
								: 'This may take a minute depending on your model...'}
						</p>
					)}
				</div>
			</div>
		)}
	</>;
};

export default AiGenerateButton;
