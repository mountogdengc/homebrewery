import './aiGenerate.less';
import React, { useState, useEffect } from 'react';
import request from '../../utils/request-middleware.js';

const PRESETS = [
	{ label: 'Replace em dashes',    instruction: 'Replace em dashes (—) with context-appropriate alternatives such as commas, colons, semicolons, periods, or parentheses. Preserve meaning and flow.' },
	{ label: 'Rewrite for clarity',  instruction: 'Rewrite this text for clarity. Keep the same tone, meaning, and formatting. Make sentences direct and easy to parse.' },
	{ label: 'Tighten prose',        instruction: 'Tighten this prose. Remove unnecessary words, reduce passive voice, and make it more concise without losing meaning or voice.' },
	{ label: 'Fix grammar & typos',  instruction: 'Fix any grammar errors, typos, and punctuation issues. Do not change style or meaning.' },
	{ label: 'Convert to read-aloud', instruction: 'Rewrite this as vivid read-aloud boxed text for a D&D adventure. Use second person ("you"), sensory details, and present tense. Keep it to 2-3 short paragraphs.' },
];

// Pricing per million tokens (Sonnet 4)
const PRICING = {
	'claude-sonnet-4-20250514' : { input: 3.00, output: 15.00 },
};
const DEFAULT_PRICING = { input: 3.00, output: 15.00 };

function formatCost(usage) {
	const pricing = PRICING[usage.model] || DEFAULT_PRICING;
	const cost = (usage.inputTokens * pricing.input + usage.outputTokens * pricing.output) / 1_000_000;
	return cost < 0.01 ? `<$0.01` : `$${cost.toFixed(2)}`;
}

function formatTokens(n) {
	return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`;
}

const AiEditModal = ({ selectedText, onApply, onClose })=>{
	const [instruction, setInstruction] = useState('');
	const [isProcessing, setIsProcessing] = useState(false);
	const [preview, setPreview] = useState(null);
	const [usage, setUsage] = useState(null);
	const [sessionUsage, setSessionUsage] = useState({ inputTokens: 0, outputTokens: 0, requests: 0 });
	const [error, setError] = useState(null);
	const [claudeAvailable, setClaudeAvailable] = useState(null);

	useEffect(()=>{
		request.get('/api/ai/claude/status')
			.then((res)=>setClaudeAvailable(res.body.available))
			.catch(()=>setClaudeAvailable(false));
	}, []);

	const handleEdit = async (instr)=>{
		const finalInstruction = instr || instruction;
		if(!finalInstruction.trim() || isProcessing) return;
		setIsProcessing(true);
		setError(null);
		setPreview(null);
		setUsage(null);

		try {
			const res = await request.post('/api/ai/claude/edit')
				.send({ text: selectedText, instruction: finalInstruction.trim() })
				.timeout({ response: 120000 });
			setPreview(res.body.result);
			if(res.body.usage) {
				setUsage(res.body.usage);
				setSessionUsage((prev)=>({
					inputTokens  : prev.inputTokens + res.body.usage.inputTokens,
					outputTokens : prev.outputTokens + res.body.usage.outputTokens,
					requests     : prev.requests + 1,
				}));
			}
		} catch (err) {
			console.error('AI edit failed:', err);
			setError(err?.response?.body?.error || err.message || 'Edit failed');
		} finally {
			setIsProcessing(false);
		}
	};

	const handleKeyDown = (e)=>{
		if(e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleEdit();
		}
	};

	if(claudeAvailable === false) {
		return <div className="aiModal-overlay" onClick={onClose}>
			<div className="aiModal" onClick={(e)=>e.stopPropagation()}>
				<div className="aiModal-header">
					<h3><i className="fas fa-magic" /> AI Edit</h3>
					<button className="aiModal-close" onClick={onClose}>&#x2715;</button>
				</div>
				<div className="aiModal-error">
					No Anthropic API key configured. Set ANTHROPIC_API_KEY environment variable or add anthropic_api_key to your config.
				</div>
			</div>
		</div>;
	}

	return <div className="aiModal-overlay" onClick={()=>!isProcessing && onClose()}>
		<div className="aiModal aiEditModal" onClick={(e)=>e.stopPropagation()}>
			<div className="aiModal-header">
				<h3><i className="fas fa-magic" /> AI Edit</h3>
				{!isProcessing && <button className="aiModal-close" onClick={onClose}>&#x2715;</button>}
			</div>

			<div className="aiEdit-selection">
				<label>Selected text ({selectedText.length} chars)</label>
				<pre>{selectedText.length > 300 ? `${selectedText.slice(0, 300)}...` : selectedText}</pre>
			</div>

			<div className="aiEdit-presets">
				{PRESETS.map((preset)=>(
					<button
						key={preset.label}
						className="aiEdit-preset"
						onClick={()=>{ setInstruction(preset.instruction); handleEdit(preset.instruction); }}
						disabled={isProcessing}
					>
						{preset.label}
					</button>
				))}
			</div>

			<textarea
				className="aiModal-input"
				value={instruction}
				onChange={(e)=>setInstruction(e.target.value)}
				onKeyDown={handleKeyDown}
				placeholder="Or type a custom instruction..."
				disabled={isProcessing}
			/>

			{error && <div className="aiModal-error">{error}</div>}

			{preview && <div className="aiEdit-preview">
				<label>Preview</label>
				<pre>{preview}</pre>

				{usage && <div className="aiEdit-usage">
					<span title={`${usage.inputTokens} in / ${usage.outputTokens} out`}>
						<i className="fas fa-coins" /> {formatTokens(usage.inputTokens + usage.outputTokens)} tokens
					</span>
					<span>{formatCost(usage)}</span>
					{sessionUsage.requests > 1 && <span className="aiEdit-session" title={`${sessionUsage.inputTokens} in / ${sessionUsage.outputTokens} out across ${sessionUsage.requests} requests`}>
						session: {formatTokens(sessionUsage.inputTokens + sessionUsage.outputTokens)} tokens, ~{formatCost({ ...sessionUsage, model: usage.model })}
					</span>}
				</div>}

				<div className="aiModal-actions">
					<button className="aiModal-generate" onClick={()=>{ onApply(preview); onClose(); }}>
						<i className="fas fa-check" /> Apply
					</button>
					<button className="aiModal-cancel" onClick={()=>setPreview(null)}>
						Try again
					</button>
				</div>
			</div>}

			{!preview && <div className="aiModal-actions">
				<button
					className="aiModal-generate"
					onClick={()=>handleEdit()}
					disabled={!instruction.trim() || isProcessing}
				>
					{isProcessing ? (
						<><i className="fas fa-spinner fa-spin" /> Processing...</>
					) : (
						<><i className="fas fa-magic" /> Edit</>
					)}
				</button>
				{!isProcessing && <button className="aiModal-cancel" onClick={onClose}>Cancel</button>}
			</div>}

			{isProcessing && <p className="aiModal-status">Sending to Claude...</p>}
		</div>
	</div>;
};

export default AiEditModal;
