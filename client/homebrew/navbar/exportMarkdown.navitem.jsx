import React, { useState } from 'react';
import Nav from './nav.jsx';
import { convertToMarkdown } from '@shared/helpers.js';

const ExportMarkdownNavItem = ({ brew, name = 'export' })=>{
	const [isExporting, setIsExporting] = useState(false);

	const handleExport = ()=>{
		if(isExporting || !brew) return;
		setIsExporting(true);

		try {
			// Convert the brew text to markdown
			const markdownContent = convertToMarkdown(brew.text);

			// Optionally add metadata section at the top
			let fullContent = `# ${brew.title || name}\n\n`;

			if(brew.description) {
				fullContent += `${brew.description}\n\n`;
			}

			fullContent += markdownContent;

			// Create a blob from the markdown content
			const blob = new Blob([fullContent], { type: 'text/markdown;charset=utf-8' });
			const link = document.createElement('a');
			link.href = URL.createObjectURL(blob);
			link.download = `${name || 'brew'}.md`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(link.href);
		} catch (err) {
			console.error('Markdown export failed:', err);
			alert(`Markdown export failed: ${err.message}`);
		} finally {
			setIsExporting(false);
		}
	};

	if(!brew) return null;

	return <Nav.item
		icon={isExporting ? 'fas fa-spinner fa-spin' : 'fas fa-file-lines'}
		color='purple'
		onClick={handleExport}
	>
		{isExporting ? 'Exporting...' : 'Export Markdown'}
	</Nav.item>;
};

export default ExportMarkdownNavItem;
