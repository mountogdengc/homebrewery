import mongoose   from 'mongoose';
import { nanoid } from 'nanoid';

const WillowlightBestiarySchema = mongoose.Schema({
	shareId   : { type: String, default: ()=>{return nanoid(12);}, index: { unique: true } },
	editId    : { type: String, default: ()=>{return nanoid(12);}, index: { unique: true } },
	authors   : { type: [String], index: true },
	published : { type: Boolean, default: false, index: true },

	// Identity
	name     : { type: String, default: '', index: true },
	subtitle : { type: String, default: '' },
	tier     : { type: String, default: 'mook', index: true },
	tags     : { type: [String], index: true },
	source   : { type: String, default: '' },

	// TNs
	atkTN : { type: mongoose.Schema.Types.Mixed, default: ()=>({ mental: 8, physical: 8, social: 8 }) },
	defTN : { type: mongoose.Schema.Types.Mixed, default: ()=>({ mental: 8, physical: 8, social: 8 }) },

	// Scale
	scale : { type: mongoose.Schema.Types.Mixed, default: ()=>({ mental: 0, physical: 0, social: 0 }) },

	// Mook-specific
	threshold : { type: Number, default: 2 },
	size      : { type: Number, default: 3 },

	// Health tracks (elite/boss/legend)
	health : { type: mongoose.Schema.Types.Mixed, default: ()=>({ willpower: 0, vitality: 0, composure: 0 }) },

	// Traits
	trait  : { type: String, default: '' },
	traits : [mongoose.Schema.Types.Mixed],

	// Behavior
	goal  : { type: String, default: '' },
	notes : { type: String, default: '' },

	// Timestamps
	createdAt : { type: Date, default: Date.now, index: true },
	updatedAt : { type: Date, default: Date.now, index: true },
	views     : { type: Number, default: 0 },
}, { versionKey: false });

WillowlightBestiarySchema.statics.get = async function(query, fields = null) {
	const doc = await WillowlightBestiary.findOne(query, fields).orFail()
		.catch(()=>{throw 'Can not find bestiary entry';});
	return doc;
};

WillowlightBestiarySchema.statics.getByUser = async function(username, allowAccess = false, fields = null) {
	const query = { authors: username, published: true };
	if(allowAccess) delete query.published;
	const docs = await WillowlightBestiary.find(query, fields).lean().exec()
		.catch(()=>{throw 'Can not find bestiary entries';});
	return docs;
};

WillowlightBestiarySchema.index({ name: 'text' });
WillowlightBestiarySchema.index({ updatedAt: -1 });

const WillowlightBestiary = mongoose.model('WillowlightBestiary', WillowlightBestiarySchema);

export {
	WillowlightBestiarySchema as schema,
	WillowlightBestiary       as model
};
