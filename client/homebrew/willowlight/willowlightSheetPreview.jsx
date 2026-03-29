import React, { useMemo } from 'react';
import { render } from '@shared/willowlight/sheetRenderer.js';

const WillowlightSheetPreview = ({ character, layout = 'narrow', bw = false })=>{
	const html = useMemo(()=>{
		try {
			return render(character, layout, { bw });
		} catch (e) {
			return `<div style="color:red;padding:20px;">Render error: ${e.message}</div>`;
		}
	}, [character, layout, bw]);

	return <div className="willowlightCharacterPreview">
		<div dangerouslySetInnerHTML={{ __html: html }} />
	</div>;
};

export default WillowlightSheetPreview;
