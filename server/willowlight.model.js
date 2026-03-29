import mongoose   from 'mongoose';
import { nanoid } from 'nanoid';

const WillowlightSchema = mongoose.Schema({
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

	// Demographics
	age    : { type: String, default: '' },
	gender : { type: String, default: '' },
	height : { type: String, default: '' },
	weight : { type: String, default: '' },

	// Attributes & Scale
	attributes : { type: mongoose.Schema.Types.Mixed, default: ()=>({
		might: 0, reflex: 0, endurance: 0,
		reason: 0, guile: 0, resolve: 0,
		influence: 0, poise: 0, command: 0
	}) },
	scale : { type: mongoose.Schema.Types.Mixed, default: ()=>({ physical: '', mental: '', social: '' }) },

	// Skills
	vocation    : { type: mongoose.Schema.Types.Mixed, default: ()=>({ name: '', bonus: 0 }) },
	domainFocus : { type: String, default: '' },
	interests   : [mongoose.Schema.Types.Mixed],
	hobbies     : [mongoose.Schema.Types.Mixed],

	// Health track overrides
	vitalityOverride  : { type: Number, default: null },
	willpowerOverride : { type: Number, default: null },
	composureOverride : { type: Number, default: null },

	// Attacks, Edges, Aspects, Burdens
	attacks : [mongoose.Schema.Types.Mixed],
	edges   : [mongoose.Schema.Types.Mixed],
	aspects : [mongoose.Schema.Types.Mixed],
	burdens : [mongoose.Schema.Types.Mixed],

	// Luck
	luckRating : { type: Number, default: 3 },
	luckTokens : { type: Number, default: 3 },

	// Corruption
	corruption    : { type: Number, default: 0 },
	hearthTrigger : { type: String, default: '' },

	// XP & Wealth
	unspentXP    : { type: Number, default: 0 },
	totalXP      : { type: Number, default: 0 },
	xpSpent      : { type: Number, default: 0 },
	sessionXP    : { type: Number, default: 0 },
	wealthPoints : { type: Number, default: 0 },
	lifestyle    : { type: Number, default: 0 },
	downtime     : { type: String, default: '' },

	// Milestones
	convictionMilestones : [mongoose.Schema.Types.Mixed],
	pathMilestones       : [mongoose.Schema.Types.Mixed],

	// Contacts, Secrets, Equipment, Afflictions
	contacts    : [mongoose.Schema.Types.Mixed],
	secrets     : [mongoose.Schema.Types.Mixed],
	equipment   : [mongoose.Schema.Types.Mixed],
	afflictions : { type: mongoose.Schema.Types.Mixed, default: ()=>({
		terrified: false, discredited: false, stunned: false, prone: false,
		blinded: false, disoriented: false, restrained: false, slowed: false,
		disarmed: false, dying: false, other: ''
	}) },

	// Notes
	notes : { type: String, default: '' },

	// Timestamps
	createdAt : { type: Date, default: Date.now, index: true },
	updatedAt : { type: Date, default: Date.now, index: true },
	views     : { type: Number, default: 0 },
}, { versionKey: false });

WillowlightSchema.statics.get = async function(query, fields = null) {
	const doc = await Willowlight.findOne(query, fields).orFail()
		.catch(()=>{throw 'Can not find Willowlight character';});
	return doc;
};

WillowlightSchema.statics.getByUser = async function(username, allowAccess = false, fields = null) {
	const query = { authors: username, published: true };
	if(allowAccess) delete query.published;
	const docs = await Willowlight.find(query, fields).lean().exec()
		.catch(()=>{throw 'Can not find Willowlight characters';});
	return docs;
};

WillowlightSchema.statics.increaseView = async function(query) {
	const doc = await Willowlight.findOne(query).exec();
	if(!doc) return;
	doc.views = doc.views + 1;
	await doc.save().catch((err)=>{return err;});
	return doc;
};

WillowlightSchema.index({ name: 'text' });
WillowlightSchema.index({ updatedAt: -1 });

const Willowlight = mongoose.model('Willowlight', WillowlightSchema);

export {
	WillowlightSchema as schema,
	Willowlight       as model
};
