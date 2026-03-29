import React, { useMemo } from 'react';
import { render } from '@shared/besmStatblock/renderer.js';

const BesmStatblockPreview = ({ character, layout = 'narrow' })=>{
	const html = useMemo(()=>{
		try {
			return render(character, layout);
		} catch (e) {
			return `<div style="color:red;padding:20px;">Render error: ${e.message}</div>`;
		}
	}, [character, layout]);

	return <div className="besmStatblockPreview">
		<div dangerouslySetInnerHTML={{ __html: html }} />
	</div>;
};

export default BesmStatblockPreview;
