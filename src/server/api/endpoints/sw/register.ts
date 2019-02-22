import $ from 'cafy';
import Subscription from '../../../../models/sw-subscription';
import define from '../../define';
import fetchMeta from '../../../../misc/fetch-meta';

export const meta = {
	tags: ['account'],

	requireCredential: true,

	params: {
		endpoint: {
			validator: $.str
		},

		auth: {
			validator: $.str
		},

		publickey: {
			validator: $.str
		}
	}
};

export default define(meta, async (ps, user) => {
	// if already subscribed
	const exist = await Subscription.findOne({
		userId: user._id,
		endpoint: ps.endpoint,
		auth: ps.auth,
		publickey: ps.publickey,
		deletedAt: { $exists: false }
	});

	const instance = await fetchMeta();

	if (exist != null) {
		return {
			state: 'already-subscribed',
			key: instance.swPublicKey
		};
	}

	await Subscription.insert({
		userId: user._id,
		endpoint: ps.endpoint,
		auth: ps.auth,
		publickey: ps.publickey
	});

	return {
		state: 'subscribed',
		key: instance.swPublicKey
	};
});
