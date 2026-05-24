const ART_INTERACTION_STYLES = `
.art-block {
	cursor: default;
}
.art-block.art-hover {
	outline: 2px dashed rgba(0, 120, 255, 0.5);
	cursor: grab;
}
.art-block.art-selected {
	outline: 2px solid rgba(0, 120, 255, 0.8);
	cursor: grab;
}
.art-block.art-dragging {
	cursor: grabbing;
	opacity: 0.8;
}
.art-handle {
	position: absolute;
	width: 10px;
	height: 10px;
	background: white;
	border: 2px solid rgba(0, 120, 255, 0.8);
	z-index: 10000;
	pointer-events: auto;
	box-sizing: border-box;
}
.art-handle-nw { cursor: nw-resize; }
.art-handle-ne { cursor: ne-resize; }
.art-handle-sw { cursor: sw-resize; }
.art-handle-se { cursor: se-resize; }
`;

function pxToUnit(px, unit, pageDimPx) {
	switch (unit) {
		case 'in': return (px / 96).toFixed(2) + 'in';
		case 'cm': return (px / 96 * 2.54).toFixed(2) + 'cm';
		case '%':  return (px / pageDimPx * 100).toFixed(2) + '%';
		case 'px': return Math.round(px) + 'px';
		default:   return (px / 96).toFixed(2) + 'in';
	}
}

function unitToPx(value, pageDimPx) {
	const num = parseFloat(value);
	if(value.endsWith('%'))  return num / 100 * pageDimPx;
	if(value.endsWith('cm')) return num / 2.54 * 96;
	if(value.endsWith('px')) return num;
	return num * 96;
}

export function initArtBlockInteraction(frameDoc, onUpdate) {
	if(!frameDoc.getElementById('art-interaction-styles')) {
		const styleEl = frameDoc.createElement('style');
		styleEl.id = 'art-interaction-styles';
		styleEl.textContent = ART_INTERACTION_STYLES;
		frameDoc.head.appendChild(styleEl);
	}

	let selectedImg = null;
	let handles = [];
	let isDragging = false;
	let isResizing = false;
	let dragStartX = 0;
	let dragStartY = 0;
	let dragStartLeft = 0;
	let dragStartTop = 0;
	let resizeStartX = 0;
	let resizeStartY = 0;
	let resizeStartW = 0;
	let resizeStartH = 0;
	let resizeCorner = '';

	function getPageElement(el) {
		let page = el.parentElement;
		while (page && !page.classList?.contains('page')) {
			page = page.parentElement;
		}
		return page;
	}

	function removeHandles() {
		handles.forEach((h)=>h.remove());
		handles = [];
	}

	function positionHandles(img) {
		const page = getPageElement(img);
		if(!page) return;

		const w = img.offsetWidth;
		const h = img.offsetHeight;

		const pageRect = page.querySelector('.columnWrapper')?.getBoundingClientRect() || page.getBoundingClientRect();
		const imgRect = img.getBoundingClientRect();
		const relLeft = imgRect.left - pageRect.left;
		const relTop = imgRect.top - pageRect.top;

		const positions = [
			{ cls: 'art-handle-nw', x: relLeft - 5,     y: relTop - 5 },
			{ cls: 'art-handle-ne', x: relLeft + w - 5,  y: relTop - 5 },
			{ cls: 'art-handle-sw', x: relLeft - 5,     y: relTop + h - 5 },
			{ cls: 'art-handle-se', x: relLeft + w - 5,  y: relTop + h - 5 },
		];

		if(handles.length !== 4) {
			removeHandles();
			const container = page.querySelector('.columnWrapper') || page;
			positions.forEach((pos)=>{
				const handle = frameDoc.createElement('div');
				handle.className = `art-handle ${pos.cls}`;
				handle.style.position = 'absolute';
				handle.style.left = pos.x + 'px';
				handle.style.top = pos.y + 'px';
				container.appendChild(handle);
				handles.push(handle);

				handle.addEventListener('mousedown', (e)=>{
					e.stopPropagation();
					e.preventDefault();
					startResize(e, pos.cls.replace('art-handle-', ''));
				});
			});
		} else {
			positions.forEach((pos, i)=>{
				handles[i].style.left = pos.x + 'px';
				handles[i].style.top = pos.y + 'px';
			});
		}
	}

	function selectArt(img) {
		deselectArt();
		selectedImg = img;
		img.classList.add('art-selected');
		positionHandles(img);
	}

	function deselectArt() {
		if(selectedImg) {
			selectedImg.classList.remove('art-selected');
			selectedImg = null;
		}
		removeHandles();
	}

	function startDrag(e) {
		if(!selectedImg || isResizing) return;
		isDragging = true;
		selectedImg.classList.add('art-dragging');

		const page = getPageElement(selectedImg);
		const pageW = page?.offsetWidth || 816;
		const pageH = page?.offsetHeight || 1056;

		dragStartX = e.clientX;
		dragStartY = e.clientY;
		dragStartLeft = unitToPx(selectedImg.style.left || '0in', pageW);
		dragStartTop = unitToPx(selectedImg.style.top || '0in', pageH);

		frameDoc.addEventListener('mousemove', onDragMove);
		frameDoc.addEventListener('mouseup', onDragEnd);
	}

	function onDragMove(e) {
		if(!isDragging || !selectedImg) return;
		e.preventDefault();
		const dx = e.clientX - dragStartX;
		const dy = e.clientY - dragStartY;
		selectedImg.style.left = (dragStartLeft + dx) + 'px';
		selectedImg.style.top = (dragStartTop + dy) + 'px';
		positionHandles(selectedImg);
	}

	function onDragEnd(e) {
		if(!isDragging || !selectedImg) return;
		isDragging = false;
		selectedImg.classList.remove('art-dragging');
		frameDoc.removeEventListener('mousemove', onDragMove);
		frameDoc.removeEventListener('mouseup', onDragEnd);

		const page = getPageElement(selectedImg);
		const pageW = page?.offsetWidth || 816;
		const pageH = page?.offsetHeight || 1056;
		const unitX = selectedImg.getAttribute('data-art-unit-x') || 'in';
		const unitY = selectedImg.getAttribute('data-art-unit-y') || 'in';

		const newX = pxToUnit(parseFloat(selectedImg.style.left), unitX, pageW);
		const newY = pxToUnit(parseFloat(selectedImg.style.top), unitY, pageH);
		const artIndex = parseInt(selectedImg.getAttribute('data-art-index'), 10);

		onUpdate({ artIndex, props: { x: newX, y: newY } });
	}

	function startResize(e, corner) {
		if(!selectedImg) return;
		isResizing = true;
		resizeCorner = corner;
		resizeStartX = e.clientX;
		resizeStartY = e.clientY;
		resizeStartW = selectedImg.offsetWidth;
		resizeStartH = selectedImg.offsetHeight;

		selectedImg.setAttribute('data-orig-left', selectedImg.style.left);
		selectedImg.setAttribute('data-orig-top', selectedImg.style.top);

		frameDoc.addEventListener('mousemove', onResizeMove);
		frameDoc.addEventListener('mouseup', onResizeEnd);
	}

	function onResizeMove(e) {
		if(!isResizing || !selectedImg) return;
		e.preventDefault();
		const dx = e.clientX - resizeStartX;
		const dy = e.clientY - resizeStartY;

		let newW = resizeStartW;
		let newH = resizeStartH;

		if(resizeCorner === 'se') {
			newW = resizeStartW + dx;
			newH = resizeStartH + dy;
		} else if(resizeCorner === 'sw') {
			newW = resizeStartW - dx;
			newH = resizeStartH + dy;
		} else if(resizeCorner === 'ne') {
			newW = resizeStartW + dx;
			newH = resizeStartH - dy;
		} else if(resizeCorner === 'nw') {
			newW = resizeStartW - dx;
			newH = resizeStartH - dy;
		}

		newW = Math.max(20, newW);
		newH = Math.max(20, newH);

		selectedImg.style.width = newW + 'px';
		selectedImg.style.height = newH + 'px';

		if(resizeCorner === 'nw' || resizeCorner === 'sw') {
			const page = getPageElement(selectedImg);
			const pageW = page?.offsetWidth || 816;
			const origLeft = unitToPx(selectedImg.getAttribute('data-orig-left') || '0', pageW);
			selectedImg.style.left = (origLeft + (resizeStartW - newW)) + 'px';
		}
		if(resizeCorner === 'nw' || resizeCorner === 'ne') {
			const page = getPageElement(selectedImg);
			const pageH = page?.offsetHeight || 1056;
			const origTop = unitToPx(selectedImg.getAttribute('data-orig-top') || '0', pageH);
			selectedImg.style.top = (origTop + (resizeStartH - newH)) + 'px';
		}

		positionHandles(selectedImg);
	}

	function onResizeEnd(e) {
		if(!isResizing || !selectedImg) return;
		isResizing = false;
		frameDoc.removeEventListener('mousemove', onResizeMove);
		frameDoc.removeEventListener('mouseup', onResizeEnd);

		const page = getPageElement(selectedImg);
		const pageW = page?.offsetWidth || 816;
		const pageH = page?.offsetHeight || 1056;
		const unitW = selectedImg.getAttribute('data-art-unit-w') || 'in';
		const unitX = selectedImg.getAttribute('data-art-unit-x') || 'in';
		const unitY = selectedImg.getAttribute('data-art-unit-y') || 'in';
		const artIndex = parseInt(selectedImg.getAttribute('data-art-index'), 10);

		const newProps = {
			w: pxToUnit(selectedImg.offsetWidth, unitW, pageW)
		};

		if(resizeCorner === 'nw' || resizeCorner === 'sw') {
			newProps.x = pxToUnit(parseFloat(selectedImg.style.left), unitX, pageW);
		}
		if(resizeCorner === 'nw' || resizeCorner === 'ne') {
			newProps.y = pxToUnit(parseFloat(selectedImg.style.top), unitY, pageH);
		}

		const unitH = selectedImg.getAttribute('data-art-unit-h');
		if(unitH !== null && unitH !== undefined) {
			newProps.h = pxToUnit(selectedImg.offsetHeight, unitH, pageH);
		}

		onUpdate({ artIndex, props: newProps });
	}

	const artBlocks = frameDoc.querySelectorAll('.art-block');

	artBlocks.forEach((img)=>{
		img.addEventListener('mouseenter', ()=>{
			if(!isDragging && !isResizing && img !== selectedImg) {
				img.classList.add('art-hover');
			}
		});

		img.addEventListener('mouseleave', ()=>{
			img.classList.remove('art-hover');
		});

		img.addEventListener('click', (e)=>{
			e.stopPropagation();
			e.preventDefault();
			img.classList.remove('art-hover');
			selectArt(img);
		});

		img.addEventListener('mousedown', (e)=>{
			if(img === selectedImg && !isResizing) {
				e.stopPropagation();
				e.preventDefault();
				startDrag(e);
			}
		});
	});

	const onDocClick = (e)=>{
		if(!e.target.classList?.contains('art-block') && !e.target.classList?.contains('art-handle')) {
			deselectArt();
		}
	};

	const onDocKeydown = (e)=>{
		if(e.key === 'Escape') {
			deselectArt();
		}
	};

	frameDoc.addEventListener('click', onDocClick);
	frameDoc.addEventListener('keydown', onDocKeydown);

	return function cleanup() {
		deselectArt();
		frameDoc.removeEventListener('click', onDocClick);
		frameDoc.removeEventListener('keydown', onDocKeydown);
	};
}
