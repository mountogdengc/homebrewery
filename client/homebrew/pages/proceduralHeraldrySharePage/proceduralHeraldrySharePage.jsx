import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import './proceduralHeraldrySharePage.less';
import Nav from '@navbar/nav.jsx';
import Navbar from '@navbar/navbar.jsx';
import AccountNavItem from '@navbar/account.navitem.jsx';

const ProceduralHeraldrySharePage = (props)=>{
	const { id } = useParams();
	const [heraldry, setHeraldry] = useState(null);
	const [imageUrl, setImageUrl] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(()=>{
		fetchHeraldry();
	}, [id]);

	useEffect(()=>{
		if (heraldry) {
			loadImage();
		}
	}, [heraldry]);

	const fetchHeraldry = async ()=>{
		try {
			const response = await fetch(`/api/procedural-image/share/${id}`);
			if (!response.ok) throw new Error('Not found');
			const data = await response.json();
			setHeraldry(data);
		} catch (err) {
			console.error('Error loading heraldry:', err);
			setError('Heraldry not found');
		} finally {
			setLoading(false);
		}
	};

	const loadImage = async ()=>{
		if (!heraldry?.shareId) return;

		try {
			const response = await fetch(`/api/procedural-image/${heraldry.shareId}/render?size=512`);
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
		return <div className='heraldry-share-page loading'>Loading...</div>;
	}

	if (error || !heraldry) {
		return <div className='heraldry-share-page error'>{error || 'Error loading heraldry'}</div>;
	}

	const embedCode = `{{heraldry:${heraldry.shareId}}}`;

	return (
		<div className='heraldry-share-page'>
			<Navbar>
				<Nav.section>
					<Nav.item color='purple' icon='fas fa-shield-alt'>Heraldry</Nav.item>
					<Nav.item icon='fas fa-home' href='/heraldry/library'>
						Library
					</Nav.item>
				</Nav.section>
				<Nav.section>
					<AccountNavItem />
				</Nav.section>
			</Navbar>

			<div className='share-header'>
				<h1>{heraldry.name}</h1>
				{heraldry.description && <p className='description'>{heraldry.description}</p>}
			</div>

			<div className='share-container'>
				<div className='heraldry-display'>
					<div className='image-container'>
						{imageUrl && (
							<img
								src={imageUrl}
								alt={heraldry.name}
								className='heraldry-image'
							/>
						)}
					</div>

					<div className='download-section'>
						<a
							href={imageUrl}
							download={`${heraldry.name || 'heraldry'}.png`}
							className='btn btn-download'
						>
							⬇ Download PNG
						</a>
					</div>
				</div>

				<div className='heraldry-info'>
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
							<dd>{heraldry.templateName}</dd>
							<dt>Created:</dt>
							<dd>{new Date(heraldry.createdAt).toLocaleDateString()}</dd>
							<dt>Updated:</dt>
							<dd>{new Date(heraldry.updatedAt).toLocaleDateString()}</dd>
							<dt>Views:</dt>
							<dd>{heraldry.views}</dd>
						</dl>
					</section>

					<section className='info-section'>
						<h2>Share</h2>
						<p>Share this page's URL to let others see your heraldry!</p>
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

export default ProceduralHeraldrySharePage;
