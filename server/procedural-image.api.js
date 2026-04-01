import _              from 'lodash';
import express        from 'express';
import asyncHandler   from 'express-async-handler';
import { nanoid }     from 'nanoid';
import { ProceduralImage } from './procedural-image.model.js';
import { getGenerator } from '../shared/procedural/generatorBase.js';
import { SealGenerator } from '../shared/procedural/generators/sealGenerator.js';
import { AdventureIconGenerator } from '../shared/procedural/generators/adventureIconGenerator.js';
import { registerGenerator } from '../shared/procedural/generatorBase.js';
import dbCheck        from './middleware/dbCheck.js';

const router = express.Router();

// Register generators
registerGenerator(new SealGenerator());
registerGenerator(new AdventureIconGenerator());

const sanitize = (image)=>{
	image._id = undefined;
	image.__v = undefined;
	return image;
};

const requireAuth = (req, res)=>{
	if (!req.account) {
		res.status(401).send({ error: 'You must be logged in' });
		return false;
	}
	return true;
};

// ── API Routes ───────────────────────────────────────────────────────

router.use('/api/procedural-image', dbCheck);

// CREATE
router.post('/api/procedural-image', asyncHandler(async (req, res)=>{
	if (!requireAuth(req, res)) return;

	const data = req.body;
	delete data.editId;
	delete data.shareId;
	data.authors = [req.account.username];

	// Validate generator type
	const generator = getGenerator(data.generatorType);
	if (!generator) {
		return res.status(400).send({ error: `Unknown generator type: ${data.generatorType}` });
	}

	// Validate config
	const validation = generator.validate(data);
	if (!validation.valid) {
		return res.status(400).send({ error: validation.errors.join(', ') });
	}

	const image = new ProceduralImage(data);
	image.editId  = nanoid(12);
	image.shareId = nanoid(12);

	const saved = await image.save()
		.catch((err)=>{
			console.error(err);
			throw { name: 'ProceduralImageSave Error', message: `Error creating procedural image: ${err.toString()}`, status: 500 };
		});

	res.status(200).send(sanitize(saved.toObject()));
}));

// RETRIEVE (by editId, authenticated)
router.get('/api/procedural-image/edit/:id', asyncHandler(async (req, res)=>{
	if (!requireAuth(req, res)) return;

	const image = await ProceduralImage.get({ editId: req.params.id })
		.catch(()=>{
			throw { name: 'Not Found', message: 'Procedural image not found', status: 404 };
		});

	if (!image.authors.includes(req.account.username)) {
		return res.status(403).send({ error: 'You are not an author of this image' });
	}

	res.status(200).send(sanitize(image.toObject()));
}));

// RETRIEVE (by shareId, public)
router.get('/api/procedural-image/share/:id', asyncHandler(async (req, res)=>{
	const image = await ProceduralImage.get({ shareId: req.params.id })
		.catch(()=>{
			throw { name: 'Not Found', message: 'Procedural image not found', status: 404 };
		});

	if (!image.published && (!req.account || !image.authors.includes(req.account.username))) {
		return res.status(403).send({ error: 'This image is not public' });
	}

	res.status(200).send(sanitize(image.toObject()));
}));

// UPDATE
router.put('/api/procedural-image/:id', asyncHandler(async (req, res)=>{
	if (!requireAuth(req, res)) return;

	const image = await ProceduralImage.get({ editId: req.params.id })
		.catch(()=>{
			throw { name: 'Not Found', message: 'Procedural image not found', status: 404 };
		});

	if (!image.authors.includes(req.account.username)) {
		return res.status(403).send({ error: 'You are not an author of this image' });
	}

	// Re-validate on update
	const generator = getGenerator(image.generatorType);
	if (!generator) {
		return res.status(500).send({ error: 'Generator not found' });
	}

	const updates = _.omit(req.body, ['_id', '__v', 'editId', 'shareId', 'authors', 'createdAt']);
	updates.updatedAt = new Date();

	Object.assign(image, updates);
	image.markModified('customizations');

	// Validate updated config
	const validation = generator.validate(image);
	if (!validation.valid) {
		return res.status(400).send({ error: validation.errors.join(', ') });
	}

	// Invalidate cache on update
	await image.invalidateCache();

	const saved = await image.save()
		.catch((err)=>{
			console.error(err);
			throw { name: 'ProceduralImageUpdate Error', message: `Error updating procedural image: ${err.toString()}`, status: 500 };
		});

	res.status(200).send(sanitize(saved.toObject()));
}));

// DELETE
router.delete('/api/procedural-image/:id', asyncHandler(async (req, res)=>{
	if (!requireAuth(req, res)) return;

	const image = await ProceduralImage.findOne({ editId: req.params.id })
		.catch(()=>{
			throw { name: 'Not Found', message: 'Procedural image not found', status: 404 };
		});

	if (!image) return res.status(404).send({ error: 'Procedural image not found' });
	if (!image.authors.includes(req.account.username)) {
		return res.status(403).send({ error: 'You are not an author of this image' });
	}

	image.authors = image.authors.filter((a)=>a !== req.account.username);
	if (image.authors.length === 0) {
		await ProceduralImage.deleteOne({ _id: image._id });
		return res.status(200).send({ success: true });
	}

	await image.save();
	res.status(200).send({ success: true });
}));

// LIST (library view)
router.get('/api/procedural-images', asyncHandler(async (req, res)=>{
	const query = {};
	const page = parseInt(req.query.page) || 0;
	const count = parseInt(req.query.count) || 24;
	const sort = req.query.sort || '-updatedAt';
	const type = req.query.type;

	// Filter by type if provided
	if (type) {
		query.generatorType = type;
	}

	// Filter by visibility
	if (req.account) {
		// Show user's own images (published or not) plus others' published
		query.$or = [
			{ authors: req.account.username },
			{ published: true }
		];
	} else {
		// Only show published for anonymous users
		query.published = true;
	}

	// Text search
	if (req.query.search) {
		query.$text = { $search: req.query.search };
	}

	const images = await ProceduralImage.find(query)
		.sort(sort)
		.skip(page * count)
		.limit(count)
		.lean()
		.exec()
		.catch(()=>{ throw 'Error fetching procedural images'; });

	const total = await ProceduralImage.countDocuments(query)
		.catch(()=>0);

	res.status(200).send({
		images,
		total,
		page,
		count,
		pages: Math.ceil(total / count)
	});
}));

// RENDER (generate image)
router.get('/api/procedural-image/:id/render', asyncHandler(async (req, res)=>{
	const shareId = req.params.id;
	const size = parseInt(req.query.size) || 512;

	// Find image (by shareId for public)
	const image = await ProceduralImage.get({ shareId })
		.catch(()=>{
			throw { name: 'Not Found', message: 'Procedural image not found', status: 404 };
		});

	if (!image.published && (!req.account || !image.authors.includes(req.account.username))) {
		return res.status(403).send({ error: 'This image is not public' });
	}

	// Check cache
	if (image.isCacheValid()) {
		const cachedData = image.getCacheData();
		if (cachedData) {
			res.setHeader('Content-Type', 'image/png');
			res.setHeader('Cache-Control', 'public, max-age=2592000'); // 30 days
			return res.send(Buffer.from(cachedData, 'base64'));
		}
	}

	// Generate
	const generator = getGenerator(image.generatorType);
	if (!generator) {
		return res.status(500).send({ error: 'Generator not found' });
	}

	try {
		const imageData = await generator.generate(image.seed, image, size);

		// Extract base64 from data URL if needed
		let base64Data = imageData;
		if (imageData.startsWith('data:')) {
			base64Data = imageData.split(',')[1];
		}

		// Cache it
		image.setCacheData(base64Data, 'png');
		await image.save().catch((err)=>console.error('Cache save error:', err));

		// Increase view count (async, don't wait)
		image.constructor.increaseView({ shareId }).catch(err=>console.error(err));

		res.setHeader('Content-Type', 'image/png');
		res.setHeader('Cache-Control', 'public, max-age=2592000');
		res.send(Buffer.from(base64Data, 'base64'));
	} catch (err) {
		console.error('Render error:', err);
		return res.status(500).send({ error: `Failed to render image: ${err.message}` });
	}
}));

// DUPLICATE (create copy of image)
router.post('/api/procedural-image/:id/duplicate', asyncHandler(async (req, res)=>{
	if (!requireAuth(req, res)) return;

	const original = await ProceduralImage.get({ editId: req.params.id })
		.catch(()=>{
			throw { name: 'Not Found', message: 'Procedural image not found', status: 404 };
		});

	if (!original.published && !original.authors.includes(req.account.username)) {
		return res.status(403).send({ error: 'You cannot duplicate this image' });
	}

	// Create copy
	const copy = new ProceduralImage({
		name: `${original.name} (Copy)`,
		description: original.description,
		generatorType: original.generatorType,
		templateName: original.templateName,
		customizations: JSON.parse(JSON.stringify(original.customizations)), // Deep copy
		seed: original.seed,
		authors: [req.account.username],
		published: false,
		tags: original.tags ? [...original.tags] : []
	});

	copy.editId = nanoid(12);
	copy.shareId = nanoid(12);

	const saved = await copy.save()
		.catch((err)=>{
			console.error(err);
			throw { name: 'DuplicateError', message: `Error duplicating image: ${err.toString()}`, status: 500 };
		});

	res.status(200).send(sanitize(saved.toObject()));
}));

export default router;
