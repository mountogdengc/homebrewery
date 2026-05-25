import React, { useState } from 'react';
import Nav from './nav.jsx';

// Generic Export PDF nav item. Pass the API URL to fetch the PDF from.
// Example: <ExportPdfNavItem url={`/api/pdf/brp/${shareId}?view=sheet`} name="my-character" />
// Set showFlatten=true to also show a "Flat PDF" option (rasterized, smaller file size).

function exportPdf(url, name, setIsExporting) {
	return async ()=>{
		if(!url) return;
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
}

const ExportPdfNavItem = ({ url, name = 'export', showFlatten = false })=>{
	const [isExporting, setIsExporting] = useState(false);

	if(!url) return null;

	// Build flatten URL: append flatten=true query param
	const flatUrl = url && (()=>{
		const sep = url.includes('?') ? '&' : '?';
		return `${url}${sep}flatten=true`;
	})();

	return <>
		<Nav.item
			icon={isExporting ? 'fas fa-spinner fa-spin' : 'far fa-file-pdf'}
			color='purple'
			onClick={isExporting ? undefined : exportPdf(url, name, setIsExporting)}
		>
			{isExporting ? 'Exporting...' : 'Export PDF'}
		</Nav.item>
		{showFlatten && <Nav.item
			icon={isExporting ? 'fas fa-spinner fa-spin' : 'fas fa-image'}
			color='purple'
			onClick={isExporting ? undefined : exportPdf(flatUrl, name, setIsExporting)}
		>
			{isExporting ? 'Exporting...' : 'Export Flat PDF'}
		</Nav.item>}
	</>;
};

export default ExportPdfNavItem;
