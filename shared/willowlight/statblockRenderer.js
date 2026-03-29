// ── Willowlight Engine Stat Block Renderer (compact) ──────────────────
// Renders the compact stat block view suitable for embedding in books.
// Omits character-only fields (luck, corruption, milestones, etc.).

import {
	ATTRIBUTE_GROUPS, ATTRIBUTE_LABELS,
	HEALTH_TRACKS, DOMAIN_LABELS,
	getTrackBoxes, getDefTN
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

function renderHealthTracks(sb) {
	const attrs = sb.attributes || {};
	const rows = HEALTH_TRACKS.map((track)=>{
		const attrVal = attrs[track.baseAttr] || 0;
		const boxes = track.key === 'vitality' ? (sb.vitalityOverride ?? getTrackBoxes(track.base, attrVal))
			: track.key === 'willpower' ? (sb.willpowerOverride ?? getTrackBoxes(track.base, attrVal))
				: (sb.composureOverride ?? getTrackBoxes(track.base, attrVal));
		const defTN = getDefTN(attrVal);

		let boxHtml = '';
		for (let i = 0; i < boxes; i++) {
			boxHtml += '<span class="wl-health-box"></span>';
		}

		return `<div class="wl-health-track">
			<div class="wl-track-header">
				<span class="wl-track-name">${track.label}</span>
				<span class="wl-track-def">DEF TN ${defTN}</span>
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
		const domain = DOMAIN_LABELS[a.domain] || a.domain || '—';
		return `<tr>
			<td>${esc(a.name)}</td>
			<td>${esc(domain)}</td>
			<td>${esc(a.attribute || '—')}</td>
			<td>${esc(a.skill || '—')}${a.bonus ? ` +${a.bonus}` : ''}</td>
			<td>${a.modifier ?? '—'}</td>
			<td>${esc(a.rating || '—')}</td>
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

export function render(sb, layout = 'narrow', opts = {}) {
	const name = esc(sb.name) || 'Unnamed';
	const subtitle = [sb.conviction, sb.path].filter(Boolean).join(' \u2014 ');
	const bwClass = opts.bw ? ' wl-bw' : '';

	let html = `<div class="wl-statblock ${layout === 'wide' ? 'wl-wide' : 'wl-narrow'}${bwClass}">`;
	html += `<div class="wl-header"><div class="wl-name">${name}</div>`;
	if(subtitle) html += `<div class="wl-subtitle">${esc(subtitle)}</div>`;
	if(sb.shortDescription) html += `<div class="wl-description">${esc(sb.shortDescription)}</div>`;
	html += `</div>`;
	html += `<div class="wl-divider"></div>`;
	html += renderAttributes(sb.attributes);
	html += `<div class="wl-divider"></div>`;
	html += renderScale(sb.scale);
	html += renderHealthTracks(sb);
	html += renderSkills(sb);
	html += renderAttacks(sb.attacks);
	html += renderDotList('Edges', sb.edges);
	html += renderDotList('Aspects', sb.aspects);
	html += renderDotList('Burdens', sb.burdens);

	if(sb.notes) {
		html += `<div class="wl-section"><div class="wl-section-title">Notes</div><div class="wl-notes">${esc(sb.notes)}</div></div>`;
	}

	html += `</div>`;
	return html;
}
