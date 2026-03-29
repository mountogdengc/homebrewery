import _              from 'lodash';
import express        from 'express';
import asyncHandler   from 'express-async-handler';
import { nanoid }     from 'nanoid';
import { model as WillowlightCharacterModel } from './willowlight-character.model.js';
import { render }     from '../shared/willowlightCharacter/renderer.js';
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

router.use('/api/willowlight-character', dbCheck);

// Create
router.post('/api/willowlight-character', asyncHandler(async (req, res)=>{
	if(!requireAuth(req, res)) return;
	const data = req.body;
	delete data.editId; delete data.shareId;
	data.authors = [req.account.username];

	const ch = new WillowlightCharacterModel(data);
	ch.editId  = nanoid(12);
	ch.shareId = nanoid(12);

	const saved = await ch.save().catch((err)=>{
		console.error(err);
		throw { name: 'Save Error', message: `Error creating character: ${err.toString()}`, status: 500 };
	});
	res.status(200).send(sanitize(saved.toObject()));
}));

// Update
router.put('/api/willowlight-character/:id', asyncHandler(async (req, res)=>{
	if(!requireAuth(req, res)) return;
	const ch = await WillowlightCharacterModel.get({ editId: req.params.id }).catch(()=>{
		throw { name: 'Not Found', message: 'Character not found', status: 404 };
	});
	if(!ch.authors.includes(req.account.username)) {
		return res.status(403).send({ error: 'You are not an author' });
	}

	const updates = _.omit(req.body, ['_id', '__v', 'editId', 'shareId', 'authors', 'createdAt']);
	updates.updatedAt = new Date();
	Object.assign(ch, updates);

	const mixedFields = ['attributes', 'scale', 'vocation', 'interests', 'hobbies',
		'attacks', 'edges', 'aspects', 'burdens',
		'convictionMilestones', 'pathMilestones', 'contacts', 'secrets'];
	for (const f of mixedFields) ch.markModified(f);

	const saved = await ch.save().catch((err)=>{
		console.error(err);
		throw { name: 'Update Error', message: `Error updating character: ${err.toString()}`, status: 500 };
	});
	res.status(200).send(sanitize(saved.toObject()));
}));

// Delete
router.delete('/api/willowlight-character/:id', asyncHandler(async (req, res)=>{
	if(!requireAuth(req, res)) return;
	const ch = await WillowlightCharacterModel.findOne({ editId: req.params.id }).catch(()=>{
		throw { name: 'Not Found', message: 'Character not found', status: 404 };
	});
	if(!ch) return res.status(404).send({ error: 'Character not found' });
	if(!ch.authors.includes(req.account.username)) {
		return res.status(403).send({ error: 'You are not an author' });
	}
	ch.authors = ch.authors.filter((a)=>a !== req.account.username);
	if(ch.authors.length === 0) {
		await WillowlightCharacterModel.deleteOne({ _id: ch._id });
	} else {
		await ch.save();
	}
	res.status(200).send({ success: true });
}));

// Render HTML
router.get('/api/willowlight-character/render/:id', asyncHandler(async (req, res)=>{
	const ch = await WillowlightCharacterModel.get({ shareId: req.params.id }).catch(()=>{
		throw { name: 'Not Found', message: 'Character not found', status: 404 };
	});
	const layout = req.query.layout === 'wide' ? 'wide' : 'narrow';
	const bw = req.query.bw === '1' || req.query.bw === 'true';
	const html = render(ch.toObject(), layout, { bw });
	res.status(200).send(html);
}));

// Get by shareId
router.get('/api/willowlight-character/:id', asyncHandler(async (req, res)=>{
	const ch = await WillowlightCharacterModel.get({ shareId: req.params.id }).catch(()=>{
		throw { name: 'Not Found', message: 'Character not found', status: 404 };
	});
	res.status(200).send(sanitize(ch.toObject()));
}));

// List for current user
router.get('/api/willowlight-characters', asyncHandler(async (req, res)=>{
	if(!requireAuth(req, res)) return;
	const page  = Math.max(1, parseInt(req.query.page) || 1);
	const count = Math.min(100, Math.max(1, parseInt(req.query.count) || 50));
	const skip  = (page - 1) * count;

	const query = { authors: req.account.username };
	if(req.query.search) query.name = { $regex: req.query.search, $options: 'i' };

	const fields = ['name', 'player', 'path', 'conviction', 'tags', 'source',
		'shareId', 'editId', 'authors', 'createdAt', 'updatedAt', 'views'];

	const [chars, total] = await Promise.all([
		WillowlightCharacterModel.find(query, fields).sort({ updatedAt: -1 }).skip(skip).limit(count).lean().exec(),
		WillowlightCharacterModel.countDocuments(query)
	]);
	res.status(200).send({ characters: chars, page, totalPages: Math.ceil(total / count), total });
}));

// Bulk import
router.post('/api/willowlight-characters/import', asyncHandler(async (req, res)=>{
	if(!requireAuth(req, res)) return;
	const items = req.body;
	if(!Array.isArray(items) || items.length === 0) return res.status(400).send({ error: 'Must be a non-empty array' });
	if(items.length > 200) return res.status(400).send({ error: 'Maximum 200 per import' });

	const results = [];
	for (const item of items) {
		delete item._id; delete item.__v; delete item.editId;
		delete item.shareId; delete item.id; delete item.createdAt; delete item.updatedAt;
		item.authors = [req.account.username];
		const ch = new WillowlightCharacterModel(item);
		ch.editId = nanoid(12); ch.shareId = nanoid(12);
		const saved = await ch.save().catch((err)=>{ console.error('Import error:', err); return null; });
		if(saved) results.push(sanitize(saved.toObject()));
	}
	res.status(200).send({ imported: results.length, characters: results });
}));

export default router;
