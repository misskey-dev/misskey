import $ from 'cafy';
import Subscription from '../../../../models/sw-subscription';
import { ILocalUser } from '../../../../models/user';
import config from '../../../../config';
import getParams from '../../get-params';

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

export default async (params: any, user: ILocalUser) => new Promise(async (res, rej) => {
	const [ps, psErr] = getParams(meta, params);
	if (psErr) return rej(psErr);

	// if already subscribed
	const exist = await Subscription.findOne({
		userId: user._id,
		endpoint: ps.endpoint,
		auth: ps.auth,
		publickey: ps.publickey,
		deletedAt: { $exists: false }
	});

	if (exist != null) {
		return res({
			state: 'already-subscribed',
			key: config.sw.public_key
		});
	}

	await Subscription.insert({
		userId: user._id,
		endpoint: ps.endpoint,
		auth: ps.auth,
		publickey: ps.publickey
	});

	res({
		state: 'subscribed',
		key: config.sw.public_key
	});
});
