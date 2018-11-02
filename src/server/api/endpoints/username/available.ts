import $ from 'cafy';
import User from '../../../../models/user';
import { validateUsername } from '../../../../models/user';
import getParams from '../../get-params';

export const meta = {
	requireCredential: false,

	params: {
		username: {
			validator: $.str.pipe(validateUsername)
		}
	}
};

export default async (params: any) => new Promise(async (res, rej) => {
	const [ps, psErr] = getParams(meta, params);
	if (psErr) return rej(psErr);

	// Get exist
	const exist = await User
		.count({
			host: null,
			usernameLower: ps.username.toLowerCase()
		}, {
			limit: 1
		});

	// Reply
	res({
		available: exist === 0
	});
});
