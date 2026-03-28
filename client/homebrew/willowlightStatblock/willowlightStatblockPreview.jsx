import React, { useMemo } from 'react';
import { render } from '@shared/willowlightStatblock/renderer.js';

const WillowlightStatblockPreview = ({ statblock, layout = 'narrow' })=>{
	const html = useMemo(()=>{
		try {
			return render(statblock, layout);
		} catch (e) {
			return `<div style="color:red;padding:20px;">Render error: ${e.message}</div>`;
		}
	}, [statblock, layout]);

	return <div className="willowlightStatblockPreview">
		<div dangerouslySetInnerHTML={{ __html: html }} />
	</div>;
};

export default WillowlightStatblockPreview;
