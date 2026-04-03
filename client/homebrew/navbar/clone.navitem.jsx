import React, { useState } from 'react';
import Nav from './nav.jsx';
import request from '../utils/request-middleware.js';

export default ({ brew })=>{
	const [cloning, setCloning] = useState(false);

	const handleClone = ()=>{
		if(cloning) return;
		setCloning(true);

		const clonedBrew = {
			title       : `${brew.title} (clone)`,
			text        : brew.text,
			style       : brew.style,
			snippets    : brew.snippets,
			description : brew.description,
			tags        : brew.tags,
			systems     : brew.systems,
			lang        : brew.lang,
			renderer    : brew.renderer,
			theme       : brew.theme,
		};

		request.post('/api')
			.send(clonedBrew)
			.end((err, res)=>{
				if(err) {
					setCloning(false);
					console.error('Clone failed:', err);
					return;
				}
				window.open(`/edit/${res.body.editId}`, '_blank');
				setCloning(false);
			});
	};

	return <Nav.item
		color='blue'
		icon={cloning ? 'fas fa-spinner fa-spin' : 'fas fa-clone'}
		onClick={handleClone}
	>
		{cloning ? 'cloning...' : 'clone'}
	</Nav.item>;
};
