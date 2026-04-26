import React, { useMemo, useState } from 'react';
import { renderPage1, renderPage2 } from '@shared/willowlight/landscapeSheetRenderer.js';

const WillowlightLandscapePreview = ({ character, layout = 'narrow', bw = false })=>{
	const [page, setPage] = useState('p1');

	const html1 = useMemo(()=>{
		try { return renderPage1(character, layout, { bw }); }
		catch (e) { return `<div style="color:red;padding:20px;">Render error: ${e.message}</div>`; }
	}, [character, layout, bw]);

	const html2 = useMemo(()=>{
		try { return renderPage2(character, layout, { bw }); }
		catch (e) { return `<div style="color:red;padding:20px;">Render error: ${e.message}</div>`; }
	}, [character, layout, bw]);

	return <div className="willowlightLandscapePreview">
		<div className="wl-page-toggle">
			<button className={page === 'p1' ? 'active' : ''} onClick={()=>setPage('p1')}>Page 1</button>
			<button className={page === 'p2' ? 'active' : ''} onClick={()=>setPage('p2')}>Page 2</button>
		</div>
		<div style={{ display: page === 'p1' ? 'block' : 'none' }} className="wl-print-page" dangerouslySetInnerHTML={{ __html: html1 }} />
		<div style={{ display: page === 'p2' ? 'block' : 'none' }} className="wl-print-page" dangerouslySetInnerHTML={{ __html: html2 }} />
	</div>;
};

export default WillowlightLandscapePreview;
