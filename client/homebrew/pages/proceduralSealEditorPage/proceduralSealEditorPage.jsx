import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router';
import './proceduralSealEditorPage.less';
import SealForm from './sealForm.jsx';
import SealPreview from './sealPreview.jsx';

const ProceduralSealEditorPage = (props)=>{
	const navigate = useNavigate();
	const { id } = useParams();
	const saveTimeoutRef = useRef(null);

	const [seal, setSeal] = useState(null);
	const [originalSeal, setOriginalSeal] = useState(null);
	const [loading, setLoading] = useState(!!id);
	const [saving, setSaving] = useState(false);
	const [lastSaved, setLastSaved] = useState(new Date());
	const [previewKey, setPreviewKey] = useState(0);

	// Load existing seal if editing
	useEffect(()=>{
		if (!id) {
			// New seal with defaults
			setSeal({
				name: 'Untitled Seal',
				description: '',
				templateName: 'simple_wax',
				customizations: {},
				seed: generateRandomSeed(),
				tags: []
			});
			setOriginalSeal({});
			setLoading(false);
		} else {
			fetchSeal(id);
		}
	}, [id]);

	// Auto-save on changes
	useEffect(()=>{
		if (!seal || !originalSeal._id) return; // Don't auto-save new seals until first manual save

		clearTimeout(saveTimeoutRef.current);
		saveTimeoutRef.current = setTimeout(()=>{
			handleSave(true);
		}, 2000);

		return ()=>clearTimeout(saveTimeoutRef.current);
	}, [seal]);

	const fetchSeal = async (editId)=>{
		try {
			const response = await fetch(`/api/procedural-image/edit/${editId}`);
			if (!response.ok) throw new Error('Not found');
			const data = await response.json();
			setSeal(data);
			setOriginalSeal(data);
		} catch (err) {
			console.error('Error loading seal:', err);
			alert('Error loading seal');
			navigate('/seal/library');
		} finally {
			setLoading(false);
		}
	};

	const handleSave = async (isAutoSave = false)=>{
		if (!seal) return;

		setSaving(true);
		try {
			const method = originalSeal._id ? 'PUT' : 'POST';
			const url = originalSeal._id
				? `/api/procedural-image/${originalSeal.editId}`
				: '/api/procedural-image';

			const response = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(seal)
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Save failed');
			}

			const saved = await response.json();
			setOriginalSeal(saved);
			setSeal(saved);
			setLastSaved(new Date());

			if (!isAutoSave) {
				alert('Seal saved!');
				if (!originalSeal._id) {
					navigate(`/seal/edit/${saved.editId}`);
				}
			}
		} catch (err) {
			console.error('Error saving seal:', err);
			if (!isAutoSave) {
				alert(`Error saving seal: ${err.message}`);
			}
		} finally {
			setSaving(false);
		}
	};

	const handleRegenerate = ()=>{
		setSeal({
			...seal,
			seed: generateRandomSeed()
		});
		setPreviewKey(k => k + 1);
	};

	const handleFieldChange = (field, value)=>{
		setSeal({
			...seal,
			[field]: value
		});
	};

	const handleCustomizationChange = (field, value)=>{
		setSeal({
			...seal,
			customizations: {
				...seal.customizations,
				[field]: value
			}
		});
		setPreviewKey(k => k + 1);
	};

	if (loading) {
		return <div className='seal-editor-page loading'>Loading...</div>;
	}

	if (!seal) {
		return <div className='seal-editor-page error'>Error loading seal</div>;
	}

	const isSaved = JSON.stringify(seal) === JSON.stringify(originalSeal);
	const timeAgo = formatTimeAgo(lastSaved);

	return (
		<div className='seal-editor-page'>
			<div className='editor-header'>
				<div className='header-left'>
					<button
						className='btn btn-back'
						onClick={()=>navigate('/seal/library')}
					>
						← Library
					</button>
					<h1>Wax Seal Editor</h1>
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
						{originalSeal._id ? 'Update' : 'Create'} Seal
					</button>
					{originalSeal._id && (
						<button
							className='btn btn-secondary'
							onClick={()=>window.open(`/seal/share/${originalSeal.shareId}`, '_blank')}
						>
							Share
						</button>
					)}
				</div>
			</div>

			<div className='editor-container'>
				<div className='editor-panel'>
					<SealForm
						seal={seal}
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
					<SealPreview
						key={previewKey}
						seal={seal}
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

export default ProceduralSealEditorPage;
