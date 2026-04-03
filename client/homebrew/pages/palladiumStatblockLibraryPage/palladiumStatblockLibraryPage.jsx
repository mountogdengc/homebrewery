import '../statblockLibraryPage/statblockLibraryPage.less';
import React, { useState, useEffect, useCallback } from 'react';
import request from '../../utils/request-middleware.js';
import { PALLADIUM_GAMES } from '@shared/palladiumStatblock/schema.js';

import Nav            from '@navbar/nav.jsx';
import Navbar         from '@navbar/navbar.jsx';
import AccountNavItem from '@navbar/account.navitem.jsx';

const PalladiumStatblockLibraryPage = ()=>{
	const [statblocks, setStatblocks] = useState([]);
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(0);
	const [total, setTotal] = useState(0);
	const [search, setSearch] = useState('');
	const [gameFilter, setGameFilter] = useState('');
	const [loading, setLoading] = useState(true);
	const [importStatus, setImportStatus] = useState(null);
	const [showImportBox, setShowImportBox] = useState(false);
	const [importText, setImportText] = useState('');

	const fetchStatblocks = useCallback(async ()=>{
		setLoading(true);
		try {
			const query = new URLSearchParams({ page, count: 24 });
			if(search) query.set('search', search);
			if(gameFilter) query.set('game', gameFilter);

			const res = await request.get(`/api/palladium-statblocks?${query.toString()}`);
			setStatblocks(res.body.statblocks);
			setTotalPages(res.body.totalPages);
			setTotal(res.body.total);
		} catch (err) {
			console.error('Failed to fetch Palladium stat blocks:', err);
			setStatblocks([]);
		} finally {
			setLoading(false);
		}
	}, [page, search, gameFilter]);

	useEffect(()=>{ fetchStatblocks(); }, [fetchStatblocks]);
	useEffect(()=>{ setPage(1); }, [search, gameFilter]);

	const handleDelete = async (e, editId, name)=>{
		e.stopPropagation();
		if(!confirm(`Delete "${name || 'Untitled'}"?`)) return;
		try {
			await request.delete(`/api/palladium-statblock/${editId}`);
			fetchStatblocks();
		} catch (err) {
			console.error('Delete failed:', err);
		}
	};

	const handleImportSubmit = async ()=>{
		if(!importText.trim()) return;
		let data;
		try { data = JSON.parse(importText); } catch (e) {
			setImportStatus('Invalid JSON');
			setTimeout(()=>setImportStatus(null), 3000);
			return;
		}
		const items = Array.isArray(data) ? data : [data];
		let imported = 0;
		for (const item of items) {
			delete item.editId; delete item.shareId; delete item.id; delete item._id;
			try { await request.post('/api/palladium-statblock').send(item); imported++; }
			catch (err) { console.error('Import failed for', item.name, err); }
		}
		setImportStatus(`Imported ${imported} stat block${imported !== 1 ? 's' : ''}`);
		setTimeout(()=>setImportStatus(null), 3000);
		setImportText('');
		setShowImportBox(false);
		fetchStatblocks();
	};

	const handleDuplicate = async (e, shareId)=>{
		e.stopPropagation();
		try {
			const res = await request.get(`/api/palladium-statblock/${shareId}`);
			const sb = res.body;
			delete sb.editId; delete sb.shareId; delete sb.createdAt; delete sb.updatedAt;
			sb.name = `${sb.name || 'Untitled'} (Copy)`;
			const saved = await request.post('/api/palladium-statblock').send(sb);
			window.location.href = `/palladium/edit/${saved.body.editId}`;
		} catch (err) {
			console.error('Duplicate failed:', err);
		}
	};

	const gameColors = {
		'Rifts'            : '#2a7acc',
		'Palladium Fantasy': '#8b6914',
		'TMNT'             : '#2a8c3e'
	};

	return (
		<div className="statblockLibraryPage">
			<Navbar>
				<Nav.section>
					<Nav.item color="orange">Palladium</Nav.item>
					<Nav.item icon="fas fa-plus" onClick={()=>{ window.location.href = '/palladium/new'; }}>
						New Stat Block
					</Nav.item>
					<Nav.item icon="fas fa-paste" onClick={()=>setShowImportBox(!showImportBox)}>
						Paste Import
					</Nav.item>
				</Nav.section>
				<Nav.section>
					{importStatus && <Nav.item color="green">{importStatus}</Nav.item>}
					<AccountNavItem />
				</Nav.section>
			</Navbar>

			<div className="libraryContent">
				<div className="libraryHeader">
					<h1>Your Palladium Stat Blocks <span style={{ color: '#666', fontSize: '16px', fontWeight: 400 }}>({total})</span></h1>
				</div>

				<div className="filterBar">
					<input type="text" placeholder="Search by name..." value={search}
						onChange={(e)=>setSearch(e.target.value)} />
					<select value={gameFilter} onChange={(e)=>setGameFilter(e.target.value)}>
						<option value="">All Games</option>
						{PALLADIUM_GAMES.map((g)=><option key={g} value={g}>{g}</option>)}
					</select>
				</div>

				{showImportBox && (
					<div style={{ background: '#252538', border: '1px solid #3a3a54', borderRadius: '6px', padding: '12px', marginBottom: '16px' }}>
						<p style={{ color: '#aaa', fontSize: '13px', margin: '0 0 8px' }}>Paste Palladium stat block JSON:</p>
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
				) : statblocks.length === 0 ? (
					<div className="emptyState">
						{search || gameFilter ? 'No stat blocks match your filters.' : 'No Palladium stat blocks yet. Click "+ New Stat Block" to create one.'}
					</div>
				) : (
					<>
						<div className="statblockGrid">
							{statblocks.map((sb)=>(
								<div className="statblockCard" key={sb.editId}
									onClick={()=>{ window.location.href = `/palladium/edit/${sb.editId}`; }}>
									<div className="cardHeader">
										<span className="cardBadge" style={{ background: gameColors[sb.game] || '#555' }}>{sb.game}</span>
										<h3 className="cardName">{sb.name || 'Untitled'}</h3>
									</div>
									<div className="cardMeta">
										{sb.category}{sb.occ ? ` — ${sb.occ}` : ''}{sb.level ? ` (Lv.${sb.level})` : ''}
									</div>
									{sb.race && <div className="cardMeta">{sb.race}</div>}
									{sb.tags && sb.tags.length > 0 && (
										<div className="cardTags">
											{sb.tags.map((tag, i)=><span className="tag" key={i}>{tag}</span>)}
										</div>
									)}
									<div className="cardActions">
										<button onClick={(e)=>{
											e.stopPropagation();
											navigator.clipboard.writeText('{{palladium-statblock:' + sb.shareId + '}}');
											setImportStatus('Copied embed for ' + (sb.name || 'Untitled'));
											setTimeout(()=>setImportStatus(null), 2000);
										}}><i className="fas fa-code" /> Embed</button>
										<button onClick={(e)=>handleDuplicate(e, sb.shareId)}><i className="fas fa-copy" /> Duplicate</button>
										<button onClick={(e)=>handleDelete(e, sb.editId, sb.name)}><i className="fas fa-trash" /> Delete</button>
									</div>
								</div>
							))}
						</div>

						{totalPages > 1 && (
							<div className="pagination">
								<button disabled={page <= 1} onClick={()=>setPage(page - 1)}>&#8592; Previous</button>
								<span className="pageInfo">Page {page} of {totalPages}</span>
								<button disabled={page >= totalPages} onClick={()=>setPage(page + 1)}>Next &#8594;</button>
							</div>
						)}
					</>
				)}
			</div>
		</div>
	);
};

export default PalladiumStatblockLibraryPage;
