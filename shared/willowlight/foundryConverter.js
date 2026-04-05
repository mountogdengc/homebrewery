// ── Willowlight ↔ Foundry VTT Converter ──────────────────────────────
// Converts between the homebrewery Willowlight schemas and the Foundry
// VTT system JSON format. Handles both PCs and NPC bestiary entries.

// ══════════════════════════════════════════════════════════════════════
// PC: Homebrewery → Foundry
// ══════════════════════════════════════════════════════════════════════

export function toFoundry(ch) {
	const attrs = ch.attributes || {};
	const interests = ch.interests || [];
	const hobbies = ch.hobbies || [];

	const skills = {
		vocation:  { name: ch.vocation?.name || '', bonus: ch.vocation?.bonus || 3 },
		interest1: { name: interests[0]?.name || '', bonus: 2 },
		interest2: { name: interests[1]?.name || '', bonus: 2 },
		interest3: { name: interests[2]?.name || '', bonus: 2 },
		hobby1:    { name: hobbies[0]?.name || '', bonus: 1 },
		hobby2:    { name: hobbies[1]?.name || '', bonus: 1 },
		hobby3:    { name: hobbies[2]?.name || '', bonus: 1 }
	};

	const vitalityMax  = ch.vitalityOverride  ?? (3 + (attrs.endurance || 0));
	const willpowerMax = ch.willpowerOverride ?? (3 + (attrs.resolve || 0));
	const composureMax = ch.composureOverride ?? (3 + (attrs.command || 0));

	const convictionMilestones = (ch.convictionMilestones || []).map((m)=>({
		text: m.text || '', achieved: !!m.completed
	}));
	const pathMilestones = (ch.pathMilestones || []).map((m)=>({
		text: m.text || '', achieved: !!m.completed
	}));
	while (convictionMilestones.length < 4) convictionMilestones.push({ text: '', achieved: false });
	while (pathMilestones.length < 4) pathMilestones.push({ text: '', achieved: false });

	return {
		age: ch.age || '',
		gender: ch.gender || '',
		height: ch.height || '',
		description: ch.shortDescription || ch.description || '',
		conviction: ch.conviction || '',
		path: ch.path || '',
		scale: {
			physical: ch.scale?.physical || 3,
			mental:   ch.scale?.mental || 3,
			social:   ch.scale?.social || 3
		},
		attributes: {
			might:     { value: attrs.might || 0 },
			reflex:    { value: attrs.reflex || 0 },
			endurance: { value: attrs.endurance || 0 },
			reason:    { value: attrs.reason || 0 },
			guile:     { value: attrs.guile || 0 },
			resolve:   { value: attrs.resolve || 0 },
			influence: { value: attrs.influence || 0 },
			poise:     { value: attrs.poise || 0 },
			command:   { value: attrs.command || 0 }
		},
		skills,
		domainFocus: ch.domainFocus || '',
		health: {
			vitality:  { value: vitalityMax,  max: vitalityMax },
			willpower: { value: willpowerMax, max: willpowerMax },
			composure: { value: composureMax, max: composureMax }
		},
		afflictions: {
			terrified:    ch.afflictions?.terrified || false,
			discredited:  ch.afflictions?.discredited || false,
			stunned:      ch.afflictions?.stunned || false,
			prone:        ch.afflictions?.prone || false,
			blinded:      ch.afflictions?.blinded || false,
			disoriented:  ch.afflictions?.disoriented || false,
			restrained:   ch.afflictions?.restrained || false,
			slowed:       ch.afflictions?.slowed || false,
			disarmed:     ch.afflictions?.disarmed || false,
			dying:        ch.afflictions?.dying || false
		},
		luck: {
			rating: ch.luckRating || 1,
			tokens: ch.luckTokens || 1
		},
		corruption: {
			value:  ch.corruption || 0,
			hearth: ch.hearthTrigger ? 1 : 0
		},
		xp: {
			spent:   ch.xpSpent || 0,
			unspent: ch.unspentXP || 0,
			session: ch.sessionXP || 0
		},
		wealth:    ch.wealthPoints || 0,
		downtime:  typeof ch.downtime === 'number' ? ch.downtime : (parseInt(ch.downtime) || 0),
		lifestyle: ch.lifestyle || 0,
		domainPriority: {
			physical: 'primary',
			mental:   'secondary',
			social:   'tertiary'
		},
		milestones: {
			conviction: convictionMilestones,
			path:       pathMilestones
		},
		contacts: (ch.contacts || []).map((c)=>({
			name: c.name || '', type: c.type || '', rating: c.rating || 0,
			health: c.health || 5, relationship: c.relationship || '', note: c.note || ''
		})),
		secrets: (ch.secrets || []).map((s)=>({
			name: s.name || '', weight: s.weight || 0,
			spread: s.spread || [false, false, false],
			containmentPlan: s.containmentPlan || '', contacts: s.contacts || ''
		})),
		attacks: (ch.attacks || []).map((a)=>({
			name: a.name || '', domain: a.domain || 'P', attribute: a.attribute || '',
			skill: a.skill || '', modifier: a.modifier || 0, rating: a.rating || ''
		})),
		edges: (ch.edges || []).map((e)=>({
			name: e.name || '', dots: e.dots || 0, flavor: e.flavor || ''
		})),
		aspects: (ch.aspects || []).map((a)=>({
			name: a.name || '', dots: a.dots || 0, flavor: a.flavor || ''
		})),
		burdens: (ch.burdens || []).map((b)=>({
			name: b.name || '', dots: b.dots || 0, flavor: b.flavor || ''
		})),
		equipment: (ch.equipment || []).map((e)=>({
			name: e.name || ''
		})),
		biography: ch.notes || ''
	};
}

// ══════════════════════════════════════════════════════════════════════
// PC: Foundry → Homebrewery
// ══════════════════════════════════════════════════════════════════════

export function fromFoundry(f, existingCharacter = {}) {
	const attrs = f.attributes || {};
	const skills = f.skills || {};

	const interests = [];
	if(skills.interest1?.name) interests.push({ name: skills.interest1.name, bonus: 2 });
	if(skills.interest2?.name) interests.push({ name: skills.interest2.name, bonus: 2 });
	if(skills.interest3?.name) interests.push({ name: skills.interest3.name, bonus: 2 });

	const hobbies = [];
	if(skills.hobby1?.name) hobbies.push({ name: skills.hobby1.name, bonus: 1 });
	if(skills.hobby2?.name) hobbies.push({ name: skills.hobby2.name, bonus: 1 });
	if(skills.hobby3?.name) hobbies.push({ name: skills.hobby3.name, bonus: 1 });

	const convictionMilestones = (f.milestones?.conviction || []).map((m)=>({
		text: m.text || '', completed: !!m.achieved
	}));
	const pathMilestones = (f.milestones?.path || []).map((m)=>({
		text: m.text || '', completed: !!m.achieved
	}));

	const scaleVal = (v)=>{
		if(typeof v === 'string') return v;
		if(typeof v === 'number') return String(v);
		return '';
	};

	return {
		...existingCharacter,
		age:              f.age || '',
		gender:           f.gender || '',
		height:           f.height || '',
		shortDescription: f.description || '',
		conviction:       f.conviction || '',
		path:             f.path || '',
		scale: {
			physical: scaleVal(f.scale?.physical),
			mental:   scaleVal(f.scale?.mental),
			social:   scaleVal(f.scale?.social)
		},
		attributes: {
			might:     attrs.might?.value ?? attrs.might ?? 0,
			reflex:    attrs.reflex?.value ?? attrs.reflex ?? 0,
			endurance: attrs.endurance?.value ?? attrs.endurance ?? 0,
			reason:    attrs.reason?.value ?? attrs.reason ?? 0,
			guile:     attrs.guile?.value ?? attrs.guile ?? 0,
			resolve:   attrs.resolve?.value ?? attrs.resolve ?? 0,
			influence: attrs.influence?.value ?? attrs.influence ?? 0,
			poise:     attrs.poise?.value ?? attrs.poise ?? 0,
			command:   attrs.command?.value ?? attrs.command ?? 0
		},
		vocation:    { name: skills.vocation?.name || '', bonus: skills.vocation?.bonus || 3 },
		domainFocus: f.domainFocus || '',
		interests,
		hobbies,
		vitalityOverride:  f.health?.vitality?.max ?? null,
		willpowerOverride: f.health?.willpower?.max ?? null,
		composureOverride: f.health?.composure?.max ?? null,
		afflictions: {
			terrified:   f.afflictions?.terrified || false,
			discredited: f.afflictions?.discredited || false,
			stunned:     f.afflictions?.stunned || false,
			prone:       f.afflictions?.prone || false,
			blinded:     f.afflictions?.blinded || false,
			disoriented: f.afflictions?.disoriented || false,
			restrained:  f.afflictions?.restrained || false,
			slowed:      f.afflictions?.slowed || false,
			disarmed:    f.afflictions?.disarmed || false,
			dying:       f.afflictions?.dying || false
		},
		luckRating: f.luck?.rating || 1,
		luckTokens: f.luck?.tokens || 1,
		corruption:    f.corruption?.value || 0,
		hearthTrigger: f.corruption?.hearth ? String(f.corruption.hearth) : '',
		xpSpent:   f.xp?.spent || 0,
		unspentXP: f.xp?.unspent || 0,
		sessionXP: f.xp?.session || 0,
		totalXP:   (f.xp?.spent || 0) + (f.xp?.unspent || 0),
		wealthPoints: f.wealth || 0,
		downtime:     String(f.downtime || ''),
		lifestyle:    f.lifestyle || 0,
		convictionMilestones,
		pathMilestones,
		contacts: (f.contacts || []).map((c)=>({
			name: c.name || '', type: c.type || '', rating: c.rating || 0,
			health: c.health || 5, relationship: c.relationship || '', note: c.note || ''
		})),
		secrets: (f.secrets || []).map((s)=>({
			name: s.name || '', weight: s.weight || 0,
			spread: s.spread || [false, false, false],
			containmentPlan: s.containmentPlan || '', contacts: s.contacts || ''
		})),
		attacks: (f.attacks || []).map((a)=>({
			name: a.name || '', domain: a.domain || 'P', attribute: a.attribute || '',
			skill: a.skill || '', modifier: a.modifier || 0, rating: a.rating || ''
		})),
		edges: (f.edges || []).map((e)=>({
			name: e.name || '', dots: e.dots || 0, flavor: e.flavor || ''
		})),
		aspects: (f.aspects || []).map((a)=>({
			name: a.name || '', dots: a.dots || 0, flavor: a.flavor || ''
		})),
		burdens: (f.burdens || []).map((b)=>({
			name: b.name || '', dots: b.dots || 0, flavor: b.flavor || ''
		})),
		equipment: (f.equipment || []).map((e)=>({
			name: e.name || ''
		})),
		notes: f.biography || ''
	};
}

// ══════════════════════════════════════════════════════════════════════
// NPC Bestiary: Homebrewery → Foundry
// ══════════════════════════════════════════════════════════════════════
// Foundry NPC tiers: Mook, Tough, Rival, Boss
// Homebrewery tiers: mook, elite, boss, legend

const TIER_TO_FOUNDRY = { mook: 'mook', elite: 'tough', boss: 'rival', legend: 'boss' };
const FOUNDRY_TO_TIER = { mook: 'mook', tough: 'elite', rival: 'boss', boss: 'legend' };

export function npcToFoundry(enemy) {
	const tier = enemy.tier || 'mook';
	const foundryTier = TIER_TO_FOUNDRY[tier] || 'mook';

	const scale = {
		physical: enemy.scale?.physical || 0,
		mental:   enemy.scale?.mental || 0,
		social:   enemy.scale?.social || 0
	};

	// Traits: mook uses single string, others use array
	const traits = tier === 'mook'
		? (enemy.trait ? [{ name: 'Trait', desc: enemy.trait }] : [])
		: (enemy.traits || []).map((t)=>({ name: t.name || '', desc: t.desc || '' }));

	// ── Mook ─────────────────────────────────────────────────────────
	if(foundryTier === 'mook') {
		return {
			_foundryTier: 'mook',
			scale,
			tn: enemy.atkTN?.physical || enemy.defTN?.physical || 10,
			threshold: enemy.threshold || 2,
			size: { value: enemy.size || 3, max: enemy.size || 3 },
			traits: traits.map((t)=>t.desc || t.name),
			goal: enemy.goal || ''
		};
	}

	// Per-domain TNs (used by tough/rival/boss)
	const tn = {
		physical: enemy.atkTN?.physical || enemy.defTN?.physical || 10,
		mental:   enemy.atkTN?.mental || enemy.defTN?.mental || 10,
		social:   enemy.atkTN?.social || enemy.defTN?.social || 10
	};

	const health = {
		vitality:  { value: enemy.health?.vitality || 0,  max: enemy.health?.vitality || 0 },
		willpower: { value: enemy.health?.willpower || 0, max: enemy.health?.willpower || 0 },
		composure: { value: enemy.health?.composure || 0, max: enemy.health?.composure || 0 }
	};

	// ── Tough (elite) ────────────────────────────────────────────────
	if(foundryTier === 'tough') {
		// Determine which tracks are active (elite usually has 1)
		const activeTracks = {
			vitality:  (enemy.health?.vitality || 0) > 0,
			willpower: (enemy.health?.willpower || 0) > 0,
			composure: (enemy.health?.composure || 0) > 0
		};
		return {
			_foundryTier: 'tough',
			scale, tn, health, activeTracks,
			traits: traits.map((t)=>({ name: t.name, desc: t.desc })),
			goal: enemy.goal || ''
		};
	}

	// ── Rival (boss) ─────────────────────────────────────────────────
	if(foundryTier === 'rival') {
		return {
			_foundryTier: 'rival',
			scale, tn, health,
			traits: traits.map((t)=>({ name: t.name, desc: t.desc })),
			edges: (enemy.edges || []).map((e)=>({ name: e.name || '', dots: e.dots || 0 })),
			goal: enemy.goal || ''
		};
	}

	// ── Boss (legend) ────────────────────────────────────────────────
	return {
		_foundryTier: 'boss',
		scale, tn, health,
		attributes: {
			might:     { value: enemy.attributes?.might || 0 },
			reflex:    { value: enemy.attributes?.reflex || 0 },
			endurance: { value: enemy.attributes?.endurance || 0 },
			reason:    { value: enemy.attributes?.reason || 0 },
			guile:     { value: enemy.attributes?.guile || 0 },
			resolve:   { value: enemy.attributes?.resolve || 0 },
			influence: { value: enemy.attributes?.influence || 0 },
			poise:     { value: enemy.attributes?.poise || 0 },
			command:   { value: enemy.attributes?.command || 0 }
		},
		skills: {
			vocation:  { name: enemy.vocation?.name || '', bonus: enemy.vocation?.bonus || 3 },
			interest1: { name: (enemy.interests || [])[0]?.name || '', bonus: 2 },
			interest2: { name: (enemy.interests || [])[1]?.name || '', bonus: 2 },
			interest3: { name: (enemy.interests || [])[2]?.name || '', bonus: 2 },
			hobby1:    { name: (enemy.hobbies || [])[0]?.name || '', bonus: 1 },
			hobby2:    { name: (enemy.hobbies || [])[1]?.name || '', bonus: 1 },
			hobby3:    { name: (enemy.hobbies || [])[2]?.name || '', bonus: 1 }
		},
		conviction: enemy.conviction || '',
		path: enemy.path || '',
		traits: traits.map((t)=>({ name: t.name, desc: t.desc })),
		edges:   (enemy.edges || []).map((e)=>({ name: e.name || '', dots: e.dots || 0 })),
		aspects: (enemy.aspects || []).map((a)=>({ name: a.name || '', dots: a.dots || 0 })),
		goal: enemy.goal || ''
	};
}

// ══════════════════════════════════════════════════════════════════════
// NPC Bestiary: Foundry → Homebrewery
// ══════════════════════════════════════════════════════════════════════

export function npcFromFoundry(f) {
	// Detect tier from structure
	let tier;
	if(f._foundryTier) {
		tier = FOUNDRY_TO_TIER[f._foundryTier] || 'mook';
	} else if(f.attributes) {
		tier = 'legend';
	} else if(f.edges) {
		tier = 'boss';
	} else if(f.activeTracks) {
		tier = 'elite';
	} else if(f.size !== undefined || f.threshold !== undefined) {
		tier = 'mook';
	} else {
		// Guess from health structure
		tier = f.health ? 'elite' : 'mook';
	}

	const scale = {
		physical: f.scale?.physical || 0,
		mental:   f.scale?.mental || 0,
		social:   f.scale?.social || 0
	};

	const result = {
		name:     f.name || '',
		subtitle: f.subtitle || '',
		tier,
		tags:     f.tags || [],
		source:   f.source || '',
		scale,
		goal:     f.goal || '',
		notes:    f.notes || ''
	};

	// TNs
	if(typeof f.tn === 'number') {
		// Mook: single TN → apply to all domains
		result.atkTN = { physical: f.tn, mental: f.tn, social: f.tn };
		result.defTN = { physical: f.tn, mental: f.tn, social: f.tn };
	} else if(f.tn) {
		result.atkTN = { physical: f.tn.physical || 8, mental: f.tn.mental || 8, social: f.tn.social || 8 };
		result.defTN = { physical: f.tn.physical || 8, mental: f.tn.mental || 8, social: f.tn.social || 8 };
	}

	// Mook-specific
	if(tier === 'mook') {
		result.threshold = f.threshold || 2;
		result.size      = f.size?.max || f.size?.value || f.size || 3;
		// Traits: mook uses single string
		const traits = f.traits || [];
		if(typeof traits[0] === 'string') {
			result.trait = traits.join('; ');
		} else {
			result.trait = traits.map((t)=>t.desc || t.name || '').filter(Boolean).join('; ');
		}
		result.traits = [];
	} else {
		result.threshold = 0;
		result.size = 0;
		result.trait = '';

		// Traits array
		const traits = f.traits || [];
		result.traits = traits.map((t)=>{
			if(typeof t === 'string') return { name: t, desc: '' };
			return { name: t.name || '', desc: t.desc || '' };
		});
	}

	// Health
	if(f.health) {
		result.health = {
			vitality:  f.health.vitality?.max || f.health.vitality?.value || 0,
			willpower: f.health.willpower?.max || f.health.willpower?.value || 0,
			composure: f.health.composure?.max || f.health.composure?.value || 0
		};
	}

	// Edges
	if(f.edges) {
		result.edges = f.edges.map((e)=>({ name: e.name || '', dots: e.dots || 0 }));
	}

	// Aspects
	if(f.aspects) {
		result.aspects = f.aspects.map((a)=>({ name: a.name || '', dots: a.dots || 0 }));
	}

	// Boss-level: attributes and skills
	if(f.attributes) {
		const a = f.attributes;
		result.attributes = {
			might:     a.might?.value ?? a.might ?? 0,
			reflex:    a.reflex?.value ?? a.reflex ?? 0,
			endurance: a.endurance?.value ?? a.endurance ?? 0,
			reason:    a.reason?.value ?? a.reason ?? 0,
			guile:     a.guile?.value ?? a.guile ?? 0,
			resolve:   a.resolve?.value ?? a.resolve ?? 0,
			influence: a.influence?.value ?? a.influence ?? 0,
			poise:     a.poise?.value ?? a.poise ?? 0,
			command:   a.command?.value ?? a.command ?? 0
		};
	}

	if(f.skills) {
		result.vocation = { name: f.skills.vocation?.name || '', bonus: f.skills.vocation?.bonus || 3 };
		const interests = [];
		if(f.skills.interest1?.name) interests.push({ name: f.skills.interest1.name, bonus: 2 });
		if(f.skills.interest2?.name) interests.push({ name: f.skills.interest2.name, bonus: 2 });
		if(f.skills.interest3?.name) interests.push({ name: f.skills.interest3.name, bonus: 2 });
		result.interests = interests;
		const hobbies = [];
		if(f.skills.hobby1?.name) hobbies.push({ name: f.skills.hobby1.name, bonus: 1 });
		if(f.skills.hobby2?.name) hobbies.push({ name: f.skills.hobby2.name, bonus: 1 });
		if(f.skills.hobby3?.name) hobbies.push({ name: f.skills.hobby3.name, bonus: 1 });
		result.hobbies = hobbies;
	}

	if(f.conviction) result.conviction = f.conviction;
	if(f.path) result.path = f.path;

	return result;
}
