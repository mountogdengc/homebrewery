import mongoose   from 'mongoose';
import { nanoid } from 'nanoid';

const WillowlightCharacterSchema = mongoose.Schema({
	shareId   : { type: String, default: ()=>{return nanoid(12);}, index: { unique: true } },
	editId    : { type: String, default: ()=>{return nanoid(12);}, index: { unique: true } },
	authors   : { type: [String], index: true },
	published : { type: Boolean, default: false, index: true },

	// Identity
	name             : { type: String, default: '', index: true },
	player           : { type: String, default: '' },
	conviction       : { type: String, default: '' },
	path             : { type: String, default: '' },
	shortDescription : { type: String, default: '' },
	description      : { type: String, default: '' },
	source           : { type: String, default: '' },
	tags             : { type: [String], index: true },

	// Attributes & Scale
	attributes : { type: mongoose.Schema.Types.Mixed, default: ()=>({
		might: 0, reflex: 0, endurance: 0,
		reason: 0, guile: 0, resolve: 0,
		influence: 0, poise: 0, command: 0
	}) },
	scale : { type: mongoose.Schema.Types.Mixed, default: ()=>({ physical: '', mental: '', social: '' }) },

	// Skills
	vocation  : { type: mongoose.Schema.Types.Mixed, default: ()=>({ name: '', bonus: 0 }) },
	interests : [mongoose.Schema.Types.Mixed],
	hobbies   : [mongoose.Schema.Types.Mixed],

	// Health track overrides
	vitalityOverride  : { type: Number, default: null },
	willpowerOverride : { type: Number, default: null },
	composureOverride : { type: Number, default: null },

	// Attacks, Edges, Aspects, Burdens
	attacks : [mongoose.Schema.Types.Mixed],
	edges   : [mongoose.Schema.Types.Mixed],
	aspects : [mongoose.Schema.Types.Mixed],
	burdens : [mongoose.Schema.Types.Mixed],

	// Character-specific
	luckRating : { type: Number, default: 3 },
	luckTokens : { type: Number, default: 3 },
	corruption : { type: Number, default: 0 },
	unspentXP  : { type: Number, default: 0 },
	wealthPoints : { type: Number, default: 0 },

	convictionMilestones : [mongoose.Schema.Types.Mixed],
	pathMilestones       : [mongoose.Schema.Types.Mixed],
	contacts             : [mongoose.Schema.Types.Mixed],
	secrets              : [mongoose.Schema.Types.Mixed],

	// Notes
	notes : { type: String, default: '' },

	// Timestamps
	createdAt : { type: Date, default: Date.now, index: true },
	updatedAt : { type: Date, default: Date.now, index: true },
	views     : { type: Number, default: 0 },
}, { versionKey: false });

WillowlightCharacterSchema.statics.get = async function(query, fields = null) {
	const ch = await WillowlightCharacter.findOne(query, fields).orFail()
		.catch(()=>{throw 'Can not find Willowlight character';});
	return ch;
};

WillowlightCharacterSchema.statics.getByUser = async function(username, allowAccess = false, fields = null) {
	const query = { authors: username, published: true };
	if(allowAccess) delete query.published;
	const chars = await WillowlightCharacter.find(query, fields).lean().exec()
		.catch(()=>{throw 'Can not find Willowlight characters';});
	return chars;
};

WillowlightCharacterSchema.index({ name: 'text' });
WillowlightCharacterSchema.index({ updatedAt: -1 });

const WillowlightCharacter = mongoose.model('WillowlightCharacter', WillowlightCharacterSchema);

export {
	WillowlightCharacterSchema as schema,
	WillowlightCharacter       as model
};
