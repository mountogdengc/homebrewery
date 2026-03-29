// ── BESM 4e Stat Block Renderer ──────────────────────────────────────
// Pure function: BESM character model → HTML string
// Isomorphic: used by both client (live preview) and server (embed API)

const esc = (s)=>(s ?? '').toString()
	.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Stat point cost: v <= 12 → v*2, v > 12 → 24 + (v-12)*4
function statPointCost(v) {
	if(!v || v <= 0) return 0;
	return v <= 12 ? v * 2 : 24 + (v - 12) * 4;
}

// Recalculate derived values from stats + attributes when DB values are all zero
function computeDerived(ch) {
	const body = ch.stats?.body || 0;
	const mind = ch.stats?.mind || 0;
	const soul = ch.stats?.soul || 0;

	const derivedMods = { CV: 0, ACV: 0, DCV: 0, HP: 0, EP: 0, DM: 0, SV: 0, SCV: 0 };
	const multipliers = { CV: 1, ACV: 1, DCV: 1, HP: 1, EP: 1, DM: 1, SV: 1, SCV: 1 };

	let bodyMods = 0, mindMods = 0, soulMods = 0;

	(ch.attributes || []).forEach((attr)=>{
		const statMods = attr.template?.stat_mods;
		if(!statMods) return;
		const level = attr.level || 1;

		if(statMods.base) {
			bodyMods += (statMods.base.Body ?? 0) * level;
			mindMods += (statMods.base.Mind ?? 0) * level;
			soulMods += (statMods.base.Soul ?? 0) * level;
		}
		if(statMods.derived) {
			for(const key in statMods.derived) {
				if(key in derivedMods) derivedMods[key] += statMods.derived[key] * level;
			}
		}
		if(statMods.multipliers) {
			for(const key in statMods.multipliers) {
				if(key in multipliers) multipliers[key] *= statMods.multipliers[key];
			}
		}
	});

	(ch.defects || []).forEach((d)=>{
		const dmods = d.template?.stat_mods;
		if(dmods?.multipliers) {
			for(const key in dmods.multipliers) {
				if(key in multipliers) multipliers[key] *= dmods.multipliers[key];
			}
		}
	});

	const fBody = Math.max(0, body + bodyMods);
	const fMind = Math.max(0, mind + mindMods);
	const fSoul = Math.max(0, soul + soulMods);

	const cv = Math.floor((fBody + fMind + fSoul) / 3) + derivedMods.CV;
	return {
		attackCombatValue:  Math.floor((cv + derivedMods.ACV) * multipliers.ACV * multipliers.CV),
		defenseCombatValue: Math.floor((cv + derivedMods.DCV) * multipliers.DCV * multipliers.CV),
		healthPoints:       Math.floor(((fBody + fSoul) * 5 + derivedMods.HP) * multipliers.HP),
		energyPoints:       Math.floor(((fMind + fSoul) * 5 + derivedMods.EP) * multipliers.EP),
		damage:             Math.floor((5 + derivedMods.DM) * multipliers.DM),
		armorRating:        ch.derivedValues?.armorRating ?? 0,
		sv:                 Math.floor((fBody * 2 + derivedMods.SV) * multipliers.SV),
		scv:                Math.floor((Math.floor((fMind + fSoul) / 2) + derivedMods.SCV) * multipliers.SCV),
		sanityPoints:       Math.floor((fMind + fSoul) * 2),
	};
}

function getPowerLevelLabel(cp) {
	if(cp <= 25)  return 'Human';
	if(cp <= 50)  return 'Adventurer';
	if(cp <= 100) return 'Heroic';
	if(cp <= 200) return 'Superheroic';
	return 'Godlike';
}

function getSizeLabel(rank) {
	const sizes = {
		'-10': 'Point', '-8': 'Tiny', '-6': 'Diminutive',
		'-4': 'Very Small', '-2': 'Small', '0': 'Medium',
		'2': 'Large', '4': 'Very Large', '6': 'Huge',
		'8': 'Gigantic', '10': 'Colossal'
	};
	return sizes[String(rank)] || `Rank ${rank}`;
}

function renderStats(ch) {
	const body = ch.stats?.body;
	const mind = ch.stats?.mind || 0;
	const soul = ch.stats?.soul || 0;
	const bodyDisplay = (body === null || body === undefined || body === 0) ? 'NA' : body;
	const bodyPoints  = (body === null || body === undefined || body === 0) ? '' : statPointCost(body);
	const mindPoints  = statPointCost(mind);
	const soulPoints  = statPointCost(soul);

	return `<table class="besm-stats-table">
		<tr><th>Stat</th><th>Body</th><th>Mind</th><th>Soul</th></tr>
		<tr><td>Value</td><td>${bodyDisplay}</td><td>${mind}</td><td>${soul}</td></tr>
		<tr><td>Points</td><td>${bodyPoints}</td><td>${mindPoints}</td><td>${soulPoints}</td></tr>
	</table>`;
}

function renderDerived(ch) {
	let dv = ch.derivedValues || {};

	// If stored derived values are all zero, recalculate from stats + attributes
	const storedAcv = dv.attackCombatValue ?? dv.acv ?? 0;
	const storedHp  = dv.healthPoints ?? dv.hp ?? 0;
	if(storedAcv === 0 && storedHp === 0 && (ch.stats?.mind || ch.stats?.soul || ch.stats?.body)) {
		dv = computeDerived(ch);
	}

	const acv = dv.attackCombatValue ?? dv.acv ?? 0;
	const dcv = dv.defenseCombatValue ?? dv.dcv ?? 0;
	const dm  = dv.damage ?? dv.dm ?? 5;
	const arm = dv.armorRating ?? dv.armour ?? 0;
	const hp  = dv.healthPoints ?? dv.hp ?? 0;
	const ep  = dv.energyPoints ?? dv.ep ?? 0;
	const sp  = dv.sanityPoints ?? dv.sp ?? 0;
	const sv  = dv.shockValue ?? dv.sv ?? 0;
	const scv = dv.scv ?? dv.socialCombatValue ?? 0;

	// Movement (if available)
	const mv = ch.movement || {};
	const walk   = mv.walk   ?? '—';
	const jog    = mv.jog    ?? '—';
	const run    = mv.run    ?? '—';
	const sprint = mv.sprint ?? '—';

	return `<div class="besm-section-header">Derived Values</div>
	<div class="besm-derived">
		<div class="besm-derived-left">
			<div class="besm-derived-row"><span class="besm-dv-label">Attack Combat Value</span><span class="besm-dv-val">${acv}</span></div>
			<div class="besm-derived-row"><span class="besm-dv-label">Defence Combat Value</span><span class="besm-dv-val">${dcv}</span></div>
			<div class="besm-derived-row"><span class="besm-dv-label">Damage Multiplier</span><span class="besm-dv-val">${dm}</span></div>
			<div class="besm-derived-row"><span class="besm-dv-label">Armour (Physical)</span><span class="besm-dv-val">${arm}</span></div>
		</div>
		<div class="besm-derived-right">
			<div class="besm-derived-row"><span class="besm-dv-label">Health Points</span><span class="besm-dv-val">${hp}</span></div>
			<div class="besm-derived-row"><span class="besm-dv-label">Energy Points</span><span class="besm-dv-val">${ep}</span></div>
			<div class="besm-derived-row"><span class="besm-dv-label">Sanity Points</span><span class="besm-dv-val">${sp}</span></div>
			<div class="besm-derived-row"><span class="besm-dv-label">Shock Value</span><span class="besm-dv-val">${sv}</span></div>
		</div>
		<div class="besm-movement-header">Movement Speed</div>
		<div class="besm-movement">
			<div class="besm-mv-cell header">Walk</div>
			<div class="besm-mv-cell header">Jog</div>
			<div class="besm-mv-cell header">Run</div>
			<div class="besm-mv-cell header">Sprint</div>
			<div class="besm-mv-cell">${walk}</div>
			<div class="besm-mv-cell">${jog}</div>
			<div class="besm-mv-cell">${run}</div>
			<div class="besm-mv-cell">${sprint}</div>
		</div>
		<div class="besm-scv-row">
			<span class="besm-dv-label">Social Combat Value</span>
			<span class="besm-dv-val">${scv}</span>
		</div>
	</div>`;
}

function renderAttributes(attrs) {
	if(!attrs || attrs.length === 0) return '';

	let totalPoints = 0;
	const rows = attrs.map((a)=>{
		const name = esc(a.template?.name || a.name || 'Unknown');
		const notes = a.notes ? ` <span class="besm-attr-detail">(${esc(a.notes)})</span>` : '';
		const level = a.level ?? 1;
		const points = a.cpCost ?? 0;
		totalPoints += points;
		return `<tr><td>${name}${notes}</td><td>${level}</td><td>${points}</td></tr>`;
	}).join('');

	return `<div class="besm-section-header">Attributes</div>
	<table class="besm-attr-table">
		<tr><th>Attribute</th><th>Level</th><th>Points</th></tr>
		${rows}
	</table>
	<div class="besm-points-row"><span>Points</span><span>${totalPoints}</span></div>`;
}

function renderDefects(defects) {
	if(!defects || defects.length === 0) return '';

	let totalPoints = 0;
	const rows = defects.map((d)=>{
		const name = esc(d.template?.name || d.name || 'Unknown');
		const notes = d.notes ? ` <span class="besm-attr-detail">(${esc(d.notes)})</span>` : '';
		const rank = d.rank ?? 1;
		const points = d.cpRefund ?? d.cpCost ?? 0;
		totalPoints += points;
		return `<tr><td>${name}${notes}</td><td>${rank}</td><td>${points}</td></tr>`;
	}).join('');

	return `<div class="besm-section-header">Defects</div>
	<table class="besm-attr-table">
		<tr><th>Defect</th><th>Rank</th><th>Points</th></tr>
		${rows}
	</table>
	<div class="besm-points-row"><span>Points</span><span>${totalPoints}</span></div>`;
}

function renderSkills(skills) {
	if(!skills || skills.length === 0) return '';

	let totalCost = 0;
	const rows = skills.map((s)=>{
		const name = esc(s.name || 'Unknown');
		const spec = s.specialization ? ` <span class="besm-attr-detail">(${esc(s.specialization)})</span>` : '';
		const level = s.level ?? 1;
		const cost = s.cpCost ?? 0;
		totalCost += cost;
		return `<tr><td>${name}${spec}</td><td>${level}</td><td>${cost}</td></tr>`;
	}).join('');

	return `<div class="besm-section-header">Skills</div>
	<table class="besm-attr-table">
		<tr><th>Skill</th><th>Level</th><th>SP</th></tr>
		${rows}
	</table>
	<div class="besm-points-row"><span>Skill Points</span><span>${totalCost}</span></div>`;
}

// ── Main render ──────────────────────────────────────────────────────

export function render(character, layout = 'narrow') {
	const ch = character || {};
	const name = esc(ch.name) || 'Unnamed Character';
	const totalCP = ch.totalCP || 0;
	const powerLevel = getPowerLevelLabel(totalCP);

	// Size info
	const sizeRank = ch.templates?.size?.rank ?? 0;
	const sizeName = ch.templates?.size?.name || getSizeLabel(sizeRank);
	const identity = ch.identity ? `${esc(ch.identity)}` : '';

	// Subtitle line
	let subtitle = `<em>Power Level:</em> ${esc(powerLevel)} (${totalCP})`;
	subtitle += `<br><em>Size Rank ${sizeRank}:</em> ${esc(sizeName)}`;
	if(identity) subtitle += ` — ${identity}`;

	const wideClass = layout === 'wide' ? ' besm-statblock--wide' : '';

	return `<div class="besm-statblock${wideClass}">
		<div class="besm-title">
			<div class="besm-name">${name}</div>
			<div class="besm-subtitle">${subtitle}</div>
		</div>
		${renderStats(ch)}
		${renderDerived(ch)}
		${renderAttributes(ch.attributes)}
		${renderDefects(ch.defects)}
		${renderSkills(ch.skills)}
		<div class="besm-total-row"><span>Total Points</span><span>${ch.totalPointsSpent || totalCP}</span></div>
	</div>`;
}
