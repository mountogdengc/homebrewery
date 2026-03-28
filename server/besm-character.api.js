import _              from 'lodash';
import express        from 'express';
import asyncHandler   from 'express-async-handler';
import { nanoid }     from 'nanoid';
import { model as BesmCharacterModel } from './besm-character.model.js';
import dbCheck        from './middleware/dbCheck.js';

const router = express.Router();

// ── Helpers ──────────────────────────────────────────────────────────────

const sanitize = (bc)=>{
	bc._id = undefined;
	bc.__v = undefined;
	return bc;
};

const requireAuth = (req, res)=>{
	if(!req.account) {
		res.status(401).send({ error: 'You must be logged in' });
		return false;
	}
	return true;
};

// Mixed fields that need markModified() on update
const MIXED_FIELDS = [
	'stats', 'templates', 'sizeModifiers', 'characterClass',
	'appliedTemplates', 'derivedValues'
];

// ── API Routes ───────────────────────────────────────────────────────────

router.use('/api/besm', dbCheck);

// Create a new BESM character
router.post('/api/besm', asyncHandler(async (req, res)=>{
	if(!requireAuth(req, res)) return;

	const data = req.body;
	delete data.editId;
	delete data.shareId;

	data.authors = [req.account.username];

	const character = new BesmCharacterModel(data);
	character.editId  = nanoid(12);
	character.shareId = nanoid(12);

	const saved = await character.save()
		.catch((err)=>{
			console.error(err);
			throw { name: 'BesmSave Error', message: `Error creating BESM character: ${err.toString()}`, status: 500 };
		});

	res.status(200).send(sanitize(saved.toObject()));
}));

// Update an existing BESM character by editId
router.put('/api/besm/:id', asyncHandler(async (req, res)=>{
	if(!requireAuth(req, res)) return;

	const bc = await BesmCharacterModel.get({ editId: req.params.id })
		.catch(()=>{
			throw { name: 'Not Found', message: 'BESM character not found', status: 404 };
		});

	if(!bc.authors.includes(req.account.username)) {
		return res.status(403).send({ error: 'You are not an author of this character' });
	}

	const updates = _.omit(req.body, ['_id', '__v', 'editId', 'shareId', 'authors', 'createdAt']);
	updates.updatedAt = new Date();

	Object.assign(bc, updates);
	for(const field of MIXED_FIELDS) {
		bc.markModified(field);
	}

	const saved = await bc.save()
		.catch((err)=>{
			console.error(err);
			throw { name: 'BesmUpdate Error', message: `Error updating BESM character: ${err.toString()}`, status: 500 };
		});

	res.status(200).send(sanitize(saved.toObject()));
}));

// Delete a BESM character by editId
router.delete('/api/besm/:id', asyncHandler(async (req, res)=>{
	if(!requireAuth(req, res)) return;

	const bc = await BesmCharacterModel.findOne({ editId: req.params.id })
		.catch(()=>{
			throw { name: 'Not Found', message: 'BESM character not found', status: 404 };
		});

	if(!bc) {
		return res.status(404).send({ error: 'BESM character not found' });
	}

	if(!bc.authors.includes(req.account.username)) {
		return res.status(403).send({ error: 'You are not an author of this character' });
	}

	bc.authors = bc.authors.filter((a)=>a !== req.account.username);
	if(bc.authors.length === 0) {
		await BesmCharacterModel.deleteOne({ _id: bc._id });
	} else {
		await bc.save();
	}

	res.status(200).send({ success: true });
}));

// Get a single BESM character by shareId (public read)
router.get('/api/besm/:id', asyncHandler(async (req, res)=>{
	const bc = await BesmCharacterModel.get({ shareId: req.params.id })
		.catch(()=>{
			throw { name: 'Not Found', message: 'BESM character not found', status: 404 };
		});

	res.status(200).send(sanitize(bc.toObject()));
}));

// List BESM characters for the current user (library view)
router.get('/api/besm-characters', asyncHandler(async (req, res)=>{
	if(!requireAuth(req, res)) return;

	const page   = Math.max(1, parseInt(req.query.page) || 1);
	const count  = Math.min(100, Math.max(1, parseInt(req.query.count) || 50));
	const skip   = (page - 1) * count;

	const query = { authors: req.account.username };

	if(req.query.search) {
		query.name = { $regex: req.query.search, $options: 'i' };
	}

	const fields = ['name', 'identity', 'totalCP', 'selectedGenre',
		'shareId', 'editId', 'authors',
		'createdAt', 'updatedAt', 'views'];

	const [characters, total] = await Promise.all([
		BesmCharacterModel.find(query, fields).sort({ updatedAt: -1 }).skip(skip).limit(count).lean().exec(),
		BesmCharacterModel.countDocuments(query)
	]);

	res.status(200).send({
		characters,
		page,
		totalPages : Math.ceil(total / count),
		total
	});
}));

// Bulk import BESM characters from JSON array
router.post('/api/besm-characters/import', asyncHandler(async (req, res)=>{
	if(!requireAuth(req, res)) return;

	const items = req.body;
	if(!Array.isArray(items) || items.length === 0) {
		return res.status(400).send({ error: 'Request body must be a non-empty array of BESM characters' });
	}

	if(items.length > 200) {
		return res.status(400).send({ error: 'Maximum 200 characters per import' });
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

		const bc = new BesmCharacterModel(item);
		bc.editId  = nanoid(12);
		bc.shareId = nanoid(12);

		const saved = await bc.save().catch((err)=>{
			console.error('Import error:', err);
			return null;
		});
		if(saved) results.push(sanitize(saved.toObject()));
	}

	res.status(200).send({ imported: results.length, characters: results });
}));

export default router;
