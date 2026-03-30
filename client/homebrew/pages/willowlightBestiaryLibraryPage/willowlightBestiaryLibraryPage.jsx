import '../statblockLibraryPage/statblockLibraryPage.less';
import React, { useState, useEffect, useCallback } from 'react';
import request from '../../utils/request-middleware.js';
import { TIER_LABELS } from '@shared/willowlight/bestiarySchema.js';

import Nav            from '@navbar/nav.jsx';
import Navbar         from '@navbar/navbar.jsx';
import AccountNavItem from '@navbar/account.navitem.jsx';

const WillowlightBestiaryLibraryPage = ()=>{
	const [entries, setEntries] = useState([]);
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(0);
	const [total, setTotal] = useState(0);
	const [search, setSearch] = useState('');
	const [loading, setLoading] = useState(true);
	const [status, setStatus] = useState(null);
	const [showImportBox, setShowImportBox] = useState(false);
	const [importText, setImportText] = useState('');

	const fetchEntries = useCallback(async ()=>{
		setLoading(true);
		try {
			const query = new URLSearchParams({ page, count: 24 });
			if(search) query.set('search', search);
			const res = await request.get(`/api/willowlight-bestiaries?${query.toString()}`);
			setEntries(res.body.entries);
			setTotalPages(res.body.totalPages);
			setTotal(res.body.total);
		} catch (err) {
			console.error('Failed to fetch:', err);
			setEntries([]);
		} finally {
			setLoading(false);
		}
	}, [page, search]);

	useEffect(()=>{ fetchEntries(); }, [fetchEntries]);
	useEffect(()=>{ setPage(1); }, [search]);

	const handleDelete = async (e, editId, name)=>{
		e.stopPropagation();
		if(!confirm(`Delete "${name || 'Untitled'}"?`)) return;
		try { await request.delete(`/api/willowlight-bestiary/${editId}`); fetchEntries(); }
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
			try { await request.post('/api/willowlight-bestiary').send(item); imported++; }
			catch (err) { console.error('Import failed:', err); }
		}
		setStatus(`Imported ${imported} entr${imported !== 1 ? 'ies' : 'y'}`);
		setTimeout(()=>setStatus(null), 3000);
		setImportText(''); setShowImportBox(false); fetchEntries();
	};

	const handleDuplicate = async (e, shareId)=>{
		e.stopPropagation();
		try {
			const res = await request.get(`/api/willowlight-bestiary/${shareId}`);
			const entry = res.body;
			delete entry.editId; delete entry.shareId; delete entry.createdAt; delete entry.updatedAt;
			entry.name = `${entry.name || 'Untitled'} (Copy)`;
			const saved = await request.post('/api/willowlight-bestiary').send(entry);
			window.location.href = `/willowlight/bestiary/edit/${saved.body.editId}`;
		} catch (err) { console.error('Duplicate failed:', err); }
	};

	const tierBadge = (tier)=>{
		const colors = { mook: '#5a8a4a', elite: '#4a7a9b', boss: '#b34040', legend: '#7a5a9b' };
		return <span style={{
			background: colors[tier] || '#555', color: '#fff', fontSize: '10px',
			padding: '1px 6px', borderRadius: '3px', fontWeight: 600, textTransform: 'uppercase'
		}}>{TIER_LABELS[tier] || tier}</span>;
	};

	return (
		<div className="statblockLibraryPage">
			<Navbar>
				<Nav.section>
					<Nav.item color="blue">Willowlight Bestiary</Nav.item>
					<Nav.item icon="fas fa-plus" onClick={()=>{ window.location.href = '/willowlight/bestiary/new'; }}>
						New Enemy
					</Nav.item>
					<Nav.item icon="fas fa-th-list" onClick={()=>{ window.location.href = '/willowlight/library'; }}>
						Characters
					</Nav.item>
					<Nav.item icon="fas fa-paste" onClick={()=>setShowImportBox(!showImportBox)}>
						Paste Import
					</Nav.item>
					<Nav.item icon="fas fa-dice-d20" onClick={()=>{ window.location.href = '/playtest'; }}>
						Playtest
					</Nav.item>
				</Nav.section>
				<Nav.section>
					{status && <Nav.item color="green">{status}</Nav.item>}
					<AccountNavItem />
				</Nav.section>
			</Navbar>

			<div className="libraryContent">
				<div className="libraryHeader">
					<h1>Willowlight Bestiary <span style={{ color: '#666', fontSize: '16px', fontWeight: 400 }}>({total})</span></h1>
				</div>

				<div className="filterBar">
					<input type="text" placeholder="Search by name..." value={search}
						onChange={(e)=>setSearch(e.target.value)} />
				</div>

				{showImportBox && (
					<div style={{ background: '#252538', border: '1px solid #3a3a54', borderRadius: '6px', padding: '12px', marginBottom: '16px' }}>
						<p style={{ color: '#aaa', fontSize: '13px', margin: '0 0 8px' }}>Paste enemy JSON:</p>
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
				) : entries.length === 0 ? (
					<div className="emptyState">
						{search ? 'No enemies match your search.' : 'No bestiary entries yet. Click "+ New Enemy" to create one.'}
					</div>
				) : (
					<>
						<div className="statblockGrid">
							{entries.map((e)=>(
								<div className="statblockCard" key={e.editId}
									onClick={()=>{ window.location.href = `/willowlight/bestiary/edit/${e.editId}`; }}>
									<div className="cardHeader">
										<h3 className="cardName">{e.name || 'Untitled'}</h3>
										{tierBadge(e.tier)}
									</div>
									{e.subtitle && <div className="cardMeta">{e.subtitle}</div>}
									{e.tags && e.tags.length > 0 && (
										<div className="cardTags">
											{e.tags.map((tag, i)=><span className="tag" key={i}>{tag}</span>)}
										</div>
									)}
									<div className="cardActions">
										<button onClick={(ev)=>handleDuplicate(ev, e.shareId)}><i className="fas fa-copy" /> Duplicate</button>
										<button onClick={(ev)=>handleDelete(ev, e.editId, e.name)}><i className="fas fa-trash" /> Delete</button>
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

export default WillowlightBestiaryLibraryPage;
