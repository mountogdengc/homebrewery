import _              from 'lodash';
import express        from 'express';
import asyncHandler   from 'express-async-handler';
import { nanoid }     from 'nanoid';
import { model as PlaytestSessionModel } from './playtest-session.model.js';
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

const MIXED_FIELDS = ['characters', 'enemies', 'rollLog', 'tides', 'partyAnchor'];

router.use('/api/playtest-session', dbCheck);

// Create
router.post('/api/playtest-session', asyncHandler(async (req, res)=>{
	if(!requireAuth(req, res)) return;
	const data = req.body;
	delete data.sessionId;
	data.authors = [req.account.username];

	const doc = new PlaytestSessionModel(data);
	doc.sessionId = nanoid(12);

	const saved = await doc.save().catch((err)=>{
		console.error(err);
		throw { name: 'Save Error', message: `Error creating session: ${err.toString()}`, status: 500 };
	});
	res.status(200).send(sanitize(saved.toObject()));
}));

// Update
router.put('/api/playtest-session/:id', asyncHandler(async (req, res)=>{
	if(!requireAuth(req, res)) return;
	const doc = await PlaytestSessionModel.get({ sessionId: req.params.id }).catch(()=>{
		throw { name: 'Not Found', message: 'Session not found', status: 404 };
	});
	if(!doc.authors.includes(req.account.username)) {
		return res.status(403).send({ error: 'You are not an author' });
	}

	const updates = _.omit(req.body, ['_id', '__v', 'sessionId', 'authors', 'createdAt']);
	updates.updatedAt = new Date();
	Object.assign(doc, updates);
	for (const f of MIXED_FIELDS) doc.markModified(f);

	const saved = await doc.save().catch((err)=>{
		console.error(err);
		throw { name: 'Update Error', message: `Error updating session: ${err.toString()}`, status: 500 };
	});
	res.status(200).send(sanitize(saved.toObject()));
}));

// Delete
router.delete('/api/playtest-session/:id', asyncHandler(async (req, res)=>{
	if(!requireAuth(req, res)) return;
	const doc = await PlaytestSessionModel.findOne({ sessionId: req.params.id }).catch(()=>{
		throw { name: 'Not Found', message: 'Session not found', status: 404 };
	});
	if(!doc) return res.status(404).send({ error: 'Session not found' });
	if(!doc.authors.includes(req.account.username)) {
		return res.status(403).send({ error: 'You are not an author' });
	}
	await PlaytestSessionModel.deleteOne({ _id: doc._id });
	res.status(200).send({ success: true });
}));

// Get by sessionId
router.get('/api/playtest-session/:id', asyncHandler(async (req, res)=>{
	if(!requireAuth(req, res)) return;
	const doc = await PlaytestSessionModel.get({ sessionId: req.params.id }).catch(()=>{
		throw { name: 'Not Found', message: 'Session not found', status: 404 };
	});
	if(!doc.authors.includes(req.account.username)) {
		return res.status(403).send({ error: 'You are not an author' });
	}
	res.status(200).send(sanitize(doc.toObject()));
}));

// List for current user
router.get('/api/playtest-sessions', asyncHandler(async (req, res)=>{
	if(!requireAuth(req, res)) return;

	const query = { authors: req.account.username };
	if(req.query.system) query.system = req.query.system;

	const fields = ['name', 'system', 'description', 'sessionId',
		'authors', 'createdAt', 'updatedAt'];

	const sessions = await PlaytestSessionModel.find(query, fields)
		.sort({ updatedAt: -1 }).lean().exec();
	res.status(200).send({ sessions });
}));

export default router;
