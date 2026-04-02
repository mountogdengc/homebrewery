import mongoose   from 'mongoose';
import { nanoid } from 'nanoid';

const PalladiumStatblockSchema = mongoose.Schema({
	shareId   : { type: String, default: ()=>{return nanoid(12);}, index: { unique: true } },
	editId    : { type: String, default: ()=>{return nanoid(12);}, index: { unique: true } },
	authors   : { type: [String], index: true },
	published : { type: Boolean, default: false, index: true },

	// Identity
	name        : { type: String, default: '', index: true },
	game        : { type: String, default: 'Rifts', index: true },
	category    : { type: String, default: 'NPC', index: true },
	occ         : { type: String, default: '' },
	occType     : { type: String, default: 'OCC' },
	level       : { type: Number, default: 1 },
	alignment   : { type: String, default: '' },
	race        : { type: String, default: '' },
	description : { type: String, default: '' },
	source      : { type: String, default: '' },
	tags        : { type: [String], index: true },

	// Core Attributes
	attributes : { type: mongoose.Schema.Types.Mixed, default: ()=>({
		iq: 10, me: 10, ma: 10, ps: 10, pp: 10, pe: 10, pb: 10, spd: 10
	}) },

	// Durability
	hp          : { type: Number, default: 0 },
	hpOverride  : { type: Number, default: null },
	sdc         : { type: Number, default: 0 },
	sdcOverride : { type: Number, default: null },
	mdc         : { type: Number, default: 0 },
	mdcOverride : { type: Number, default: null },
	ar          : { type: Number, default: 0 },
	ppeMagic    : { type: Number, default: 0 },
	isp         : { type: Number, default: 0 },

	// Combat
	combat : { type: mongoose.Schema.Types.Mixed, default: ()=>({
		attacks: 0, initiative: 0, strike: 0, parry: 0, dodge: 0,
		rollWithPunch: 0, pull: 0, damage: '', criticalOn: 'Natural 20'
	}) },

	// Movement
	movement : { type: mongoose.Schema.Types.Mixed, default: ()=>({
		run: '', fly: '', swim: '', leap: ''
	}) },

	// Arrays
	skills    : [mongoose.Schema.Types.Mixed],
	weapons   : [mongoose.Schema.Types.Mixed],
	armor     : [mongoose.Schema.Types.Mixed],
	magic     : [mongoose.Schema.Types.Mixed],
	psionics  : [mongoose.Schema.Types.Mixed],
	abilities : [mongoose.Schema.Types.Mixed],

	// TMNT-specific
	animalType : { type: String, default: '' },
	bioE       : { type: Number, default: 0 },
	mutations  : [mongoose.Schema.Types.Mixed],
	animalSize : { type: String, default: '' },

	// General
	equipment : { type: String, default: '' },
	notes     : { type: String, default: '' },

	// Timestamps
	createdAt : { type: Date, default: Date.now, index: true },
	updatedAt : { type: Date, default: Date.now, index: true },
	views     : { type: Number, default: 0 },
}, { versionKey: false });

// STATIC FUNCTIONS

PalladiumStatblockSchema.statics.get = async function(query, fields = null) {
	const sb = await PalladiumStatblock.findOne(query, fields).orFail()
		.catch(()=>{throw 'Can not find Palladium stat block';});
	return sb;
};

PalladiumStatblockSchema.statics.getByUser = async function(username, allowAccess = false, fields = null) {
	const query = { authors: username, published: true };
	if(allowAccess) {
		delete query.published;
	}
	const statblocks = await PalladiumStatblock.find(query, fields).lean().exec()
		.catch(()=>{throw 'Can not find Palladium stat blocks';});
	return statblocks;
};

PalladiumStatblockSchema.statics.increaseView = async function(query) {
	const sb = await PalladiumStatblock.findOne(query).exec();
	if(!sb) return;
	sb.views = sb.views + 1;
	await sb.save().catch((err)=>{return err;});
	return sb;
};

// INDEXES

PalladiumStatblockSchema.index({ name: 'text' });
PalladiumStatblockSchema.index({ updatedAt: -1 });

const PalladiumStatblock = mongoose.model('PalladiumStatblock', PalladiumStatblockSchema);

export {
	PalladiumStatblockSchema as schema,
	PalladiumStatblock       as model
};
