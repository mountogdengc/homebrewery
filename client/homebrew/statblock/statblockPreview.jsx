import React, { useMemo } from 'react';
import { render } from '@shared/statblock/renderer.js';

const StatblockPreview = ({ statblock, layout = 'narrow' })=>{
	const html = useMemo(()=>{
		try {
			return render(statblock, layout);
		} catch (e) {
			return `<div style="color:red;padding:20px;">Render error: ${e.message}</div>`;
		}
	}, [statblock, layout]);

	return <div className="statblockPreview">
		<div dangerouslySetInnerHTML={{ __html: html }} />
	</div>;
};

export default StatblockPreview;
