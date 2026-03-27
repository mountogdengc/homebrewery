import React, { useMemo, useState } from 'react';

import Nav            from '@navbar/nav.jsx';
import Navbar         from '@navbar/navbar.jsx';
import AccountNavItem from '@navbar/account.navitem.jsx';

import fullSrc from './bookmarklet-ddb.js?raw';

const StatblockImportPage = ()=>{
	const [copied, setCopied] = useState(false);

	const bookmarkletHref = useMemo(()=>{
		const baseUrl = window.location.origin;
		const code = fullSrc.replace("'{{HB_URL}}'", "'" + baseUrl + "'");
		return 'javascript:' + encodeURIComponent(code);
	}, []);

	return (
		<div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
			<Navbar>
				<Nav.logo />
				<Nav.section>
					<Nav.item color="purple">D&D Beyond Importer</Nav.item>
				</Nav.section>
				<Nav.section>
					<Nav.item icon="fas fa-th-list" onClick={()=>{ window.location.href = '/statblock/library'; }}>
						Library
					</Nav.item>
					<AccountNavItem />
				</Nav.section>
			</Navbar>

			<div style={{
				flex: 1, overflow: 'auto', padding: '40px',
				background: '#1a1a2e', color: '#e0e0f0',
				fontFamily: "'Segoe UI', sans-serif"
			}}>
				<div style={{ maxWidth: '700px', margin: '0 auto' }}>
					<h1 style={{ color: '#f5e6c8', fontSize: '28px', marginBottom: '20px' }}>
						D&D Beyond Importer
					</h1>

					<p style={{ color: '#aaa', lineHeight: 1.6, marginBottom: '20px' }}>
						Import monster stat blocks directly from D&D Beyond into your Homebrewery stat block library.
						The bookmarklet reads the data your D&D Beyond subscription gives you access to and sends it to your Homebrewery account.
					</p>

					<h2 style={{ color: '#f5e6c8', fontSize: '20px', marginBottom: '12px' }}>
						Step 1: Install the Bookmarklet
					</h2>

					<p style={{ color: '#aaa', lineHeight: 1.6, marginBottom: '16px' }}>
						Click the button below to copy the bookmarklet code, then create a new bookmark and paste it as the URL:
					</p>

					<div style={{ textAlign: 'center', marginBottom: '30px' }}>
						<button
							onClick={()=>{
								navigator.clipboard.writeText(bookmarkletHref).then(()=>{
									setCopied(true);
									setTimeout(()=>setCopied(false), 3000);
								});
							}}
							style={{
								display: 'inline-block',
								background: copied ? '#2e7d32' : '#8B1A1A',
								color: '#fff',
								padding: '12px 24px',
								borderRadius: '6px',
								fontSize: '16px',
								fontWeight: 'bold',
								border: 'none',
								cursor: 'pointer',
								boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
								transition: 'background 0.2s'
							}}
						>
							{copied ? 'Copied!' : 'Copy Bookmarklet Code'}
						</button>
					</div>

					<p style={{ color: '#666', fontSize: '12px', textAlign: 'center', marginBottom: '30px' }}>
						After copying, create a new bookmark in your browser, name it "Import to Homebrewery", and paste the code as the URL.
					</p>

					<h2 style={{ color: '#f5e6c8', fontSize: '20px', marginBottom: '12px' }}>
						Step 2: Use It
					</h2>

					<ol style={{ color: '#aaa', lineHeight: 1.8, paddingLeft: '20px' }}>
						<li>Go to any monster page on <strong style={{ color: '#f5e6c8' }}>D&D Beyond</strong> (2024 format)</li>
						<li>Click the <strong style={{ color: '#f5e6c8' }}>"Import to Homebrewery"</strong> bookmark</li>
						<li>A green banner confirms the stat block was <strong style={{ color: '#f5e6c8' }}>copied to your clipboard</strong></li>
						<li>Go to your <a href="/statblock/library" style={{ color: '#8B1A1A' }}>Stat Block Library</a> and click <strong style={{ color: '#f5e6c8' }}>"Paste Import"</strong></li>
					</ol>

					<h2 style={{ color: '#f5e6c8', fontSize: '20px', margin: '30px 0 12px' }}>
						Requirements
					</h2>

					<ul style={{ color: '#aaa', lineHeight: 1.8, paddingLeft: '20px' }}>
						<li>A D&D Beyond account with access to the monster content</li>
						<li>Chrome, Edge, or another Chromium-based browser</li>
						<li>Supports both <strong style={{ color: '#f5e6c8' }}>2024</strong> and <strong style={{ color: '#f5e6c8' }}>legacy (2014)</strong> stat block formats</li>
						<li>Legacy stat blocks are automatically converted to 2024 format</li>
					</ul>

					<div style={{
						marginTop: '30px', padding: '16px', background: '#252538',
						borderRadius: '6px', border: '1px solid #3a3a54'
					}}>
						<p style={{ color: '#888', fontSize: '12px', lineHeight: 1.5, margin: 0 }}>
							<strong style={{ color: '#aaa' }}>Note:</strong> This tool reads data from pages you already have access to through your D&D Beyond subscription.
							D&D Beyond content is &copy; Wizards of the Coast. For personal use only.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};

export default StatblockImportPage;
