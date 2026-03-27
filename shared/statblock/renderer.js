// statblock/renderer.js — pure function: statblock model → HTML string
// Isomorphic: used by both client (live preview) and server (embed API)
// Supports two layout modes: 'wide' (D&D Beyond style) and 'narrow' (book/print)

import { abilityMod, fmtMod, getPB, getXP, fmtXP, displayCR, SKILLS, ABILITY_LABELS } from './constants.js';

// ── Shared helpers ────────────────────────────────────────────────────────

function esc(str) {
	return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildSpeed(speed) {
	const parts = [];
	if(speed.walk)   parts.push(`${speed.walk} ft.`);
	if(speed.burrow) parts.push(`Burrow ${speed.burrow} ft.`);
	if(speed.climb)  parts.push(`Climb ${speed.climb} ft.`);
	if(speed.fly)    parts.push(`Fly ${speed.fly} ft.${speed.hover ? ' (Hover)' : ''}`);
	if(speed.swim)   parts.push(`Swim ${speed.swim} ft.`);
	return parts.join(', ') || '—';
}

function buildSkills(sb) {
	if(!sb.skills) return '';
	const pb = getPB(sb.cr);
	const parts = [];
	SKILLS.forEach(({ key, name, ability })=>{
		const sk = sb.skills[key];
		if(!sk || !sk.proficient) return;
		const base = abilityMod(sb.abilities[ability]);
		const bonus = (sk.override !== null && sk.override !== '')
			? Number(sk.override)
			: base + pb * (sk.expertise ? 2 : 1);
		parts.push(`<span class="sb-skill-name">${esc(name)}</span> ${fmtMod(bonus)}`);
	});
	return parts.join(', ');
}

function calcPassivePerception(sb) {
	const pb = getPB(sb.cr);
	const wisBase = abilityMod(sb.abilities?.wis ?? 10);
	const perc = sb.skills?.perception;
	if(perc && perc.proficient) {
		if(perc.override !== null && perc.override !== '') return 10 + Number(perc.override);
		return 10 + wisBase + pb * (perc.expertise ? 2 : 1);
	}
	return 10 + wisBase;
}

function buildInitiative(sb) {
	if(sb.initiativeOverride !== null && sb.initiativeOverride !== '') {
		const v = Number(sb.initiativeOverride);
		return `${fmtMod(v)} (${10 + v})`;
	}
	const dexMod = abilityMod(sb.abilities.dex);
	return `${fmtMod(dexMod)} (${10 + dexMod})`;
}

function propLine(label, value) {
	if(!value && value !== 0) return '';
	return `<p class="sb-property"><span class="sb-label">${esc(label)}</span> ${value}</p>`;
}

// ── Ability table ─────────────────────────────────────────────────────────

function renderAbilityTable(sb) {
	const pb = getPB(sb.cr);

	function abilRow(ab) {
		const score = sb.abilities?.[ab] ?? 10;
		const mod   = abilityMod(score);
		const st    = sb.savingThrows?.[ab] || { proficient: false, override: null };
		const save  = st.proficient
			? (st.override !== null && st.override !== '' ? Number(st.override) : mod + pb)
			: mod;
		const profClass = st.proficient ? ' ab-prof' : '';
		return `<tr>
			<td class="ab-label">${ABILITY_LABELS[ab]}</td>
			<td class="ab-score">${score}</td>
			<td class="ab-mod">${fmtMod(mod)}</td>
			<td class="ab-save${profClass}">${fmtMod(save)}</td>
		</tr>`;
	}

	function makeTable(abils) {
		return `<table class="sb-ability-table">
			<thead><tr>
				<th class="ab-h-label"></th>
				<th class="ab-h-score"></th>
				<th>MOD</th>
				<th>SAVE</th>
			</tr></thead>
			<tbody>${abils.map(abilRow).join('')}</tbody>
		</table>`;
	}

	return `<div class="sb-ability-block">
		${makeTable(['str', 'dex', 'con'])}
		<div class="sb-ability-divider"></div>
		${makeTable(['int', 'wis', 'cha'])}
	</div>`;
}

// ── Section renderers ─────────────────────────────────────────────────────

function renderTraits(items) {
	if(!items || !items.length) return '';
	return items.map((item)=>{
		const name = item.name ? item.name.trim() : '';
		const usage = item.usage ? item.usage.trim() : '';
		const displayName = (name && usage) ? `${name} (${usage})` : name;
		const desc = item.description || '';
		const nameHtml = displayName
			? `<em><strong>${esc(displayName)}${displayName.endsWith('.') ? '' : '.'}</strong></em> `
			: '';
		const descHtml = esc(desc)
			.replace(/\n\n+/g, '</p><p class="sb-trait">')
			.replace(/\n/g, '<br>')
			// Bold spell frequency headers: "At Will:", "Cantrips (at will):", "1/Day Each:", "3rd Level (2 slots):", etc.
			// Must appear after <br>, after </p><p...>, or at start of text
			.replace(/(<br>|<\/p><p class="sb-trait">|^)((?:At Will|Cantrips?(?:\s*\([^)]*\))?|\d+\/Day(?: Each)?|\d+(?:st|nd|rd|th)[- ][Ll]evel\s*\([^)]*\)|\d+\/Short|Innate)\s*:)/gi, '$1<strong>$2</strong>');
		return `<p class="sb-trait">${nameHtml}${descHtml}</p>`;
	}).join('');
}

function renderSection(title, items, preamble) {
	if(!items || !items.length) return '';
	const preambleHtml = preamble
		? `<p class="sb-trait sb-preamble">${esc(preamble)}</p>`
		: '';
	return `<div class="sb-section">
		<h2 class="sb-section-header">${esc(title)}</h2>
		<div class="sb-rule sb-rule--section"></div>
		${preambleHtml}${renderTraits(items)}
	</div>`;
}

function renderLegendary(legendary, name) {
	if(!legendary.actions || !legendary.actions.length) return '';
	const defaultPreamble = name
		? `${name} can take ${legendary.count || 3} legendary actions, choosing from the options below. Only one legendary action option can be used at a time and only at the end of another creature's turn. ${name} regains spent legendary actions at the start of its turn.`
		: '';
	const preamble = legendary.preamble || defaultPreamble;
	return `<div class="sb-section">
		<h2 class="sb-section-header">Legendary Actions</h2>
		<div class="sb-rule sb-rule--section"></div>
		${preamble ? `<p class="sb-trait sb-preamble">${esc(preamble)}</p>` : ''}
		${renderTraits(legendary.actions)}
	</div>`;
}

function buildContentSections(sb) {
	return [
		renderSection('Actions', sb.actions),
		renderSection('Bonus Actions', sb.bonusActions),
		renderSection('Reactions', sb.reactions),
		renderLegendary(sb.legendary, sb.name),
		(sb.mythic && sb.mythic.enabled && sb.mythic.actions && sb.mythic.actions.length
			? renderSection('Mythic Actions', sb.mythic.actions, sb.mythic.preamble)
			: ''),
		(sb.lair && sb.lair.enabled && sb.lair.actions && sb.lair.actions.length
			? renderSection('Lair Actions', sb.lair.actions, sb.lair.preamble)
			: '')
	].join('');
}

function computeProps(sb) {
	const pb = getPB(sb.cr);
	const xp = getXP(sb.cr);
	const subtitleParts = [sb.size, sb.type];
	if(sb.subtype) subtitleParts.push(`(${sb.subtype})`);
	const subtitle = subtitleParts.filter(Boolean).join(' ');
	return {
		fullSubtitle : sb.alignment ? `${subtitle}, ${sb.alignment}` : subtitle,
		acStr        : sb.ac.description ? `${sb.ac.value} (${esc(sb.ac.description)})` : `${sb.ac.value}`,
		hpStr        : sb.hp.formula ? `${sb.hp.average} (${esc(sb.hp.formula)})` : `${sb.hp.average}`,
		speedStr     : buildSpeed(sb.speed),
		initiative   : buildInitiative(sb),
		skills       : buildSkills(sb),
		sensesStr    : (()=>{
			const passivePerc = calcPassivePerception(sb);
			return sb.senses
				? `${esc(sb.senses)}; Passive Perception ${passivePerc}`
				: `Passive Perception ${passivePerc}`;
		})(),
		crStr : sb.cr ? `${displayCR(sb.cr)} (XP ${fmtXP(xp)}; PB ${fmtMod(pb)})` : '',
		immunitiesStr : (()=>{
			const parts = [];
			if(sb.damageImmunities)    parts.push(esc(sb.damageImmunities));
			if(sb.conditionImmunities) parts.push(esc(sb.conditionImmunities));
			return parts.join('; ');
		})()
	};
}

// ── WIDE layout ───────────────────────────────────────────────────────────

function renderWide(sb) {
	const p = computeProps(sb);

	const statsHtml = `
		<div class="sb-properties">
			<p class="sb-property">
				<span class="sb-label">AC</span> ${p.acStr}&emsp;<span class="sb-label">Initiative</span> ${p.initiative}
			</p>
			${propLine('HP', p.hpStr)}
			${propLine('Speed', p.speedStr)}
		</div>
		${renderAbilityTable(sb)}
		<div class="sb-properties">
			${p.skills ? propLine('Skills', p.skills) : ''}
			${sb.damageVulnerabilities ? propLine('Vulnerabilities', esc(sb.damageVulnerabilities)) : ''}
			${sb.damageResistances     ? propLine('Resistances',     esc(sb.damageResistances))     : ''}
			${p.immunitiesStr          ? propLine('Immunities', p.immunitiesStr)                     : ''}
			${propLine('Senses', p.sensesStr)}
			${propLine('Languages', esc(sb.languages || '—'))}
			${sb.gear ? propLine('Gear', esc(sb.gear)) : ''}
			${p.crStr ? propLine('CR', p.crStr) : ''}
		</div>`;

	const traitsHtml = (sb.traits && sb.traits.length)
		? `<div class="sb-section">
			<h2 class="sb-section-header">Traits</h2>
			<div class="sb-rule sb-rule--section"></div>
			${renderTraits(sb.traits)}
		</div>`
		: '';

	return `<div class="statblock statblock--wide">
		<div class="sb-header">
			<h1 class="sb-name">${esc(sb.name || 'Unnamed Creature')}</h1>
			<p class="sb-subtitle">${esc(p.fullSubtitle)}</p>
		</div>
		<div class="sb-rule sb-rule--thick"></div>
		<div class="sb-wide-cols">
			<div class="sb-wide-left">
				${statsHtml}
				${traitsHtml}
			</div>
			<div class="sb-wide-right">
				${buildContentSections(sb)}
			</div>
		</div>
	</div>`;
}

// ── NARROW layout ─────────────────────────────────────────────────────────

function renderNarrow(sb) {
	const p = computeProps(sb);

	const traitsSection = (sb.traits && sb.traits.length)
		? `<div class="sb-section">
			<h2 class="sb-section-header">Traits</h2>
			<div class="sb-rule sb-rule--section"></div>
			${renderTraits(sb.traits)}
		</div>`
		: '';

	return `<div class="statblock statblock--narrow">
		<div class="sb-header">
			<h1 class="sb-name">${esc(sb.name || 'Unnamed Creature')}</h1>
			<p class="sb-subtitle">${esc(p.fullSubtitle)}</p>
		</div>
		<div class="sb-rule sb-rule--thick"></div>
		<div class="sb-properties">
			<p class="sb-property">
				<span class="sb-label">AC</span> ${p.acStr}&emsp;<span class="sb-label">Initiative</span> ${p.initiative}
			</p>
			${propLine('HP', p.hpStr)}
			${propLine('Speed', p.speedStr)}
		</div>
		${renderAbilityTable(sb)}
		<div class="sb-properties">
			${p.skills ? propLine('Skills', p.skills) : ''}
			${sb.damageVulnerabilities ? propLine('Vulnerabilities', esc(sb.damageVulnerabilities)) : ''}
			${sb.damageResistances     ? propLine('Resistances',     esc(sb.damageResistances))     : ''}
			${p.immunitiesStr          ? propLine('Immunities', p.immunitiesStr)                     : ''}
			${propLine('Senses', p.sensesStr)}
			${propLine('Languages', esc(sb.languages || '—'))}
			${sb.gear ? propLine('Gear', esc(sb.gear)) : ''}
			${p.crStr ? propLine('CR', p.crStr) : ''}
		</div>
		<div class="sb-rule sb-rule--thick"></div>
		${traitsSection}
		${buildContentSections(sb)}
	</div>`;
}

// ── Public API ────────────────────────────────────────────────────────────

export function render(sb, layout = 'narrow') {
	return layout === 'wide' ? renderWide(sb) : renderNarrow(sb);
}
