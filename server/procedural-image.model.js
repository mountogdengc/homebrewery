import mongoose from 'mongoose';
import { nanoid } from 'nanoid';

const ProceduralImageSchema = mongoose.Schema({
	shareId : { type: String, default: ()=>{ return nanoid(12); }, index: { unique: true } },
	editId  : { type: String, default: ()=>{ return nanoid(12); }, index: { unique: true } },
	authors : { type: [String], index: true },
	published : { type: Boolean, default: false, index: true },

	// Identity
	name        : { type: String, default: '', index: true },
	description : { type: String, default: '' },
	tags        : { type: [String], index: true },

	// Generator type and configuration
	generatorType : {
		type: String,
		enum: ['seal', 'insignia', 'heraldry', 'icon'],
		index: true,
		required: true
	},

	// Template name (e.g., 'celtic_wax', 'royal_seal')
	templateName : { type: String, required: true, index: true },

	// User customizations to template
	customizations : { type: mongoose.Schema.Types.Mixed, default: ()=>({}) },

	// Deterministic seed for reproducibility
	seed : { type: String, required: true },

	// Cached render data (for performance)
	renderCache : {
		imageData : { type: String, default: null }, // Base64 PNG
		format    : { type: String, default: 'png' },
		timestamp : { type: Date, default: null }
	},

	// Metadata
	createdAt : { type: Date, default: Date.now, index: true },
	updatedAt : { type: Date, default: Date.now, index: true },
	views     : { type: Number, default: 0 }
}, { versionKey: false });

// STATIC FUNCTIONS

ProceduralImageSchema.statics.get = async function(query, fields = null) {
	const image = await ProceduralImage.findOne(query, fields).orFail()
		.catch(()=>{ throw 'Can not find procedural image'; });
	return image;
};

ProceduralImageSchema.statics.getByUser = async function(username, allowAccess = false, fields = null) {
	const query = { authors: username, published: true };
	if (allowAccess) {
		delete query.published;
	}
	const images = await ProceduralImage.find(query, fields).lean().exec()
		.catch(()=>{ throw 'Can not find procedural images'; });
	return images;
};

ProceduralImageSchema.statics.getByType = async function(type, query = {}, fields = null) {
	const finalQuery = { generatorType: type, ...query };
	const images = await ProceduralImage.find(finalQuery, fields).lean().exec()
		.catch(()=>{ throw `Can not find ${type} images`; });
	return images;
};

ProceduralImageSchema.statics.increaseView = async function(query) {
	const image = await ProceduralImage.findOne(query).exec();
	if (!image) return;
	image.views = image.views + 1;
	await image.save().catch((err)=>{ return err; });
	return image;
};

// INSTANCE METHODS

ProceduralImageSchema.methods.invalidateCache = function() {
	this.renderCache = {
		imageData: null,
		format: 'png',
		timestamp: null
	};
	return this.save();
};

ProceduralImageSchema.methods.setCacheData = function(imageData, format = 'png') {
	this.renderCache = {
		imageData,
		format,
		timestamp: new Date()
	};
	return this;
};

ProceduralImageSchema.methods.getCacheData = function() {
	return this.renderCache?.imageData || null;
};

ProceduralImageSchema.methods.isCacheValid = function(maxAgeMs = 30 * 24 * 60 * 60 * 1000) {
	if (!this.renderCache?.timestamp) return false;
	const age = Date.now() - this.renderCache.timestamp.getTime();
	return age < maxAgeMs;
};

// INDEXES

ProceduralImageSchema.index({ name: 'text' });
ProceduralImageSchema.index({ updatedAt: -1 });
ProceduralImageSchema.index({ generatorType: 1, published: 1 });
ProceduralImageSchema.index({ authors: 1, generatorType: 1 });

const ProceduralImage = mongoose.model('ProceduralImage', ProceduralImageSchema);

export { ProceduralImage, ProceduralImageSchema };
