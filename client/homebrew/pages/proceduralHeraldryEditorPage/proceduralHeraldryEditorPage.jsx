import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import './proceduralHeraldryEditorPage.less';
import Nav from '@navbar/nav.jsx';
import Navbar from '@navbar/navbar.jsx';
import AccountNavItem from '@navbar/account.navitem.jsx';
import HeraldryForm from './heraldryForm.jsx';
import HeraldryPreview from './heraldryPreview.jsx';

const ProceduralHeraldryEditorPage = (props)=>{
	const { id } = useParams();
	const [heraldry, setHeraldry] = useState(null);
	const [saveStatus, setSaveStatus] = useState('');
	const [loading, setLoading] = useState(!!id);
	const [error, setError] = useState(null);
	const [previewKey, setPreviewKey] = useState(0);

	// Load existing heraldry if editing
	useEffect(()=>{
		if (id) {
			fetchHeraldry();
		} else {
			// New heraldry with default template
			setHeraldry({
				name: '',
				description: '',
				templateName: 'noble_house',
				customizations: {
					primaryColor: '#FF0000',
					accentColor: '#FFD700',
					detail: 0.8
				},
				generatorType: 'heraldry',
				editId: null
			});
			setLoading(false);
		}
	}, [id]);

	const fetchHeraldry = async ()=>{
		try {
			const response = await fetch(`/api/procedural-image/edit/${id}`);
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

	// Auto-save every 2 seconds
	useEffect(()=>{
		if (!heraldry || !heraldry.editId) return;

		const timer = setInterval(()=>{
			saveHeraldry(true);
		}, 2000);

		return ()=>clearInterval(timer);
	}, [heraldry]);

	const saveHeraldry = async (isAutoSave = false)=>{
		if (!heraldry) return;

		try {
			const endpoint = heraldry.editId ? `/api/procedural-image/${heraldry.editId}` : '/api/procedural-image';
			const method = heraldry.editId ? 'PUT' : 'POST';

			const response = await fetch(endpoint, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(heraldry)
			});

			if (!response.ok) throw new Error('Save failed');

			const saved = await response.json();
			setHeraldry(saved);

			if (!isAutoSave) {
				setSaveStatus('Saved!');
				setTimeout(()=>setSaveStatus(''), 2000);
			}
		} catch (err) {
			console.error('Save error:', err);
			setSaveStatus('Save failed');
		}
	};

	const handleShare = async ()=>{
		if (!heraldry.editId) {
			// Must save first
			await saveHeraldry();
			return;
		}

		try {
			const response = await fetch(`/api/procedural-image/${heraldry.editId}/share`, {
				method: 'POST'
			});

			if (!response.ok) throw new Error('Share failed');

			const shared = await response.json();
			const shareUrl = `/heraldry/share/${shared.shareId}`;
			window.location.href = shareUrl;
		} catch (err) {
			console.error('Share error:', err);
		}
	};

	const handleRegenerate = ()=>{
		setPreviewKey(k => k + 1);
	};

	if (loading) {
		return <div className='heraldry-editor-page loading'>Loading...</div>;
	}

	if (error || !heraldry) {
		return <div className='heraldry-editor-page error'>{error || 'Error loading heraldry'}</div>;
	}

	return (
		<div className='heraldry-editor-page'>
			<Navbar>
				<Nav.section>
					<Nav.item color='purple' icon='fas fa-shield-alt'>Heraldry Editor</Nav.item>
					<Nav.item icon='fas fa-home' href='/heraldry/library'>
						Library
					</Nav.item>
				</Nav.section>
				<Nav.section>
					<Nav.item icon='fas fa-redo' onClick={handleRegenerate}>
						Regenerate
					</Nav.item>
					<Nav.item
						icon='fas fa-share-alt'
						onClick={handleShare}
						disabled={!heraldry.editId}
					>
						Share
					</Nav.item>
				</Nav.section>
				<Nav.section>
					<AccountNavItem />
				</Nav.section>
			</Navbar>

			<div className='editor-header'>
				<div className='header-left'>
					<h1>Heraldry Editor</h1>
				</div>
				<div className='header-right'>
					<button
						className='btn btn-primary'
						onClick={()=>saveHeraldry()}
					>
						💾 Save
					</button>
					<div className='save-status'>{saveStatus}</div>
				</div>
			</div>

			<div className='editor-container'>
				<div className='editor-panel'>
					<HeraldryForm
						heraldry={heraldry}
						onChange={setHeraldry}
					/>
				</div>
				<div className='preview-panel'>
					<div className='preview-header'>
						<h2>Preview</h2>
					</div>
					<HeraldryPreview key={previewKey} heraldry={heraldry} />
				</div>
			</div>
		</div>
	);
};

export default ProceduralHeraldryEditorPage;
