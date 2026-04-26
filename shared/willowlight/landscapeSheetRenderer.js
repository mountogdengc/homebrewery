// ── Cascade Landscape Character Sheet Renderer ─────────────────────────
// Renders a landscape (11×8.5) character sheet as two embeddable pages.

const esc = (s)=>(s ?? '').toString()
	.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function dots(val, max = 5, size = '') {
	const cls = size === 'sm' ? 'wll-dot-sm' : 'wll-dot';
	let html = '<span class="wll-dots">';
	for (let i = 0; i < max; i++) {
		html += `<span class="${cls}${i < val ? ' filled' : ''}"></span>`;
	}
	html += '</span>';
	return html;
}

function boxes(count, filled = 0, size = '') {
	const cls = size === 'sm' ? 'wll-box-sm' : 'wll-box';
	let html = '';
	for (let i = 0; i < count; i++) {
		html += `<span class="${cls}${i < filled ? ' filled' : ''}"></span>`;
	}
	return html;
}

function fieldVal(label, value) {
	const display = esc(value) || '&nbsp;';
	return `<div class="wll-field-row"><span class="wll-field-label">${label}</span><div class="wll-field-value">${display}</div></div>`;
}

function fieldValShort(label, value) {
	const display = esc(value) || '&nbsp;';
	return `<div class="wll-field-row"><span class="wll-field-label">${label}</span><div class="wll-field-value-short">${display}</div></div>`;
}

function getTrackBoxes(base, attrVal) { return base + (attrVal || 0); }

const AFFLICTION_LIST = ['terrified','discredited','stunned','prone','blinded','disoriented','restrained','slowed','disarmed','dying'];

// ── PAGE 1 ───────────────────────────────────────────────────────────

export function renderPage1(ch, layout = 'narrow', opts = {}) {
	const attrs = ch.attributes || {};
	const scale = ch.scale || {};
	const bwClass = opts.bw ? ' wll-bw' : '';

	// Identity
	const identity = `
		<div class="wll-panel">
			<div class="wll-section-label">Identity</div>
			<div class="wll-row" style="gap:8px; flex-wrap:wrap;">
				${fieldVal('Name', ch.name)}
				${fieldVal('Vocation', ch.vocation?.name || '')}
			</div>
			<div class="wll-row" style="gap:8px; flex-wrap:wrap; margin-top:2px;">
				${fieldVal('Conviction', ch.conviction)}
				${fieldVal('Path', ch.path)}
			</div>
			<div class="wll-row" style="gap:8px; flex-wrap:wrap; margin-top:2px;">
				${fieldVal('Age', ch.age)}
				${fieldVal('Gender', ch.gender)}
				${fieldVal('Height', ch.height)}
				${fieldVal('Weight', ch.weight)}
			</div>
			${fieldVal('Description', ch.shortDescription || ch.description || '')}
		</div>`;

	// Attributes
	function attrDomain(title, attrNames, anchorIdx, initIdx, scaleKey) {
		const labels = { might:'Might', reflex:'Reflex', endurance:'Endurance', reason:'Reason', guile:'Guile', resolve:'Resolve', influence:'Influence', poise:'Poise', command:'Command' };
		let rows = '';
		attrNames.forEach((a, i)=>{
			const name = labels[a] || a;
			const note = i === initIdx ? ' <span class="wll-attr-note">(init)</span>' : '';
			const cls = i === anchorIdx ? ' wll-attr-anchor' : '';
			rows += `<div class="wll-attr-row"><span class="wll-attr-name${cls}">${name}${i === anchorIdx ? ' \u2606' : ''}${note}</span>${dots(attrs[a] || 0)}</div>`;
		});
		const scaleVal = scale[scaleKey] || '';
		rows += `<div class="wll-attr-row" style="border-top:1px solid #ddd; margin-top:2px; padding-top:2px;">
			<span class="wll-attr-name" style="font-size:7pt; color:#666;">Scale</span>
			${scaleVal ? `<span style="font-size:7pt;">${esc(scaleVal)}</span>` : dots(0, 5, 'sm')}
		</div>`;
		return `<div class="wll-attr-domain"><div class="wll-attr-domain-title">${title}</div>${rows}</div>`;
	}

	const attributes = `
		<div class="wll-panel">
			<div class="wll-section-label">Attributes</div>
			<div class="wll-attr-grid">
				${attrDomain('Mental', ['reason','guile','resolve'], 2, 1, 'mental')}
				${attrDomain('Physical', ['might','reflex','endurance'], 2, 1, 'physical')}
				${attrDomain('Social', ['influence','poise','command'], 2, 1, 'social')}
			</div>
			<div style="font-size:6pt; color:#888; margin-top:2px;">\u2606 = Anchor attribute \u00b7 (init) = governs initiative in that domain</div>
		</div>`;

	// Skills
	const interests = (ch.interests || []).map((s)=>esc(s.name)).filter(Boolean);
	const hobbies = (ch.hobbies || []).map((s)=>esc(s.name)).filter(Boolean);
	const vocBonus = ch.vocation?.bonus ? ` +${ch.vocation.bonus}` : '';

	const skills = `
		<div class="wll-panel">
			<div class="wll-section-label">Vocation \u00b7 Interests \u00b7 Hobbies</div>
			<div class="wll-row" style="gap:8px;">
				<div style="flex:1;">
					<div class="wll-sub-label" style="margin-bottom:2px;">Vocation (Tier 3)</div>
					<div class="wll-writein-row"><div class="wll-writein-value">${esc(ch.vocation?.name || '')}${vocBonus}</div></div>
				</div>
				<div style="flex:2;">
					<div class="wll-sub-label" style="margin-bottom:2px;">Domain Focus</div>
					<div class="wll-writein-row"><div class="wll-writein-value">${esc(ch.domainFocus || '')}</div></div>
				</div>
			</div>
			<div class="wll-row" style="gap:8px; margin-top:2px;">
				<div style="flex:1;">
					<div class="wll-sub-label" style="margin-bottom:2px;">Interests (Tier 2)</div>
					${interests.map((n)=>`<div class="wll-writein-row"><div class="wll-writein-value">${n}</div></div>`).join('')}
					${Array(Math.max(0, 5 - interests.length)).fill('<div class="wll-writein-row"><div class="wll-writein-value"></div></div>').join('')}
				</div>
				<div style="flex:1;">
					<div class="wll-sub-label" style="margin-bottom:2px;">Hobbies (Tier 1)</div>
					${hobbies.map((n)=>`<div class="wll-writein-row"><div class="wll-writein-value">${n}</div></div>`).join('')}
					${Array(Math.max(0, 5 - hobbies.length)).fill('<div class="wll-writein-row"><div class="wll-writein-value"></div></div>').join('')}
				</div>
			</div>
		</div>`;

	// Health Tracks
	function healthPanel(label, base, attrKey, formula, overrideKey) {
		const attrVal = attrs[attrKey] || 0;
		const totalBoxes = ch[overrideKey] ?? getTrackBoxes(base, attrVal);
		const t1 = Math.min(totalBoxes, 3);
		const t2 = Math.min(Math.max(totalBoxes - 3, 0), 3);
		const t3 = Math.max(totalBoxes - 6, 0);
		return `<div class="wll-panel-light">
			<div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:3px;">
				<span style="font-size:8.5pt; font-weight:700;">${label}</span>
				<span class="wll-sub-label">${formula}</span>
			</div>
			${t1 > 0 ? `<div style="display:flex; align-items:center; gap:3px; margin-bottom:2px;"><span class="wll-sub-label" style="width:22px;">T1</span>${boxes(t1)}</div>` : ''}
			${t2 > 0 ? `<div style="display:flex; align-items:center; gap:3px; margin-bottom:2px;"><span class="wll-sub-label" style="width:22px;">T2</span>${boxes(t2)}</div>` : ''}
			${t3 > 0 ? `<div style="display:flex; align-items:center; gap:3px; margin-bottom:2px;"><span class="wll-sub-label" style="width:22px;">T3</span>${boxes(t3)}</div>` : ''}
		</div>`;
	}

	const afflictions = ch.afflictions || {};
	const afflictionHtml = AFFLICTION_LIST.map((a)=>{
		const checked = afflictions[a] ? '&#10003;' : '';
		return `<span class="wll-affliction-item"><span class="wll-check-box" style="width:8px; height:8px;">${checked}</span> ${a.charAt(0).toUpperCase() + a.slice(1)}</span>`;
	}).join(' ');

	const healthTracks = `
		<div class="wll-panel">
			<div class="wll-section-label">Health Tracks</div>
			<div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px;">
				${healthPanel('Willpower', 3, 'resolve', '3 + Resolve', 'willpowerOverride')}
				${healthPanel('Vitality', 3, 'endurance', '3 + Endurance', 'vitalityOverride')}
				${healthPanel('Composure', 3, 'command', '3 + Command', 'composureOverride')}
			</div>
			<div style="margin-top:4px;">
				<div class="wll-sub-label" style="margin-bottom:3px;">Afflictions &amp; Conditions</div>
				<div class="wll-affliction-row">${afflictionHtml}</div>
			</div>
		</div>`;

	// Aspects (large — 6 slots)
	const aspectRows = (ch.aspects || []).map((a)=>
		`<div class="wll-writein-row"><div class="wll-writein-value">${esc(a.name)}</div>${dots(a.dots || 0, 5, 'sm')}</div>`
	).join('');
	const aspectBlanks = Array(Math.max(0, 6 - (ch.aspects || []).length)).fill(
		`<div class="wll-writein-row"><div class="wll-writein-value"></div>${dots(0, 5, 'sm')}</div>`
	).join('');

	const aspects = `
		<div class="wll-panel">
			<div class="wll-section-label">Aspects</div>
			<div style="font-size:6.5pt; color:#777; margin-bottom:3px;">3 dots at creation \u00b7 Note linked attribute</div>
			${aspectRows}${aspectBlanks}
		</div>`;

	// Edges
	const edgeRows = (ch.edges || []).map((e)=>
		`<div class="wll-writein-row"><div class="wll-writein-value">${esc(e.name)}</div>${dots(e.dots || 0, 5, 'sm')}</div>`
	).join('');
	const edgeBlanks = Array(Math.max(0, 4 - (ch.edges || []).length)).fill(
		`<div class="wll-writein-row"><div class="wll-writein-value"></div>${dots(0, 5, 'sm')}</div>`
	).join('');

	// Burdens
	const burdenRows = (ch.burdens || []).map((b)=>
		`<div class="wll-writein-row"><div class="wll-writein-value">${esc(b.name)}</div>${dots(b.dots || 0, 5, 'sm')}</div>`
	).join('');
	const burdenBlanks = Array(Math.max(0, 4 - (ch.burdens || []).length)).fill(
		`<div class="wll-writein-row"><div class="wll-writein-value"></div>${dots(0, 5, 'sm')}</div>`
	).join('');

	const edgesBurdens = `
		<div class="wll-row" style="gap:6px;">
			<div class="wll-panel" style="flex:1;">
				<div class="wll-section-label">Edges</div>
				<div style="font-size:6.5pt; color:#777; margin-bottom:3px;">7 dots at creation</div>
				${edgeRows}${edgeBlanks}
			</div>
			<div class="wll-panel" style="flex:1;">
				<div class="wll-section-label">Burdens</div>
				<div style="font-size:6.5pt; color:#777; margin-bottom:3px;">3 dots at creation</div>
				${burdenRows}${burdenBlanks}
			</div>
		</div>`;

	// Luck & Resources
	const luck = `
		<div class="wll-panel">
			<div class="wll-section-label">Luck &amp; Resources</div>
			<div class="wll-row" style="gap:10px;">
				<div style="flex:1;">
					<div class="wll-sub-label" style="margin-bottom:2px;">Luck Rating</div>
					<div style="display:flex; align-items:center; gap:4px;">${dots(ch.luckRating || 0, 5)}</div>
					<div class="wll-sub-label" style="margin-top:4px; margin-bottom:2px;">Current Tokens</div>
					<div style="display:flex; gap:3px;">${boxes(ch.luckTokens || 5)}</div>
				</div>
				<div style="flex:1;">
					${fieldVal('Wealth', String(ch.wealthPoints || 0))}
					${fieldVal('Downtime', ch.downtime || '')}
					<div style="display:flex; align-items:center; gap:4px; margin-top:4px;">
						<span class="wll-field-label">Lifestyle</span>
						${dots(ch.lifestyle || 0, 5, 'sm')}
					</div>
				</div>
			</div>
		</div>`;

	// Advancement
	const advancement = `
		<div class="wll-panel">
			<div class="wll-section-label">Advancement</div>
			<div class="wll-row" style="gap:10px;">
				<div style="flex:1;">
					<div class="wll-sub-label" style="margin-bottom:2px;">Session XP (max 3)</div>
					<div style="display:flex; gap:3px;">${boxes(3, ch.sessionXP || 0, 'sm')}</div>
				</div>
				<div style="flex:1;">
					${fieldVal('Total XP', String(ch.totalXP || 0))}
					${fieldVal('XP Spent', String(ch.xpSpent || 0))}
				</div>
			</div>
		</div>`;

	return `<div class="wll-sheet${bwClass}">
		<div class="wll-page-title">
			Cascade <span>${esc(ch.name || '')}</span>
			<img src="/assets/lolgo_200x200_black.png" class="wll-logo" alt="" />
		</div>
		<div class="wll-row" style="gap:6px;">
			<div class="wll-col" style="flex:2; gap:5px;">
				${identity}
				${attributes}
				${skills}
				${healthTracks}
			</div>
			<div class="wll-col" style="flex:1; gap:5px;">
				${aspects}
				${edgesBurdens}
				${luck}
				${advancement}
			</div>
		</div>
		<div style="text-align:right; font-size:6pt; color:#aaa; margin-top:4px;">Cascade \u00a9 Mount Ogden Gaming Company</div>
	</div>`;
}

// ── PAGE 2 ───────────────────────────────────────────────────────────

export function renderPage2(ch, layout = 'narrow', opts = {}) {
	const bwClass = opts.bw ? ' wll-bw' : '';

	// Connections
	const contactCards = (ch.contacts || []).map((c)=>`
		<div class="wll-conn-card">
			<div class="wll-conn-header">
				<span class="wll-field-label">Name</span><div class="wll-field-value" style="flex:2;">${esc(c.name)}</div>
				<span class="wll-field-label" style="margin-left:6px;">Type</span><div class="wll-field-value" style="flex:1;">${esc(c.type || '')}</div>
			</div>
			${fieldVal('Relationship', c.relationship || '')}
			<div style="display:flex; align-items:center; gap:8px; margin-top:2px;">
				<span class="wll-sub-label">Rating</span>${dots(c.rating || 0)}
				<span class="wll-sub-label" style="margin-left:8px;">Health</span>${boxes(5, 0, 'sm')}
			</div>
			${fieldVal('Notes / Secrets Carried', c.note || '')}
		</div>
	`).join('');
	const blankContacts = Array(Math.max(0, 4 - (ch.contacts || []).length)).fill(`
		<div class="wll-conn-card">
			<div class="wll-conn-header">
				<span class="wll-field-label">Name</span><div class="wll-field-value" style="flex:2;"></div>
				<span class="wll-field-label" style="margin-left:6px;">Type</span><div class="wll-field-value" style="flex:1;"></div>
			</div>
			${fieldVal('Relationship', '')}
			<div style="display:flex; align-items:center; gap:8px; margin-top:2px;">
				<span class="wll-sub-label">Rating</span>${dots(0)}
				<span class="wll-sub-label" style="margin-left:8px;">Health</span>${boxes(5, 0, 'sm')}
			</div>
			${fieldVal('Notes / Secrets Carried', '')}
		</div>
	`).join('');

	const connections = `
		<div class="wll-panel">
			<div class="wll-section-label">Connections</div>
			<div style="font-size:6.5pt; color:#777; margin-bottom:4px;">Type: Contact / Ally / Rival / Retainer \u00b7 Start with 2 free contacts at rating 2</div>
			${contactCards}${blankContacts}
		</div>`;

	// Secrets
	const secretCards = (ch.secrets || []).map((s)=>{
		const spread = s.spread || [false, false, false];
		return `
			<div class="wll-secret-card">
				${fieldVal('Secret', s.name || '')}
				<div class="wll-row" style="gap:8px; margin-top:3px;">
					<div style="flex:1;">
						<div class="wll-sub-label">Weight (1-3)</div>
						<div style="display:flex; gap:3px; margin-top:2px;">${dots(s.weight || 0, 3)}</div>
					</div>
					<div style="flex:2;">
						<div class="wll-sub-label">Spread</div>
						<div style="display:flex; align-items:center; gap:2px; margin-top:2px;">
							<span class="wll-box-sm${spread[0] ? ' filled' : ''}"></span><span style="font-size:6pt; color:#888;">Whispered</span>
							<span class="wll-box-sm${spread[1] ? ' filled' : ''}" style="margin-left:4px;"></span><span style="font-size:6pt; color:#888;">Spread</span>
							<span class="wll-box-sm${spread[2] ? ' filled' : ''}" style="margin-left:4px;"></span><span style="font-size:6pt; color:#888;">Exposed</span>
						</div>
					</div>
				</div>
				${fieldValShort('Containment Cost', String((s.weight || 0) + (spread.filter(Boolean).length)))}
				${fieldVal('Contacts Carrying', s.contacts || '')}
				${fieldVal('Notes', s.containmentPlan || '')}
			</div>`;
	}).join('');
	const blankSecrets = Array(Math.max(0, 2 - (ch.secrets || []).length)).fill(`
		<div class="wll-secret-card">
			${fieldVal('Secret', '')}
			<div class="wll-row" style="gap:8px; margin-top:3px;">
				<div style="flex:1;"><div class="wll-sub-label">Weight (1-3)</div><div style="display:flex; gap:3px; margin-top:2px;">${dots(0, 3)}</div></div>
				<div style="flex:2;"><div class="wll-sub-label">Spread</div><div style="display:flex; align-items:center; gap:2px; margin-top:2px;">
					<span class="wll-box-sm"></span><span style="font-size:6pt; color:#888;">Whispered</span>
					<span class="wll-box-sm" style="margin-left:4px;"></span><span style="font-size:6pt; color:#888;">Spread</span>
					<span class="wll-box-sm" style="margin-left:4px;"></span><span style="font-size:6pt; color:#888;">Exposed</span>
				</div></div>
			</div>
			${fieldValShort('Containment Cost', '')}
			${fieldVal('Contacts Carrying', '')}
			${fieldVal('Notes', '')}
		</div>`).join('');

	const secrets = `
		<div class="wll-panel">
			<div class="wll-section-label">Secrets</div>
			<div style="font-size:6.5pt; color:#777; margin-bottom:4px;">Containment Cost = Weight + current Spread (paid per arc)</div>
			${secretCards}${blankSecrets}
		</div>`;

	// Milestones
	function milestoneCol(title, milestones) {
		const rows = (milestones || []).map((m)=>{
			const check = m.completed ? '&#10003;' : '';
			return `<div class="wll-milestone-row"><span class="wll-check-box">${check}</span><div class="wll-writein-value">${esc(m.text || '')}</div></div>`;
		}).join('');
		const blanks = Array(Math.max(0, 4 - (milestones || []).length)).fill(
			'<div class="wll-milestone-row"><span class="wll-check-box"></span><div class="wll-writein-value"></div></div>'
		).join('');
		return `<div style="flex:1;"><div class="wll-sub-label" style="margin-bottom:3px;">${title}</div>${rows}${blanks}</div>`;
	}

	const milestones = `
		<div class="wll-panel">
			<div class="wll-section-label">Milestones</div>
			<div class="wll-row" style="gap:8px;">
				${milestoneCol('Conviction Milestones', ch.convictionMilestones)}
				${milestoneCol('Path Milestones', ch.pathMilestones)}
			</div>
		</div>`;

	// Corruption
	const corruption = `
		<div class="wll-panel">
			<div class="wll-section-label">Corruption</div>
			<div style="display:flex; align-items:center; gap:8px;">
				<span class="wll-sub-label">Current</span>
				${boxes(10, ch.corruption || 0, 'sm')}
			</div>
			${fieldVal('Hearth Trigger', ch.hearthTrigger || '')}
		</div>`;

	// Equipment
	const equipItems = (ch.equipment || []).map((item)=>
		`<div class="wll-writein-row"><div class="wll-writein-value">${esc(item.name || '')}</div></div>`
	).join('');
	const equipBlanks = Array(Math.max(0, 8 - (ch.equipment || []).length)).fill(
		'<div class="wll-writein-row"><div class="wll-writein-value"></div></div>'
	).join('');

	const equipment = `
		<div class="wll-panel">
			<div class="wll-section-label">Equipment &amp; Gear</div>
			${equipItems}${equipBlanks}
		</div>`;

	// Notes
	const notesText = esc(ch.notes || '').replace(/\n/g, '<br>');
	const noteLines = Array(6).fill('<div class="wll-note-line"></div>').join('');
	const notes = `
		<div class="wll-panel" style="flex:1;">
			<div class="wll-section-label">Notes</div>
			${ch.notes ? `<div style="font-size:7.5pt; padding:2px;">${notesText}</div>` : noteLines}
		</div>`;

	return `<div class="wll-sheet${bwClass}">
		<div class="wll-page-title">
			Cascade <span>${esc(ch.name || '')}</span>
			<img src="/assets/lolgo_200x200_black.png" class="wll-logo" alt="" />
		</div>
		<div class="wll-row" style="gap:6px; flex:1;">
			<div class="wll-col" style="flex:3; gap:5px;">
				${connections}
				${secrets}
			</div>
			<div class="wll-col" style="flex:1; gap:5px;">
				${milestones}
				${corruption}
				${equipment}
				${notes}
			</div>
		</div>
		<div style="text-align:right; font-size:6pt; color:#aaa; margin-top:4px;">Cascade \u00a9 Mount Ogden Gaming Company</div>
	</div>`;
}
