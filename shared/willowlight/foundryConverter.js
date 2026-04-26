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

	// Build items array from attacks, edges, aspects, burdens, gear
	const items = [];

	(ch.attacks || []).forEach((a)=>{
		items.push({
			name: a.name || '', type: 'attack',
			system: {
				domain:       a.domain || 'physical',
				attribute:    a.attribute || '',
				skillBonus:   a.modifier || 0,
				modifier:     a.modifier || 0,
				weaponRating: a.rating ? parseInt(a.rating) || 0 : 0
			}
		});
	});

	(ch.edges || []).forEach((e)=>{
		items.push({ name: e.name || '', type: 'edge', system: { rating: e.dots || 0 } });
	});

	(ch.aspects || []).forEach((a)=>{
		items.push({ name: a.name || '', type: 'aspect', system: { dot: a.dots || 0, attribute: a.attribute || '' } });
	});

	(ch.burdens || []).forEach((b)=>{
		items.push({ name: b.name || '', type: 'burden', system: { rating: b.dots || 0 } });
	});

	(ch.equipment || []).forEach((e)=>{
		items.push({ name: e.name || '', type: 'gear', system: { quantity: 1, description: '' } });
	});

	return {
		name: ch.name || '',
		type: 'pc',
		system: {
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
			equipment: [],
			biography: ch.notes || ''
		},
		items
	};
}

// ══════════════════════════════════════════════════════════════════════
// PC: Foundry → Homebrewery
// ══════════════════════════════════════════════════════════════════════

export function fromFoundry(f, existingCharacter = {}) {
	// Support both new Actor-envelope format and legacy flat format
	const sys = f.system || f;
	const items = f.items || [];

	const attrs = sys.attributes || {};
	const skills = sys.skills || {};

	const interests = [];
	if(skills.interest1?.name) interests.push({ name: skills.interest1.name, bonus: 2 });
	if(skills.interest2?.name) interests.push({ name: skills.interest2.name, bonus: 2 });
	if(skills.interest3?.name) interests.push({ name: skills.interest3.name, bonus: 2 });

	const hobbies = [];
	if(skills.hobby1?.name) hobbies.push({ name: skills.hobby1.name, bonus: 1 });
	if(skills.hobby2?.name) hobbies.push({ name: skills.hobby2.name, bonus: 1 });
	if(skills.hobby3?.name) hobbies.push({ name: skills.hobby3.name, bonus: 1 });

	const convictionMilestones = (sys.milestones?.conviction || []).map((m)=>({
		text: m.text || '', completed: !!m.achieved
	}));
	const pathMilestones = (sys.milestones?.path || []).map((m)=>({
		text: m.text || '', completed: !!m.achieved
	}));

	const scaleVal = (v)=>{
		if(typeof v === 'string') return v;
		if(typeof v === 'number') return String(v);
		return '';
	};

	// Extract items by type
	const attackItems   = items.filter((i)=>i.type === 'attack');
	const edgeItems     = items.filter((i)=>i.type === 'edge');
	const aspectItems   = items.filter((i)=>i.type === 'aspect');
	const burdenItems   = items.filter((i)=>i.type === 'burden');
	const gearItems     = items.filter((i)=>i.type === 'gear' || i.type === 'equipment');

	// Attacks: prefer items, fall back to legacy
	const attacks = attackItems.length
		? attackItems.map((a)=>({
			name: a.name || '', domain: a.system?.domain || 'physical', attribute: a.system?.attribute || '',
			skill: '', modifier: a.system?.modifier || 0, rating: String(a.system?.weaponRating || 0)
		}))
		: (sys.attacks || []).map((a)=>({
			name: a.name || '', domain: a.domain || 'P', attribute: a.attribute || '',
			skill: a.skill || '', modifier: a.modifier || 0, rating: a.rating || ''
		}));

	const edges = edgeItems.length
		? edgeItems.map((e)=>({ name: e.name || '', dots: e.system?.rating || 0, flavor: '' }))
		: (sys.edges || []).map((e)=>({ name: e.name || '', dots: e.dots || 0, flavor: e.flavor || '' }));

	const aspects = aspectItems.length
		? aspectItems.map((a)=>({ name: a.name || '', dots: a.system?.dot || 0, attribute: a.system?.attribute || '', flavor: '' }))
		: (sys.aspects || []).map((a)=>({ name: a.name || '', dots: a.dots || 0, flavor: a.flavor || '' }));

	const burdens = burdenItems.length
		? burdenItems.map((b)=>({ name: b.name || '', dots: b.system?.rating || 0, flavor: '' }))
		: (sys.burdens || []).map((b)=>({ name: b.name || '', dots: b.dots || 0, flavor: b.flavor || '' }));

	const equipment = gearItems.length
		? gearItems.map((e)=>({ name: e.name || '' }))
		: (sys.equipment || []).map((e)=>({ name: e.name || '' }));

	return {
		...existingCharacter,
		name:             f.name || existingCharacter.name || '',
		age:              sys.age || '',
		gender:           sys.gender || '',
		height:           sys.height || '',
		shortDescription: sys.description || '',
		conviction:       sys.conviction || '',
		path:             sys.path || '',
		scale: {
			physical: scaleVal(sys.scale?.physical),
			mental:   scaleVal(sys.scale?.mental),
			social:   scaleVal(sys.scale?.social)
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
		domainFocus: sys.domainFocus || '',
		interests,
		hobbies,
		vitalityOverride:  sys.health?.vitality?.max ?? null,
		willpowerOverride: sys.health?.willpower?.max ?? null,
		composureOverride: sys.health?.composure?.max ?? null,
		afflictions: {
			terrified:   sys.afflictions?.terrified || false,
			discredited: sys.afflictions?.discredited || false,
			stunned:     sys.afflictions?.stunned || false,
			prone:       sys.afflictions?.prone || false,
			blinded:     sys.afflictions?.blinded || false,
			disoriented: sys.afflictions?.disoriented || false,
			restrained:  sys.afflictions?.restrained || false,
			slowed:      sys.afflictions?.slowed || false,
			disarmed:    sys.afflictions?.disarmed || false,
			dying:       sys.afflictions?.dying || false
		},
		luckRating: sys.luck?.rating || 1,
		luckTokens: sys.luck?.tokens || 1,
		corruption:    sys.corruption?.value || 0,
		hearthTrigger: sys.corruption?.hearth ? String(sys.corruption.hearth) : '',
		xpSpent:   sys.xp?.spent || 0,
		unspentXP: sys.xp?.unspent || 0,
		sessionXP: sys.xp?.session || 0,
		totalXP:   (sys.xp?.spent || 0) + (sys.xp?.unspent || 0),
		wealthPoints: sys.wealth || 0,
		downtime:     String(sys.downtime || ''),
		lifestyle:    sys.lifestyle || 0,
		convictionMilestones,
		pathMilestones,
		contacts: (sys.contacts || []).map((c)=>({
			name: c.name || '', type: c.type || '', rating: c.rating || 0,
			health: c.health || 5, relationship: c.relationship || '', note: c.note || ''
		})),
		secrets: (sys.secrets || []).map((s)=>({
			name: s.name || '', weight: s.weight || 0,
			spread: s.spread || [false, false, false],
			containmentPlan: s.containmentPlan || '', contacts: s.contacts || ''
		})),
		attacks,
		edges,
		aspects,
		burdens,
		equipment,
		notes: sys.biography || ''
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

	// Build items array from attacks, traits, edges, aspects
	const items = [];

	// Attacks
	(enemy.attacks || []).forEach((a)=>{
		items.push({
			name: a.name || '', type: 'attack',
			system: {
				domain:       a.domain || 'physical',
				attribute:    a.attribute || '',
				skillBonus:   a.skillBonus ?? a.modifier ?? 0,
				modifier:     a.modifier || 0,
				weaponRating: a.rating ? parseInt(a.rating) || 0 : 0
			}
		});
	});

	// Traits: mook uses single string, others use array
	if(tier === 'mook') {
		if(enemy.trait) {
			items.push({ name: 'Trait', type: 'trait', system: { effect: enemy.trait } });
		}
	} else {
		(enemy.traits || []).forEach((t)=>{
			items.push({ name: t.name || '', type: 'trait', system: { effect: t.desc || '' } });
		});
	}

	// Edges
	(enemy.edges || []).forEach((e)=>{
		items.push({ name: e.name || '', type: 'edge', system: { rating: e.dots || 0 } });
	});

	// Aspects (legend only, but include if present)
	(enemy.aspects || []).forEach((a)=>{
		items.push({ name: a.name || '', type: 'aspect', system: { dot: a.dots || 0, attribute: '' } });
	});

	// ── Mook ─────────────────────────────────────────────────────────
	if(foundryTier === 'mook') {
		return {
			name: enemy.name || '',
			type: 'mook',
			system: {
				tn: enemy.atkTN?.physical || enemy.defTN?.physical || 10,
				scale,
				threshold: enemy.threshold || 2,
				size: { value: enemy.size || 3, max: enemy.size || 3 },
				goal: enemy.goal || ''
			},
			items
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
		return {
			name: enemy.name || '',
			type: 'tough',
			system: { tn, scale, health, goal: enemy.goal || '' },
			items
		};
	}

	// ── Rival (boss) ─────────────────────────────────────────────────
	if(foundryTier === 'rival') {
		return {
			name: enemy.name || '',
			type: 'rival',
			system: { tn, scale, health, goal: enemy.goal || '' },
			items
		};
	}

	// ── Boss (legend) ────────────────────────────────────────────────
	return {
		name: enemy.name || '',
		type: 'boss',
		system: {
			tn, scale, health,
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
			goal: enemy.goal || ''
		},
		items
	};
}

// ══════════════════════════════════════════════════════════════════════
// NPC Bestiary: Foundry → Homebrewery
// ══════════════════════════════════════════════════════════════════════

export function npcFromFoundry(f) {
	// Support both new Actor-envelope format and legacy flat format
	const sys = f.system || f;
	const items = f.items || [];

	// Detect tier from Actor type field or legacy detection
	let tier;
	if(f.type) {
		tier = FOUNDRY_TO_TIER[f.type] || 'mook';
	} else if(f._foundryTier) {
		tier = FOUNDRY_TO_TIER[f._foundryTier] || 'mook';
	} else if(sys.attributes) {
		tier = 'legend';
	} else if(sys.threshold !== undefined || sys.size !== undefined) {
		tier = 'mook';
	} else {
		tier = sys.health ? 'elite' : 'mook';
	}

	const scale = {
		physical: sys.scale?.physical || 0,
		mental:   sys.scale?.mental || 0,
		social:   sys.scale?.social || 0
	};

	const result = {
		name:     f.name || '',
		subtitle: f.subtitle || '',
		tier,
		tags:     f.tags || [],
		source:   f.source || '',
		scale,
		goal:     sys.goal || '',
		notes:    sys.notes || f.notes || ''
	};

	// TNs
	if(typeof sys.tn === 'number') {
		result.atkTN = { physical: sys.tn, mental: sys.tn, social: sys.tn };
		result.defTN = { physical: sys.tn, mental: sys.tn, social: sys.tn };
	} else if(sys.tn) {
		result.atkTN = { physical: sys.tn.physical || 8, mental: sys.tn.mental || 8, social: sys.tn.social || 8 };
		result.defTN = { physical: sys.tn.physical || 8, mental: sys.tn.mental || 8, social: sys.tn.social || 8 };
	}

	// Extract items by type
	const attackItems = items.filter((i)=>i.type === 'attack');
	const traitItems  = items.filter((i)=>i.type === 'trait');
	const edgeItems   = items.filter((i)=>i.type === 'edge');
	const aspectItems = items.filter((i)=>i.type === 'aspect');

	// Attacks
	result.attacks = attackItems.map((a)=>({
		name:      a.name || '',
		domain:    a.system?.domain || 'physical',
		attribute: a.system?.attribute || '',
		skill:     '',
		modifier:  a.system?.modifier || 0,
		rating:    String(a.system?.weaponRating || 0)
	}));

	// Mook-specific
	if(tier === 'mook') {
		result.threshold = sys.threshold || 2;
		result.size      = sys.size?.max || sys.size?.value || sys.size || 3;
		// Traits: mook uses single string
		if(traitItems.length) {
			result.trait = traitItems.map((t)=>t.system?.effect || t.name || '').filter(Boolean).join('; ');
		} else {
			// Legacy: traits on sys directly
			const traits = sys.traits || [];
			if(typeof traits[0] === 'string') {
				result.trait = traits.join('; ');
			} else {
				result.trait = traits.map((t)=>t.desc || t.name || '').filter(Boolean).join('; ');
			}
		}
		result.traits = [];
	} else {
		result.threshold = 0;
		result.size = 0;
		result.trait = '';

		// Traits array
		if(traitItems.length) {
			result.traits = traitItems.map((t)=>({ name: t.name || '', desc: t.system?.effect || '' }));
		} else {
			// Legacy
			const traits = sys.traits || [];
			result.traits = traits.map((t)=>{
				if(typeof t === 'string') return { name: t, desc: '' };
				return { name: t.name || '', desc: t.desc || '' };
			});
		}
	}

	// Health
	const hp = sys.health;
	if(hp) {
		result.health = {
			vitality:  hp.vitality?.max || hp.vitality?.value || 0,
			willpower: hp.willpower?.max || hp.willpower?.value || 0,
			composure: hp.composure?.max || hp.composure?.value || 0
		};
	}

	// Edges
	if(edgeItems.length) {
		result.edges = edgeItems.map((e)=>({ name: e.name || '', dots: e.system?.rating || 0 }));
	} else if(sys.edges) {
		result.edges = sys.edges.map((e)=>({ name: e.name || '', dots: e.dots || 0 }));
	}

	// Aspects
	if(aspectItems.length) {
		result.aspects = aspectItems.map((a)=>({ name: a.name || '', dots: a.system?.dot || a.system?.rating || 0 }));
	} else if(sys.aspects) {
		result.aspects = sys.aspects.map((a)=>({ name: a.name || '', dots: a.dots || 0 }));
	}

	// Legend-level: attributes and skills from system
	if(sys.attributes) {
		const a = sys.attributes;
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

	if(sys.skills) {
		result.vocation = { name: sys.skills.vocation?.name || '', bonus: sys.skills.vocation?.bonus || 3 };
		const interests = [];
		if(sys.skills.interest1?.name) interests.push({ name: sys.skills.interest1.name, bonus: 2 });
		if(sys.skills.interest2?.name) interests.push({ name: sys.skills.interest2.name, bonus: 2 });
		if(sys.skills.interest3?.name) interests.push({ name: sys.skills.interest3.name, bonus: 2 });
		result.interests = interests;
		const hobbies = [];
		if(sys.skills.hobby1?.name) hobbies.push({ name: sys.skills.hobby1.name, bonus: 1 });
		if(sys.skills.hobby2?.name) hobbies.push({ name: sys.skills.hobby2.name, bonus: 1 });
		if(sys.skills.hobby3?.name) hobbies.push({ name: sys.skills.hobby3.name, bonus: 1 });
		result.hobbies = hobbies;
	}

	if(sys.conviction) result.conviction = sys.conviction;
	if(sys.path) result.path = sys.path;

	return result;
}
