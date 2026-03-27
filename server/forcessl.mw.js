import config from './config.js';

export default (req, res, next)=>{
	const localEnvs = config.get('local_environments') || ['local', 'docker'];
	if(localEnvs.includes(process.env.NODE_ENV)) return next();
	if(req.header('x-forwarded-proto') !== 'https') {
		return res.redirect(302, `https://${req.get('Host')}${req.url}`);
	}
	return next();
};
