import './converterPanel.less';
import React, { useState, useRef } from 'react';
import { convert } from './browserConverter.js';

const FORMAT_OPTIONS = [
	{ value: '5ePHB',          label: '5e PHB' },
	{ value: 'DungeonCraftAL', label: 'DungeonCraft AL' },
	{ value: 'Legacy',         label: 'Legacy' },
	{ value: 'Blank',          label: 'Blank' },
];

const ConverterPanel = ({ onConvert, onClose })=>{
	const [input, setInput] = useState('');
	const [format, setFormat] = useState('5ePHB');
	const [preview, setPreview] = useState('');
	const [mode, setMode] = useState('input'); // 'input' or 'preview'
	const fileInputRef = useRef(null);

	const handleConvert = ()=>{
		if(!input.trim()) return;
		const result = convert(input, format);
		setPreview(result);
		setMode('preview');
	};

	const handleInsert = ()=>{
		onConvert(preview);
		onClose();
	};

	const handleFileLoad = (e)=>{
		const file = e.target.files[0];
		if(!file) return;
		const reader = new FileReader();
		reader.onload = (ev)=>{
			setInput(ev.target.result);
			setMode('input');
			setPreview('');
		};
		reader.readAsText(file);
	};

	const handleBack = ()=>{
		setMode('input');
	};

	return (
		<div className="converter-overlay" onClick={onClose}>
			<div className="converter-modal" onClick={(e)=>e.stopPropagation()}>
				<div className="converter-header">
					<h3><i className="fas fa-exchange-alt" /> Markdown Converter</h3>
					<button className="converter-close" onClick={onClose}>&#x2715;</button>
				</div>

				{mode === 'input' && <>
					<div className="converter-controls">
						<label className="converter-label">Target Format:</label>
						<select
							className="converter-select"
							value={format}
							onChange={(e)=>setFormat(e.target.value)}
						>
							{FORMAT_OPTIONS.map((opt)=>(
								<option key={opt.value} value={opt.value}>{opt.label}</option>
							))}
						</select>

						<button className="converter-file-btn" onClick={()=>fileInputRef.current?.click()}>
							<i className="fas fa-file-upload" /> Load File
						</button>
						<input
							ref={fileInputRef}
							type="file"
							accept=".md,.txt,.markdown"
							style={{ display: 'none' }}
							onChange={handleFileLoad}
						/>
					</div>

					<p className="converter-hint">
						Paste standard markdown below, or load a .md file. The converter will transform it to Homebrewery format.
					</p>

					<textarea
						className="converter-input"
						value={input}
						onChange={(e)=>setInput(e.target.value)}
						placeholder="Paste your markdown here..."
						autoFocus
					/>

					<div className="converter-actions">
						<button
							className="converter-convert"
							onClick={handleConvert}
							disabled={!input.trim()}
						>
							<i className="fas fa-exchange-alt" /> Convert
						</button>
						<button className="converter-cancel" onClick={onClose}>Cancel</button>
					</div>
				</>}

				{mode === 'preview' && <>
					<p className="converter-hint">
						Preview the converted output. Click &ldquo;Insert&rdquo; to add it to your brew, or &ldquo;Back&rdquo; to edit the input.
					</p>

					<textarea
						className="converter-input preview"
						value={preview}
						onChange={(e)=>setPreview(e.target.value)}
					/>

					<div className="converter-actions">
						<button className="converter-convert" onClick={handleInsert}>
							<i className="fas fa-file-import" /> Insert into Editor
						</button>
						<button className="converter-cancel" onClick={handleBack}>
							<i className="fas fa-arrow-left" /> Back
						</button>
					</div>
				</>}
			</div>
		</div>
	);
};

export default ConverterPanel;
