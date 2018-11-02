import $ from 'cafy';
import AuthSess, { pack } from '../../../../../models/auth-session';
import define from '../../../define';

export const meta = {
	requireCredential: false,

	params: {
		token: {
			validator: $.str
		}
	}
};

export default define(meta, (ps, user) => new Promise(async (res, rej) => {
	// Lookup session
	const session = await AuthSess.findOne({
		token: ps.token
	});

	if (session == null) {
		return rej('session not found');
	}

	// Response
	res(await pack(session, user));
}));
