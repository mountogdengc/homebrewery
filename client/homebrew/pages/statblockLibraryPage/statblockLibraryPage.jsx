import './statblockLibraryPage.less';
import React, { useState, useEffect, useCallback } from 'react';
import request from '../../utils/request-middleware.js';
import { CREATURE_TYPES, CR_LIST, displayCR } from '@shared/statblock/constants.js';

import Nav            from '@navbar/nav.jsx';
import Navbar         from '@navbar/navbar.jsx';
import AccountNavItem from '@navbar/account.navitem.jsx';

const StatblockLibraryPage = ()=>{
	const [statblocks, setStatblocks] = useState([]);
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(0);
	const [total, setTotal] = useState(0);
	const [search, setSearch] = useState('');
	const [typeFilter, setTypeFilter] = useState('');
	const [loading, setLoading] = useState(true);

	const fetchStatblocks = useCallback(async ()=>{
		setLoading(true);
		try {
			const query = new URLSearchParams({ page, count: 24 });
			if(search) query.set('search', search);
			if(typeFilter) query.set('type', typeFilter);

			const res = await request.get(`/api/statblocks?${query.toString()}`);
			setStatblocks(res.body.statblocks);
			setTotalPages(res.body.totalPages);
			setTotal(res.body.total);
		} catch (err) {
			console.error('Failed to fetch stat blocks:', err);
			setStatblocks([]);
		} finally {
			setLoading(false);
		}
	}, [page, search, typeFilter]);

	useEffect(()=>{ fetchStatblocks(); }, [fetchStatblocks]);

	// Reset to page 1 when filters change
	useEffect(()=>{ setPage(1); }, [search, typeFilter]);

	const handleDelete = async (e, editId, name)=>{
		e.stopPropagation();
		if(!confirm(`Delete "${name || 'Untitled'}"?`)) return;
		try {
			await request.delete(`/api/statblock/${editId}`);
			fetchStatblocks();
		} catch (err) {
			console.error('Delete failed:', err);
		}
	};

	const handleDuplicate = async (e, shareId)=>{
		e.stopPropagation();
		try {
			const res = await request.get(`/api/statblock/${shareId}`);
			const sb = res.body;
			delete sb.editId;
			delete sb.shareId;
			delete sb.createdAt;
			delete sb.updatedAt;
			sb.name = `${sb.name || 'Untitled'} (Copy)`;
			const saved = await request.post('/api/statblock').send(sb);
			window.location.href = `/statblock/edit/${saved.body.editId}`;
		} catch (err) {
			console.error('Duplicate failed:', err);
		}
	};

	return (
		<div className="statblockLibraryPage">
			<Navbar>
				<Nav.logo />
				<Nav.section>
					<Nav.item color="purple">Stat Block Library</Nav.item>
				</Nav.section>
				<Nav.section>
					<AccountNavItem />
				</Nav.section>
			</Navbar>

			<div className="libraryContent">
				<div className="libraryHeader">
					<h1>Your Stat Blocks <span style={{ color: '#666', fontSize: '16px', fontWeight: 400 }}>({total})</span></h1>
					<div style={{ display: 'flex', gap: '10px' }}>
						<a href="/statblock/import" className="newButton" style={{ background: '#1565c0' }}>
							<i className="fas fa-download" /> D&D Beyond Import
						</a>
						<a href="/statblock/new" className="newButton">+ New Stat Block</a>
					</div>
				</div>

				<div className="filterBar">
					<input
						type="text"
						placeholder="Search by name..."
						value={search}
						onChange={(e)=>setSearch(e.target.value)}
					/>
					<select value={typeFilter} onChange={(e)=>setTypeFilter(e.target.value)}>
						<option value="">All Types</option>
						{CREATURE_TYPES.map((t)=><option key={t} value={t}>{t}</option>)}
					</select>
				</div>

				{loading ? (
					<div className="emptyState"><i className="fas fa-spinner fa-spin" /> Loading...</div>
				) : statblocks.length === 0 ? (
					<div className="emptyState">
						{search || typeFilter
							? 'No stat blocks match your filters.'
							: 'No stat blocks yet. Click "+ New Stat Block" to create one.'
						}
					</div>
				) : (
					<>
						<div className="statblockGrid">
							{statblocks.map((sb)=>(
								<div
									className="statblockCard"
									key={sb.editId}
									onClick={()=>{ window.location.href = `/statblock/edit/${sb.editId}`; }}
								>
									<div className="cardHeader">
										<h3 className="cardName">{sb.name || 'Untitled'}</h3>
										<span className="cardCR">CR {displayCR(sb.cr)}</span>
									</div>
									<div className="cardMeta">
										{sb.size} {sb.type}{sb.subtype ? ` (${sb.subtype})` : ''}
									</div>
									<div className="cardMeta">
										{sb.alignment}
									</div>
									{sb.tags && sb.tags.length > 0 && (
										<div className="cardTags">
											{sb.tags.map((tag, i)=><span className="tag" key={i}>{tag}</span>)}
										</div>
									)}
									<div className="cardActions">
										<button onClick={(e)=>handleDuplicate(e, sb.shareId)}>
											<i className="fas fa-copy" /> Duplicate
										</button>
										<button onClick={(e)=>handleDelete(e, sb.editId, sb.name)}>
											<i className="fas fa-trash" /> Delete
										</button>
									</div>
								</div>
							))}
						</div>

						{totalPages > 1 && (
							<div className="pagination">
								<button disabled={page <= 1} onClick={()=>setPage(page - 1)}>
									← Previous
								</button>
								<span className="pageInfo">Page {page} of {totalPages}</span>
								<button disabled={page >= totalPages} onClick={()=>setPage(page + 1)}>
									Next →
								</button>
							</div>
						)}
					</>
				)}
			</div>
		</div>
	);
};

export default StatblockLibraryPage;
