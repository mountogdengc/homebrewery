import '../statblockLibraryPage/statblockLibraryPage.less';
import React, { useState, useEffect, useCallback } from 'react';
import request from '../../utils/request-middleware.js';

import Nav            from '@navbar/nav.jsx';
import Navbar         from '@navbar/navbar.jsx';
import AccountNavItem from '@navbar/account.navitem.jsx';

const WillowlightCharacterLibraryPage = ()=>{
	const [characters, setCharacters] = useState([]);
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(0);
	const [total, setTotal] = useState(0);
	const [search, setSearch] = useState('');
	const [loading, setLoading] = useState(true);
	const [status, setStatus] = useState(null);
	const [showImportBox, setShowImportBox] = useState(false);
	const [importText, setImportText] = useState('');

	const fetchCharacters = useCallback(async ()=>{
		setLoading(true);
		try {
			const query = new URLSearchParams({ page, count: 24 });
			if(search) query.set('search', search);
			const res = await request.get(`/api/willowlight-characters?${query.toString()}`);
			setCharacters(res.body.characters);
			setTotalPages(res.body.totalPages);
			setTotal(res.body.total);
		} catch (err) {
			console.error('Failed to fetch:', err);
			setCharacters([]);
		} finally {
			setLoading(false);
		}
	}, [page, search]);

	useEffect(()=>{ fetchCharacters(); }, [fetchCharacters]);
	useEffect(()=>{ setPage(1); }, [search]);

	const handleDelete = async (e, editId, name)=>{
		e.stopPropagation();
		if(!confirm(`Delete "${name || 'Untitled'}"?`)) return;
		try { await request.delete(`/api/willowlight-character/${editId}`); fetchCharacters(); }
		catch (err) { console.error('Delete failed:', err); }
	};

	const handleImportSubmit = async ()=>{
		if(!importText.trim()) return;
		let data;
		try { data = JSON.parse(importText); } catch (e) {
			setStatus('Invalid JSON'); setTimeout(()=>setStatus(null), 3000); return;
		}
		const items = Array.isArray(data) ? data : [data];
		let imported = 0;
		for (const item of items) {
			delete item.editId; delete item.shareId; delete item.id; delete item._id;
			try { await request.post('/api/willowlight-character').send(item); imported++; }
			catch (err) { console.error('Import failed:', err); }
		}
		setStatus(`Imported ${imported} character${imported !== 1 ? 's' : ''}`);
		setTimeout(()=>setStatus(null), 3000);
		setImportText(''); setShowImportBox(false); fetchCharacters();
	};

	const handleDuplicate = async (e, shareId)=>{
		e.stopPropagation();
		try {
			const res = await request.get(`/api/willowlight-character/${shareId}`);
			const ch = res.body;
			delete ch.editId; delete ch.shareId; delete ch.createdAt; delete ch.updatedAt;
			ch.name = `${ch.name || 'Untitled'} (Copy)`;
			const saved = await request.post('/api/willowlight-character').send(ch);
			window.location.href = `/willowlight-character/edit/${saved.body.editId}`;
		} catch (err) { console.error('Duplicate failed:', err); }
	};

	return (
		<div className="statblockLibraryPage">
			<Navbar>
				<Nav.logo />
				<Nav.section><Nav.item color="blue">Willowlight Character Library</Nav.item></Nav.section>
				<Nav.section><AccountNavItem /></Nav.section>
			</Navbar>

			<div className="libraryContent">
				<div className="libraryHeader">
					<h1>Your Willowlight Characters <span style={{ color: '#666', fontSize: '16px', fontWeight: 400 }}>({total})</span></h1>
					<div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
						{status && <span style={{ color: '#4caf50', fontSize: '13px' }}>{status}</span>}
						<button className="newButton" style={{ background: '#2e7d32', border: 'none', cursor: 'pointer' }}
							onClick={()=>setShowImportBox(!showImportBox)}>
							<i className="fas fa-paste" /> Paste Import
						</button>
						<a href="/willowlight-character/new" className="newButton">+ New Character</a>
					</div>
				</div>

				<div className="filterBar">
					<input type="text" placeholder="Search by name..." value={search}
						onChange={(e)=>setSearch(e.target.value)} />
				</div>

				{showImportBox && (
					<div style={{ background: '#252538', border: '1px solid #3a3a54', borderRadius: '6px', padding: '12px', marginBottom: '16px' }}>
						<p style={{ color: '#aaa', fontSize: '13px', margin: '0 0 8px' }}>Paste character JSON:</p>
						<textarea value={importText} onChange={(e)=>setImportText(e.target.value)}
							placeholder='Paste JSON here...'
							style={{ width: '100%', minHeight: '100px', background: '#1e1e2e', border: '1px solid #3a3a54', borderRadius: '4px', color: '#e0e0f0', padding: '8px', fontFamily: 'monospace', fontSize: '12px', resize: 'vertical' }} />
						<div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
							<button className="newButton" style={{ background: '#2e7d32', border: 'none', cursor: 'pointer' }} onClick={handleImportSubmit}>Import</button>
							<button className="newButton" style={{ background: '#3a3a54', border: 'none', cursor: 'pointer' }} onClick={()=>{ setShowImportBox(false); setImportText(''); }}>Cancel</button>
						</div>
					</div>
				)}

				{loading ? (
					<div className="emptyState"><i className="fas fa-spinner fa-spin" /> Loading...</div>
				) : characters.length === 0 ? (
					<div className="emptyState">
						{search ? 'No characters match your search.' : 'No characters yet. Click "+ New Character" to create one.'}
					</div>
				) : (
					<>
						<div className="statblockGrid">
							{characters.map((ch)=>(
								<div className="statblockCard" key={ch.editId}
									onClick={()=>{ window.location.href = `/willowlight-character/edit/${ch.editId}`; }}>
									<div className="cardHeader">
										<h3 className="cardName">{ch.name || 'Untitled'}</h3>
									</div>
									<div className="cardMeta">{ch.conviction}{ch.path ? ` — ${ch.path}` : ''}</div>
									{ch.player && <div className="cardMeta">Player: {ch.player}</div>}
									{ch.tags && ch.tags.length > 0 && (
										<div className="cardTags">
											{ch.tags.map((tag, i)=><span className="tag" key={i}>{tag}</span>)}
										</div>
									)}
									<div className="cardActions">
										<button onClick={(e)=>handleDuplicate(e, ch.shareId)}><i className="fas fa-copy" /> Duplicate</button>
										<button onClick={(e)=>handleDelete(e, ch.editId, ch.name)}><i className="fas fa-trash" /> Delete</button>
									</div>
								</div>
							))}
						</div>

						{totalPages > 1 && (
							<div className="pagination">
								<button disabled={page <= 1} onClick={()=>setPage(page - 1)}>← Previous</button>
								<span className="pageInfo">Page {page} of {totalPages}</span>
								<button disabled={page >= totalPages} onClick={()=>setPage(page + 1)}>Next →</button>
							</div>
						)}
					</>
				)}
			</div>
		</div>
	);
};

export default WillowlightCharacterLibraryPage;
