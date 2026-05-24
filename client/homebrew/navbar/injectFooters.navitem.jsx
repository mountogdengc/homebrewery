import React from 'react';
import Nav from './nav.jsx';
import { injectFooters } from './injectFooters.js';

const InjectFootersNavItem = ({ markdown, metadata, onTextChange })=>{
	const handleClick = ()=>{
		if(!markdown) return;

		const missing = [];
		if(!metadata.title) missing.push('title');
		if(!metadata.adventureCode) missing.push('adventure code');
		if(!metadata.adventureVersion) missing.push('adventure version');

		if(missing.length) {
			alert(`Please fill in the following fields in the Properties Editor first:\n\n${missing.join('\n')}`);
			return;
		}

		const result = injectFooters(markdown, metadata);
		if(result) onTextChange(result);
	};

	if(!markdown) return null;

	return <Nav.item
		icon='fas fa-shoe-prints'
		color='green'
		onClick={handleClick}
	>
		Inject Footers
	</Nav.item>;
};

export default InjectFootersNavItem;
