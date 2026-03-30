import React, { useState } from 'react';
import _ from 'lodash';
import { displayCR } from '@shared/statblock/constants.js';

import ListPage from '../basePages/listPage/listPage.jsx';

import Nav from '@navbar/nav.jsx';
import Navbar from '@navbar/navbar.jsx';
import RecentNavItems from '@navbar/recent.navitem.jsx';
const { both: RecentNavItem } = RecentNavItems;
import Account from '@navbar/account.navitem.jsx';
import NewBrew from '@navbar/newbrew.navitem.jsx';
import ErrorNavItem from '@navbar/error-navitem.jsx';
import VaultNavitem from '@navbar/vault.navitem.jsx';

const StatblockSection = ({ statblocks = [], username })=>{
	if(!statblocks.length) return null;
	const isOwn = username === global.account?.username;
	const label = username + (username.endsWith('s') ? "'" : "'s");

	return <div className="statblockUserSection" style={{
		padding: '10px 20px 20px', background: '#1e1e2e', borderTop: '1px solid #3a3a54'
	}}>
		<h2 style={{ color: '#f5e6c8', fontFamily: 'Segoe UI, sans-serif', fontSize: '18px', margin: '10px 0' }}>
			{label} Stat Blocks ({statblocks.length})
		</h2>
		<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '10px' }}>
			{statblocks.map((sb)=>(
				<a key={sb.shareId}
					href={isOwn ? `/statblock/edit/${sb.editId}` : `/statblock/share/${sb.shareId}`}
					style={{
						background: '#252538', border: '1px solid #3a3a54', borderRadius: '6px',
						padding: '12px', textDecoration: 'none', color: '#e0e0f0',
						display: 'block', transition: 'border-color 0.15s'
					}}
					onMouseOver={(e)=>{ e.currentTarget.style.borderColor = '#8B1A1A'; }}
					onMouseOut={(e)=>{ e.currentTarget.style.borderColor = '#3a3a54'; }}
				>
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
						<strong style={{ color: '#f5e6c8' }}>{sb.name || 'Untitled'}</strong>
						<span style={{
							background: '#8B1A1A', color: '#fff', fontSize: '10px',
							padding: '2px 6px', borderRadius: '8px', fontWeight: 700
						}}>CR {displayCR(sb.cr)}</span>
					</div>
					<div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
						{sb.size} {sb.type}
					</div>
				</a>
			))}
		</div>
	</div>;
};

const UserPage = (props)=>{
	props = {
		username       : '',
		brews          : [],
		userStatblocks : [],
		query          : '',
		...props
	};

	const [error, setError] = useState(null);

	const usernameWithS = props.username + (props.username.endsWith('s') ? "'" : "'s");
	const groupedBrews = _.groupBy(props.brews, (brew)=>brew.published ? 'published' : 'private');

	const brewCollection = [
		{
			title : `${usernameWithS} published brews`,
			class : 'published',
			brews : groupedBrews.published || []
		},
		...(props.username === global.account?.username ? [{
			title : `${usernameWithS} unpublished brews`,
			class : 'unpublished',
			brews : groupedBrews.private || []
		}] : [])
	];

	const clearError = ()=>{
		setError(null);
	};

	const navItems = (
		<Navbar>
			<Nav.section>
				{error && (<ErrorNavItem error={error} clearError={clearError}></ErrorNavItem>)}
				<NewBrew />
				<VaultNavitem />
				<RecentNavItem />
				<Account />
			</Nav.section>
		</Navbar>
	);

	return <>
		<ListPage brewCollection={brewCollection} navItems={navItems} query={props.query} reportError={(err)=>setError(err)} />
		<StatblockSection statblocks={props.userStatblocks} username={props.username} />
	</>;
};

export default UserPage;
