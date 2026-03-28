import '../../willowlightStatblock/willowlightStatblock.less';
import '../../statblock/statblock.less';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import request from '../../utils/request-middleware.js';
import { createEmptyWillowlightStatblock } from '@shared/willowlightStatblock/schema.js';

import SplitPane                    from '../../../components/splitPane/splitPane.jsx';
import WillowlightStatblockForm     from '../../willowlightStatblock/willowlightStatblockForm.jsx';
import WillowlightStatblockPreview  from '../../willowlightStatblock/willowlightStatblockPreview.jsx';

import Nav             from '@navbar/nav.jsx';
import Navbar          from '@navbar/navbar.jsx';
import AccountNavItem  from '@navbar/account.navitem.jsx';

const SAVE_TIMEOUT = 3000;

const WillowlightStatblockEditorPage = (props)=>{
	const initial = props.willowlightStatblock || createEmptyWillowlightStatblock();
	const [statblock, setStatblock] = useState(initial);
	const [editId, setEditId] = useState(props.willowlightStatblock?.editId || null);
	const [shareId, setShareId] = useState(props.willowlightStatblock?.shareId || null);
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
				const response = await request.put(`/api/willowlight-statblock/${editId}`)
					.send(statblock)
					.timeout({ response: 10000 });
				setStatblock(response.body);
				setHasChanges(false);
			} else {
				const response = await request.post('/api/willowlight-statblock')
					.send(statblock)
					.timeout({ response: 10000 });
				const saved = response.body;
				setStatblock(saved);
				setEditId(saved.editId);
				setShareId(saved.shareId);
				setHasChanges(false);
				window.history.replaceState(null, '', `/willowlight/edit/${saved.editId}`);
			}
		} catch (err) {
			console.error('Save error:', err);
			setError(err?.response?.body?.error || err.message || 'Save failed');
		} finally {
			setIsSaving(false);
		}
	}, [statblock, editId, isSaving]);

	useEffect(()=>{
		if(!hasChanges || !editId) return;
		clearTimeout(saveTimeout.current);
		saveTimeout.current = setTimeout(save, SAVE_TIMEOUT);
		return ()=>clearTimeout(saveTimeout.current);
	}, [statblock, hasChanges, editId]);

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

	const [copied, setCopied] = useState(false);
	const toggleLayout = ()=>setLayout((l)=>l === 'narrow' ? 'wide' : 'narrow');

	const copyEmbed = ()=>{
		if(!shareId) return;
		const code = `{{willowlight-statblock:${shareId}}}`;
		navigator.clipboard.writeText(code).then(()=>{
			setCopied(true);
			setTimeout(()=>setCopied(false), 2000);
		});
	};

	return (
		<div className="willowlightStatblockEditorPage">
			<Navbar>
				<Nav.logo />
				<Nav.section>
					<Nav.item className="statblockTitle" color="blue">
						{statblock.name || 'New Willowlight Stat Block'}
					</Nav.item>
					<Nav.item icon="fas fa-th-list" onClick={()=>{ window.location.href = '/willowlight/library'; }}>
						Library
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

					{shareId && (
						<Nav.item icon={copied ? 'fas fa-check' : 'fas fa-code'} onClick={copyEmbed}>
							{copied ? 'Copied!' : 'Copy Embed'}
						</Nav.item>
					)}

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
					<WillowlightStatblockForm statblock={statblock} onChange={handleChange} />
					<WillowlightStatblockPreview statblock={statblock} layout={layout} />
				</SplitPane>
			</div>
		</div>
	);
};

export default WillowlightStatblockEditorPage;
