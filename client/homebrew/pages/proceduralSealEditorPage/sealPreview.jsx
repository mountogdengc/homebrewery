import React, { useState, useEffect, useRef } from 'react';
import { SealGenerator } from '@shared/procedural/generators/sealGenerator.js';

const sealGen = new SealGenerator();

const SealPreview = (props)=>{
	const { seal, size = 512 } = props;
	const [imageUrl, setImageUrl] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(()=>{
		generatePreview();
	}, [seal]);

	const generatePreview = async ()=>{
		if (!seal || !seal.templateName) return;

		setLoading(true);
		setError(null);

		try {
			const imageData = await sealGen.generate(seal.seed, seal, size);
			setImageUrl(imageData);
		} catch (err) {
			console.error('Preview generation error:', err);
			setError('Error generating preview');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className='seal-preview'>
			<div className='preview-content'>
				{loading && (
					<div className='preview-loading'>
						<div className='spinner'>⊙</div>
						<p>Generating...</p>
					</div>
				)}

				{error && (
					<div className='preview-error'>
						<p>⚠ {error}</p>
					</div>
				)}

				{imageUrl && !loading && (
					<img
						src={imageUrl}
						alt='Seal preview'
						className='seal-image'
						style={{ maxWidth: '100%', maxHeight: '512px' }}
					/>
				)}
			</div>

			<div className='preview-actions'>
				<button
					className='btn-small'
					onClick={()=>{
						if (imageUrl) {
							const a = document.createElement('a');
							a.href = imageUrl;
							a.download = `${seal.name || 'seal'}.png`;
							a.click();
						}
					}}
					disabled={!imageUrl}
				>
					⬇ Download PNG
				</button>
				<button
					className='btn-small'
					onClick={()=>{
						if (seal.shareId) {
							navigator.clipboard.writeText(`{{seal:${seal.shareId}}}`);
							alert('Embed code copied!');
						}
					}}
					disabled={!seal.shareId}
				>
					📋 Copy Embed
				</button>
			</div>
		</div>
	);
};

export default SealPreview;
