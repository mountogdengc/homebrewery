import React, { useState } from 'react';
import Nav from './nav.jsx';

// Generic Export PDF nav item. Pass the API URL to fetch the PDF from.
// Example: <ExportPdfNavItem url={`/api/pdf/brp/${shareId}?view=sheet`} name="my-character" />

const ExportPdfNavItem = ({ url, name = 'export' })=>{
	const [isExporting, setIsExporting] = useState(false);

	const handleExport = async ()=>{
		if(isExporting || !url) return;
		setIsExporting(true);

		try {
			const res = await fetch(url);
			if(!res.ok) throw new Error(`Export failed: ${res.status}`);

			const blob = await res.blob();
			const link = document.createElement('a');
			link.href = URL.createObjectURL(blob);
			link.download = `${name}.pdf`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(link.href);
		} catch (err) {
			console.error('PDF export failed:', err);
			alert(`PDF export failed: ${err.message}`);
		} finally {
			setIsExporting(false);
		}
	};

	if(!url) return null;

	return <Nav.item
		icon={isExporting ? 'fas fa-spinner fa-spin' : 'far fa-file-pdf'}
		color='purple'
		onClick={handleExport}
	>
		{isExporting ? 'Exporting...' : 'Export PDF'}
	</Nav.item>;
};

export default ExportPdfNavItem;
