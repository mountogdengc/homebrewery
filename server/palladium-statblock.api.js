import _              from 'lodash';
import express        from 'express';
import asyncHandler   from 'express-async-handler';
import { nanoid }     from 'nanoid';
import { model as PalladiumStatblockModel } from './palladium-statblock.model.js';
import { render }     from '../shared/palladiumStatblock/renderer.js';
import dbCheck        from './middleware/dbCheck.js';

const router = express.Router();

const sanitize = (sb)=>{
	sb._id = undefined;
	sb.__v = undefined;
	return sb;
};

const requireAuth = (req, res)=>{
	if(!req.account) {
		res.status(401).send({ error: 'You must be logged in' });
		return false;
	}
	return true;
};

// ── API Routes ───────────────────────────────────────────────────────

router.use('/api/palladium-statblock', dbCheck);

// Create
router.post('/api/palladium-statblock', asyncHandler(async (req, res)=>{
	if(!requireAuth(req, res)) return;

	const data = req.body;
	delete data.editId;
	delete data.shareId;
	data.authors = [req.account.username];

	const sb = new PalladiumStatblockModel(data);
	sb.editId  = nanoid(12);
	sb.shareId = nanoid(12);

	const saved = await sb.save()
		.catch((err)=>{
			console.error(err);
			throw { name: 'PalladiumStatblockSave Error', message: `Error creating Palladium stat block: ${err.toString()}`, status: 500 };
		});

	res.status(200).send(sanitize(saved.toObject()));
}));

// Update
router.put('/api/palladium-statblock/:id', asyncHandler(async (req, res)=>{
	if(!requireAuth(req, res)) return;

	const sb = await PalladiumStatblockModel.get({ editId: req.params.id })
		.catch(()=>{
			throw { name: 'Not Found', message: 'Palladium stat block not found', status: 404 };
		});

	if(!sb.authors.includes(req.account.username)) {
		return res.status(403).send({ error: 'You are not an author of this stat block' });
	}

	const updates = _.omit(req.body, ['_id', '__v', 'editId', 'shareId', 'authors', 'createdAt']);
	updates.updatedAt = new Date();

	Object.assign(sb, updates);
	sb.markModified('attributes');
	sb.markModified('combat');
	sb.markModified('movement');
	sb.markModified('skills');
	sb.markModified('weapons');
	sb.markModified('armor');
	sb.markModified('magic');
	sb.markModified('psionics');
	sb.markModified('abilities');
	sb.markModified('mutations');

	const saved = await sb.save()
		.catch((err)=>{
			console.error(err);
			throw { name: 'PalladiumStatblockUpdate Error', message: `Error updating Palladium stat block: ${err.toString()}`, status: 500 };
		});

	res.status(200).send(sanitize(saved.toObject()));
}));

// Delete
router.delete('/api/palladium-statblock/:id', asyncHandler(async (req, res)=>{
	if(!requireAuth(req, res)) return;

	const sb = await PalladiumStatblockModel.findOne({ editId: req.params.id })
		.catch(()=>{
			throw { name: 'Not Found', message: 'Palladium stat block not found', status: 404 };
		});

	if(!sb) return res.status(404).send({ error: 'Palladium stat block not found' });
	if(!sb.authors.includes(req.account.username)) {
		return res.status(403).send({ error: 'You are not an author of this stat block' });
	}

	sb.authors = sb.authors.filter((a)=>a !== req.account.username);
	if(sb.authors.length === 0) {
		await PalladiumStatblockModel.deleteOne({ _id: sb._id });
	} else {
		await sb.save();
	}

	res.status(200).send({ success: true });
}));

// Render HTML
router.get('/api/palladium-statblock/render/:id', asyncHandler(async (req, res)=>{
	const sb = await PalladiumStatblockModel.get({ shareId: req.params.id })
		.catch(()=>{
			throw { name: 'Not Found', message: 'Palladium stat block not found', status: 404 };
		});

	const layout = req.query.layout === 'wide' ? 'wide' : 'narrow';
	const html = render(sb.toObject(), layout);
	res.status(200).send(html);
}));

// Get by shareId
router.get('/api/palladium-statblock/:id', asyncHandler(async (req, res)=>{
	const sb = await PalladiumStatblockModel.get({ shareId: req.params.id })
		.catch(()=>{
			throw { name: 'Not Found', message: 'Palladium stat block not found', status: 404 };
		});

	res.status(200).send(sanitize(sb.toObject()));
}));

// List for current user
router.get('/api/palladium-statblocks', asyncHandler(async (req, res)=>{
	if(!requireAuth(req, res)) return;

	const page  = Math.max(1, parseInt(req.query.page) || 1);
	const count = Math.min(100, Math.max(1, parseInt(req.query.count) || 50));
	const skip  = (page - 1) * count;

	const query = { authors: req.account.username };
	if(req.query.search) query.name = { $regex: req.query.search, $options: 'i' };
	if(req.query.game)     query.game = req.query.game;
	if(req.query.category) query.category = req.query.category;

	const fields = ['name', 'game', 'category', 'occ', 'race', 'level', 'tags', 'source',
		'shareId', 'editId', 'authors', 'createdAt', 'updatedAt', 'views'];

	const [statblocks, total] = await Promise.all([
		PalladiumStatblockModel.find(query, fields).sort({ updatedAt: -1 }).skip(skip).limit(count).lean().exec(),
		PalladiumStatblockModel.countDocuments(query)
	]);

	res.status(200).send({ statblocks, page, totalPages: Math.ceil(total / count), total });
}));

// Bulk import
router.post('/api/palladium-statblocks/import', asyncHandler(async (req, res)=>{
	if(!requireAuth(req, res)) return;

	const items = req.body;
	if(!Array.isArray(items) || items.length === 0) {
		return res.status(400).send({ error: 'Request body must be a non-empty array' });
	}
	if(items.length > 200) {
		return res.status(400).send({ error: 'Maximum 200 per import' });
	}

	const results = [];
	for (const item of items) {
		delete item._id; delete item.__v; delete item.editId;
		delete item.shareId; delete item.id; delete item.createdAt; delete item.updatedAt;
		item.authors = [req.account.username];

		const sb = new PalladiumStatblockModel(item);
		sb.editId  = nanoid(12);
		sb.shareId = nanoid(12);

		const saved = await sb.save().catch((err)=>{ console.error('Import error:', err); return null; });
		if(saved) results.push(sanitize(saved.toObject()));
	}

	res.status(200).send({ imported: results.length, statblocks: results });
}));

export default router;
