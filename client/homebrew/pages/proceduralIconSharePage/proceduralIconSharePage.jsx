import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import './proceduralIconSharePage.less';
import Nav from '@navbar/nav.jsx';
import Navbar from '@navbar/navbar.jsx';
import AccountNavItem from '@navbar/account.navitem.jsx';

const ProceduralIconSharePage = (props)=>{
	const { id } = useParams();
	const [icon, setIcon] = useState(null);
	const [imageUrl, setImageUrl] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(()=>{
		fetchIcon();
	}, [id]);

	useEffect(()=>{
		if (icon) {
			loadImage();
		}
	}, [icon]);

	const fetchIcon = async ()=>{
		try {
			const response = await fetch(`/api/procedural-image/share/${id}`);
			if (!response.ok) throw new Error('Not found');
			const data = await response.json();
			setIcon(data);
		} catch (err) {
			console.error('Error loading icon:', err);
			setError('Icon not found');
		} finally {
			setLoading(false);
		}
	};

	const loadImage = async ()=>{
		if (!icon?.shareId) return;

		try {
			const response = await fetch(`/api/procedural-image/${icon.shareId}/render?size=512`);
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
		return <div className='icon-share-page loading'>Loading...</div>;
	}

	if (error || !icon) {
		return <div className='icon-share-page error'>{error || 'Error loading icon'}</div>;
	}

	const embedCode = `{{icon:${icon.shareId}}}`;

	return (
		<div className='icon-share-page'>
			<Navbar>
				<Nav.section>
					<Nav.item color='purple' icon='fas fa-gem'>Adventure Icon</Nav.item>
					<Nav.item icon='fas fa-home' href='/icon/library'>
						Library
					</Nav.item>
				</Nav.section>
				<Nav.section>
					<AccountNavItem />
				</Nav.section>
			</Navbar>

			<div className='share-header'>
				<h1>{icon.name}</h1>
				{icon.description && <p className='description'>{icon.description}</p>}
			</div>

			<div className='share-container'>
				<div className='icon-display'>
					<div className='image-container'>
						{imageUrl && (
							<img
								src={imageUrl}
								alt={icon.name}
								className='icon-image'
							/>
						)}
					</div>

					<div className='download-section'>
						<a
							href={imageUrl}
							download={`${icon.name || 'icon'}.png`}
							className='btn btn-download'
						>
							⬇ Download PNG
						</a>
					</div>
				</div>

				<div className='icon-info'>
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
							<dt>Theme:</dt>
							<dd>{icon.templateName}</dd>
							<dt>Created:</dt>
							<dd>{new Date(icon.createdAt).toLocaleDateString()}</dd>
							<dt>Updated:</dt>
							<dd>{new Date(icon.updatedAt).toLocaleDateString()}</dd>
							<dt>Views:</dt>
							<dd>{icon.views}</dd>
						</dl>
					</section>

					{icon.tags && icon.tags.length > 0 && (
						<section className='info-section'>
							<h2>Tags</h2>
							<div className='tag-list'>
								{icon.tags.map(tag => (
									<span key={tag} className='tag'>{tag}</span>
								))}
							</div>
						</section>
					)}

					<section className='info-section'>
						<h2>Share</h2>
						<p>Share this page's URL to let others see your icon!</p>
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

export default ProceduralIconSharePage;
