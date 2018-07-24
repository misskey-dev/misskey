import $ from 'cafy';
import AuthSess, { pack } from '../../../../../models/auth-session';
import { ILocalUser } from '../../../../../models/user';

/**
 * Show a session
 */
export default (params: any, user: ILocalUser) => new Promise(async (res, rej) => {
	// Get 'token' parameter
	const [token, tokenErr] = $.str.get(params.token);
	if (tokenErr) return rej('invalid token param');

	// Lookup session
	const session = await AuthSess.findOne({
		token: token
	});

	if (session == null) {
		return rej('session not found');
	}

	// Response
	res(await pack(session, user));
});
