// ── BRP Statblock Renderer ────────────────────────────────────────────
import {
	CHAR_LABELS, CHARACTERISTICS,
	getDamageBonus, getHitPoints, getMagicPoints
} from './constants.js';

const esc = (s)=>(s ?? '').toString()
	.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function renderCharacteristics(chars) {
	const cells = CHARACTERISTICS.map((c)=>{
		const val = chars?.[c] ?? 10;
		return `<td><div class="brp-char-label">${CHAR_LABELS[c]}</div><div class="brp-char-value">${val}</div></td>`;
	}).join('');
	return `<table class="brp-chars"><tr>${cells}</tr></table>`;
}

function renderDerived(sb) {
	const chars = sb.characteristics || {};
	const hp  = sb.hitPointsOverride   ?? getHitPoints(chars.con, chars.siz);
	const mp  = sb.magicPointsOverride ?? getMagicPoints(chars.pow);
	const db  = sb.damageBonusOverride || getDamageBonus(chars.str, chars.siz);
	const mv  = sb.moveRate ?? 8;
	const ap  = sb.armorPoints ?? 0;

	let rows = '';
	rows += `<tr><td class="brp-derived-label">Hit Points</td><td class="brp-derived-value">${hp}</td></tr>`;
	rows += `<tr><td class="brp-derived-label">Magic Points</td><td class="brp-derived-value">${mp}</td></tr>`;
	rows += `<tr><td class="brp-derived-label">Damage Bonus</td><td class="brp-derived-value">${esc(db)}</td></tr>`;
	rows += `<tr><td class="brp-derived-label">Move</td><td class="brp-derived-value">${mv}</td></tr>`;
	if(ap > 0 || sb.armorDescription) {
		const armorText = sb.armorDescription ? ` (${esc(sb.armorDescription)})` : '';
		rows += `<tr><td class="brp-derived-label">Armor</td><td class="brp-derived-value">${ap} AP${armorText}</td></tr>`;
	}
	return `<table class="brp-derived">${rows}</table>`;
}

function renderSkills(skills) {
	if(!skills || skills.length === 0) return '';
	const items = skills.map((s)=>`<span class="brp-skill"><strong>${esc(s.name)}</strong> ${s.value}%</span>`).join(', ');
	return `<div class="brp-section"><div class="brp-section-title">Skills</div><div class="brp-skill-list">${items}</div></div>`;
}

function renderWeapons(weapons) {
	if(!weapons || weapons.length === 0) return '';
	let rows = weapons.map((w)=>{
		return `<tr>
			<td>${esc(w.name)}</td>
			<td>${w.skill ?? ''}%</td>
			<td>${esc(w.damage)}</td>
			<td>${esc(w.range || '—')}</td>
			<td>${w.rate ?? '—'}</td>
			<td>${w.parry ?? '—'}%</td>
			<td>${w.hp ?? '—'}</td>
		</tr>`;
	}).join('');
	return `<div class="brp-section"><div class="brp-section-title">Weapons</div>
		<table class="brp-weapons">
			<thead><tr><th>Weapon</th><th>Skill</th><th>Damage</th><th>Range</th><th>Rate</th><th>Parry</th><th>HP</th></tr></thead>
			<tbody>${rows}</tbody>
		</table></div>`;
}

function renderSpells(spells) {
	if(!spells || spells.length === 0) return '';
	const items = spells.map((s)=>{
		const cost = s.cost ? ` (${esc(s.cost)})` : '';
		const desc = s.description ? ` — ${esc(s.description)}` : '';
		return `<div class="brp-spell"><strong>${esc(s.name)}</strong>${cost}${desc}</div>`;
	}).join('');
	return `<div class="brp-section"><div class="brp-section-title">Spells &amp; Powers</div>${items}</div>`;
}

function renderTraits(traits) {
	if(!traits || traits.length === 0) return '';
	const items = traits.map((t)=>{
		return `<div class="brp-trait"><strong>${esc(t.name)}.</strong> ${esc(t.description)}</div>`;
	}).join('');
	return `<div class="brp-section"><div class="brp-section-title">Special Abilities</div>${items}</div>`;
}

function renderHitLocations(hitLocations, chars, baseAP) {
	if(!hitLocations || hitLocations.length === 0) return '';
	const baseHP = getHitPoints(chars?.con, chars?.siz);
	const rows = hitLocations.map((loc)=>{
		const hp = loc.hpOverride ?? baseHP;
		const ap = loc.armorOverride ?? (baseAP || 0);
		return `<tr><td>${esc(loc.name)}</td><td>${hp}</td><td>${ap}</td></tr>`;
	}).join('');
	return `<div class="brp-section"><div class="brp-section-title">Hit Locations</div>
		<table class="brp-hit-locations">
			<thead><tr><th>Location</th><th>HP</th><th>AP</th></tr></thead>
			<tbody>${rows}</tbody>
		</table></div>`;
}

export function render(sb, layout = 'narrow') {
	const name = esc(sb.name) || 'Unnamed Creature';
	const subtitle = [sb.category, sb.subtype].filter(Boolean).join(', ');

	let html = `<div class="brp-statblock ${layout === 'wide' ? 'brp-wide' : 'brp-narrow'}">`;
	html += `<div class="brp-header"><div class="brp-name">${name}</div>`;
	if(subtitle) html += `<div class="brp-subtitle">${esc(subtitle)}</div>`;
	html += `</div>`;
	html += `<div class="brp-divider"></div>`;
	html += renderCharacteristics(sb.characteristics);
	html += `<div class="brp-divider"></div>`;
	html += renderDerived(sb);
	html += `<div class="brp-divider"></div>`;
	html += renderSkills(sb.skills);
	html += renderWeapons(sb.weapons);
	html += renderSpells(sb.spells);
	html += renderTraits(sb.traits);
	html += renderHitLocations(sb.hitLocations, sb.characteristics, sb.armorPoints);

	if(sb.notes) {
		html += `<div class="brp-section"><div class="brp-section-title">Notes</div><div class="brp-notes">${esc(sb.notes)}</div></div>`;
	}

	html += `</div>`;
	return html;
}
