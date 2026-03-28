import './besmBuilder.css';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import request from '../../utils/request-middleware.js';
import { ToastProvider } from './besm/contexts/ToastContext.tsx';
import { PowProvider } from './besm/components/PowEffect.tsx';
import { CharacterBuilder } from './besm/components/CharacterBuilder.tsx';

const SAVE_TIMEOUT = 3000;

const BesmBuilderPage = (props)=>{
	const initial = props.besmCharacter || null;
	const [character, setCharacter] = useState(initial);
	const [editId, setEditId] = useState(props.besmCharacter?.editId || null);
	const [shareId, setShareId] = useState(props.besmCharacter?.shareId || null);
	const [isSaving, setIsSaving] = useState(false);
	const [hasChanges, setHasChanges] = useState(false);
	const [error, setError] = useState(null);
	const saveTimeout = useRef(null);

	const handleCharacterChange = useCallback((updated)=>{
		setCharacter(updated);
		setHasChanges(true);
	}, []);

	const save = useCallback(async ()=>{
		if(isSaving || !character) return;
		setIsSaving(true);
		setError(null);

		try {
			if(editId) {
				const response = await request.put(`/api/besm/${editId}`)
					.send(character)
					.timeout({ response: 10000 });
				setHasChanges(false);
			} else {
				const response = await request.post('/api/besm')
					.send(character)
					.timeout({ response: 10000 });
				const saved = response.body;
				setEditId(saved.editId);
				setShareId(saved.shareId);
				setHasChanges(false);
				window.history.replaceState(null, '', `/besm/edit/${saved.editId}`);
			}
		} catch (err) {
			console.error('Save error:', err);
			setError(err?.response?.body?.error || err.message || 'Save failed');
		} finally {
			setIsSaving(false);
		}
	}, [character, editId, isSaving]);

	// Auto-save on changes (debounced)
	useEffect(()=>{
		if(!hasChanges || !editId) return;
		clearTimeout(saveTimeout.current);
		saveTimeout.current = setTimeout(save, SAVE_TIMEOUT);
		return ()=>clearTimeout(saveTimeout.current);
	}, [character, hasChanges, editId]);

	// Ctrl+S to save
	useEffect(()=>{
		const handleKeyDown = (e)=>{
			if((e.ctrlKey || e.metaKey) && e.key === 's') {
				e.preventDefault();
				save();
			}
		};
		document.addEventListener('keydown', handleKeyDown);
		return ()=>document.removeEventListener('keydown', handleKeyDown);
	}, [save]);

	const saveLabel = isSaving ? 'Saving...' : (hasChanges ? 'Save' : (editId ? 'Saved' : 'Save'));
	const saveIcon = isSaving ? 'fas fa-spinner fa-spin' : 'fas fa-save';

	return (
		<div className="besm-builder">
			<div className="besm-toolbar" style={{
				padding: '8px 16px',
				background: 'rgba(0,0,0,0.3)',
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'center',
				flexWrap: 'wrap',
				gap: '8px'
			}}>
				<div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
					<a href="/" className="besm-back-link">
						<i className="fas fa-arrow-left" /> Toolkit
					</a>
					<a href="/besm/library" className="besm-back-link">
						<i className="fas fa-th-list" /> Library
					</a>
					<a href="/besm/new" className="besm-back-link">
						<i className="fas fa-plus" /> New
					</a>
				</div>

				<div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
					{error && (
						<span style={{ color: '#ff6b6b', fontSize: '13px' }}>{error}</span>
					)}
					<button
						onClick={save}
						disabled={isSaving}
						style={{
							background: hasChanges ? 'var(--besm-pink, #e93a7d)' : 'rgba(255,255,255,0.15)',
							color: 'white',
							border: 'none',
							borderRadius: '6px',
							padding: '6px 14px',
							cursor: isSaving ? 'wait' : 'pointer',
							fontFamily: "'Bangers', cursive",
							fontSize: '1rem',
							letterSpacing: '0.5px',
							display: 'flex',
							alignItems: 'center',
							gap: '6px',
							transition: 'background 0.2s'
						}}
					>
						<i className={saveIcon} /> {saveLabel}
					</button>
				</div>
			</div>

			<ToastProvider>
				<PowProvider>
					<CharacterBuilder
						initialCharacter={initial}
						onCharacterChange={handleCharacterChange}
					/>
				</PowProvider>
			</ToastProvider>
		</div>
	);
};

export default BesmBuilderPage;
