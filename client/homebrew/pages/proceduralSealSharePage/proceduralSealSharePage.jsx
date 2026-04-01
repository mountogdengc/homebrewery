import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import './proceduralSealSharePage.less';

const ProceduralSealSharePage = (props)=>{
	const { id } = useParams();
	const [seal, setSeal] = useState(null);
	const [imageUrl, setImageUrl] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [size, setSize] = useState('medium');

	useEffect(()=>{
		fetchSeal();
	}, [id]);

	useEffect(()=>{
		if (seal) {
			loadImage();
		}
	}, [seal, size]);

	const fetchSeal = async ()=>{
		try {
			const response = await fetch(`/api/procedural-image/share/${id}`);
			if (!response.ok) throw new Error('Not found');
			const data = await response.json();
			setSeal(data);
		} catch (err) {
			console.error('Error loading seal:', err);
			setError('Seal not found');
		} finally {
			setLoading(false);
		}
	};

	const loadImage = async ()=>{
		if (!seal?.shareId) return;

		const sizeMap = {
			small: 256,
			medium: 512,
			large: 1024
		};

		try {
			const response = await fetch(`/api/procedural-image/${seal.shareId}/render?size=${sizeMap[size]}`);
			if (response.ok) {
				const blob = await response.blob();
				const url = URL.createObjectURL(blob);
				setImageUrl(url);
			}
		} catch (err) {
			console.error('Error loading image:', err);
		}
	};

	if (loading) {
		return <div className='seal-share-page loading'>Loading...</div>;
	}

	if (error || !seal) {
		return <div className='seal-share-page error'>{error || 'Error loading seal'}</div>;
	}

	const embedCode = `{{seal:${seal.shareId}}}`;

	return (
		<div className='seal-share-page'>
			<div className='share-header'>
				<h1>{seal.name}</h1>
				{seal.description && <p className='description'>{seal.description}</p>}
			</div>

			<div className='share-container'>
				<div className='seal-display'>
					<div className='size-controls'>
						<label>Size:</label>
						<button
							className={`size-btn ${size === 'small' ? 'active' : ''}`}
							onClick={()=>setSize('small')}
						>
							Small (256px)
						</button>
						<button
							className={`size-btn ${size === 'medium' ? 'active' : ''}`}
							onClick={()=>setSize('medium')}
						>
							Medium (512px)
						</button>
						<button
							className={`size-btn ${size === 'large' ? 'active' : ''}`}
							onClick={()=>setSize('large')}
						>
							Large (1024px)
						</button>
					</div>

					<div className='image-container'>
						{imageUrl && (
							<img
								src={imageUrl}
								alt={seal.name}
								className='seal-image'
							/>
						)}
					</div>

					<div className='download-section'>
						<a
							href={imageUrl}
							download={`${seal.name || 'seal'}.png`}
							className='btn btn-download'
						>
							⬇ Download PNG
						</a>
					</div>
				</div>

				<div className='seal-info'>
					<section className='info-section'>
						<h2>Embed in Brew</h2>
						<p className='instructions'>
							Copy this code and paste it into your brew document:
						</p>
						<div className='code-block'>
							<code>{embedCode}</code>
							<button
								className='copy-btn'
								onClick={()=>{
									navigator.clipboard.writeText(embedCode);
									alert('Copied to clipboard!');
								}}
							>
								Copy
							</button>
						</div>
					</section>

					<section className='info-section'>
						<h2>Details</h2>
						<dl>
							<dt>Template:</dt>
							<dd>{seal.templateName}</dd>
							<dt>Created:</dt>
							<dd>{new Date(seal.createdAt).toLocaleDateString()}</dd>
							<dt>Updated:</dt>
							<dd>{new Date(seal.updatedAt).toLocaleDateString()}</dd>
							<dt>Views:</dt>
							<dd>{seal.views}</dd>
						</dl>
					</section>

					{seal.tags && seal.tags.length > 0 && (
						<section className='info-section'>
							<h2>Tags</h2>
							<div className='tag-list'>
								{seal.tags.map(tag => (
									<span key={tag} className='tag'>{tag}</span>
								))}
							</div>
						</section>
					)}

					<section className='info-section'>
						<h2>Share</h2>
						<p>Share this page's URL to let others see your seal!</p>
						<div className='url-block'>
							<input
								type='text'
								value={window.location.href}
								readOnly
								className='url-input'
							/>
							<button
								className='copy-btn'
								onClick={()=>{
									navigator.clipboard.writeText(window.location.href);
									alert('URL copied!');
								}}
							>
								Copy Link
							</button>
						</div>
					</section>
				</div>
			</div>
		</div>
	);
};

export default ProceduralSealSharePage;
