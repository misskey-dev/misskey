/**
 * Module dependencies
 */
import $ from 'cafy';
import Subscription from '../../../../models/sw-subscription';

/**
 * subscribe service worker
 */
module.exports = async (params, user, app) => new Promise(async (res, rej) => {
	// Get 'endpoint' parameter
	const [endpoint, endpointErr] = $.str.get(params.endpoint);
	if (endpointErr) return rej('invalid endpoint param');

	// Get 'auth' parameter
	const [auth, authErr] = $.str.get(params.auth);
	if (authErr) return rej('invalid auth param');

	// Get 'publickey' parameter
	const [publickey, publickeyErr] = $.str.get(params.publickey);
	if (publickeyErr) return rej('invalid publickey param');

	// if already subscribed
	const exist = await Subscription.findOne({
		userId: user._id,
		endpoint: endpoint,
		auth: auth,
		publickey: publickey,
		deletedAt: { $exists: false }
	});

	if (exist !== null) {
		return res();
	}

	await Subscription.insert({
		userId: user._id,
		endpoint: endpoint,
		auth: auth,
		publickey: publickey
	});

	res();
});
