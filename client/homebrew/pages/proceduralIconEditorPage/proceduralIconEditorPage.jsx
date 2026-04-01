import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router';
import './proceduralIconEditorPage.less';
import IconForm from './iconForm.jsx';
import IconPreview from './iconPreview.jsx';
import Nav from '@navbar/nav.jsx';
import Navbar from '@navbar/navbar.jsx';
import AccountNavItem from '@navbar/account.navitem.jsx';

const ProceduralIconEditorPage = (props)=>{
	const navigate = useNavigate();
	const { id } = useParams();
	const saveTimeoutRef = useRef(null);

	const [icon, setIcon] = useState(null);
	const [originalIcon, setOriginalIcon] = useState(null);
	const [loading, setLoading] = useState(!!id);
	const [saving, setSaving] = useState(false);
	const [lastSaved, setLastSaved] = useState(new Date());
	const [previewKey, setPreviewKey] = useState(0);

	// Load existing icon if editing
	useEffect(()=>{
		if (!id) {
			// New icon with defaults
			setIcon({
				name: 'Untitled Icon',
				description: '',
				templateName: 'dragon_slaying',
				customizations: {},
				seed: generateRandomSeed(),
				tags: []
			});
			setOriginalIcon({});
			setLoading(false);
		} else {
			fetchIcon(id);
		}
	}, [id]);

	// Auto-save on changes
	useEffect(()=>{
		if (!icon || !originalIcon._id) return;

		clearTimeout(saveTimeoutRef.current);
		saveTimeoutRef.current = setTimeout(()=>{
			handleSave(true);
		}, 2000);

		return ()=>clearTimeout(saveTimeoutRef.current);
	}, [icon]);

	const fetchIcon = async (editId)=>{
		try {
			const response = await fetch(`/api/procedural-image/edit/${editId}`);
			if (!response.ok) throw new Error('Not found');
			const data = await response.json();
			setIcon(data);
			setOriginalIcon(data);
		} catch (err) {
			console.error('Error loading icon:', err);
			alert('Error loading icon');
			navigate('/icon/library');
		} finally {
			setLoading(false);
		}
	};

	const handleSave = async (isAutoSave = false)=>{
		if (!icon) return;

		setSaving(true);
		try {
			const method = originalIcon._id ? 'PUT' : 'POST';
			const url = originalIcon._id
				? `/api/procedural-image/${originalIcon.editId}`
				: '/api/procedural-image';

			const body = {
				...icon,
				generatorType: 'icon'
			};

			const response = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Save failed');
			}

			const saved = await response.json();
			setOriginalIcon(saved);
			setIcon(saved);
			setLastSaved(new Date());

			if (!isAutoSave) {
				alert('Icon saved!');
				if (!originalIcon._id) {
					navigate(`/icon/edit/${saved.editId}`);
				}
			}
		} catch (err) {
			console.error('Error saving icon:', err);
			if (!isAutoSave) {
				alert(`Error saving icon: ${err.message}`);
			}
		} finally {
			setSaving(false);
		}
	};

	const handleRegenerate = ()=>{
		setIcon({
			...icon,
			seed: generateRandomSeed()
		});
		setPreviewKey(k => k + 1);
	};

	const handleFieldChange = (field, value)=>{
		setIcon({
			...icon,
			[field]: value
		});
	};

	const handleCustomizationChange = (field, value)=>{
		setIcon({
			...icon,
			customizations: {
				...icon.customizations,
				[field]: value
			}
		});
		setPreviewKey(k => k + 1);
	};

	if (loading) {
		return <div className='icon-editor-page loading'>Loading...</div>;
	}

	if (!icon) {
		return <div className='icon-editor-page error'>Error loading icon</div>;
	}

	const isSaved = JSON.stringify(icon) === JSON.stringify(originalIcon);
	const timeAgo = formatTimeAgo(lastSaved);

	return (
		<div className='icon-editor-page'>
			<Navbar>
				<Nav.section>
					<Nav.item color='purple' icon='fas fa-gem'>Adventure Icon</Nav.item>
					<Nav.item icon='fas fa-arrow-left' onClick={()=>navigate('/icon/library')}>
						Library
					</Nav.item>
				</Nav.section>
				<Nav.section>
					<AccountNavItem />
				</Nav.section>
			</Navbar>

			<div className='editor-header'>
				<div className='header-left'>
					<h1>Icon Editor</h1>
				</div>
				<div className='header-right'>
					<span className='save-status'>
						{saving ? 'Saving...' : isSaved ? `Saved ${timeAgo}` : 'Unsaved'}
					</span>
					<button
						className='btn btn-primary'
						onClick={()=>handleSave(false)}
						disabled={saving || isSaved}
					>
						{originalIcon._id ? 'Update' : 'Create'} Icon
					</button>
					{originalIcon._id && (
						<button
							className='btn btn-secondary'
							onClick={()=>window.open(`/icon/share/${originalIcon.shareId}`, '_blank')}
						>
							Share
						</button>
					)}
				</div>
			</div>

			<div className='editor-container'>
				<div className='editor-panel'>
					<IconForm
						icon={icon}
						onFieldChange={handleFieldChange}
						onCustomizationChange={handleCustomizationChange}
						onRegenerate={handleRegenerate}
					/>
				</div>

				<div className='preview-panel'>
					<div className='preview-header'>
						<h2>Preview</h2>
						<button
							className='btn-regenerate'
							onClick={handleRegenerate}
							title='Generate new random seed'
						>
							🔄 Regenerate
						</button>
					</div>
					<IconPreview
						key={previewKey}
						icon={icon}
						size={512}
					/>
				</div>
			</div>
		</div>
	);
};

function generateRandomSeed() {
	const timestamp = Date.now().toString(36);
	const random = Math.random().toString(36).slice(2);
	return (timestamp + random).slice(0, 16).padEnd(16, '0');
}

function formatTimeAgo(date) {
	const seconds = Math.floor((new Date() - date) / 1000);
	if (seconds < 60) return 'just now';
	if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
	if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
	return `${Math.floor(seconds / 86400)}d ago`;
}

export default ProceduralIconEditorPage;
