import $ from 'cafy';
import Subscription from '../../../../models/sw-subscription';
import define from '../../define';
import fetchMeta from '../../../../misc/fetch-meta';

export const meta = {
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

export default define(meta, (ps, user) => Subscription.findOne({
		userId: user._id,
		endpoint: ps.endpoint,
		auth: ps.auth,
		publickey: ps.publickey,
		deletedAt: { $exists: false }
	}).then(x => fetchMeta()
		.then(instance => x ? {
				state: 'already-subscribed',
				key: instance.swPublicKey
			} : Subscription.insert({
				userId: user._id,
				endpoint: ps.endpoint,
				auth: ps.auth,
				publickey: ps.publickey
			})
			.then(() => ({
				state: 'subscribed',
				key: instance.swPublicKey
			})))));
