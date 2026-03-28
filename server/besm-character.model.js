import mongoose   from 'mongoose';
import { nanoid } from 'nanoid';

const BesmCharacterSchema = mongoose.Schema({
	shareId   : { type: String, default: ()=>{return nanoid(12);}, index: { unique: true } },
	editId    : { type: String, default: ()=>{return nanoid(12);}, index: { unique: true } },
	authors   : { type: [String], index: true },

	// Identity
	name          : { type: String, default: '', index: true },
	identity      : { type: String, default: '' },
	description   : { type: String, default: '' },
	playerName    : { type: String, default: '' },
	gmName        : { type: String, default: '' },
	selectedGenre : { type: String, default: null },
	selectedSubgenre : { type: String, default: null },

	// Character Points
	totalCP        : { type: Number, default: 0 },
	availableCP    : { type: Number, default: 0 },
	totalPointsSpent : { type: Number, default: 0 },

	// Stats (mixed — nested object)
	stats : { type: mongoose.Schema.Types.Mixed, default: ()=>({ body: 0, mind: 0, soul: 0 }) },

	// Templates (mixed — deeply nested)
	templates : { type: mongoose.Schema.Types.Mixed, default: ()=>({ race: null, class: null, size: null }) },
	sizeModifiers    : { type: mongoose.Schema.Types.Mixed, default: null },
	characterClass   : { type: mongoose.Schema.Types.Mixed, default: null },
	appliedTemplates : { type: mongoose.Schema.Types.Mixed, default: ()=>([]) },

	// Attributes, Defects, Skills (arrays of mixed objects)
	attributes : [mongoose.Schema.Types.Mixed],
	defects    : [mongoose.Schema.Types.Mixed],
	skills     : [mongoose.Schema.Types.Mixed],

	// Derived Values (mixed)
	derivedValues : { type: mongoose.Schema.Types.Mixed, default: ()=>({
		healthPoints: 0, energyPoints: 0,
		attackCombatValue: 0, defenseCombatValue: 0,
		damage: 0, armorRating: 0
	}) },

	// Personal Details
	baseOfOperations : { type: String, default: '' },
	gender           : { type: String, default: '' },
	age              : { type: Number, default: null },
	height           : { type: String, default: '' },
	weight           : { type: String, default: '' },
	habitat          : { type: String, default: '' },
	hairColor        : { type: String, default: '' },
	eyeColor         : { type: String, default: '' },
	appearance       : { type: String, default: '' },
	background       : { type: String, default: '' },
	personality      : { type: String, default: '' },
	notes            : { type: String, default: '' },

	// Timestamps
	createdAt : { type: Date, default: Date.now, index: true },
	updatedAt : { type: Date, default: Date.now, index: true },
	views     : { type: Number, default: 0 },
}, { versionKey: false });

// STATIC FUNCTIONS

BesmCharacterSchema.statics.get = async function(query, fields = null) {
	const bc = await BesmCharacter.findOne(query, fields).orFail()
		.catch(()=>{throw 'Can not find BESM character';});
	return bc;
};

BesmCharacterSchema.statics.getByUser = async function(username, allowAccess = false, fields = null) {
	const query = { authors: username };
	if(!allowAccess) {
		query.published = true;
	}
	const characters = await BesmCharacter.find(query, fields).lean().exec()
		.catch(()=>{throw 'Can not find BESM characters';});
	return characters;
};

// INDEXES

BesmCharacterSchema.index({ name: 'text' });
BesmCharacterSchema.index({ updatedAt: -1 });

const BesmCharacter = mongoose.model('BesmCharacter', BesmCharacterSchema);

export {
	BesmCharacterSchema as schema,
	BesmCharacter       as model
};
