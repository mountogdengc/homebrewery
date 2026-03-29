import 'core-js/es/string/to-well-formed.js'; // Polyfill for older browsers
import './homebrew.less';
import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useParams, useSearchParams } from 'react-router';

import { updateLocalStorage } from './utils/updateLocalStorage/updateLocalStorageKeys.js';

import HomePage    from './pages/homePage/homePage.jsx';
import EditPage    from './pages/editPage/editPage.jsx';
import UserPage    from './pages/userPage/userPage.jsx';
import SharePage   from './pages/sharePage/sharePage.jsx';
import NewPage     from './pages/newPage/newPage.jsx';
import ErrorPage   from './pages/errorPage/errorPage.jsx';
import VaultPage   from './pages/vaultPage/vaultPage.jsx';
import AccountPage from './pages/accountPage/accountPage.jsx';
import StatblockEditorPage from './pages/statblockEditorPage/statblockEditorPage.jsx';
import StatblockLibraryPage from './pages/statblockLibraryPage/statblockLibraryPage.jsx';
import StatblockSharePage from './pages/statblockSharePage/statblockSharePage.jsx';
import LandingPage from './pages/landingPage/landingPage.jsx';
import StatblockImportPage from './pages/statblockImportPage/statblockImportPage.jsx';
import BrpStatblockEditorPage from './pages/brpStatblockEditorPage/brpStatblockEditorPage.jsx';
import BrpStatblockLibraryPage from './pages/brpStatblockLibraryPage/brpStatblockLibraryPage.jsx';
import BrpStatblockSharePage from './pages/brpStatblockSharePage/brpStatblockSharePage.jsx';
import WillowlightStatblockEditorPage from './pages/willowlightStatblockEditorPage/willowlightStatblockEditorPage.jsx';
import WillowlightStatblockLibraryPage from './pages/willowlightStatblockLibraryPage/willowlightStatblockLibraryPage.jsx';
import WillowlightStatblockSharePage from './pages/willowlightStatblockSharePage/willowlightStatblockSharePage.jsx';
import WillowlightCharacterEditorPage from './pages/willowlightCharacterEditorPage/willowlightCharacterEditorPage.jsx';
import WillowlightCharacterLibraryPage from './pages/willowlightCharacterLibraryPage/willowlightCharacterLibraryPage.jsx';
import WillowlightCharacterSharePage from './pages/willowlightCharacterSharePage/willowlightCharacterSharePage.jsx';

// Lazy-load BESM pages — keeps ~500KB of data libraries out of the main bundle
const BesmBuilderPage = lazy(()=>import('./pages/besmBuilder/besmBuilderPage.jsx'));
const BesmLibraryPage = lazy(()=>import('./pages/besmLibraryPage/besmLibraryPage.jsx'));

const WithRoute = ({ el: Element, ...rest })=>{
	const params = useParams();
	const [searchParams] = useSearchParams();
	const queryParams = Object.fromEntries(searchParams?.entries() || []);
	return <Element {...rest} {...params} query={queryParams} />;
};

const Homebrew = (props)=>{
	const {
		url = '',
		version = '0.0.0',
		account = null,
		config,
		brew = {
			title     : '',
			text      : '',
			shareId   : null,
			editId    : null,
			createdAt : null,
			updatedAt : null,
			lang      : ''
		},
		userThemes,
		brews
	} = props;

	const backgroundObject = ()=>{
		if(config?.deployment || (config?.local && config?.development)) {
			const bgText = config?.deployment || 'Local';
			return {
				backgroundImage : `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' version='1.1' height='100px' width='200px'><text x='0' y='15' fill='%23fff7' font-size='20'>${bgText}</text></svg>")`
			};
		}
		return null;
	};

	updateLocalStorage();

	if(brew.pureError) {
		return (
			<Router>
				<div className={`homebrew${(config?.deployment || config?.local) ? ' deployment' : ''}`} style={backgroundObject()}>
					<Routes>
						<Route path={brew.originalUrl} element={<WithRoute el={ErrorPage} brew={brew} />} />
					</Routes>
				</div>
			</Router>
		);
	}


	return (
		<Router>
			<div className={`homebrew${(config?.deployment || config?.local) ? ' deployment' : ''}`} style={backgroundObject()}>
				<Routes>
					<Route path='/besm/new' element={<Suspense fallback={<div style={{ textAlign: 'center', padding: '4rem', color: '#e93a7d', fontSize: '1.2rem' }}>Loading BESM Builder...</div>}><WithRoute el={BesmBuilderPage} /></Suspense>} />
					<Route path='/besm/edit/:id' element={<Suspense fallback={<div style={{ textAlign: 'center', padding: '4rem', color: '#e93a7d', fontSize: '1.2rem' }}>Loading BESM Builder...</div>}><WithRoute el={BesmBuilderPage} besmCharacter={props.besmCharacter} /></Suspense>} />
					<Route path='/besm/library' element={<Suspense fallback={<div style={{ textAlign: 'center', padding: '4rem', color: '#e93a7d', fontSize: '1.2rem' }}>Loading...</div>}><WithRoute el={BesmLibraryPage} /></Suspense>} />
					<Route path='/brp/new' element={<WithRoute el={BrpStatblockEditorPage} />} />
					<Route path='/brp/edit/:id' element={<WithRoute el={BrpStatblockEditorPage} brpStatblock={props.brpStatblock} />} />
					<Route path='/brp/share/:id' element={<WithRoute el={BrpStatblockSharePage} brpStatblock={props.brpStatblock} />} />
					<Route path='/brp/library' element={<WithRoute el={BrpStatblockLibraryPage} />} />
					<Route path='/willowlight/new' element={<WithRoute el={WillowlightStatblockEditorPage} />} />
					<Route path='/willowlight/edit/:id' element={<WithRoute el={WillowlightStatblockEditorPage} willowlightStatblock={props.willowlightStatblock} />} />
					<Route path='/willowlight/share/:id' element={<WithRoute el={WillowlightStatblockSharePage} willowlightStatblock={props.willowlightStatblock} />} />
					<Route path='/willowlight/library' element={<WithRoute el={WillowlightStatblockLibraryPage} />} />
					<Route path='/willowlight-character/new' element={<WithRoute el={WillowlightCharacterEditorPage} />} />
					<Route path='/willowlight-character/edit/:id' element={<WithRoute el={WillowlightCharacterEditorPage} willowlightCharacter={props.willowlightCharacter} />} />
					<Route path='/willowlight-character/share/:id' element={<WithRoute el={WillowlightCharacterSharePage} willowlightCharacter={props.willowlightCharacter} />} />
					<Route path='/willowlight-character/library' element={<WithRoute el={WillowlightCharacterLibraryPage} />} />
					<Route path='/statblock/new' element={<WithRoute el={StatblockEditorPage} />} />
					<Route path='/statblock/edit/:id' element={<WithRoute el={StatblockEditorPage} statblock={props.statblock} />} />
					<Route path='/statblock/share/:id' element={<WithRoute el={StatblockSharePage} statblock={props.statblock} />} />
					<Route path='/statblock/library' element={<WithRoute el={StatblockLibraryPage} />} />
					<Route path='/statblock/import' element={<WithRoute el={StatblockImportPage} />} />
					<Route path='/edit/:id' element={<WithRoute el={EditPage} brew={brew} userThemes={userThemes}/>} />
					<Route path='/share/:id' element={<WithRoute el={SharePage} brew={brew} />} />
					<Route path='/new/:id' element={<WithRoute el={NewPage} brew={brew} userThemes={userThemes}/>} />
					<Route path='/new' element={<WithRoute el={NewPage} userThemes={userThemes}/> } />
					<Route path='/user/:username' element={<WithRoute el={UserPage} brews={brews} userStatblocks={props.userStatblocks} />} />
					<Route path='/vault' element={<WithRoute el={VaultPage}/>}/>
					<Route path='/changelog' element={<WithRoute el={SharePage} brew={brew} disableMeta={true} />} />
					<Route path='/faq' element={<WithRoute el={SharePage} brew={brew} disableMeta={true} />} />
					<Route path='/migrate' element={<WithRoute el={SharePage} brew={brew} disableMeta={true} />} />
					<Route path='/account' element={<WithRoute el={AccountPage} brew={brew} accountDetails={brew.accountDetails} />} />
					<Route path='/brew' element={<WithRoute el={HomePage} brew={brew} />} />
					<Route path='/legacy' element={<WithRoute el={HomePage} brew={brew} />} />
					<Route path='/error' element={<WithRoute el={ErrorPage} brew={brew} />} />
					<Route path='/' element={<WithRoute el={LandingPage} />} />
					<Route path='/*' element={<WithRoute el={LandingPage} />} />
				</Routes>
			</div>
		</Router>
	);
};

export default Homebrew;
