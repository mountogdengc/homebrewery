import _              from 'lodash';
import express        from 'express';
import asyncHandler   from 'express-async-handler';
import { nanoid }     from 'nanoid';
import { model as StatblockModel } from './statblock.model.js';
import { render }     from '../shared/statblock/renderer.js';
import dbCheck        from './middleware/dbCheck.js';

const router = express.Router();

// ── Helpers ──────────────────────────────────────────────────────────────

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

// ── API Routes ───────────────────────────────────────────────────────────

router.use('/api/statblock', dbCheck);

// Create a new stat block
router.post('/api/statblock', asyncHandler(async (req, res)=>{
	if(!requireAuth(req, res)) return;

	const data = req.body;
	delete data.editId;
	delete data.shareId;

	data.authors = [req.account.username];

	const statblock = new StatblockModel(data);
	statblock.editId  = nanoid(12);
	statblock.shareId = nanoid(12);

	const saved = await statblock.save()
		.catch((err)=>{
			console.error(err);
			throw { name: 'StatblockSave Error', message: `Error creating stat block: ${err.toString()}`, status: 500 };
		});

	res.status(200).send(sanitize(saved.toObject()));
}));

// Update an existing stat block by editId
router.put('/api/statblock/:id', asyncHandler(async (req, res)=>{
	if(!requireAuth(req, res)) return;

	const sb = await StatblockModel.get({ editId: req.params.id })
		.catch(()=>{
			throw { name: 'Not Found', message: 'Stat block not found', status: 404 };
		});

	if(!sb.authors.includes(req.account.username)) {
		return res.status(403).send({ error: 'You are not an author of this stat block' });
	}

	const updates = _.omit(req.body, ['_id', '__v', 'editId', 'shareId', 'authors', 'createdAt']);
	updates.updatedAt = new Date();

	// Mark mixed fields as modified so Mongoose saves them
	Object.assign(sb, updates);
	sb.markModified('savingThrows');
	sb.markModified('skills');
	sb.markModified('abilities');
	sb.markModified('ac');
	sb.markModified('hp');
	sb.markModified('speed');
	sb.markModified('legendary');
	sb.markModified('mythic');
	sb.markModified('lair');

	const saved = await sb.save()
		.catch((err)=>{
			console.error(err);
			throw { name: 'StatblockUpdate Error', message: `Error updating stat block: ${err.toString()}`, status: 500 };
		});

	res.status(200).send(sanitize(saved.toObject()));
}));

// Delete a stat block by editId
router.delete('/api/statblock/:id', asyncHandler(async (req, res)=>{
	if(!requireAuth(req, res)) return;

	const sb = await StatblockModel.findOne({ editId: req.params.id })
		.catch(()=>{
			throw { name: 'Not Found', message: 'Stat block not found', status: 404 };
		});

	if(!sb) {
		return res.status(404).send({ error: 'Stat block not found' });
	}

	if(!sb.authors.includes(req.account.username)) {
		return res.status(403).send({ error: 'You are not an author of this stat block' });
	}

	// Remove user from authors; delete only if no authors remain
	sb.authors = sb.authors.filter((a)=>a !== req.account.username);
	if(sb.authors.length === 0) {
		await StatblockModel.deleteOne({ _id: sb._id });
	} else {
		await sb.save();
	}

	res.status(200).send({ success: true });
}));

// Get rendered HTML of a stat block (for live embedding in brews)
router.get('/api/statblock/render/:id', asyncHandler(async (req, res)=>{
	const sb = await StatblockModel.get({ shareId: req.params.id })
		.catch(()=>{
			throw { name: 'Not Found', message: 'Stat block not found', status: 404 };
		});

	const layout = req.query.layout === 'wide' ? 'wide' : 'narrow';
	const html = render(sb.toObject(), layout);

	res.status(200).send(html);
}));

// Get a single stat block by shareId (for embedding / sharing)
router.get('/api/statblock/:id', asyncHandler(async (req, res)=>{
	const sb = await StatblockModel.get({ shareId: req.params.id })
		.catch(()=>{
			throw { name: 'Not Found', message: 'Stat block not found', status: 404 };
		});

	res.status(200).send(sanitize(sb.toObject()));
}));

// List stat blocks for the current user (library view)
router.get('/api/statblocks', asyncHandler(async (req, res)=>{
	if(!requireAuth(req, res)) return;

	const page   = Math.max(1, parseInt(req.query.page) || 1);
	const count  = Math.min(100, Math.max(1, parseInt(req.query.count) || 50));
	const skip   = (page - 1) * count;

	const query = { authors: req.account.username };

	// Optional filters
	if(req.query.search) {
		query.name = { $regex: req.query.search, $options: 'i' };
	}
	if(req.query.type) {
		query.type = req.query.type;
	}
	if(req.query.crMin || req.query.crMax) {
		query.cr = {};
		if(req.query.crMin) query.cr.$gte = req.query.crMin;
		if(req.query.crMax) query.cr.$lte = req.query.crMax;
	}
	if(req.query.system) {
		query.system = req.query.system;
	}

	const fields = ['name', 'size', 'type', 'subtype', 'alignment', 'cr', 'tags',
		'system', 'shareId', 'editId', 'authors', 'isHomebrew', 'source',
		'createdAt', 'updatedAt', 'views'];

	const [statblocks, total] = await Promise.all([
		StatblockModel.find(query, fields).sort({ updatedAt: -1 }).skip(skip).limit(count).lean().exec(),
		StatblockModel.countDocuments(query)
	]);

	res.status(200).send({
		statblocks,
		page,
		totalPages : Math.ceil(total / count),
		total
	});
}));

// Batch fetch stat blocks by shareIds (for embedding multiple in a brew)
router.get('/api/statblocks/batch', asyncHandler(async (req, res)=>{
	const ids = (req.query.ids || '').split(',').filter(Boolean).slice(0, 20);
	if(ids.length === 0) {
		return res.status(200).send({});
	}

	const statblocks = await StatblockModel.find({ shareId: { $in: ids } }).lean().exec();
	const result = {};
	for (const sb of statblocks) {
		sanitize(sb);
		result[sb.shareId] = sb;
	}

	res.status(200).send(result);
}));

// Bulk import stat blocks from JSON array
router.post('/api/statblocks/import', asyncHandler(async (req, res)=>{
	if(!requireAuth(req, res)) return;

	const items = req.body;
	if(!Array.isArray(items) || items.length === 0) {
		return res.status(400).send({ error: 'Request body must be a non-empty array of stat blocks' });
	}

	if(items.length > 200) {
		return res.status(400).send({ error: 'Maximum 200 stat blocks per import' });
	}

	const results = [];
	for (const item of items) {
		delete item._id;
		delete item.__v;
		delete item.editId;
		delete item.shareId;
		delete item.id;
		delete item.createdAt;
		delete item.updatedAt;

		item.authors = [req.account.username];

		const sb = new StatblockModel(item);
		sb.editId  = nanoid(12);
		sb.shareId = nanoid(12);

		const saved = await sb.save().catch((err)=>{
			console.error('Import error:', err);
			return null;
		});
		if(saved) results.push(sanitize(saved.toObject()));
	}

	res.status(200).send({ imported: results.length, statblocks: results });
}));

export default router;
