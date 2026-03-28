import mongoose   from 'mongoose';
import { nanoid } from 'nanoid';

const WillowlightStatblockSchema = mongoose.Schema({
	shareId   : { type: String, default: ()=>{return nanoid(12);}, index: { unique: true } },
	editId    : { type: String, default: ()=>{return nanoid(12);}, index: { unique: true } },
	authors   : { type: [String], index: true },
	published : { type: Boolean, default: false, index: true },

	// Identity
	name       : { type: String, default: '', index: true },
	path       : { type: String, default: '' },
	conviction : { type: String, default: '' },
	description: { type: String, default: '' },
	source     : { type: String, default: '' },
	tags       : { type: [String], index: true },

	// Attributes
	attributes : { type: mongoose.Schema.Types.Mixed, default: ()=>({
		might: 0, reflex: 0, endurance: 0,
		reason: 0, guile: 0, resolve: 0,
		influence: 0, poise: 0, command: 0
	}) },

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

	// Notes
	notes : { type: String, default: '' },

	// Timestamps
	createdAt : { type: Date, default: Date.now, index: true },
	updatedAt : { type: Date, default: Date.now, index: true },
	views     : { type: Number, default: 0 },
}, { versionKey: false });

// STATIC FUNCTIONS

WillowlightStatblockSchema.statics.get = async function(query, fields = null) {
	const sb = await WillowlightStatblock.findOne(query, fields).orFail()
		.catch(()=>{throw 'Can not find Willowlight stat block';});
	return sb;
};

WillowlightStatblockSchema.statics.getByUser = async function(username, allowAccess = false, fields = null) {
	const query = { authors: username, published: true };
	if(allowAccess) {
		delete query.published;
	}
	const statblocks = await WillowlightStatblock.find(query, fields).lean().exec()
		.catch(()=>{throw 'Can not find Willowlight stat blocks';});
	return statblocks;
};

WillowlightStatblockSchema.statics.increaseView = async function(query) {
	const sb = await WillowlightStatblock.findOne(query).exec();
	if(!sb) return;
	sb.views = sb.views + 1;
	await sb.save().catch((err)=>{return err;});
	return sb;
};

// INDEXES

WillowlightStatblockSchema.index({ name: 'text' });
WillowlightStatblockSchema.index({ updatedAt: -1 });

const WillowlightStatblock = mongoose.model('WillowlightStatblock', WillowlightStatblockSchema);

export {
	WillowlightStatblockSchema as schema,
	WillowlightStatblock       as model
};
