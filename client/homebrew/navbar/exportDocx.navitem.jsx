import React, { useState } from 'react';
import Nav from './nav.jsx';

const ExportDocxNavItem = ({ markdown, name = 'export' })=>{
	const [isExporting, setIsExporting] = useState(false);

	const handleExport = async ()=>{
		if(isExporting || !markdown) return;
		setIsExporting(true);

		try {
			const res = await fetch('/api/convert/docx', {
				method  : 'POST',
				headers : { 'Content-Type': 'application/json' },
				body    : JSON.stringify({ markdown, filename: name })
			});
			if(!res.ok) throw new Error(`Export failed: ${res.status}`);

			const blob = await res.blob();
			const link = document.createElement('a');
			link.href = URL.createObjectURL(blob);
			link.download = `${name}.docx`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(link.href);
		} catch (err) {
			console.error('DOCX export failed:', err);
			alert(`DOCX export failed: ${err.message}`);
		} finally {
			setIsExporting(false);
		}
	};

	if(!markdown) return null;

	return <Nav.item
		icon={isExporting ? 'fas fa-spinner fa-spin' : 'fas fa-file-word'}
		color='blue'
		onClick={handleExport}
	>
		{isExporting ? 'Exporting...' : 'Export DOCX'}
	</Nav.item>;
};

export default ExportDocxNavItem;
