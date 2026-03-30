import _              from 'lodash';
import express        from 'express';
import asyncHandler   from 'express-async-handler';
import { nanoid }     from 'nanoid';
import { model as BestiaryModel } from './willowlight-bestiary.model.js';
import dbCheck        from './middleware/dbCheck.js';

const router = express.Router();

const sanitize = (obj)=>{
	obj._id = undefined;
	obj.__v = undefined;
	return obj;
};

const requireAuth = (req, res)=>{
	if(!req.account) {
		res.status(401).send({ error: 'You must be logged in' });
		return false;
	}
	return true;
};

const MIXED_FIELDS = ['atkTN', 'defTN', 'scale', 'health', 'traits'];

router.use('/api/willowlight-bestiary', dbCheck);

// Create
router.post('/api/willowlight-bestiary', asyncHandler(async (req, res)=>{
	if(!requireAuth(req, res)) return;
	const data = req.body;
	delete data.editId; delete data.shareId;
	data.authors = [req.account.username];

	const doc = new BestiaryModel(data);
	doc.editId  = nanoid(12);
	doc.shareId = nanoid(12);

	const saved = await doc.save().catch((err)=>{
		console.error(err);
		throw { name: 'Save Error', message: `Error creating bestiary entry: ${err.toString()}`, status: 500 };
	});
	res.status(200).send(sanitize(saved.toObject()));
}));

// Update
router.put('/api/willowlight-bestiary/:id', asyncHandler(async (req, res)=>{
	if(!requireAuth(req, res)) return;
	const doc = await BestiaryModel.get({ editId: req.params.id }).catch(()=>{
		throw { name: 'Not Found', message: 'Bestiary entry not found', status: 404 };
	});
	if(!doc.authors.includes(req.account.username)) {
		return res.status(403).send({ error: 'You are not an author' });
	}

	const updates = _.omit(req.body, ['_id', '__v', 'editId', 'shareId', 'authors', 'createdAt']);
	updates.updatedAt = new Date();
	Object.assign(doc, updates);
	for (const f of MIXED_FIELDS) doc.markModified(f);

	const saved = await doc.save().catch((err)=>{
		console.error(err);
		throw { name: 'Update Error', message: `Error updating bestiary entry: ${err.toString()}`, status: 500 };
	});
	res.status(200).send(sanitize(saved.toObject()));
}));

// Delete
router.delete('/api/willowlight-bestiary/:id', asyncHandler(async (req, res)=>{
	if(!requireAuth(req, res)) return;
	const doc = await BestiaryModel.findOne({ editId: req.params.id }).catch(()=>{
		throw { name: 'Not Found', message: 'Bestiary entry not found', status: 404 };
	});
	if(!doc) return res.status(404).send({ error: 'Bestiary entry not found' });
	if(!doc.authors.includes(req.account.username)) {
		return res.status(403).send({ error: 'You are not an author' });
	}
	await BestiaryModel.deleteOne({ _id: doc._id });
	res.status(200).send({ success: true });
}));

// Get by shareId
router.get('/api/willowlight-bestiary/:id', asyncHandler(async (req, res)=>{
	const doc = await BestiaryModel.get({ shareId: req.params.id }).catch(()=>{
		throw { name: 'Not Found', message: 'Bestiary entry not found', status: 404 };
	});
	res.status(200).send(sanitize(doc.toObject()));
}));

// List for current user
router.get('/api/willowlight-bestiaries', asyncHandler(async (req, res)=>{
	if(!requireAuth(req, res)) return;
	const page  = Math.max(1, parseInt(req.query.page) || 1);
	const count = Math.min(100, Math.max(1, parseInt(req.query.count) || 50));
	const skip  = (page - 1) * count;

	const query = { authors: req.account.username };
	if(req.query.search) query.name = { $regex: req.query.search, $options: 'i' };
	if(req.query.tier) query.tier = req.query.tier;

	const fields = ['name', 'subtitle', 'tier', 'tags', 'source',
		'shareId', 'editId', 'authors', 'createdAt', 'updatedAt'];

	const [entries, total] = await Promise.all([
		BestiaryModel.find(query, fields).sort({ updatedAt: -1 }).skip(skip).limit(count).lean().exec(),
		BestiaryModel.countDocuments(query)
	]);
	res.status(200).send({ entries, page, totalPages: Math.ceil(total / count), total });
}));

// Bulk import
router.post('/api/willowlight-bestiaries/import', asyncHandler(async (req, res)=>{
	if(!requireAuth(req, res)) return;
	const items = req.body;
	if(!Array.isArray(items) || items.length === 0) return res.status(400).send({ error: 'Must be a non-empty array' });
	if(items.length > 200) return res.status(400).send({ error: 'Maximum 200 per import' });

	const results = [];
	for (const item of items) {
		delete item._id; delete item.__v; delete item.editId;
		delete item.shareId; delete item.id; delete item.createdAt; delete item.updatedAt;
		item.authors = [req.account.username];
		const doc = new BestiaryModel(item);
		doc.editId = nanoid(12); doc.shareId = nanoid(12);
		const saved = await doc.save().catch((err)=>{ console.error('Import error:', err); return null; });
		if(saved) results.push(sanitize(saved.toObject()));
	}
	res.status(200).send({ imported: results.length, entries: results });
}));

export default router;
