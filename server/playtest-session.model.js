import mongoose   from 'mongoose';
import { nanoid } from 'nanoid';

const PlaytestSessionSchema = mongoose.Schema({
	sessionId : { type: String, default: ()=>{return nanoid(12);}, index: { unique: true } },
	authors   : { type: [String], index: true },

	// Metadata
	name        : { type: String, default: '', index: true },
	system      : { type: String, default: 'willowlight' },  // willowlight, 5e, brp, besm
	description : { type: String, default: '' },

	// Full session state — stored as Mixed to keep flexible
	characters : [mongoose.Schema.Types.Mixed],
	enemies    : [mongoose.Schema.Types.Mixed],
	taintPool  : { type: Number, default: 0 },
	rollLog    : [mongoose.Schema.Types.Mixed],
	tides      : [mongoose.Schema.Types.Mixed],
	partyAnchor    : { type: mongoose.Schema.Types.Mixed, default: ()=>({ name: '', desc: '' }) },
	sgNotes        : { type: String, default: '' },
	rules          : { type: mongoose.Schema.Types.Mixed, default: ()=>({}) },
	rulesChangeLog : [mongoose.Schema.Types.Mixed],

	// Timestamps
	createdAt : { type: Date, default: Date.now, index: true },
	updatedAt : { type: Date, default: Date.now, index: true },
}, { versionKey: false });

PlaytestSessionSchema.statics.get = async function(query, fields = null) {
	const doc = await PlaytestSession.findOne(query, fields).orFail()
		.catch(()=>{throw 'Can not find playtest session';});
	return doc;
};

PlaytestSessionSchema.statics.getByUser = async function(username, fields = null) {
	const docs = await PlaytestSession.find({ authors: username }, fields)
		.sort({ updatedAt: -1 }).lean().exec()
		.catch(()=>{throw 'Can not find playtest sessions';});
	return docs;
};

PlaytestSessionSchema.index({ updatedAt: -1 });

const PlaytestSession = mongoose.model('PlaytestSession', PlaytestSessionSchema);

export {
	PlaytestSessionSchema as schema,
	PlaytestSession       as model
};
