import './besmLibraryPage.less';
import React, { useState, useEffect, useCallback } from 'react';
import request from '../../utils/request-middleware.js';

import Nav            from '@navbar/nav.jsx';
import Navbar         from '@navbar/navbar.jsx';
import AccountNavItem from '@navbar/account.navitem.jsx';

const BesmLibraryPage = ()=>{
	const [characters, setCharacters] = useState([]);
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(0);
	const [total, setTotal] = useState(0);
	const [search, setSearch] = useState('');
	const [loading, setLoading] = useState(true);
	const [importStatus, setImportStatus] = useState(null);
	const [showImportBox, setShowImportBox] = useState(false);
	const [importText, setImportText] = useState('');

	const fetchCharacters = useCallback(async ()=>{
		setLoading(true);
		try {
			const query = new URLSearchParams({ page, count: 24 });
			if(search) query.set('search', search);

			const res = await request.get(`/api/besm-characters?${query.toString()}`);
			setCharacters(res.body.characters);
			setTotalPages(res.body.totalPages);
			setTotal(res.body.total);
		} catch (err) {
			console.error('Failed to fetch BESM characters:', err);
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
		try {
			await request.delete(`/api/besm/${editId}`);
			fetchCharacters();
		} catch (err) {
			console.error('Delete failed:', err);
		}
	};

	const handleDuplicate = async (e, shareId)=>{
		e.stopPropagation();
		try {
			const res = await request.get(`/api/besm/${shareId}`);
			const bc = res.body;
			delete bc.editId;
			delete bc.shareId;
			delete bc.createdAt;
			delete bc.updatedAt;
			bc.name = `${bc.name || 'Untitled'} (Copy)`;
			const saved = await request.post('/api/besm').send(bc);
			window.location.href = `/besm/edit/${saved.body.editId}`;
		} catch (err) {
			console.error('Duplicate failed:', err);
		}
	};

	const handleImportSubmit = async ()=>{
		if(!importText.trim()) return;
		let data;
		try {
			data = JSON.parse(importText);
		} catch (e) {
			setImportStatus('Invalid JSON');
			setTimeout(()=>setImportStatus(null), 3000);
			return;
		}
		const items = Array.isArray(data) ? data : [data];
		let imported = 0;
		for (const item of items) {
			delete item.editId;
			delete item.shareId;
			delete item.id;
			delete item._id;
			try {
				await request.post('/api/besm').send(item);
				imported++;
			} catch (err) {
				console.error('Import failed for', item.name, err);
			}
		}
		setImportStatus(`Imported ${imported} character${imported !== 1 ? 's' : ''}`);
		setTimeout(()=>setImportStatus(null), 3000);
		setImportText('');
		setShowImportBox(false);
		fetchCharacters();
	};

	return (
		<div className="besmLibraryPage">
			<Navbar>
				<Nav.logo />
				<Nav.section>
					<Nav.item color="purple">BESM Character Library</Nav.item>
				</Nav.section>
				<Nav.section>
					<AccountNavItem />
				</Nav.section>
			</Navbar>

			<div className="libraryContent">
				<div className="libraryHeader">
					<h1>Your BESM Characters <span style={{ color: '#888', fontSize: '14px', fontWeight: 400 }}>({total})</span></h1>
					<div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
						{importStatus && <span style={{ color: '#4caf50', fontSize: '13px' }}>{importStatus}</span>}
						<button className="newButton" style={{ background: '#4a3a7a', border: 'none', cursor: 'pointer' }}
							onClick={()=>setShowImportBox(!showImportBox)}>
							<i className="fas fa-paste" /> Import JSON
						</button>
						<a href="/besm/new" className="newButton">+ New Character</a>
					</div>
				</div>

				<div className="filterBar">
					<input
						type="text"
						placeholder="Search by name..."
						value={search}
						onChange={(e)=>setSearch(e.target.value)}
					/>
				</div>

				{showImportBox && (
					<div style={{
						background: '#2d1e62', border: '1px solid #4a3a7a', borderRadius: '6px',
						padding: '12px', marginBottom: '16px'
					}}>
						<p style={{ color: '#aaa', fontSize: '13px', margin: '0 0 8px' }}>
							Paste BESM character JSON (single object or array):
						</p>
						<textarea
							value={importText}
							onChange={(e)=>setImportText(e.target.value)}
							placeholder='Paste character JSON here...'
							style={{
								width: '100%', minHeight: '100px', background: '#1a1035',
								border: '1px solid #4a3a7a', borderRadius: '4px', color: '#e0e0f0',
								padding: '8px', fontFamily: 'monospace', fontSize: '12px', resize: 'vertical'
							}}
						/>
						<div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
							<button className="newButton" style={{ background: '#28a745', border: 'none', cursor: 'pointer' }}
								onClick={handleImportSubmit}>
								Import
							</button>
							<button className="newButton" style={{ background: '#4a3a7a', border: 'none', cursor: 'pointer' }}
								onClick={()=>{ setShowImportBox(false); setImportText(''); }}>
								Cancel
							</button>
						</div>
					</div>
				)}

				{loading ? (
					<div className="emptyState"><i className="fas fa-spinner fa-spin" /> Loading...</div>
				) : characters.length === 0 ? (
					<div className="emptyState">
						{search
							? 'No characters match your search.'
							: 'No characters yet. Click "+ New Character" to create one.'
						}
					</div>
				) : (
					<>
						<div className="characterGrid">
							{characters.map((bc)=>(
								<div
									className="characterCard"
									key={bc.editId}
									onClick={()=>{ window.location.href = `/besm/edit/${bc.editId}`; }}
								>
									<div className="cardHeader">
										<h3 className="cardName">{bc.name || 'Untitled'}</h3>
										<span className="cardCP">{bc.totalCP || 0} CP</span>
									</div>
									{bc.identity && (
										<div className="cardMeta">{bc.identity}</div>
									)}
									{bc.selectedGenre && (
										<div className="cardMeta">{bc.selectedGenre}</div>
									)}
									<div className="cardActions">
										<button onClick={(e)=>handleDuplicate(e, bc.shareId)}>
											<i className="fas fa-copy" /> Duplicate
										</button>
										<button onClick={(e)=>handleDelete(e, bc.editId, bc.name)}>
											<i className="fas fa-trash" /> Delete
										</button>
									</div>
								</div>
							))}
						</div>

						{totalPages > 1 && (
							<div className="pagination">
								<button disabled={page <= 1} onClick={()=>setPage(page - 1)}>
									&larr; Previous
								</button>
								<span className="pageInfo">Page {page} of {totalPages}</span>
								<button disabled={page >= totalPages} onClick={()=>setPage(page + 1)}>
									Next &rarr;
								</button>
							</div>
						)}
					</>
				)}
			</div>
		</div>
	);
};

export default BesmLibraryPage;
