import React, { useState, useEffect } from 'react';

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
			const tempId = heraldry.seed || 'preview';
			const response = await fetch(
				`/api/procedural-image/${tempId}/render?size=${size}`,
				{
					method: heraldry.editId ? 'GET' : 'POST',
					headers: heraldry.editId ? {} : { 'Content-Type': 'application/json' },
					...(heraldry.editId ? {} : { body: JSON.stringify({ ...heraldry, generatorType: 'heraldry' }) })
				}
			);

			if (response.ok) {
				const blob = await response.blob();
				const url = URL.createObjectURL(blob);
				setImageUrl(url);
			} else {
				setError('Unable to generate preview');
			}
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
						if (imageUrl) {
							navigator.clipboard.writeText(`{{heraldry:${heraldry.shareId || 'ID'}}}`);
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
