import './searchPanel.less';
import React, { useState, useEffect, useRef, useCallback } from 'react';

const SearchPanel = ({ codeMirror, onClose })=>{
	const [searchText, setSearchText] = useState('');
	const [replaceText, setReplaceText] = useState('');
	const [showReplace, setShowReplace] = useState(false);
	const [matchCase, setMatchCase] = useState(false);
	const [useRegex, setUseRegex] = useState(false);
	const [matchCount, setMatchCount] = useState(0);
	const [currentMatch, setCurrentMatch] = useState(0);
	const searchRef = useRef(null);
	const overlayRef = useRef(null);
	const markersRef = useRef([]);

	// Focus search input on mount
	useEffect(()=>{
		searchRef.current?.focus();
		// Pre-fill with current selection if any
		if(codeMirror) {
			const sel = codeMirror.getSelection();
			if(sel && sel.length < 200) {
				setSearchText(sel);
			}
		}
	}, []);

	// Clear highlights on unmount
	useEffect(()=>{
		return ()=>{
			clearMarkers();
			removeOverlay();
		};
	}, []);

	const clearMarkers = ()=>{
		markersRef.current.forEach((m)=>m.clear());
		markersRef.current = [];
	};

	const removeOverlay = ()=>{
		if(overlayRef.current && codeMirror) {
			codeMirror.removeOverlay(overlayRef.current);
			overlayRef.current = null;
		}
	};

	const getQuery = useCallback(()=>{
		if(!searchText) return null;
		if(useRegex) {
			try {
				return new RegExp(searchText, matchCase ? 'g' : 'gi');
			} catch (e) {
				return null;
			}
		}
		return searchText;
	}, [searchText, matchCase, useRegex]);

	// Highlight all matches whenever search text or options change
	useEffect(()=>{
		if(!codeMirror) return;

		clearMarkers();
		removeOverlay();

		const query = getQuery();
		if(!query) {
			setMatchCount(0);
			setCurrentMatch(0);
			return;
		}

		// Add overlay for live highlighting
		const overlay = {
			token: (stream)=>{
				if(useRegex) {
					const q = typeof query === 'string' ? new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), matchCase ? '' : 'i') : query;
					q.lastIndex = stream.pos;
					const match = q.exec(stream.string);
					if(match && match.index === stream.pos) {
						stream.pos += match[0].length || 1;
						return 'searching';
					}
					if(match) {
						stream.pos = match.index;
					} else {
						stream.skipToEnd();
					}
				} else {
					const needle = matchCase ? searchText : searchText.toLowerCase();
					const hay = matchCase ? stream.string : stream.string.toLowerCase();
					const idx = hay.indexOf(needle, stream.pos);
					if(idx === stream.pos) {
						stream.pos += needle.length;
						return 'searching';
					}
					if(idx > -1) {
						stream.pos = idx;
					} else {
						stream.skipToEnd();
					}
				}
			}
		};
		codeMirror.addOverlay(overlay);
		overlayRef.current = overlay;

		// Count matches
		let count = 0;
		const cursor = codeMirror.getSearchCursor(query, { line: 0, ch: 0 }, { caseFold: !matchCase });
		while (cursor.findNext()) count++;
		setMatchCount(count);
		if(count > 0 && currentMatch === 0) setCurrentMatch(1);
		if(currentMatch > count) setCurrentMatch(count);
	}, [searchText, matchCase, useRegex, codeMirror]);

	const findNext = useCallback(()=>{
		if(!codeMirror || !searchText) return;
		const query = getQuery();
		if(!query) return;

		const from = codeMirror.getCursor('to');
		const cursor = codeMirror.getSearchCursor(query, from, { caseFold: !matchCase });
		if(cursor.findNext()) {
			codeMirror.setSelection(cursor.from(), cursor.to());
			codeMirror.scrollIntoView({ from: cursor.from(), to: cursor.to() }, 50);
			// Calculate which match this is
			let idx = 0;
			const counter = codeMirror.getSearchCursor(query, { line: 0, ch: 0 }, { caseFold: !matchCase });
			while (counter.findNext()) {
				idx++;
				if(counter.from().line === cursor.from().line && counter.from().ch === cursor.from().ch) break;
			}
			setCurrentMatch(idx);
		} else {
			// Wrap to beginning
			const wrapCursor = codeMirror.getSearchCursor(query, { line: 0, ch: 0 }, { caseFold: !matchCase });
			if(wrapCursor.findNext()) {
				codeMirror.setSelection(wrapCursor.from(), wrapCursor.to());
				codeMirror.scrollIntoView({ from: wrapCursor.from(), to: wrapCursor.to() }, 50);
				setCurrentMatch(1);
			}
		}
	}, [codeMirror, searchText, matchCase, useRegex, getQuery]);

	const findPrev = useCallback(()=>{
		if(!codeMirror || !searchText) return;
		const query = getQuery();
		if(!query) return;

		const from = codeMirror.getCursor('from');
		const cursor = codeMirror.getSearchCursor(query, from, { caseFold: !matchCase });
		if(cursor.findPrevious()) {
			codeMirror.setSelection(cursor.from(), cursor.to());
			codeMirror.scrollIntoView({ from: cursor.from(), to: cursor.to() }, 50);
			let idx = 0;
			const counter = codeMirror.getSearchCursor(query, { line: 0, ch: 0 }, { caseFold: !matchCase });
			while (counter.findNext()) {
				idx++;
				if(counter.from().line === cursor.from().line && counter.from().ch === cursor.from().ch) break;
			}
			setCurrentMatch(idx);
		} else {
			// Wrap to end
			const wrapCursor = codeMirror.getSearchCursor(query, { line: codeMirror.lastLine() + 1, ch: 0 }, { caseFold: !matchCase });
			if(wrapCursor.findPrevious()) {
				codeMirror.setSelection(wrapCursor.from(), wrapCursor.to());
				codeMirror.scrollIntoView({ from: wrapCursor.from(), to: wrapCursor.to() }, 50);
				setCurrentMatch(matchCount);
			}
		}
	}, [codeMirror, searchText, matchCase, useRegex, matchCount, getQuery]);

	const replaceCurrent = useCallback(()=>{
		if(!codeMirror || !searchText) return;
		const sel = codeMirror.getSelection();
		const query = getQuery();
		if(!query) return;

		// Check if current selection matches
		let isMatch = false;
		if(useRegex) {
			const re = typeof query === 'string' ? new RegExp(query, matchCase ? '' : 'i') : new RegExp(query.source, matchCase ? '' : 'i');
			isMatch = re.test(sel);
		} else {
			isMatch = matchCase ? sel === searchText : sel.toLowerCase() === searchText.toLowerCase();
		}

		if(isMatch) {
			if(useRegex) {
				const re = typeof query === 'string' ? new RegExp(query, matchCase ? '' : 'i') : new RegExp(query.source, matchCase ? '' : 'i');
				codeMirror.replaceSelection(sel.replace(re, replaceText));
			} else {
				codeMirror.replaceSelection(replaceText);
			}
			setMatchCount((c)=>Math.max(0, c - 1));
		}
		findNext();
	}, [codeMirror, searchText, replaceText, matchCase, useRegex, getQuery, findNext]);

	const replaceAll = useCallback(()=>{
		if(!codeMirror || !searchText) return;
		const query = getQuery();
		if(!query) return;

		let count = 0;
		codeMirror.operation(()=>{
			const cursor = codeMirror.getSearchCursor(query, { line: 0, ch: 0 }, { caseFold: !matchCase });
			while (cursor.findNext()) {
				if(useRegex) {
					const re = typeof query === 'string' ? new RegExp(query, matchCase ? '' : 'i') : new RegExp(query.source, matchCase ? '' : 'i');
					const matched = codeMirror.getRange(cursor.from(), cursor.to());
					cursor.replace(matched.replace(re, replaceText));
				} else {
					cursor.replace(replaceText);
				}
				count++;
			}
		});
		setMatchCount(0);
		setCurrentMatch(0);
	}, [codeMirror, searchText, replaceText, matchCase, useRegex, getQuery]);

	const handleSearchKeyDown = (e)=>{
		if(e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			findNext();
		} else if(e.key === 'Enter' && e.shiftKey) {
			e.preventDefault();
			findPrev();
		} else if(e.key === 'Escape') {
			e.preventDefault();
			onClose();
		}
	};

	const handleReplaceKeyDown = (e)=>{
		if(e.key === 'Enter') {
			e.preventDefault();
			replaceCurrent();
		} else if(e.key === 'Escape') {
			e.preventDefault();
			onClose();
		}
	};

	return <div className="searchPanel">
		<div className="searchRow">
			<input
				ref={searchRef}
				className="searchInput"
				type="text"
				value={searchText}
				onChange={(e)=>setSearchText(e.target.value)}
				onKeyDown={handleSearchKeyDown}
				placeholder="Find..."
			/>
			<span className="matchInfo">
				{searchText ? `${currentMatch}/${matchCount}` : ''}
			</span>
			<button className="searchBtn" onClick={findPrev} title="Previous (Shift+Enter)">
				<i className="fas fa-chevron-up" />
			</button>
			<button className="searchBtn" onClick={findNext} title="Next (Enter)">
				<i className="fas fa-chevron-down" />
			</button>
			<button className={`searchBtn toggle ${matchCase ? 'active' : ''}`}
				onClick={()=>setMatchCase(!matchCase)} title="Match Case">
				Aa
			</button>
			<button className={`searchBtn toggle ${useRegex ? 'active' : ''}`}
				onClick={()=>setUseRegex(!useRegex)} title="Use Regex">
				.*
			</button>
			<button className={`searchBtn toggle ${showReplace ? 'active' : ''}`}
				onClick={()=>setShowReplace(!showReplace)} title="Toggle Replace">
				<i className="fas fa-exchange-alt" />
			</button>
			<button className="searchBtn close" onClick={onClose} title="Close (Esc)">
				<i className="fas fa-times" />
			</button>
		</div>
		{showReplace && <div className="replaceRow">
			<input
				className="searchInput"
				type="text"
				value={replaceText}
				onChange={(e)=>setReplaceText(e.target.value)}
				onKeyDown={handleReplaceKeyDown}
				placeholder="Replace..."
			/>
			<button className="searchBtn" onClick={replaceCurrent} title="Replace">
				Replace
			</button>
			<button className="searchBtn" onClick={replaceAll} title="Replace All">
				All
			</button>
		</div>}
	</div>;
};

export default SearchPanel;
