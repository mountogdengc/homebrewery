import React, { useState, useEffect } from 'react';
import { AdventureIconGenerator } from '@shared/procedural/generators/adventureIconGenerator.js';

const iconGen = new AdventureIconGenerator();

const IconPreview = (props)=>{
	const { icon, size = 512 } = props;
	const [imageUrl, setImageUrl] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(()=>{
		generatePreview();
	}, [icon]);

	const generatePreview = async ()=>{
		if (!icon || !icon.templateName) return;

		setLoading(true);
		setError(null);

		try {
			const imageData = await iconGen.generate(icon.seed, icon, size);
			setImageUrl(imageData);
		} catch (err) {
			console.error('Preview generation error:', err);
			setError('Error generating preview');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className='icon-preview'>
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
						alt='Icon preview'
						className='icon-image'
						style={{ maxWidth: '100%', maxHeight: '400px' }}
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
							a.download = `${icon.name || 'icon'}.png`;
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
						if (icon.shareId) {
							navigator.clipboard.writeText(`{{icon:${icon.shareId}}}`);
							alert('Embed code copied!');
						}
					}}
					disabled={!icon.shareId}
				>
					📋 Copy Embed
				</button>
			</div>
		</div>
	);
};

export default IconPreview;
