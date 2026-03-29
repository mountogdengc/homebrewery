import '../../willowlightStatblock/willowlightStatblock.less';
import '../../willowlightCharacter/willowlightCharacter.less';
import '../../statblock/statblock.less';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import request from '../../utils/request-middleware.js';
import { createEmptyWillowlightCharacter } from '@shared/willowlightCharacter/schema.js';

import SplitPane                      from '../../../components/splitPane/splitPane.jsx';
import WillowlightCharacterForm       from '../../willowlightCharacter/willowlightCharacterForm.jsx';
import WillowlightCharacterPreview    from '../../willowlightCharacter/willowlightCharacterPreview.jsx';

import Nav             from '@navbar/nav.jsx';
import Navbar          from '@navbar/navbar.jsx';
import AccountNavItem  from '@navbar/account.navitem.jsx';

const SAVE_TIMEOUT = 3000;

const WillowlightCharacterEditorPage = (props)=>{
	const initial = props.willowlightCharacter || createEmptyWillowlightCharacter();
	const [character, setCharacter] = useState(initial);
	const [editId, setEditId] = useState(props.willowlightCharacter?.editId || null);
	const [shareId, setShareId] = useState(props.willowlightCharacter?.shareId || null);
	const [isSaving, setIsSaving] = useState(false);
	const [layout, setLayout] = useState('narrow');
	const [bw, setBw] = useState(false);
	const [hasChanges, setHasChanges] = useState(false);
	const [error, setError] = useState(null);
	const saveTimeout = useRef(null);

	const handleChange = useCallback((updated)=>{
		setCharacter(updated);
		setHasChanges(true);
	}, []);

	const save = useCallback(async ()=>{
		if(isSaving) return;
		setIsSaving(true);
		setError(null);

		try {
			if(editId) {
				const response = await request.put(`/api/willowlight-character/${editId}`)
					.send(character).timeout({ response: 10000 });
				setCharacter(response.body);
				setHasChanges(false);
			} else {
				const response = await request.post('/api/willowlight-character')
					.send(character).timeout({ response: 10000 });
				const saved = response.body;
				setCharacter(saved);
				setEditId(saved.editId);
				setShareId(saved.shareId);
				setHasChanges(false);
				window.history.replaceState(null, '', `/willowlight-character/edit/${saved.editId}`);
			}
		} catch (err) {
			console.error('Save error:', err);
			setError(err?.response?.body?.error || err.message || 'Save failed');
		} finally {
			setIsSaving(false);
		}
	}, [character, editId, isSaving]);

	useEffect(()=>{
		if(!hasChanges || !editId) return;
		clearTimeout(saveTimeout.current);
		saveTimeout.current = setTimeout(save, SAVE_TIMEOUT);
		return ()=>clearTimeout(saveTimeout.current);
	}, [character, hasChanges, editId]);

	useEffect(()=>{
		const handleKeyDown = (e)=>{
			if((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); save(); }
		};
		document.addEventListener('keydown', handleKeyDown);
		return ()=>document.removeEventListener('keydown', handleKeyDown);
	}, [save]);

	const [copied, setCopied] = useState(false);

	const copyEmbed = ()=>{
		if(!shareId) return;
		const opts = [layout === 'wide' ? 'wide' : '', bw ? 'bw' : ''].filter(Boolean).join(',');
		const code = opts ? `{{willowlight-character:${shareId}|${opts}}}` : `{{willowlight-character:${shareId}}}`;
		navigator.clipboard.writeText(code).then(()=>{
			setCopied(true);
			setTimeout(()=>setCopied(false), 2000);
		});
	};

	return (
		<div className="willowlightCharacterEditorPage">
			<Navbar>
				<Nav.logo />
				<Nav.section>
					<Nav.item className="statblockTitle" color="blue">
						{character.name || 'New Willowlight Character'}
					</Nav.item>
					<Nav.item icon="fas fa-th-list" onClick={()=>{ window.location.href = '/willowlight-character/library'; }}>
						Library
					</Nav.item>
				</Nav.section>

				<Nav.section>
					<Nav.item icon={layout === 'narrow' ? 'fas fa-columns' : 'fas fa-align-justify'}
						onClick={()=>setLayout((l)=>l === 'narrow' ? 'wide' : 'narrow')}>
						{layout === 'narrow' ? 'Wide' : 'Narrow'}
					</Nav.item>

					<Nav.item icon={bw ? 'fas fa-palette' : 'fas fa-adjust'} onClick={()=>setBw((b)=>!b)}>
						{bw ? 'Color' : 'B&W'}
					</Nav.item>

					{shareId && (
						<Nav.item icon={copied ? 'fas fa-check' : 'fas fa-code'} onClick={copyEmbed}>
							{copied ? 'Copied!' : 'Copy Embed'}
						</Nav.item>
					)}

					{error && <Nav.item color="red">{error}</Nav.item>}

					<Nav.item className="save" icon={isSaving ? 'fas fa-spinner fa-spin' : 'fas fa-save'} onClick={save}>
						{isSaving ? 'Saving...' : (hasChanges ? 'Save' : 'Saved')}
					</Nav.item>

					<AccountNavItem />
				</Nav.section>
			</Navbar>

			<div className="content">
				<SplitPane showDividerButtons={false}>
					<WillowlightCharacterForm character={character} onChange={handleChange} />
					<WillowlightCharacterPreview character={character} layout={layout} bw={bw} />
				</SplitPane>
			</div>
		</div>
	);
};

export default WillowlightCharacterEditorPage;
