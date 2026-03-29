import React, { useMemo } from 'react';
import { render } from '@shared/willowlightStatblock/renderer.js';

const WillowlightStatblockPreview = ({ statblock, layout = 'narrow', bw = false })=>{
	const html = useMemo(()=>{
		try {
			return render(statblock, layout, { bw });
		} catch (e) {
			return `<div style="color:red;padding:20px;">Render error: ${e.message}</div>`;
		}
	}, [statblock, layout, bw]);

	return <div className="willowlightStatblockPreview">
		<div dangerouslySetInnerHTML={{ __html: html }} />
	</div>;
};

export default WillowlightStatblockPreview;
