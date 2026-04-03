// ── Palladium Megaversal Statblock Renderer ───────────────────────────
import {
	ATTRIBUTES, ATTR_LABELS,
	getPsDamageBonus, getSpdMph, getPeSaveBonus,
	getMaTrust, getPbCharm, getIqBonus, getPpBonus, usesMDC
} from './constants.js';

const esc = (s)=>(s ?? '').toString()
	.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ── Attribute block ──────────────────────────────────────────────────
function renderAttributes(attrs) {
	const cells = ATTRIBUTES.map((a)=>{
		const val = attrs?.[a] ?? 10;
		return `<td><div class="pal-attr-label">${ATTR_LABELS[a]}</div><div class="pal-attr-value">${val}</div></td>`;
	}).join('');
	return `<table class="pal-attrs"><tr>${cells}</tr></table>`;
}

// ── Derived values ───────────────────────────────────────────────────
function renderDerived(sb) {
	const attrs = sb.attributes || {};
	const game  = sb.game || 'Rifts';
	const isMDC = usesMDC(game, sb.category);
	let rows = '';

	// HP / SDC / MDC
	const hp  = sb.hpOverride  ?? sb.hp  ?? 0;
	const sdc = sb.sdcOverride ?? sb.sdc ?? 0;

	if(isMDC) {
		const mdc = sb.mdcOverride ?? sb.mdc ?? 0;
		rows += `<tr><td class="pal-derived-label">M.D.C.</td><td class="pal-derived-value">${mdc}</td></tr>`;
	} else {
		rows += `<tr><td class="pal-derived-label">Hit Points</td><td class="pal-derived-value">${hp}</td></tr>`;
		rows += `<tr><td class="pal-derived-label">S.D.C.</td><td class="pal-derived-value">${sdc}</td></tr>`;
	}

	if(sb.ar > 0) {
		rows += `<tr><td class="pal-derived-label">Natural A.R.</td><td class="pal-derived-value">${sb.ar}</td></tr>`;
	}
	if(sb.ppeMagic > 0) {
		rows += `<tr><td class="pal-derived-label">P.P.E.</td><td class="pal-derived-value">${sb.ppeMagic}</td></tr>`;
	}
	if(sb.isp > 0) {
		rows += `<tr><td class="pal-derived-label">I.S.P.</td><td class="pal-derived-value">${sb.isp}</td></tr>`;
	}

	// Attribute-derived bonuses
	const psBonus = getPsDamageBonus(attrs.ps || 0);
	const peBonus = getPeSaveBonus(attrs.pe || 0);
	const maTrust = getMaTrust(attrs.ma || 0);
	const pbCharm = getPbCharm(attrs.pb || 0);
	const spdMph  = getSpdMph(attrs.spd || 0);

	if(psBonus > 0)  rows += `<tr><td class="pal-derived-label">PS Damage Bonus</td><td class="pal-derived-value">+${psBonus}</td></tr>`;
	if(peBonus > 0)  rows += `<tr><td class="pal-derived-label">PE Save Bonus</td><td class="pal-derived-value">+${peBonus}</td></tr>`;
	if(maTrust > 0)  rows += `<tr><td class="pal-derived-label">Trust/Intimidate</td><td class="pal-derived-value">${maTrust}%</td></tr>`;
	if(pbCharm > 0)  rows += `<tr><td class="pal-derived-label">Charm/Impress</td><td class="pal-derived-value">${pbCharm}%</td></tr>`;
	rows += `<tr><td class="pal-derived-label">Speed (mph)</td><td class="pal-derived-value">${spdMph}</td></tr>`;

	return `<table class="pal-derived">${rows}</table>`;
}

// ── Combat ───────────────────────────────────────────────────────────
function renderCombat(combat) {
	if(!combat) return '';
	let rows = '';
	if(combat.attacks)       rows += `<tr><td class="pal-derived-label">Attacks/Melee</td><td class="pal-derived-value">${combat.attacks}</td></tr>`;
	if(combat.initiative)    rows += `<tr><td class="pal-derived-label">Initiative</td><td class="pal-derived-value">${fmt(combat.initiative)}</td></tr>`;
	if(combat.strike)        rows += `<tr><td class="pal-derived-label">Strike</td><td class="pal-derived-value">${fmt(combat.strike)}</td></tr>`;
	if(combat.parry)         rows += `<tr><td class="pal-derived-label">Parry</td><td class="pal-derived-value">${fmt(combat.parry)}</td></tr>`;
	if(combat.dodge)         rows += `<tr><td class="pal-derived-label">Dodge</td><td class="pal-derived-value">${fmt(combat.dodge)}</td></tr>`;
	if(combat.rollWithPunch) rows += `<tr><td class="pal-derived-label">Roll w/ Punch</td><td class="pal-derived-value">${fmt(combat.rollWithPunch)}</td></tr>`;
	if(combat.pull)          rows += `<tr><td class="pal-derived-label">Pull Punch</td><td class="pal-derived-value">${fmt(combat.pull)}</td></tr>`;
	if(combat.damage)        rows += `<tr><td class="pal-derived-label">Damage</td><td class="pal-derived-value">${esc(combat.damage)}</td></tr>`;
	if(combat.criticalOn)    rows += `<tr><td class="pal-derived-label">Critical Strike</td><td class="pal-derived-value">${esc(combat.criticalOn)}</td></tr>`;

	if(!rows) return '';
	return `<div class="pal-section"><div class="pal-section-title">Combat</div><table class="pal-derived">${rows}</table></div>`;
}

function fmt(n) {
	if(n > 0) return `+${n}`;
	return `${n}`;
}

// ── Movement ─────────────────────────────────────────────────────────
function renderMovement(movement) {
	if(!movement) return '';
	const parts = [];
	if(movement.run)  parts.push(`<strong>Run:</strong> ${esc(movement.run)}`);
	if(movement.fly)  parts.push(`<strong>Fly:</strong> ${esc(movement.fly)}`);
	if(movement.swim) parts.push(`<strong>Swim:</strong> ${esc(movement.swim)}`);
	if(movement.leap) parts.push(`<strong>Leap:</strong> ${esc(movement.leap)}`);
	if(parts.length === 0) return '';
	return `<div class="pal-section"><div class="pal-section-title">Movement</div><div class="pal-movement">${parts.join(' &nbsp;|&nbsp; ')}</div></div>`;
}

// ── Skills ───────────────────────────────────────────────────────────
function renderSkills(skills) {
	if(!skills || skills.length === 0) return '';
	const items = skills.map((s)=>`<span class="pal-skill"><strong>${esc(s.name)}</strong> ${s.value}%</span>`).join(', ');
	return `<div class="pal-section"><div class="pal-section-title">Skills</div><div class="pal-skill-list">${items}</div></div>`;
}

// ── Weapons ──────────────────────────────────────────────────────────
function renderWeapons(weapons) {
	if(!weapons || weapons.length === 0) return '';
	const rows = weapons.map((w)=>{
		return `<tr>
			<td>${esc(w.name)}</td>
			<td>${esc(w.damage)}</td>
			<td>${esc(w.range || '—')}</td>
			<td>${esc(w.rof || '—')}</td>
			<td>${esc(w.payload || '—')}</td>
			<td>${esc(w.bonus || '—')}</td>
		</tr>`;
	}).join('');
	return `<div class="pal-section"><div class="pal-section-title">Weapons</div>
		<table class="pal-weapons">
			<thead><tr><th>Weapon</th><th>Damage</th><th>Range</th><th>RoF</th><th>Payload</th><th>Bonus</th></tr></thead>
			<tbody>${rows}</tbody>
		</table></div>`;
}

// ── Armor ────────────────────────────────────────────────────────────
function renderArmor(armor, game) {
	if(!armor || armor.length === 0) return '';
	const isMDC = game === 'Rifts';
	const durLabel = isMDC ? 'M.D.C.' : 'S.D.C.';
	const rows = armor.map((a)=>{
		return `<tr>
			<td>${esc(a.name)}</td>
			<td>${a.mdc ?? a.sdc ?? '—'}</td>
			<td>${a.ar ?? '—'}</td>
			<td>${esc(a.notes || '')}</td>
		</tr>`;
	}).join('');
	return `<div class="pal-section"><div class="pal-section-title">Armor</div>
		<table class="pal-armor">
			<thead><tr><th>Armor</th><th>${durLabel}</th><th>A.R.</th><th>Notes</th></tr></thead>
			<tbody>${rows}</tbody>
		</table></div>`;
}

// ── Magic ────────────────────────────────────────────────────────────
function renderMagic(spells) {
	if(!spells || spells.length === 0) return '';
	const items = spells.map((s)=>{
		const parts = [`<strong>${esc(s.name)}</strong>`];
		if(s.level) parts.push(`Lv.${s.level}`);
		if(s.ppe)   parts.push(`PPE: ${s.ppe}`);
		if(s.range) parts.push(`Range: ${esc(s.range)}`);
		if(s.duration) parts.push(`Dur: ${esc(s.duration)}`);
		if(s.description) parts.push(`— ${esc(s.description)}`);
		return `<div class="pal-spell">${parts.join(' &middot; ')}</div>`;
	}).join('');
	return `<div class="pal-section"><div class="pal-section-title">Magic</div>${items}</div>`;
}

// ── Psionics ─────────────────────────────────────────────────────────
function renderPsionics(psionics) {
	if(!psionics || psionics.length === 0) return '';
	const items = psionics.map((p)=>{
		const parts = [`<strong>${esc(p.name)}</strong>`];
		if(p.category) parts.push(`(${esc(p.category)})`);
		if(p.isp) parts.push(`ISP: ${p.isp}`);
		if(p.range) parts.push(`Range: ${esc(p.range)}`);
		if(p.duration) parts.push(`Dur: ${esc(p.duration)}`);
		if(p.description) parts.push(`— ${esc(p.description)}`);
		return `<div class="pal-psionic">${parts.join(' &middot; ')}</div>`;
	}).join('');
	return `<div class="pal-section"><div class="pal-section-title">Psionics</div>${items}</div>`;
}

// ── Abilities ────────────────────────────────────────────────────────
function renderAbilities(abilities) {
	if(!abilities || abilities.length === 0) return '';
	const items = abilities.map((a)=>{
		return `<div class="pal-ability"><strong>${esc(a.name)}.</strong> ${esc(a.description)}</div>`;
	}).join('');
	return `<div class="pal-section"><div class="pal-section-title">Special Abilities</div>${items}</div>`;
}

// ── TMNT Mutations ───────────────────────────────────────────────────
function renderMutations(sb) {
	if(sb.game !== 'TMNT') return '';
	if((!sb.mutations || sb.mutations.length === 0) && !sb.animalType) return '';

	let html = `<div class="pal-section"><div class="pal-section-title">Mutant Animal</div>`;
	if(sb.animalType) html += `<div class="pal-mutation-info"><strong>Animal Type:</strong> ${esc(sb.animalType)}`;
	if(sb.animalSize) html += ` &nbsp;|&nbsp; <strong>Size:</strong> ${esc(sb.animalSize)}`;
	if(sb.bioE)       html += ` &nbsp;|&nbsp; <strong>Bio-E:</strong> ${sb.bioE}`;
	html += `</div>`;

	if(sb.mutations && sb.mutations.length > 0) {
		const items = sb.mutations.map((m)=>{
			const cost = m.cost ? ` (${m.cost} Bio-E)` : '';
			const desc = m.description ? ` — ${esc(m.description)}` : '';
			return `<div class="pal-mutation"><strong>${esc(m.name)}</strong>${cost}${desc}</div>`;
		}).join('');
		html += items;
	}
	html += `</div>`;
	return html;
}

// ── Main render ──────────────────────────────────────────────────────
export function render(sb, layout = 'narrow') {
	const name = esc(sb.name) || 'Unnamed Character';
	const game = sb.game || 'Rifts';

	// Build subtitle from category + OCC + race
	const subtitleParts = [];
	if(sb.race)      subtitleParts.push(sb.race);
	if(sb.category && sb.category !== 'NPC') subtitleParts.push(sb.category);
	if(sb.occ) {
		const occLabel = sb.occType || 'OCC';
		subtitleParts.push(`${sb.occ} (${occLabel})`);
	}
	if(sb.level > 0) subtitleParts.push(`Level ${sb.level}`);
	const subtitle = subtitleParts.join(' &mdash; ');

	const gameClass = `pal-game-${game.toLowerCase().replace(/[^a-z]/g, '')}`;

	let html = `<div class="pal-statblock ${layout === 'wide' ? 'pal-wide' : 'pal-narrow'} ${gameClass}">`;
	html += `<div class="pal-header">`;
	html += `<div class="pal-game-badge">${esc(game)}</div>`;
	html += `<div class="pal-name">${name}</div>`;
	if(subtitle) html += `<div class="pal-subtitle">${subtitle}</div>`;
	if(sb.alignment) html += `<div class="pal-alignment">Alignment: ${esc(sb.alignment)}</div>`;
	html += `</div>`;

	html += `<div class="pal-divider"></div>`;
	html += renderAttributes(sb.attributes);
	html += `<div class="pal-divider"></div>`;
	html += renderDerived(sb);
	html += `<div class="pal-divider"></div>`;
	html += renderCombat(sb.combat);
	html += renderMovement(sb.movement);
	html += renderSkills(sb.skills);
	html += renderWeapons(sb.weapons);
	html += renderArmor(sb.armor, game);
	html += renderMagic(sb.magic);
	html += renderPsionics(sb.psionics);
	html += renderAbilities(sb.abilities);
	html += renderMutations(sb);

	if(sb.equipment) {
		html += `<div class="pal-section"><div class="pal-section-title">Equipment</div><div class="pal-equipment">${esc(sb.equipment)}</div></div>`;
	}

	if(sb.description) {
		html += `<div class="pal-section"><div class="pal-section-title">Description</div><div class="pal-description">${esc(sb.description)}</div></div>`;
	}

	if(sb.notes) {
		html += `<div class="pal-section"><div class="pal-section-title">Notes</div><div class="pal-notes">${esc(sb.notes)}</div></div>`;
	}

	html += `</div>`;
	return html;
}
