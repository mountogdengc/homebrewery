import React, { useState, useEffect } from 'react';
import { HeraldryGenerator } from '@shared/procedural/generators/heraldryGenerator.js';

const heraldryGen = new HeraldryGenerator();

const HeraldryPreview = (props)=>{
	const { heraldry, size = 512 } = props;
	const [imageUrl, setImageUrl] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(()=>{
		generatePreview();
	}, [heraldry]);

	const generatePreview = async ()=>{
		if (!heraldry || !heraldry.templateName) return;

		setLoading(true);
		setError(null);

		try {
			const imageData = await heraldryGen.generate(heraldry.seed, heraldry, size);
			setImageUrl(imageData);
		} catch (err) {
			console.error('Preview generation error:', err);
			setError('Error generating preview');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className='heraldry-preview'>
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
						alt='Heraldry preview'
						className='heraldry-image'
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
							a.download = `${heraldry.name || 'heraldry'}.png`;
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
						if (heraldry.shareId) {
							navigator.clipboard.writeText(`{{heraldry:${heraldry.shareId}}}`);
							alert('Embed code copied!');
						}
					}}
					disabled={!heraldry.shareId}
				>
					📋 Copy Embed
				</button>
			</div>
		</div>
	);
};

export default HeraldryPreview;
