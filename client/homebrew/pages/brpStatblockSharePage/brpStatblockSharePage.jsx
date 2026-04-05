import '../../brpStatblock/brpStatblock.less';
import '../../statblock/statblock.less';
import React, { useState } from 'react';
import BrpStatblockPreview from '../../brpStatblock/brpStatblockPreview.jsx';
import BrpSheetPreview     from '../../brpStatblock/brpSheetPreview.jsx';
import { BLANK_CHARACTER } from '@shared/brpStatblock/portraitSheetRenderer.js';

import Nav              from '@navbar/nav.jsx';
import Navbar           from '@navbar/navbar.jsx';
import AccountNavItem   from '@navbar/account.navitem.jsx';
import ExportPdfNavItem from '@navbar/exportPdf.navitem.jsx';

const BrpStatblockSharePage = (props)=>{
	const statblock = props.brpStatblock || BLANK_CHARACTER;
	const isBlank = !props.brpStatblock;
	const [layout, setLayout] = useState('narrow');
	const [bw, setBw] = useState(false);
	const [previewMode, setPreviewMode] = useState((props.sheetView || isBlank) ? 'sheet' : 'statblock');
	const [copied, setCopied] = useState(false);
	const [copiedSheet, setCopiedSheet] = useState(false);

	const isCharacter = statblock.characterType === 'character';

	const copyEmbed = ()=>{
		const opts = [layout === 'wide' ? 'wide' : '', bw ? 'bw' : ''].filter(Boolean).join(',');
		const code = opts
			? `{{brp:${statblock.shareId}|${opts}}}`
			: `{{brp:${statblock.shareId}}}`;
		navigator.clipboard.writeText(code).then(()=>{
			setCopied(true);
			setTimeout(()=>setCopied(false), 2000);
		});
	};

	const copySheetEmbed = ()=>{
		const bwOpt = bw ? ',bw' : '';
		const code = `{{brp-sheet:${statblock.shareId}|p1${bwOpt}}}\n\n\\page\n\n{{brp-sheet:${statblock.shareId}|p2${bwOpt}}}`;
		navigator.clipboard.writeText(code).then(()=>{
			setCopiedSheet(true);
			setTimeout(()=>setCopiedSheet(false), 2000);
		});
	};

	const PreviewComponent = previewMode === 'sheet' ? BrpSheetPreview : BrpStatblockPreview;

	return (
		<div className="brpStatblockEditorPage">
			<Navbar>
				<Nav.section>
					<Nav.item color="orange">{isBlank ? 'BRP Blank Character Sheet' : (statblock.name || 'BRP')}</Nav.item>
					<Nav.item icon="fas fa-th-list" onClick={()=>{ window.location.href = '/brp/library'; }}>
						Library
					</Nav.item>
				</Nav.section>
				<Nav.section>
					<Nav.item
						icon={previewMode === 'statblock' ? 'fas fa-id-card' : 'fas fa-file-alt'}
						onClick={()=>setPreviewMode((m)=>m === 'statblock' ? 'sheet' : 'statblock')}
					>
						{previewMode === 'statblock' ? 'Sheet View' : 'Stat Block View'}
					</Nav.item>

					<Nav.item icon={layout === 'narrow' ? 'fas fa-columns' : 'fas fa-align-justify'}
						onClick={()=>setLayout((l)=>l === 'narrow' ? 'wide' : 'narrow')}>
						{layout === 'narrow' ? 'Wide' : 'Narrow'}
					</Nav.item>

					<Nav.item icon={bw ? 'fas fa-palette' : 'fas fa-adjust'} onClick={()=>setBw((b)=>!b)}>
						{bw ? 'Color' : 'B&W'}
					</Nav.item>

					<Nav.item icon="fas fa-print" onClick={()=>window.print()}>
						Print
					</Nav.item>

					<Nav.item icon="fas fa-file" onClick={()=>{ window.location.href = '/brp/sheet/blank'; }}>
						Blank Sheet
					</Nav.item>

					{!isBlank && statblock.shareId && <ExportPdfNavItem
						url={`/api/pdf/brp/${statblock.shareId}?view=${previewMode}`}
						name={statblock.name || 'brp-export'}
					/>}

					{!isBlank && statblock.shareId && (
						<Nav.item icon={copied ? 'fas fa-check' : 'fas fa-code'} onClick={copyEmbed}>
							{copied ? 'Copied!' : 'Embed Statblock'}
						</Nav.item>
					)}
					{!isBlank && statblock.shareId && (
						<Nav.item icon={copiedSheet ? 'fas fa-check' : 'fas fa-file-alt'} onClick={copySheetEmbed}>
							{copiedSheet ? 'Copied!' : 'Embed Sheet (2 pages)'}
						</Nav.item>
					)}
					<AccountNavItem />
				</Nav.section>
			</Navbar>

			<div style={{ flex: 1, overflow: 'auto' }}>
				<PreviewComponent statblock={statblock} layout={layout} bw={bw} />
			</div>
		</div>
	);
};

export default BrpStatblockSharePage;
