import _              from 'lodash';
import express        from 'express';
import asyncHandler   from 'express-async-handler';
import { nanoid }     from 'nanoid';
import { model as WillowlightStatblockModel } from './willowlight-statblock.model.js';
import { render }     from '../shared/willowlightStatblock/renderer.js';
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

router.use('/api/willowlight-statblock', dbCheck);

// Create
router.post('/api/willowlight-statblock', asyncHandler(async (req, res)=>{
	if(!requireAuth(req, res)) return;

	const data = req.body;
	delete data.editId;
	delete data.shareId;
	data.authors = [req.account.username];

	const sb = new WillowlightStatblockModel(data);
	sb.editId  = nanoid(12);
	sb.shareId = nanoid(12);

	const saved = await sb.save()
		.catch((err)=>{
			console.error(err);
			throw { name: 'WillowlightSave Error', message: `Error creating Willowlight stat block: ${err.toString()}`, status: 500 };
		});

	res.status(200).send(sanitize(saved.toObject()));
}));

// Update
router.put('/api/willowlight-statblock/:id', asyncHandler(async (req, res)=>{
	if(!requireAuth(req, res)) return;

	const sb = await WillowlightStatblockModel.get({ editId: req.params.id })
		.catch(()=>{
			throw { name: 'Not Found', message: 'Willowlight stat block not found', status: 404 };
		});

	if(!sb.authors.includes(req.account.username)) {
		return res.status(403).send({ error: 'You are not an author of this stat block' });
	}

	const updates = _.omit(req.body, ['_id', '__v', 'editId', 'shareId', 'authors', 'createdAt']);
	updates.updatedAt = new Date();

	Object.assign(sb, updates);
	sb.markModified('attributes');
	sb.markModified('scale');
	sb.markModified('vocation');
	sb.markModified('interests');
	sb.markModified('hobbies');
	sb.markModified('attacks');
	sb.markModified('edges');
	sb.markModified('aspects');
	sb.markModified('burdens');

	const saved = await sb.save()
		.catch((err)=>{
			console.error(err);
			throw { name: 'WillowlightUpdate Error', message: `Error updating Willowlight stat block: ${err.toString()}`, status: 500 };
		});

	res.status(200).send(sanitize(saved.toObject()));
}));

// Delete
router.delete('/api/willowlight-statblock/:id', asyncHandler(async (req, res)=>{
	if(!requireAuth(req, res)) return;

	const sb = await WillowlightStatblockModel.findOne({ editId: req.params.id })
		.catch(()=>{
			throw { name: 'Not Found', message: 'Willowlight stat block not found', status: 404 };
		});

	if(!sb) return res.status(404).send({ error: 'Willowlight stat block not found' });
	if(!sb.authors.includes(req.account.username)) {
		return res.status(403).send({ error: 'You are not an author of this stat block' });
	}

	sb.authors = sb.authors.filter((a)=>a !== req.account.username);
	if(sb.authors.length === 0) {
		await WillowlightStatblockModel.deleteOne({ _id: sb._id });
	} else {
		await sb.save();
	}

	res.status(200).send({ success: true });
}));

// Render HTML
router.get('/api/willowlight-statblock/render/:id', asyncHandler(async (req, res)=>{
	const sb = await WillowlightStatblockModel.get({ shareId: req.params.id })
		.catch(()=>{
			throw { name: 'Not Found', message: 'Willowlight stat block not found', status: 404 };
		});

	const layout = req.query.layout === 'wide' ? 'wide' : 'narrow';
	const bw = req.query.bw === '1' || req.query.bw === 'true';
	const html = render(sb.toObject(), layout, { bw });
	res.status(200).send(html);
}));

// Get by shareId
router.get('/api/willowlight-statblock/:id', asyncHandler(async (req, res)=>{
	const sb = await WillowlightStatblockModel.get({ shareId: req.params.id })
		.catch(()=>{
			throw { name: 'Not Found', message: 'Willowlight stat block not found', status: 404 };
		});

	res.status(200).send(sanitize(sb.toObject()));
}));

// List for current user
router.get('/api/willowlight-statblocks', asyncHandler(async (req, res)=>{
	if(!requireAuth(req, res)) return;

	const page  = Math.max(1, parseInt(req.query.page) || 1);
	const count = Math.min(100, Math.max(1, parseInt(req.query.count) || 50));
	const skip  = (page - 1) * count;

	const query = { authors: req.account.username };
	if(req.query.search) query.name = { $regex: req.query.search, $options: 'i' };

	const fields = ['name', 'path', 'conviction', 'tags', 'source',
		'shareId', 'editId', 'authors', 'createdAt', 'updatedAt', 'views'];

	const [statblocks, total] = await Promise.all([
		WillowlightStatblockModel.find(query, fields).sort({ updatedAt: -1 }).skip(skip).limit(count).lean().exec(),
		WillowlightStatblockModel.countDocuments(query)
	]);

	res.status(200).send({ statblocks, page, totalPages: Math.ceil(total / count), total });
}));

// Bulk import
router.post('/api/willowlight-statblocks/import', asyncHandler(async (req, res)=>{
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

		const sb = new WillowlightStatblockModel(item);
		sb.editId  = nanoid(12);
		sb.shareId = nanoid(12);

		const saved = await sb.save().catch((err)=>{ console.error('Import error:', err); return null; });
		if(saved) results.push(sanitize(saved.toObject()));
	}

	res.status(200).send({ imported: results.length, statblocks: results });
}));

export default router;
