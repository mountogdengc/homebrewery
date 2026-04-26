import mongoose   from 'mongoose';
import { nanoid } from 'nanoid';

const BrpStatblockSchema = mongoose.Schema({
	shareId   : { type: String, default: ()=>{return nanoid(12);}, index: { unique: true } },
	editId    : { type: String, default: ()=>{return nanoid(12);}, index: { unique: true } },
	authors   : { type: [String], index: true },
	published : { type: Boolean, default: false, index: true },

	// Character type: 'creature' or 'character'
	characterType : { type: String, default: 'creature', index: true },

	// Identity
	name        : { type: String, default: '', index: true },
	category    : { type: String, default: 'Human', index: true },
	subtype     : { type: String, default: '' },
	description : { type: String, default: '' },
	portrait    : { type: String, default: '' },
	source      : { type: String, default: '' },
	tags        : { type: [String], index: true },

	// Character-specific identity
	player      : { type: String, default: '' },
	occupation  : { type: String, default: '' },
	age         : { type: String, default: '' },
	gender      : { type: String, default: '' },
	nationality : { type: String, default: '' },
	appearance  : { type: String, default: '' },
	background  : { type: String, default: '' },

	// Characteristics
	characteristics : { type: mongoose.Schema.Types.Mixed, default: ()=>({
		str: 10, con: 10, siz: 10, int: 10, pow: 10, dex: 10, cha: 10
	}) },

	// Derived overrides
	hitPointsOverride   : { type: Number, default: null },
	magicPointsOverride : { type: Number, default: null },
	damageBonusOverride : { type: String, default: null },
	moveRate            : { type: Number, default: 8 },
	armorPoints         : { type: Number, default: 0 },
	armorDescription    : { type: String, default: '' },

	// Sanity
	sanity    : { type: Number, default: null },
	sanityMax : { type: Number, default: null },

	// Skills, Weapons, Spells, Traits, Hit Locations
	skills       : [mongoose.Schema.Types.Mixed],
	weapons      : [mongoose.Schema.Types.Mixed],
	spells       : [mongoose.Schema.Types.Mixed],
	traits       : [mongoose.Schema.Types.Mixed],
	hitLocations : [mongoose.Schema.Types.Mixed],

	// Passions, Allegiances, Equipment
	passions    : [mongoose.Schema.Types.Mixed],
	allegiances : [mongoose.Schema.Types.Mixed],
	equipment   : [mongoose.Schema.Types.Mixed],

	// Wealth & Experience
	wealth           : { type: String, default: '' },
	experiencePoints : { type: Number, default: 0 },
	experienceChecks : [String],

	// Notes
	notes : { type: String, default: '' },

	// Timestamps
	createdAt : { type: Date, default: Date.now, index: true },
	updatedAt : { type: Date, default: Date.now, index: true },
	views     : { type: Number, default: 0 },
}, { versionKey: false });

// STATIC FUNCTIONS

BrpStatblockSchema.statics.get = async function(query, fields = null) {
	const sb = await BrpStatblock.findOne(query, fields).orFail()
		.catch(()=>{throw 'Can not find BRP stat block';});
	return sb;
};

BrpStatblockSchema.statics.getByUser = async function(username, allowAccess = false, fields = null) {
	const query = { authors: username, published: true };
	if(allowAccess) {
		delete query.published;
	}
	const statblocks = await BrpStatblock.find(query, fields).lean().exec()
		.catch(()=>{throw 'Can not find BRP stat blocks';});
	return statblocks;
};

BrpStatblockSchema.statics.increaseView = async function(query) {
	const sb = await BrpStatblock.findOne(query).exec();
	if(!sb) return;
	sb.views = sb.views + 1;
	await sb.save().catch((err)=>{return err;});
	return sb;
};

// INDEXES

BrpStatblockSchema.index({ name: 'text' });
BrpStatblockSchema.index({ updatedAt: -1 });

const BrpStatblock = mongoose.model('BrpStatblock', BrpStatblockSchema);

export {
	BrpStatblockSchema as schema,
	BrpStatblock       as model
};
