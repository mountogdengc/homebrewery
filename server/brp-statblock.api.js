import _              from 'lodash';
import express        from 'express';
import asyncHandler   from 'express-async-handler';
import { nanoid }     from 'nanoid';
import { model as BrpStatblockModel } from './brp-statblock.model.js';
import { render }     from '../shared/brpStatblock/renderer.js';
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

router.use('/api/brp-statblock', dbCheck);

// Create
router.post('/api/brp-statblock', asyncHandler(async (req, res)=>{
	if(!requireAuth(req, res)) return;

	const data = req.body;
	delete data.editId;
	delete data.shareId;
	data.authors = [req.account.username];

	const sb = new BrpStatblockModel(data);
	sb.editId  = nanoid(12);
	sb.shareId = nanoid(12);

	const saved = await sb.save()
		.catch((err)=>{
			console.error(err);
			throw { name: 'BrpStatblockSave Error', message: `Error creating BRP stat block: ${err.toString()}`, status: 500 };
		});

	res.status(200).send(sanitize(saved.toObject()));
}));

// Update
router.put('/api/brp-statblock/:id', asyncHandler(async (req, res)=>{
	if(!requireAuth(req, res)) return;

	const sb = await BrpStatblockModel.get({ editId: req.params.id })
		.catch(()=>{
			throw { name: 'Not Found', message: 'BRP stat block not found', status: 404 };
		});

	if(!sb.authors.includes(req.account.username)) {
		return res.status(403).send({ error: 'You are not an author of this stat block' });
	}

	const updates = _.omit(req.body, ['_id', '__v', 'editId', 'shareId', 'authors', 'createdAt']);
	updates.updatedAt = new Date();

	Object.assign(sb, updates);
	sb.markModified('characteristics');
	sb.markModified('skills');
	sb.markModified('weapons');
	sb.markModified('spells');
	sb.markModified('traits');
	sb.markModified('hitLocations');

	const saved = await sb.save()
		.catch((err)=>{
			console.error(err);
			throw { name: 'BrpStatblockUpdate Error', message: `Error updating BRP stat block: ${err.toString()}`, status: 500 };
		});

	res.status(200).send(sanitize(saved.toObject()));
}));

// Delete
router.delete('/api/brp-statblock/:id', asyncHandler(async (req, res)=>{
	if(!requireAuth(req, res)) return;

	const sb = await BrpStatblockModel.findOne({ editId: req.params.id })
		.catch(()=>{
			throw { name: 'Not Found', message: 'BRP stat block not found', status: 404 };
		});

	if(!sb) return res.status(404).send({ error: 'BRP stat block not found' });
	if(!sb.authors.includes(req.account.username)) {
		return res.status(403).send({ error: 'You are not an author of this stat block' });
	}

	sb.authors = sb.authors.filter((a)=>a !== req.account.username);
	if(sb.authors.length === 0) {
		await BrpStatblockModel.deleteOne({ _id: sb._id });
	} else {
		await sb.save();
	}

	res.status(200).send({ success: true });
}));

// Render HTML
router.get('/api/brp-statblock/render/:id', asyncHandler(async (req, res)=>{
	const sb = await BrpStatblockModel.get({ shareId: req.params.id })
		.catch(()=>{
			throw { name: 'Not Found', message: 'BRP stat block not found', status: 404 };
		});

	const layout = req.query.layout === 'wide' ? 'wide' : 'narrow';
	const html = render(sb.toObject(), layout);
	res.status(200).send(html);
}));

// Get by shareId
router.get('/api/brp-statblock/:id', asyncHandler(async (req, res)=>{
	const sb = await BrpStatblockModel.get({ shareId: req.params.id })
		.catch(()=>{
			throw { name: 'Not Found', message: 'BRP stat block not found', status: 404 };
		});

	res.status(200).send(sanitize(sb.toObject()));
}));

// List for current user
router.get('/api/brp-statblocks', asyncHandler(async (req, res)=>{
	if(!requireAuth(req, res)) return;

	const page  = Math.max(1, parseInt(req.query.page) || 1);
	const count = Math.min(100, Math.max(1, parseInt(req.query.count) || 50));
	const skip  = (page - 1) * count;

	const query = { authors: req.account.username };
	if(req.query.search) query.name = { $regex: req.query.search, $options: 'i' };
	if(req.query.category) query.category = req.query.category;

	const fields = ['name', 'category', 'subtype', 'tags', 'source',
		'shareId', 'editId', 'authors', 'createdAt', 'updatedAt', 'views'];

	const [statblocks, total] = await Promise.all([
		BrpStatblockModel.find(query, fields).sort({ updatedAt: -1 }).skip(skip).limit(count).lean().exec(),
		BrpStatblockModel.countDocuments(query)
	]);

	res.status(200).send({ statblocks, page, totalPages: Math.ceil(total / count), total });
}));

// Bulk import
router.post('/api/brp-statblocks/import', asyncHandler(async (req, res)=>{
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

		const sb = new BrpStatblockModel(item);
		sb.editId  = nanoid(12);
		sb.shareId = nanoid(12);

		const saved = await sb.save().catch((err)=>{ console.error('Import error:', err); return null; });
		if(saved) results.push(sanitize(saved.toObject()));
	}

	res.status(200).send({ imported: results.length, statblocks: results });
}));

export default router;
