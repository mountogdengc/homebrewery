// ── BRP Portrait Character Sheet Renderer ──────────────────────────────
// Renders a portrait (8.5×11) character sheet as two embeddable pages.
// Follows the Willowlight portrait sheet pattern.

import {
	CHAR_LABELS, CHARACTERISTICS,
	getDamageBonus, getHitPoints, getMagicPoints, HIT_LOCATION_NAMES
} from './constants.js';
import { buildSkillList, SKILL_CATEGORY_ORDER, resolveBase } from './defaultSkills.js';

export const BLANK_CHARACTER = {
	name: '', player: '', occupation: '', category: 'Human', subtype: '',
	description: '', age: '', gender: '', nationality: '', appearance: '', background: '',
	characterType: 'character',
	characteristics: { str: 10, con: 10, siz: 10, int: 10, pow: 10, dex: 10, cha: 10 },
	hitPointsOverride: null, magicPointsOverride: null, damageBonusOverride: null,
	moveRate: 8, armorPoints: 0, armorDescription: '',
	sanity: null, sanityMax: null,
	skills: [], weapons: [], spells: [], traits: [], hitLocations: [],
	passions: [], allegiances: [], equipment: [], wealth: '',
	experiencePoints: 0, experienceChecks: [], notes: ''
};

const esc = (s)=>(s ?? '').toString()
	.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function fieldVal(label, value) {
	const display = esc(value) || '&nbsp;';
	return `<div class="brpp-field-row"><span class="brpp-field-label">${label}</span><div class="brpp-field-value">${display}</div></div>`;
}

function fieldValShort(label, value) {
	const display = esc(value) || '&nbsp;';
	return `<div class="brpp-field-row"><span class="brpp-field-label">${label}</span><div class="brpp-field-value-short">${display}</div></div>`;
}

function boxes(count, filled = 0, size = '') {
	const cls = size === 'sm' ? 'brpp-box-sm' : 'brpp-box';
	let html = '';
	for (let i = 0; i < count; i++) {
		html += `<span class="${cls}${i < filled ? ' filled' : ''}"></span>`;
	}
	return html;
}

function pctBar(label, value) {
	return `<span class="brpp-skill-entry"><span class="brpp-skill-name">${esc(label)}</span><span class="brpp-skill-pct">${value}%</span></span>`;
}

// ── PAGE 1 ───────────────────────────────────────────────────────────
// Identity, Characteristics, Derived Values, Skills (all with bases)

export function renderPage1(ch, layout = 'narrow', opts = {}) {
	const chars = ch.characteristics || {};
	const bwClass = opts.bw ? ' brpp-bw' : '';

	// Identity Panel
	const identity = `
		<div class="brpp-panel">
			<div class="brpp-section-label">Identity</div>
			<div class="brpp-row" style="gap:8px; flex-wrap:wrap;">
				${fieldVal('Name', ch.name)}
				${fieldVal('Player', ch.player)}
			</div>
			<div class="brpp-row" style="gap:8px; flex-wrap:wrap; margin-top:2px;">
				${fieldVal('Occupation', ch.occupation)}
				${fieldVal('Type', [ch.category, ch.subtype].filter(Boolean).join(', '))}
			</div>
			<div class="brpp-row" style="gap:8px; flex-wrap:wrap; margin-top:2px;">
				${fieldValShort('Age', ch.age)}
				${fieldValShort('Gender', ch.gender)}
				${fieldValShort('Nationality', ch.nationality)}
			</div>
			${ch.appearance ? `<div style="margin-top:2px;">${fieldVal('Appearance', ch.appearance)}</div>` : ''}
		</div>`;

	// Characteristics
	const charCells = CHARACTERISTICS.map((c)=>{
		const val = chars[c] ?? 10;
		return `<div class="brpp-char-cell">
			<div class="brpp-char-label">${CHAR_LABELS[c]}</div>
			<div class="brpp-char-value">${val}</div>
		</div>`;
	}).join('');

	const characteristics = `
		<div class="brpp-panel">
			<div class="brpp-section-label">Characteristics</div>
			<div class="brpp-char-grid">${charCells}</div>
		</div>`;

	// Derived Values
	const hp  = ch.hitPointsOverride   ?? getHitPoints(chars.con, chars.siz);
	const mp  = ch.magicPointsOverride ?? getMagicPoints(chars.pow);
	const db  = ch.damageBonusOverride || getDamageBonus(chars.str, chars.siz);
	const mv  = ch.moveRate ?? 8;
	const ap  = ch.armorPoints ?? 0;
	const san = ch.sanity ?? (chars.pow || 0) * 5;
	const sanMax = ch.sanityMax ?? 99;

	const derivedItems = [
		{ label: 'Hit Points', value: hp, formula: '(CON+SIZ)/2', boxes: true },
		{ label: 'Magic Points', value: mp, formula: 'POW', boxes: true },
		{ label: 'Damage Bonus', value: db, formula: 'STR+SIZ table' },
		{ label: 'Move', value: mv },
	];

	let derivedHtml = derivedItems.map((d)=>{
		let content = `<span class="brpp-derived-val">${esc(String(d.value))}</span>`;
		if(d.boxes) {
			content += `<span class="brpp-derived-boxes">${boxes(Math.min(d.value, 30), 0, 'sm')}</span>`;
		}
		if(d.formula) {
			content += `<span class="brpp-derived-formula">${d.formula}</span>`;
		}
		return `<div class="brpp-derived-row"><span class="brpp-derived-label">${d.label}</span>${content}</div>`;
	}).join('');

	// Armor row
	const armorText = ch.armorDescription ? ` (${esc(ch.armorDescription)})` : '';
	derivedHtml += `<div class="brpp-derived-row"><span class="brpp-derived-label">Armor</span><span class="brpp-derived-val">${ap} AP${armorText}</span></div>`;

	// Sanity row (if non-zero or character type)
	if(ch.characterType === 'character' || ch.sanity !== null) {
		derivedHtml += `<div class="brpp-derived-row">
			<span class="brpp-derived-label">Sanity</span>
			<span class="brpp-derived-val">${san}</span>
			<span class="brpp-derived-formula">POW×5 (max ${sanMax})</span>
		</div>`;
	}

	const derived = `
		<div class="brpp-panel">
			<div class="brpp-section-label">Derived Values</div>
			${derivedHtml}
		</div>`;

	// Skills — Full list grouped by category
	const allSkills = buildSkillList(ch.skills, chars);
	const grouped = {};
	for (const cat of SKILL_CATEGORY_ORDER) grouped[cat] = [];
	for (const s of allSkills) {
		const cat = s.category || 'Other';
		if(!grouped[cat]) grouped[cat] = [];
		grouped[cat].push(s);
	}

	let skillsHtml = '';
	for (const cat of [...SKILL_CATEGORY_ORDER, 'Other']) {
		const skills = grouped[cat];
		if(!skills || skills.length === 0) continue;

		const entries = skills.map((s)=>{
			const spec = s.specialty ? ` (${esc(s.specialty)})` : '';
			const trainedCls = s.trained ? ' brpp-skill-trained' : '';
			const xpCheck = (ch.experienceChecks || []).includes(s.name) ? ' brpp-skill-xp' : '';
			return `<span class="brpp-skill-entry${trainedCls}${xpCheck}">
				<span class="brpp-skill-name">${esc(s.name)}${spec}</span>
				<span class="brpp-skill-base">${s.base}</span>
				<span class="brpp-skill-pct">${s.value}%</span>
			</span>`;
		}).join('');

		skillsHtml += `<div class="brpp-skill-cat">
			<div class="brpp-skill-cat-title">${esc(cat)}</div>
			<div class="brpp-skill-cat-list">${entries}</div>
		</div>`;
	}

	const skills = `
		<div class="brpp-panel">
			<div class="brpp-section-label">Skills</div>
			<div style="font-size:6.5pt; color:#777; margin-bottom:3px;">Bold = trained &middot; Base shown in parenthesis</div>
			<div class="brpp-skill-columns">${skillsHtml}</div>
		</div>`;

	return `<div class="brpp-sheet${bwClass}">
		<div class="brpp-page-title">Basic Roleplaying <span>${esc(ch.name || '')}</span></div>
		<div class="brpp-col" style="gap:5px;">
			${identity}
			${characteristics}
			${derived}
			${skills}
		</div>
		<div style="text-align:right; font-size:6pt; color:#aaa; margin-top:4px;">BRP \u00a9 Chaosium Inc. \u00b7 Character sheet by Mount Ogden Gaming Company</div>
	</div>`;
}

// ── PAGE 2 ───────────────────────────────────────────────────────────
// Weapons, Spells, Hit Locations, Passions, Allegiances, Equipment, Background, Notes

export function renderPage2(ch, layout = 'narrow', opts = {}) {
	const chars = ch.characteristics || {};
	const bwClass = opts.bw ? ' brpp-bw' : '';

	// Weapons
	const weaponRows = (ch.weapons || []).map((w)=>`<tr>
		<td>${esc(w.name)}</td>
		<td>${w.skill ?? ''}%</td>
		<td>${esc(w.damage)}</td>
		<td>${esc(w.range || '\u2014')}</td>
		<td>${w.rate ?? '\u2014'}</td>
		<td>${w.parry ?? '\u2014'}%</td>
		<td>${w.hp ?? '\u2014'}</td>
	</tr>`).join('');
	const blankWeaponRows = Array(Math.max(0, 4 - (ch.weapons || []).length)).fill(
		'<tr><td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td><td></td></tr>'
	).join('');

	const weapons = `
		<div class="brpp-panel">
			<div class="brpp-section-label">Weapons</div>
			<table class="brpp-weapons-table">
				<thead><tr>
					<th>Weapon</th><th>Skill</th><th>Damage</th><th>Range</th><th>Rate</th><th>Parry</th><th>HP</th>
				</tr></thead>
				<tbody>${weaponRows}${blankWeaponRows}</tbody>
			</table>
		</div>`;

	// Hit Locations
	let hitLocHtml = '';
	if((ch.hitLocations || []).length > 0) {
		const baseHP = getHitPoints(chars.con, chars.siz);
		const locRows = ch.hitLocations.map((loc)=>{
			const hp = loc.hpOverride ?? baseHP;
			const ap = loc.armorOverride ?? (ch.armorPoints || 0);
			return `<tr>
				<td>${esc(loc.name)}</td>
				<td>${hp}</td>
				<td>${ap}</td>
				<td>${boxes(Math.min(hp, 12), 0, 'sm')}</td>
			</tr>`;
		}).join('');
		hitLocHtml = `
			<div class="brpp-panel">
				<div class="brpp-section-label">Hit Locations</div>
				<table class="brpp-hitloc-table">
					<thead><tr><th>Location</th><th>HP</th><th>AP</th><th>Current</th></tr></thead>
					<tbody>${locRows}</tbody>
				</table>
			</div>`;
	}

	// Spells & Powers
	let spellsHtml = '';
	if((ch.spells || []).length > 0) {
		const spellRows = ch.spells.map((s)=>{
			const cost = s.cost ? ` (${esc(s.cost)})` : '';
			const desc = s.description ? ` \u2014 ${esc(s.description)}` : '';
			return `<div class="brpp-spell-row"><strong>${esc(s.name)}</strong>${cost}${desc}</div>`;
		}).join('');
		spellsHtml = `
			<div class="brpp-panel">
				<div class="brpp-section-label">Spells &amp; Powers</div>
				${spellRows}
			</div>`;
	}

	// Special Abilities / Traits
	let traitsHtml = '';
	if((ch.traits || []).length > 0) {
		const traitRows = ch.traits.map((t)=>{
			return `<div class="brpp-trait-row"><strong>${esc(t.name)}.</strong> ${esc(t.description)}</div>`;
		}).join('');
		traitsHtml = `
			<div class="brpp-panel">
				<div class="brpp-section-label">Special Abilities</div>
				${traitRows}
			</div>`;
	}

	// Passions
	let passionsHtml = '';
	const passions = ch.passions || [];
	if(passions.length > 0 || ch.characterType === 'character') {
		const passionRows = passions.map((p)=>{
			return `<div class="brpp-passion-row">
				<span class="brpp-passion-name">${esc(p.name)}</span>
				<span class="brpp-passion-val">${p.value || 0}%</span>
			</div>`;
		}).join('');
		const blankPassions = Array(Math.max(0, 4 - passions.length)).fill(
			'<div class="brpp-passion-row"><span class="brpp-passion-name"></span><span class="brpp-passion-val"></span></div>'
		).join('');
		passionsHtml = `
			<div class="brpp-panel">
				<div class="brpp-section-label">Passions</div>
				${passionRows}${blankPassions}
			</div>`;
	}

	// Allegiances
	let allegiancesHtml = '';
	const allegiances = ch.allegiances || [];
	if(allegiances.length > 0 || ch.characterType === 'character') {
		const allegianceRows = allegiances.map((a)=>{
			return `<div class="brpp-passion-row">
				<span class="brpp-passion-name">${esc(a.name)}</span>
				<span class="brpp-passion-val">${a.value || 0}</span>
			</div>`;
		}).join('');
		const blankAllegiances = Array(Math.max(0, 3 - allegiances.length)).fill(
			'<div class="brpp-passion-row"><span class="brpp-passion-name"></span><span class="brpp-passion-val"></span></div>'
		).join('');
		allegiancesHtml = `
			<div class="brpp-panel">
				<div class="brpp-section-label">Allegiances</div>
				${allegianceRows}${blankAllegiances}
			</div>`;
	}

	// Equipment
	const equipItems = (ch.equipment || []).map((item)=>{
		const qty = (item.quantity && item.quantity > 1) ? ` (×${item.quantity})` : '';
		const note = item.notes ? ` — ${esc(item.notes)}` : '';
		return `<div class="brpp-equip-row">${esc(item.name || '')}${qty}${note}</div>`;
	}).join('');
	const blankEquip = Array(Math.max(0, 10 - (ch.equipment || []).length)).fill(
		'<div class="brpp-equip-row">&nbsp;</div>'
	).join('');

	const equipment = `
		<div class="brpp-panel">
			<div class="brpp-section-label">Equipment &amp; Gear</div>
			${ch.wealth ? `<div class="brpp-equip-row" style="font-weight:600; margin-bottom:3px;">Wealth: ${esc(ch.wealth)}</div>` : ''}
			<div style="column-count:2; column-gap:8px;">${equipItems}${blankEquip}</div>
		</div>`;

	// Experience
	let xpHtml = '';
	if(ch.characterType === 'character') {
		xpHtml = `
			<div class="brpp-panel">
				<div class="brpp-section-label">Experience</div>
				<div class="brpp-row" style="gap:10px;">
					${fieldVal('Experience Points', String(ch.experiencePoints || 0))}
				</div>
				${(ch.experienceChecks || []).length > 0
					? `<div style="margin-top:3px;"><span class="brpp-sub-label">Skill Checks:</span> ${ch.experienceChecks.map((s)=>esc(s)).join(', ')}</div>`
					: ''}
			</div>`;
	}

	// Background
	let backgroundHtml = '';
	if(ch.background) {
		const bgText = esc(ch.background).replace(/\n/g, '<br>');
		backgroundHtml = `
			<div class="brpp-panel">
				<div class="brpp-section-label">Background</div>
				<div style="font-size:7.5pt; padding:2px; line-height:1.4;">${bgText}</div>
			</div>`;
	}

	// Notes
	const notesText = esc(ch.notes || '').replace(/\n/g, '<br>');
	const noteLines = Array(6).fill('<div class="brpp-note-line"></div>').join('');
	const notes = `
		<div class="brpp-panel" style="flex:1;">
			<div class="brpp-section-label">Notes</div>
			${ch.notes ? `<div style="font-size:7.5pt; padding:2px;">${notesText}</div>` : noteLines}
		</div>`;

	return `<div class="brpp-sheet${bwClass}">
		<div class="brpp-page-title">Basic Roleplaying <span>${esc(ch.name || '')} \u2014 continued</span></div>
		<div class="brpp-col" style="gap:5px;">
			${weapons}
			${hitLocHtml}
			${spellsHtml}
			${traitsHtml}
			<div class="brpp-row" style="gap:5px;">
				<div style="flex:1;">${passionsHtml}</div>
				<div style="flex:1;">${allegiancesHtml}</div>
			</div>
			${equipment}
			${xpHtml}
			${backgroundHtml}
			${notes}
		</div>
		<div style="text-align:right; font-size:6pt; color:#aaa; margin-top:4px;">BRP \u00a9 Chaosium Inc. \u00b7 Character sheet by Mount Ogden Gaming Company</div>
	</div>`;
}
