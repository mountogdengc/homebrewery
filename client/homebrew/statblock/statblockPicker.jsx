import React, { useState, useEffect, useCallback } from 'react';
import request from '../utils/request-middleware.js';
import { CREATURE_TYPES, displayCR } from '@shared/statblock/constants.js';

const StatblockPicker = ({ onInsert, onClose })=>{
	const [statblocks, setStatblocks] = useState([]);
	const [search, setSearch] = useState('');
	const [typeFilter, setTypeFilter] = useState('');
	const [loading, setLoading] = useState(true);
	const [copied, setCopied] = useState(null);

	const fetchStatblocks = useCallback(async ()=>{
		setLoading(true);
		try {
			const query = new URLSearchParams({ page: 1, count: 100 });
			if(search) query.set('search', search);
			if(typeFilter) query.set('type', typeFilter);
			const res = await request.get(`/api/statblocks?${query.toString()}`);
			setStatblocks(res.body.statblocks);
		} catch (err) {
			console.error('Failed to fetch stat blocks:', err);
			setStatblocks([]);
		} finally {
			setLoading(false);
		}
	}, [search, typeFilter]);

	useEffect(()=>{ fetchStatblocks(); }, [fetchStatblocks]);

	const handleEmbed = (sb, wide)=>{
		const code = wide ? `{{statblock:${sb.shareId}|wide}}` : `{{statblock:${sb.shareId}}}`;
		if(onInsert) {
			onInsert(code);
		} else {
			navigator.clipboard.writeText(code);
		}
		setCopied(sb.shareId + (wide ? '-wide' : ''));
		setTimeout(()=>setCopied(null), 1500);
	};

	return <div style={{
		height: '100%', overflow: 'auto', background: '#1e1e2e',
		color: '#e0e0f0', fontFamily: "'Segoe UI', sans-serif", padding: '12px'
	}}>
		<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
			<h3 style={{ color: '#f5e6c8', margin: 0, fontSize: '16px' }}>Insert Stat Block</h3>
			<button onClick={onClose} style={{
				background: '#3a3a54', border: 'none', color: '#e0e0f0',
				padding: '4px 12px', borderRadius: '3px', cursor: 'pointer', fontSize: '12px'
			}}>
				<i className="fas fa-times" /> Back to Preview
			</button>
		</div>

		<div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
			<input
				type="text" placeholder="Search..." value={search}
				onChange={(e)=>setSearch(e.target.value)}
				style={{
					flex: 1, background: '#2a2a3e', border: '1px solid #3a3a54',
					borderRadius: '4px', color: '#e0e0f0', padding: '6px 10px',
					fontSize: '12px', fontFamily: 'inherit'
				}}
			/>
			<select value={typeFilter} onChange={(e)=>setTypeFilter(e.target.value)}
				style={{
					background: '#2a2a3e', border: '1px solid #3a3a54',
					borderRadius: '4px', color: '#e0e0f0', padding: '6px 10px',
					fontSize: '12px', fontFamily: 'inherit'
				}}>
				<option value="">All Types</option>
				{CREATURE_TYPES.map((t)=><option key={t} value={t}>{t}</option>)}
			</select>
		</div>

		{loading ? (
			<div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
				<i className="fas fa-spinner fa-spin" /> Loading...
			</div>
		) : statblocks.length === 0 ? (
			<div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
				No stat blocks found.
			</div>
		) : (
			<div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
				{statblocks.map((sb)=>(
					<div key={sb.editId} style={{
						background: '#252538', border: '1px solid #3a3a54', borderRadius: '4px',
						padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
					}}>
						<div style={{ flex: 1, minWidth: 0 }}>
							<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
								<strong style={{ color: '#f5e6c8', fontSize: '13px' }}>{sb.name || 'Untitled'}</strong>
								<span style={{
									background: '#8B1A1A', color: '#fff', fontSize: '10px',
									padding: '1px 6px', borderRadius: '8px', fontWeight: 700
								}}>CR {displayCR(sb.cr)}</span>
							</div>
							<div style={{ fontSize: '11px', color: '#888' }}>
								{sb.size} {sb.type}{sb.subtype ? ` (${sb.subtype})` : ''}
							</div>
						</div>
						<div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
							<button onClick={()=>handleEmbed(sb, false)} style={{
								background: copied === sb.shareId ? '#2e7d32' : '#3a3a54',
								border: 'none', color: '#e0e0f0', padding: '4px 8px',
								borderRadius: '3px', cursor: 'pointer', fontSize: '11px'
							}}>
								{copied === sb.shareId ? 'Inserted!' : 'Narrow'}
							</button>
							<button onClick={()=>handleEmbed(sb, true)} style={{
								background: copied === sb.shareId + '-wide' ? '#2e7d32' : '#3a3a54',
								border: 'none', color: '#e0e0f0', padding: '4px 8px',
								borderRadius: '3px', cursor: 'pointer', fontSize: '11px'
							}}>
								{copied === sb.shareId + '-wide' ? 'Inserted!' : 'Wide'}
							</button>
						</div>
					</div>
				))}
			</div>
		)}
	</div>;
};

export default StatblockPicker;
