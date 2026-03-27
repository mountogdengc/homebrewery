import '../../statblock/statblock.less';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import _ from 'lodash';
import request from '../../utils/request-middleware.js';
import { createEmptyStatblock } from '@shared/statblock/schema.js';

import SplitPane       from '../../../components/splitPane/splitPane.jsx';
import StatblockForm   from '../../statblock/statblockForm.jsx';
import StatblockPreview from '../../statblock/statblockPreview.jsx';

import Nav             from '@navbar/nav.jsx';
import Navbar          from '@navbar/navbar.jsx';
import AccountNavItem  from '@navbar/account.navitem.jsx';

const SAVE_TIMEOUT = 3000;

const StatblockEditorPage = (props)=>{
	const initial = props.statblock || createEmptyStatblock();
	const [statblock, setStatblock] = useState(initial);
	const [editId, setEditId] = useState(props.statblock?.editId || null);
	const [shareId, setShareId] = useState(props.statblock?.shareId || null);
	const [isSaving, setIsSaving] = useState(false);
	const [layout, setLayout] = useState('narrow');
	const [hasChanges, setHasChanges] = useState(false);
	const [error, setError] = useState(null);
	const saveTimeout = useRef(null);

	const handleChange = useCallback((updated)=>{
		setStatblock(updated);
		setHasChanges(true);
	}, []);

	const save = useCallback(async ()=>{
		if(isSaving) return;
		setIsSaving(true);
		setError(null);

		try {
			if(editId) {
				const response = await request.put(`/api/statblock/${editId}`)
					.send(statblock)
					.timeout({ response: 10000 });
				setStatblock(response.body);
				setHasChanges(false);
			} else {
				const response = await request.post('/api/statblock')
					.send(statblock)
					.timeout({ response: 10000 });
				const saved = response.body;
				setStatblock(saved);
				setEditId(saved.editId);
				setShareId(saved.shareId);
				setHasChanges(false);
				window.history.replaceState(null, '', `/statblock/edit/${saved.editId}`);
			}
		} catch (err) {
			console.error('Save error:', err);
			setError(err?.response?.body?.error || err.message || 'Save failed');
		} finally {
			setIsSaving(false);
		}
	}, [statblock, editId, isSaving]);

	// Auto-save on changes (debounced)
	useEffect(()=>{
		if(!hasChanges || !editId) return;
		clearTimeout(saveTimeout.current);
		saveTimeout.current = setTimeout(save, SAVE_TIMEOUT);
		return ()=>clearTimeout(saveTimeout.current);
	}, [statblock, hasChanges, editId]);

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

	const toggleLayout = ()=>{
		setLayout((l)=>l === 'narrow' ? 'wide' : 'narrow');
	};

	return (
		<div className="statblockEditorPage">
			<Navbar>
				<Nav.logo />
				<Nav.section>
					<Nav.item className="statblockTitle" color="purple">
						{statblock.name || 'New Stat Block'}
					</Nav.item>
				</Nav.section>

				<Nav.section>
					<Nav.item
						className="layoutToggle"
						icon={layout === 'narrow' ? 'fas fa-columns' : 'fas fa-align-justify'}
						onClick={toggleLayout}
					>
						{layout === 'narrow' ? 'Wide' : 'Narrow'}
					</Nav.item>

					{error && <Nav.item color="red">{error}</Nav.item>}

					<Nav.item
						className="save"
						icon={isSaving ? 'fas fa-spinner fa-spin' : 'fas fa-save'}
						onClick={save}
					>
						{isSaving ? 'Saving...' : (hasChanges ? 'Save' : 'Saved')}
					</Nav.item>

					<AccountNavItem />
				</Nav.section>
			</Navbar>

			<div className="content">
				<SplitPane showDividerButtons={false}>
					<StatblockForm
						statblock={statblock}
						onChange={handleChange}
					/>
					<StatblockPreview
						statblock={statblock}
						layout={layout}
					/>
				</SplitPane>
			</div>
		</div>
	);
};

export default StatblockEditorPage;
