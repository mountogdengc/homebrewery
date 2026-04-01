import React, { useState, useEffect } from 'react';

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
			// For new seals without a shareId, we'll use a temporary ID based on seed
			const tempId = seal.seed || 'preview';
			const response = await fetch(
				`/api/procedural-image/${tempId}/render?size=${size}`,
				{
					method: seal.editId ? 'GET' : 'POST',
					headers: seal.editId ? {} : { 'Content-Type': 'application/json' },
					...(seal.editId ? {} : { body: JSON.stringify(seal) })
				}
			);

			if (response.ok) {
				const blob = await response.blob();
				const url = URL.createObjectURL(blob);
				setImageUrl(url);
			} else {
				// Fallback: Try generating client-side with canvas
				// This would require importing the seal generator
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
						if (imageUrl) {
							navigator.clipboard.writeText(`{{seal:${seal.shareId || 'ID'}}}`);
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
