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
import PalladiumStatblockEditorPage from './pages/palladiumStatblockEditorPage/palladiumStatblockEditorPage.jsx';
import PalladiumStatblockLibraryPage from './pages/palladiumStatblockLibraryPage/palladiumStatblockLibraryPage.jsx';
import PalladiumStatblockSharePage from './pages/palladiumStatblockSharePage/palladiumStatblockSharePage.jsx';
import WillowlightEditorPage from './pages/willowlightEditorPage/willowlightEditorPage.jsx';
import WillowlightLibraryPage from './pages/willowlightLibraryPage/willowlightLibraryPage.jsx';
import WillowlightSharePage from './pages/willowlightSharePage/willowlightSharePage.jsx';
import WillowlightBestiaryEditorPage from './pages/willowlightBestiaryEditorPage/willowlightBestiaryEditorPage.jsx';
import WillowlightBestiaryLibraryPage from './pages/willowlightBestiaryLibraryPage/willowlightBestiaryLibraryPage.jsx';
import ProceduralImageLibraryPage from './pages/proceduralImageLibraryPage/proceduralImageLibraryPage.jsx';
import ProceduralSealEditorPage from './pages/proceduralSealEditorPage/proceduralSealEditorPage.jsx';
import ProceduralSealSharePage from './pages/proceduralSealSharePage/proceduralSealSharePage.jsx';
import ProceduralIconEditorPage from './pages/proceduralIconEditorPage/proceduralIconEditorPage.jsx';
import ProceduralIconSharePage from './pages/proceduralIconSharePage/proceduralIconSharePage.jsx';
import ProceduralHeraldryEditorPage from './pages/proceduralHeraldryEditorPage/proceduralHeraldryEditorPage.jsx';
import ProceduralHeraldrySharePage from './pages/proceduralHeraldrySharePage/proceduralHeraldrySharePage.jsx';

// Lazy-load BESM pages — keeps ~500KB of data libraries out of the main bundle
const BesmBuilderPage = lazy(()=>import('./pages/besmBuilder/besmBuilderPage.jsx'));
const BesmLibraryPage = lazy(()=>import('./pages/besmLibraryPage/besmLibraryPage.jsx'));
const BesmStatblockSharePage = lazy(()=>import('./pages/besmStatblockSharePage/besmStatblockSharePage.jsx'));

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
					<Route path='/seal/new' element={<WithRoute el={ProceduralSealEditorPage} />} />
					<Route path='/seal/edit/:id' element={<WithRoute el={ProceduralSealEditorPage} />} />
					<Route path='/seal/share/:id' element={<WithRoute el={ProceduralSealSharePage} />} />
					<Route path='/seal/library' element={<WithRoute el={ProceduralImageLibraryPage} />} />
					<Route path='/icon/new' element={<WithRoute el={ProceduralIconEditorPage} />} />
					<Route path='/icon/edit/:id' element={<WithRoute el={ProceduralIconEditorPage} />} />
					<Route path='/icon/share/:id' element={<WithRoute el={ProceduralIconSharePage} />} />
					<Route path='/icon/library' element={<WithRoute el={ProceduralImageLibraryPage} />} />
					<Route path='/heraldry/new' element={<WithRoute el={ProceduralHeraldryEditorPage} />} />
					<Route path='/heraldry/edit/:id' element={<WithRoute el={ProceduralHeraldryEditorPage} />} />
					<Route path='/heraldry/share/:id' element={<WithRoute el={ProceduralHeraldrySharePage} />} />
					<Route path='/heraldry/library' element={<WithRoute el={ProceduralImageLibraryPage} />} />
					<Route path='/besm/new' element={<Suspense fallback={<div style={{ textAlign: 'center', padding: '4rem', color: '#e93a7d', fontSize: '1.2rem' }}>Loading BESM Builder...</div>}><WithRoute el={BesmBuilderPage} /></Suspense>} />
					<Route path='/besm/edit/:id' element={<Suspense fallback={<div style={{ textAlign: 'center', padding: '4rem', color: '#e93a7d', fontSize: '1.2rem' }}>Loading BESM Builder...</div>}><WithRoute el={BesmBuilderPage} besmCharacter={props.besmCharacter} /></Suspense>} />
					<Route path='/besm/library' element={<Suspense fallback={<div style={{ textAlign: 'center', padding: '4rem', color: '#e93a7d', fontSize: '1.2rem' }}>Loading...</div>}><WithRoute el={BesmLibraryPage} /></Suspense>} />
					<Route path='/besm/share/:id' element={<Suspense fallback={<div style={{ textAlign: 'center', padding: '4rem', color: '#e93a7d', fontSize: '1.2rem' }}>Loading...</div>}><WithRoute el={BesmStatblockSharePage} besmCharacter={props.besmCharacter} /></Suspense>} />
					<Route path='/brp/new' element={<WithRoute el={BrpStatblockEditorPage} />} />
					<Route path='/brp/edit/:id' element={<WithRoute el={BrpStatblockEditorPage} brpStatblock={props.brpStatblock} />} />
					<Route path='/brp/share/:id' element={<WithRoute el={BrpStatblockSharePage} brpStatblock={props.brpStatblock} />} />
					<Route path='/brp/sheet/blank' element={<WithRoute el={BrpStatblockSharePage} brpStatblock={null} sheetView={true} />} />
					<Route path='/brp/sheet/:id' element={<WithRoute el={BrpStatblockSharePage} brpStatblock={props.brpStatblock} sheetView={true} />} />
					<Route path='/brp/library' element={<WithRoute el={BrpStatblockLibraryPage} />} />
					<Route path='/palladium/new' element={<WithRoute el={PalladiumStatblockEditorPage} />} />
					<Route path='/palladium/edit/:id' element={<WithRoute el={PalladiumStatblockEditorPage} palladiumStatblock={props.palladiumStatblock} />} />
					<Route path='/palladium/share/:id' element={<WithRoute el={PalladiumStatblockSharePage} palladiumStatblock={props.palladiumStatblock} />} />
					<Route path='/palladium/library' element={<WithRoute el={PalladiumStatblockLibraryPage} />} />
					<Route path='/willowlight/new' element={<WithRoute el={WillowlightEditorPage} />} />
					<Route path='/willowlight/edit/:id' element={<WithRoute el={WillowlightEditorPage} willowlightCharacter={props.willowlightCharacter} />} />
					<Route path='/willowlight/share/:id' element={<WithRoute el={WillowlightSharePage} willowlightCharacter={props.willowlightCharacter} />} />
					<Route path='/willowlight/library' element={<WithRoute el={WillowlightLibraryPage} />} />
					<Route path='/willowlight/bestiary/new' element={<WithRoute el={WillowlightBestiaryEditorPage} />} />
					<Route path='/willowlight/bestiary/edit/:id' element={<WithRoute el={WillowlightBestiaryEditorPage} willowlightBestiary={props.willowlightBestiary} />} />
					<Route path='/willowlight/bestiary' element={<WithRoute el={WillowlightBestiaryLibraryPage} />} />
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
