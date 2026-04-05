import React, { useMemo, useState } from 'react';
import { renderPage1, renderPage2 } from '@shared/brpStatblock/portraitSheetRenderer.js';

const BrpSheetPreview = ({ statblock, layout = 'narrow', bw = false })=>{
	const [page, setPage] = useState('p1');

	const html = useMemo(()=>{
		try {
			const opts = { bw };
			if(page === 'p2') return renderPage2(statblock, layout, opts);
			return renderPage1(statblock, layout, opts);
		} catch (e) {
			return `<div style="color:red;padding:20px;">Render error: ${e.message}</div>`;
		}
	}, [statblock, layout, bw, page]);

	return <div className="brpSheetPreview">
		<div style={{ display: 'flex', gap: '8px', marginBottom: '12px', justifyContent: 'center' }}>
			<button
				style={{ padding: '4px 12px', background: page === 'p1' ? '#4a3520' : '#3a3a54', color: '#f4e8d1', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}
				onClick={()=>setPage('p1')}
			>Page 1</button>
			<button
				style={{ padding: '4px 12px', background: page === 'p2' ? '#4a3520' : '#3a3a54', color: '#f4e8d1', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}
				onClick={()=>setPage('p2')}
			>Page 2</button>
		</div>
		<div dangerouslySetInnerHTML={{ __html: html }} />
	</div>;
};

export default BrpSheetPreview;
