import mongoose   from 'mongoose';
import { nanoid } from 'nanoid';

const StatblockSchema = mongoose.Schema({
	shareId   : { type: String, default: ()=>{return nanoid(12);}, index: { unique: true } },
	editId    : { type: String, default: ()=>{return nanoid(12);}, index: { unique: true } },
	authors   : { type: [String], index: true },
	published : { type: Boolean, default: false, index: true },
	system    : { type: String, default: '5e2024', index: true },

	// Identity
	name      : { type: String, default: '', index: true },
	size      : { type: String, default: 'Medium' },
	type      : { type: String, default: 'Humanoid', index: true },
	subtype   : { type: String, default: '' },
	alignment : { type: String, default: 'True Neutral' },
	isHomebrew: { type: Boolean, default: false },
	source    : { type: String, default: '' },
	tags      : { type: [String], index: true },
	habitat   : { type: String, default: '' },
	treasure  : { type: String, default: '' },

	// Combat stats
	ac                 : { type: Object, default: { value: 10, description: '' } },
	hp                 : { type: Object, default: { average: 0, formula: '' } },
	initiativeOverride : { type: Number, default: null },
	speed              : { type: Object, default: { walk: 30, fly: 0, swim: 0, burrow: 0, climb: 0, hover: false } },

	// Ability scores
	abilities    : { type: Object, default: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 } },

	// Saving throws & skills (mixed — deeply nested objects)
	savingThrows : { type: mongoose.Schema.Types.Mixed, default: ()=>({
		str: { proficient: false, override: null }, dex: { proficient: false, override: null },
		con: { proficient: false, override: null }, int: { proficient: false, override: null },
		wis: { proficient: false, override: null }, cha: { proficient: false, override: null }
	}) },
	skills : { type: mongoose.Schema.Types.Mixed, default: ()=>({
		acrobatics: { proficient: false, expertise: false, override: null },
		animalHandling: { proficient: false, expertise: false, override: null },
		arcana: { proficient: false, expertise: false, override: null },
		athletics: { proficient: false, expertise: false, override: null },
		deception: { proficient: false, expertise: false, override: null },
		history: { proficient: false, expertise: false, override: null },
		insight: { proficient: false, expertise: false, override: null },
		intimidation: { proficient: false, expertise: false, override: null },
		investigation: { proficient: false, expertise: false, override: null },
		medicine: { proficient: false, expertise: false, override: null },
		nature: { proficient: false, expertise: false, override: null },
		perception: { proficient: false, expertise: false, override: null },
		performance: { proficient: false, expertise: false, override: null },
		persuasion: { proficient: false, expertise: false, override: null },
		religion: { proficient: false, expertise: false, override: null },
		sleightOfHand: { proficient: false, expertise: false, override: null },
		stealth: { proficient: false, expertise: false, override: null },
		survival: { proficient: false, expertise: false, override: null }
	}) },

	cr : { type: String, default: '1', index: true },

	// Defenses / senses
	gear                  : { type: String, default: '' },
	damageVulnerabilities : { type: String, default: '' },
	damageResistances     : { type: String, default: '' },
	damageImmunities      : { type: String, default: '' },
	conditionImmunities   : { type: String, default: '' },
	senses                : { type: String, default: '' },
	languages             : { type: String, default: '—' },

	// Action blocks
	traits       : [mongoose.Schema.Types.Mixed],
	actions      : [mongoose.Schema.Types.Mixed],
	bonusActions : [mongoose.Schema.Types.Mixed],
	reactions    : [mongoose.Schema.Types.Mixed],

	// Legendary / Mythic / Lair
	legendary : { type: Object, default: { count: 3, preamble: '', actions: [] } },
	mythic    : { type: Object, default: { enabled: false, preamble: '', actions: [] } },
	lair      : { type: Object, default: { enabled: false, preamble: '', actions: [] } },

	// Timestamps
	createdAt  : { type: Date, default: Date.now, index: true },
	updatedAt  : { type: Date, default: Date.now, index: true },
	views      : { type: Number, default: 0 },
}, { versionKey: false });

// STATIC FUNCTIONS

StatblockSchema.statics.get = async function(query, fields = null) {
	const sb = await Statblock.findOne(query, fields).orFail()
		.catch(()=>{throw 'Can not find stat block';});
	return sb;
};

StatblockSchema.statics.getByUser = async function(username, allowAccess = false, fields = null) {
	const query = { authors: username, published: true };
	if(allowAccess) {
		delete query.published;
	}
	const statblocks = await Statblock.find(query, fields).lean().exec()
		.catch(()=>{throw 'Can not find stat blocks';});
	return statblocks;
};

StatblockSchema.statics.increaseView = async function(query) {
	const sb = await Statblock.findOne(query).exec();
	if(!sb) return;
	sb.views = sb.views + 1;
	await sb.save().catch((err)=>{return err;});
	return sb;
};

// INDEXES

StatblockSchema.index({ name: 'text' });
StatblockSchema.index({ type: 1, cr: 1 });
StatblockSchema.index({ updatedAt: -1 });

const Statblock = mongoose.model('Statblock', StatblockSchema);

export {
	StatblockSchema as schema,
	Statblock       as model
};
