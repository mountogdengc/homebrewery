import express      from 'express';
import asyncHandler from 'express-async-handler';
import config       from './config.js';

const router = express.Router();

const getLmStudioUrl = ()=>config.get('lm_studio_url') || 'http://localhost:1234';

// ── Health check — is LM Studio reachable? ───────────────────────────
router.get('/api/ai/status', asyncHandler(async (req, res)=>{
	try {
		const response = await fetch(`${getLmStudioUrl()}/v1/models`, {
			signal: AbortSignal.timeout(3000)
		});
		const data = await response.json();
		res.status(200).send({ available: true, models: data.data?.map((m)=>m.id) || [] });
	} catch (err) {
		res.status(200).send({ available: false, error: err.message });
	}
}));

// ── Shared request helper ────────────────────────────────────────────
async function callLmStudio(systemPrompt, userPrompt, opts = {}) {
	const temperature = opts.temperature ?? 0.7;
	const maxTokens   = opts.maxTokens ?? 8000;
	const timeout     = opts.timeout ?? 180000;

	const response = await fetch(`${getLmStudioUrl()}/v1/chat/completions`, {
		method  : 'POST',
		headers : { 'Content-Type': 'application/json' },
		body    : JSON.stringify({
			messages : [
				{ role: 'system', content: systemPrompt },
				{ role: 'user',   content: userPrompt }
			],
			response_format : { type: 'json_schema', json_schema: { name: 'result', strict: false, schema: { type: 'object' } } },
			temperature,
			max_tokens : maxTokens
		}),
		signal: AbortSignal.timeout(timeout)
	});

	if(!response.ok) {
		const errText = await response.text();
		throw new Error(`LM Studio returned ${response.status}: ${errText}`);
	}

	const data = await response.json();
	const content = data.choices?.[0]?.message?.content;
	if(!content) throw new Error('No content in response');
	return JSON.parse(content);
}

// ── SRD Reference Search ─────────────────────────────────────────────
const SRD_API = 'https://www.dnd5eapi.co/api/2014';
let srdMonsterIndex = null;

async function getSrdMonsterIndex() {
	if(srdMonsterIndex) return srdMonsterIndex;
	try {
		const res = await fetch(`${SRD_API}/monsters`, { signal: AbortSignal.timeout(5000) });
		const data = await res.json();
		srdMonsterIndex = data.results || [];
		return srdMonsterIndex;
	} catch (err) {
		console.error('Failed to fetch SRD monster index:', err.message);
		return [];
	}
}

async function fetchSrdMonster(index) {
	try {
		const res = await fetch(`${SRD_API}/monsters/${index}`, { signal: AbortSignal.timeout(5000) });
		if(!res.ok) return null;
		return await res.json();
	} catch (err) {
		return null;
	}
}

function summarizeSrdMonster(m) {
	const mods = (score)=>{ const mod = Math.floor((score - 10) / 2); return mod >= 0 ? `+${mod}` : `${mod}`; };
	const profs = (m.proficiencies || []).map((p)=>`${p.proficiency?.name || ''} ${mods(p.value)}`).join(', ');
	const specials = (m.special_abilities || []).map((a)=>`${a.name}: ${a.desc?.substring(0, 120)}...`).join('\n  ');
	const actions = (m.actions || []).map((a)=>`${a.name}: ${a.desc?.substring(0, 150)}...`).join('\n  ');

	return `── ${m.name} (CR ${m.challenge_rating}, ${m.size} ${m.type}) ──
  AC ${m.armor_class?.[0]?.value || '?'}, HP ${m.hit_points} (${m.hit_points_roll || m.hit_dice})
  STR ${m.strength}(${mods(m.strength)}) DEX ${m.dexterity}(${mods(m.dexterity)}) CON ${m.constitution}(${mods(m.constitution)}) INT ${m.intelligence}(${mods(m.intelligence)}) WIS ${m.wisdom}(${mods(m.wisdom)}) CHA ${m.charisma}(${mods(m.charisma)})
  Proficiencies: ${profs || 'none'}
  Abilities: ${specials || 'none'}
  Actions: ${actions || 'none'}`;
}

async function findSrdReferences(prompt) {
	const index = await getSrdMonsterIndex();
	if(index.length === 0) return '';

	// Extract keywords and CR from the prompt
	const crMatch = prompt.match(/\bCR\s*(\d+(?:\/\d+)?)\b/i);
	const targetCR = crMatch ? crMatch[1] : null;
	const words = prompt.toLowerCase().split(/\s+/).filter((w)=>w.length > 3);

	// Score each monster by keyword match
	const scored = index.map((entry)=>{
		const name = entry.name.toLowerCase();
		let score = 0;
		for (const w of words) {
			if(name.includes(w)) score += 3;
		}
		// Boost type keywords
		const types = ['undead', 'fiend', 'dragon', 'beast', 'aberration', 'celestial', 'construct', 'elemental', 'fey', 'giant', 'humanoid', 'monstrosity', 'ooze', 'plant'];
		for (const t of types) {
			if(words.includes(t) && name.includes(t)) score += 2;
		}
		return { ...entry, score };
	}).filter((e)=>e.score > 0).sort((a, b)=>b.score - a.score).slice(0, 3);

	// If we have a target CR but no keyword matches, find creatures near that CR
	const toFetch = scored.length > 0 ? scored : [];
	if(targetCR && scored.length < 2) {
		// Fetch a few random monsters near the target CR to use as calibration
		const crNum = eval(targetCR); // handles "1/4" etc
		const crMonsters = [];
		// Pick some well-known monsters to fetch by CR
		const wellKnown = [
			'adult-black-dragon', 'adult-blue-dragon', 'adult-red-dragon',
			'beholder', 'vampire', 'lich', 'mummy-lord', 'pit-fiend',
			'young-red-dragon', 'hill-giant', 'frost-giant', 'fire-giant',
			'troll', 'wyvern', 'basilisk', 'owlbear', 'minotaur',
			'knight', 'mage', 'archmage', 'assassin', 'bandit-captain',
			'dire-wolf', 'giant-spider', 'ogre', 'ettin', 'hydra',
			'roc', 'treant', 'deva', 'planetar', 'solar'
		];
		for (const idx of wellKnown) {
			if(toFetch.length >= 3) break;
			if(!toFetch.find((e)=>e.index === idx)) {
				toFetch.push({ index: idx, name: idx });
			}
		}
	}

	if(toFetch.length === 0) return '';

	// Fetch full stat blocks
	const monsters = [];
	for (const entry of toFetch.slice(0, 3)) {
		const m = await fetchSrdMonster(entry.index);
		if(m) {
			// Filter by CR proximity if we have a target
			if(targetCR) {
				const crNum = targetCR.includes('/') ? eval(targetCR) : parseFloat(targetCR);
				const mCR = typeof m.challenge_rating === 'string' && m.challenge_rating.includes('/')
					? eval(m.challenge_rating) : parseFloat(m.challenge_rating);
				if(Math.abs(mCR - crNum) <= 5) monsters.push(m);
			} else {
				monsters.push(m);
			}
		}
	}

	if(monsters.length === 0) return '';

	const summaries = monsters.map(summarizeSrdMonster).join('\n\n');
	return `\n══════════════════════════════════════
REFERENCE CREATURES FROM THE SRD (for calibration — do NOT copy these, use them to calibrate your stats)
══════════════════════════════════════
${summaries}

Use these as reference for appropriate stat ranges at this CR level. Your creature should be ORIGINAL, not a copy.`;
}

// ── Generate stat block (5e) ─────────────────────────────────────────
router.post('/api/ai/generate/statblock', asyncHandler(async (req, res)=>{
	const { prompt, system } = req.body;
	if(!prompt) return res.status(400).send({ error: 'prompt is required' });

	const systemPrompt = system || `You are an expert D&D 5e (2024) monster designer. Return ONLY valid JSON, no markdown, no commentary. Design an original, creative creature.

══════════════════════════════════════
MANDATORY MATH RULES
══════════════════════════════════════
ABILITY MODIFIER: floor((score - 10) / 2)

HIT POINTS: number_of_hit_dice × avg_hit_die + (CON_modifier × number_of_hit_dice)
  Hit die by size: Tiny=d4(2), Small=d6(3), Medium=d8(4), Large=d10(5), Huge=d12(6), Gargantuan=d20(10)
  Formula string format example: "10d8+30"

PROFICIENCY BONUS by CR:
  0-4: +2 | 5-8: +3 | 9-12: +4 | 13-16: +5 | 17-20: +6 | 21-24: +7 | 25-28: +8 | 29-30: +9

SAVING THROW = proficiency_bonus + ability_modifier (for proficient saves only)
SKILL BONUS = proficiency_bonus + ability_modifier (for proficient skills only)
SPELL SAVE DC = 8 + proficiency_bonus + spellcasting_ability_modifier
SPELL ATTACK BONUS = proficiency_bonus + spellcasting_ability_modifier
PASSIVE PERCEPTION = 10 + WIS_modifier (+ proficiency_bonus if proficient in Perception)

══════════════════════════════════════
CR REFERENCE TABLE (DMG p. 274)
══════════════════════════════════════
CR  | Prof | AC | HP Range   | Atk Bonus | Dmg/Round | Save DC
0   |  +2  | 13 | 1-6        |    +3     |   0-1     |   13
1/8 |  +2  | 13 | 7-35       |    +3     |   2-3     |   13
1/4 |  +2  | 13 | 36-49      |    +3     |   4-5     |   13
1/2 |  +2  | 13 | 50-70      |    +3     |   6-8     |   13
1   |  +2  | 13 | 71-85      |    +3     |   9-14    |   13
2   |  +2  | 13 | 86-100     |    +3     |  15-20    |   13
3   |  +2  | 13 | 101-115    |    +4     |  21-26    |   13
4   |  +2  | 14 | 116-130    |    +5     |  27-32    |   14
5   |  +3  | 15 | 131-145    |    +6     |  33-38    |   15
6   |  +3  | 15 | 146-160    |    +6     |  39-44    |   15
7   |  +3  | 15 | 161-175    |    +6     |  45-50    |   15
8   |  +3  | 16 | 176-190    |    +7     |  51-56    |   16
9   |  +4  | 16 | 191-205    |    +7     |  57-62    |   16
10  |  +4  | 17 | 206-220    |    +7     |  63-68    |   17
11  |  +4  | 17 | 221-235    |    +8     |  69-74    |   17
12  |  +4  | 17 | 236-250    |    +8     |  75-80    |   17
13  |  +5  | 18 | 251-275    |    +8     |  81-86    |   18
14  |  +5  | 18 | 276-300    |    +8     |  87-92    |   18
15  |  +5  | 18 | 301-325    |    +8     |  93-98    |   18
16  |  +5  | 18 | 326-350    |    +9     |  99-104   |   18
17  |  +6  | 19 | 351-375    |   +10     | 105-110   |   19
18  |  +6  | 19 | 376-400    |   +10     | 111-116   |   19
19  |  +6  | 19 | 401-425    |   +10     | 117-122   |   19
20  |  +6  | 19 | 426-450    |   +10     | 123-140   |   19

══════════════════════════════════════
CR INFERENCE RULES (when CR is not provided)
══════════════════════════════════════
1. Estimate Defensive CR: Find the row where HP Range fits. Adjust +/-1 if AC is 2+ above/below the table value.
2. Estimate Offensive CR: Find the row where Damage/Round fits. Adjust +/-1 if Attack Bonus or Save DC is 2+ above/below the table value.
3. Final CR = average of Defensive CR and Offensive CR, rounded to nearest valid CR.

══════════════════════════════════════
CONSTRAINTS
══════════════════════════════════════
- Every numeric stat must be consistent with the math rules above. Do not invent numbers that contradict the formulas.
- Ability scores: No score above 20 for CR 1-10. Max 22 for CR 11-16. Max 24 for CR 17-23. Only CR 24+ can exceed 24.
- Exactly 2 saving throw proficiencies. The other 4 must have proficient:false. All override values must be null.
- No more than 4 skill proficiencies unless the description specifically calls for more. All override values must be null. Expertise on at most 1 skill.
- Legendary actions are only appropriate for CR 7+ creatures. Each legendary action must have a "cost" field (1, 2, or 3).
- All damage expressions must use valid dice notation: NdX+Y.
- Actions must include at least one attack. Every attack must state: attack bonus, reach/range, target, hit damage with dice notation and type.
  Format: "Melee Weapon Attack: +X to hit, reach 5 ft., one target. Hit: N (XdY + Z) type damage."
- Save DCs must be calculated: DC = 8 + proficiency_bonus + ability_modifier. Write the number.
- Senses: write the passive Perception as a calculated number. No notes or instructions in the string.
- Languages: choose languages appropriate to the creature. Intelligent creatures can speak.
- Traits must have concrete mechanical effects (advantage, extra damage, conditions, etc), not flavor text.
- Do not include fields not in the schema.

══════════════════════════════════════
JSON SCHEMA
══════════════════════════════════════
{
  "name": "string",
  "size": "Tiny|Small|Medium|Large|Huge|Gargantuan",
  "type": "Aberration|Beast|Celestial|Construct|Dragon|Elemental|Fey|Fiend|Giant|Humanoid|Monstrosity|Ooze|Plant|Undead",
  "subtype": "",
  "alignment": "string",
  "ac": { "value": number, "description": "armor type" },
  "hp": { "average": number, "formula": "NdX+Y" },
  "speed": { "walk": 30, "fly": 0, "swim": 0, "burrow": 0, "climb": 0, "hover": false },
  "abilities": { "str": number, "dex": number, "con": number, "int": number, "wis": number, "cha": number },
  "savingThrows": {
    "str": { "proficient": false, "override": null },
    "dex": { "proficient": false, "override": null },
    "con": { "proficient": false, "override": null },
    "int": { "proficient": false, "override": null },
    "wis": { "proficient": false, "override": null },
    "cha": { "proficient": false, "override": null }
  },
  "skills": {
    "acrobatics": { "proficient": false, "expertise": false, "override": null },
    "animalHandling": { "proficient": false, "expertise": false, "override": null },
    "arcana": { "proficient": false, "expertise": false, "override": null },
    "athletics": { "proficient": false, "expertise": false, "override": null },
    "deception": { "proficient": false, "expertise": false, "override": null },
    "history": { "proficient": false, "expertise": false, "override": null },
    "insight": { "proficient": false, "expertise": false, "override": null },
    "intimidation": { "proficient": false, "expertise": false, "override": null },
    "investigation": { "proficient": false, "expertise": false, "override": null },
    "medicine": { "proficient": false, "expertise": false, "override": null },
    "nature": { "proficient": false, "expertise": false, "override": null },
    "perception": { "proficient": false, "expertise": false, "override": null },
    "performance": { "proficient": false, "expertise": false, "override": null },
    "persuasion": { "proficient": false, "expertise": false, "override": null },
    "religion": { "proficient": false, "expertise": false, "override": null },
    "sleightOfHand": { "proficient": false, "expertise": false, "override": null },
    "stealth": { "proficient": false, "expertise": false, "override": null },
    "survival": { "proficient": false, "expertise": false, "override": null }
  },
  "cr": "string",
  "senses": "string with passive Perception number",
  "languages": "string",
  "damageVulnerabilities": "",
  "damageResistances": "",
  "damageImmunities": "",
  "conditionImmunities": "",
  "traits": [{ "name": "string", "description": "string with mechanical effects" }],
  "actions": [{ "name": "string", "description": "string with attack bonus, damage dice, etc" }],
  "bonusActions": [],
  "reactions": [],
  "legendary": { "count": 0, "preamble": "", "actions": [] }
}`;

	try {
		// Fetch SRD references for context
		const references = await findSrdReferences(prompt);
		const enrichedPrompt = references
			? `${prompt}\n${references}`
			: prompt;

		const parsed = await callLmStudio(systemPrompt, enrichedPrompt);
		res.status(200).send(parsed);
	} catch (err) {
		console.error('AI generate error:', err);
		res.status(502).send({ error: `AI generation failed: ${err.message}` });
	}
}));

// ── Generate BRP stat block ──────────────────────────────────────────
router.post('/api/ai/generate/brp-statblock', asyncHandler(async (req, res)=>{
	const { prompt, system } = req.body;
	if(!prompt) return res.status(400).send({ error: 'prompt is required' });

	const systemPrompt = system || `You are a Chaosium BRP (Basic Roleplaying) creature/NPC designer. Return ONLY valid JSON, no markdown, no commentary.

RULES:
- Characteristics use 3d6 range (3-18) for humans. Larger creatures can exceed this.
- Skills are percentile-based (1-100+). Base skills start around 25-50 for trained individuals.
- Weapons must include skill percentage, damage with dice notation (e.g. "1d8+1+db" where db=damage bonus), range, attack rate, parry %, and weapon HP.
- Traits must have mechanical effects, not just flavor.
- Hit locations are optional but encouraged for important NPCs.

JSON SCHEMA:
{
  "name": "string",
  "category": "Human|Animal|Construct|Demon|Dragon|Elemental|Faerie|Giant|Monster|Spirit|Undead|Other",
  "subtype": "string or empty",
  "description": "short description",
  "characteristics": { "str": number, "con": number, "siz": number, "int": number, "pow": number, "dex": number, "cha": number },
  "moveRate": number,
  "armorPoints": number,
  "armorDescription": "string or empty",
  "skills": [{ "name": "string", "value": number, "category": "Combat|Communication|Manipulation|Mental|Perception|Physical" }],
  "weapons": [{ "name": "string", "skill": number, "damage": "string like 1d6+db", "range": "string", "rate": "string", "parry": number, "hp": number }],
  "spells": [{ "name": "string", "cost": "string", "description": "string" }],
  "traits": [{ "name": "string", "description": "string" }],
  "hitLocations": [],
  "notes": ""
}`;

	try {
		const parsed = await callLmStudio(systemPrompt, prompt);
		res.status(200).send(parsed);
	} catch (err) {
		console.error('AI generate error:', err);
		res.status(502).send({ error: `AI generation failed: ${err.message}` });
	}
}));

// ── Generate Willowlight stat block ──────────────────────────────────
router.post('/api/ai/generate/willowlight-statblock', asyncHandler(async (req, res)=>{
	const { prompt, system } = req.body;
	if(!prompt) return res.status(400).send({ error: 'prompt is required' });

	const systemPrompt = system || `You are a Willowlight Engine game designer. Return ONLY valid JSON, no markdown, no commentary.

The Willowlight Engine uses 9 attributes rated 0-5 in three groups:
  Physical: Might, Reflex, Endurance
  Mental: Reason, Guile, Resolve
  Social: Influence, Poise, Command

RULES:
- Attributes range 0-5. Most NPCs have attributes in the 1-3 range. Specialists reach 4-5 in one or two attributes.
- Attacks have a domain (P=Physical, M=Mental, S=Social), an attribute, a skill name, a modifier, and a rating/tier.
- Edges are advantages (rated 1-5 dots). Aspects are defining qualities (rated 1-5 dots). Burdens are disadvantages (rated 1-5 dots).
- Create flavorful, balanced characters with interesting edges and burdens.

JSON SCHEMA:
{
  "name": "string",
  "conviction": "string — the character's core drive",
  "path": "string — the character's role or archetype",
  "shortDescription": "one-line summary",
  "attributes": { "might": 0-5, "reflex": 0-5, "endurance": 0-5, "reason": 0-5, "guile": 0-5, "resolve": 0-5, "influence": 0-5, "poise": 0-5, "command": 0-5 },
  "scale": { "physical": "string or empty", "mental": "string or empty", "social": "string or empty" },
  "vocation": { "name": "string", "bonus": number },
  "interests": [{ "name": "string", "bonus": 2 }],
  "hobbies": [{ "name": "string", "bonus": 1 }],
  "attacks": [{ "name": "string", "domain": "P|M|S", "attribute": "might|reflex|endurance|reason|guile|resolve|influence|poise|command", "skill": "string", "modifier": number, "rating": "string" }],
  "edges": [{ "name": "string", "dots": 1-5 }],
  "aspects": [{ "name": "string", "dots": 1-5 }],
  "burdens": [{ "name": "string", "dots": 1-5 }],
  "notes": ""
}`;

	try {
		const parsed = await callLmStudio(systemPrompt, prompt);
		res.status(200).send(parsed);
	} catch (err) {
		console.error('AI generate error:', err);
		res.status(502).send({ error: `AI generation failed: ${err.message}` });
	}
}));

export default router;
