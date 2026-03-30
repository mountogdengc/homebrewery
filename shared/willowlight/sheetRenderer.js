// ── Willowlight Engine Character Sheet Renderer ──────────────────────
// Renders the full character sheet view with all fields.

import {
	ATTRIBUTE_GROUPS, ATTRIBUTE_LABELS,
	HEALTH_TRACKS, DOMAIN_LABELS,
	getTrackBoxes
} from './constants.js';

const esc = (s)=>(s ?? '').toString()
	.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function renderDots(value, max = 5) {
	let dots = '';
	for (let i = 1; i <= max; i++) {
		dots += i <= value
			? '<span class="wl-dot wl-dot-filled"></span>'
			: '<span class="wl-dot wl-dot-empty"></span>';
	}
	return `<span class="wl-dots">${dots}</span>`;
}

function renderBoxes(filled, total) {
	let html = '';
	for (let i = 0; i < total; i++) {
		html += i < filled
			? '<span class="wl-health-box wl-box-filled"></span>'
			: '<span class="wl-health-box"></span>';
	}
	return html;
}

function renderAttributes(attrs) {
	let html = '';
	for (const [groupKey, group] of Object.entries(ATTRIBUTE_GROUPS)) {
		html += `<div class="wl-attr-group">`;
		html += `<div class="wl-attr-group-label">${group.label}</div>`;
		for (const attr of group.attrs) {
			const val = attrs?.[attr] ?? 0;
			html += `<div class="wl-attr-row">
				<span class="wl-attr-name">${ATTRIBUTE_LABELS[attr]}</span>
				${renderDots(val)}
			</div>`;
		}
		html += `</div>`;
	}
	return `<div class="wl-attributes">${html}</div>`;
}

function renderScale(scale) {
	const phys = esc(scale?.physical || '\u2014');
	const ment = esc(scale?.mental || '\u2014');
	const soc  = esc(scale?.social || '\u2014');
	return `<div class="wl-section"><div class="wl-section-title">Scale</div>
		<div class="wl-scale-grid">
			<div class="wl-scale-col"><div class="wl-scale-label">Physical</div><div class="wl-scale-value">${phys}</div></div>
			<div class="wl-scale-col"><div class="wl-scale-label">Mental</div><div class="wl-scale-value">${ment}</div></div>
			<div class="wl-scale-col"><div class="wl-scale-label">Social</div><div class="wl-scale-value">${soc}</div></div>
		</div></div>`;
}

function renderHealthTracks(sb) {
	const attrs = sb.attributes || {};
	const rows = HEALTH_TRACKS.map((track)=>{
		const attrVal = attrs[track.baseAttr] || 0;
		const boxes = track.key === 'vitality' ? (sb.vitalityOverride ?? getTrackBoxes(track.base, attrVal))
			: track.key === 'willpower' ? (sb.willpowerOverride ?? getTrackBoxes(track.base, attrVal))
				: (sb.composureOverride ?? getTrackBoxes(track.base, attrVal));
		let boxHtml = '';
		for (let i = 0; i < boxes; i++) {
			boxHtml += '<span class="wl-health-box"></span>';
		}

		return `<div class="wl-health-track">
			<div class="wl-track-header">
				<span class="wl-track-name">${track.label}</span>
				<span class="wl-track-def">${boxes} boxes</span>
			</div>
			<div class="wl-track-boxes">${boxHtml}</div>
		</div>`;
	}).join('');

	return `<div class="wl-section"><div class="wl-section-title">Health Tracks</div>${rows}</div>`;
}

function renderSkills(sb) {
	const items = [];
	if(sb.vocation?.name) {
		const bonus = sb.vocation.bonus ? ` +${sb.vocation.bonus}` : '';
		items.push(`<div class="wl-skill-tier"><span class="wl-skill-tier-label">Vocation</span><span class="wl-skill-entry"><strong>${esc(sb.vocation.name)}</strong>${bonus}</span></div>`);
	}
	if(sb.interests?.length > 0) {
		const entries = sb.interests.map((s)=>`<strong>${esc(s.name)}</strong>`).join(', ');
		items.push(`<div class="wl-skill-tier"><span class="wl-skill-tier-label">Interests (+2)</span><span class="wl-skill-entry">${entries}</span></div>`);
	}
	if(sb.hobbies?.length > 0) {
		const entries = sb.hobbies.map((s)=>`<strong>${esc(s.name)}</strong>`).join(', ');
		items.push(`<div class="wl-skill-tier"><span class="wl-skill-tier-label">Hobbies (+1)</span><span class="wl-skill-entry">${entries}</span></div>`);
	}
	if(items.length === 0) return '';
	return `<div class="wl-section"><div class="wl-section-title">Skills</div>${items.join('')}</div>`;
}

function renderAttacks(attacks) {
	if(!attacks || attacks.length === 0) return '';
	const rows = attacks.map((a)=>{
		const domain = DOMAIN_LABELS[a.domain] || a.domain || '\u2014';
		return `<tr>
			<td>${esc(a.name)}</td>
			<td>${esc(domain)}</td>
			<td>${esc(a.attribute || '\u2014')}</td>
			<td>${esc(a.skill || '\u2014')}${a.bonus ? ` +${a.bonus}` : ''}</td>
			<td>${a.modifier ?? '\u2014'}</td>
			<td>${esc(a.rating || '\u2014')}</td>
		</tr>`;
	}).join('');
	return `<div class="wl-section"><div class="wl-section-title">Attacks</div>
		<table class="wl-attacks">
			<thead><tr><th>Name</th><th>Domain</th><th>Attr</th><th>Skill</th><th>Mod</th><th>Rating</th></tr></thead>
			<tbody>${rows}</tbody>
		</table></div>`;
}

function renderDotList(title, items) {
	if(!items || items.length === 0) return '';
	const rows = items.map((item)=>{
		return `<div class="wl-dot-row">
			<span class="wl-dot-name">${esc(item.name)}</span>
			${renderDots(item.dots || 0)}
		</div>`;
	}).join('');
	return `<div class="wl-section"><div class="wl-section-title">${esc(title)}</div>${rows}</div>`;
}

// ── Character-specific sections ───────────────────────────────────────

function renderLuckCorruptionXP(ch) {
	let html = `<div class="wl-section"><div class="wl-section-title">Luck / Corruption / XP</div>`;
	html += `<div class="wl-resource-grid">`;
	html += `<div class="wl-resource-col"><div class="wl-resource-label">Luck Rating</div><div class="wl-resource-value">${renderDots(ch.luckRating || 0, 3)}</div></div>`;
	html += `<div class="wl-resource-col"><div class="wl-resource-label">Luck Tokens</div><div class="wl-resource-value">${renderBoxes(0, ch.luckTokens || 3)}</div></div>`;
	html += `<div class="wl-resource-col"><div class="wl-resource-label">Corruption</div><div class="wl-resource-value">${renderBoxes(ch.corruption || 0, 10)}</div></div>`;
	html += `<div class="wl-resource-col"><div class="wl-resource-label">Unspent XP</div><div class="wl-resource-value wl-resource-number">${ch.unspentXP ?? 0}</div></div>`;
	html += `</div></div>`;
	return html;
}

function renderWealth(ch) {
	return `<div class="wl-section"><div class="wl-section-title">Wealth</div>
		<div class="wl-resource-number" style="font-size:16px;padding:4px 0;">${ch.wealthPoints ?? 0} Wealth Points</div></div>`;
}

function renderMilestones(ch) {
	const renderList = (title, milestones)=>{
		const rows = (milestones || []).map((m)=>{
			const check = m.completed ? '&#9745;' : '&#9744;';
			return `<div class="wl-milestone-row">${check} ${esc(m.text) || '<em>—</em>'}</div>`;
		}).join('');
		return `<div class="wl-milestone-col"><div class="wl-milestone-heading">${title}</div>${rows}</div>`;
	};
	return `<div class="wl-section"><div class="wl-section-title">Milestones</div>
		<div class="wl-milestone-grid">
			${renderList('Conviction', ch.convictionMilestones)}
			${renderList('Path', ch.pathMilestones)}
		</div></div>`;
}

function renderContacts(contacts) {
	if(!contacts || contacts.length === 0) return '';
	const rows = contacts.map((c)=>{
		return `<tr>
			<td>${esc(c.name)}</td>
			<td>${renderDots(c.health || 0, 5)}</td>
			<td>${esc(c.type || '\u2014')}</td>
			<td>${esc(c.note || '')}</td>
		</tr>`;
	}).join('');
	return `<div class="wl-section"><div class="wl-section-title">Contacts / Enemies / Allies</div>
		<table class="wl-attacks">
			<thead><tr><th>Name</th><th>Health</th><th>Type</th><th>Note</th></tr></thead>
			<tbody>${rows}</tbody>
		</table></div>`;
}

function renderSecrets(secrets) {
	if(!secrets || secrets.length === 0) return '';
	const items = secrets.map((s)=>{
		const weightDots = renderDots(s.weight || 0, 3);
		const spreadBoxes = (s.spread || [false, false, false]).map((filled)=>{
			return filled ? '<span class="wl-health-box wl-box-filled"></span>' : '<span class="wl-health-box"></span>';
		}).join('');
		return `<div class="wl-secret">
			<div class="wl-secret-header">
				<strong>${esc(s.name) || 'Unnamed Secret'}</strong>
				<span class="wl-secret-meta">Weight ${weightDots} &nbsp; Spread ${spreadBoxes}</span>
			</div>
			${s.containmentPlan ? `<div class="wl-secret-plan">${esc(s.containmentPlan)}</div>` : ''}
			${s.contacts ? `<div class="wl-secret-contacts"><em>Contacts:</em> ${esc(s.contacts)}</div>` : ''}
		</div>`;
	}).join('');
	return `<div class="wl-section"><div class="wl-section-title">Secrets</div>${items}</div>`;
}

// ── Main render ───────────────────────────────────────────────────────

export function render(ch, layout = 'narrow', opts = {}) {
	const name = esc(ch.name) || 'Unnamed';
	const subtitle = [ch.conviction, ch.path].filter(Boolean).join(' \u2014 ');
	const bwClass = opts.bw ? ' wl-bw' : '';

	let html = `<div class="wl-statblock wl-character-sheet ${layout === 'wide' ? 'wl-wide' : 'wl-narrow'}${bwClass}">`;

	// Header
	html += `<div class="wl-header"><div class="wl-name">${name}</div>`;
	if(ch.player) html += `<div class="wl-player">Player: ${esc(ch.player)}</div>`;
	if(subtitle) html += `<div class="wl-subtitle">${esc(subtitle)}</div>`;
	if(ch.shortDescription) html += `<div class="wl-description">${esc(ch.shortDescription)}</div>`;
	html += `</div>`;

	html += `<div class="wl-divider"></div>`;
	html += renderAttributes(ch.attributes);
	html += `<div class="wl-divider"></div>`;
	html += renderScale(ch.scale);
	html += renderHealthTracks(ch);
	html += renderLuckCorruptionXP(ch);
	html += renderWealth(ch);
	html += renderSkills(ch);
	html += renderAttacks(ch.attacks);
	html += renderDotList('Edges', ch.edges);
	html += renderDotList('Aspects', ch.aspects);
	html += renderDotList('Burdens', ch.burdens);
	html += renderMilestones(ch);
	html += renderContacts(ch.contacts);
	html += renderSecrets(ch.secrets);

	if(ch.notes) {
		html += `<div class="wl-section"><div class="wl-section-title">Notes</div><div class="wl-notes">${esc(ch.notes)}</div></div>`;
	}

	html += `</div>`;
	return html;
}
