import $ from 'cafy';
import AuthSess, { pack } from '../../../../../models/auth-session';
import { ILocalUser } from '../../../../../models/user';
import getParams from '../../../get-params';

export const meta = {
	requireCredential: false,

	params: {
		token: {
			validator: $.str
		}
	}
};

export default (params: any, user: ILocalUser) => new Promise(async (res, rej) => {
	const [ps, psErr] = getParams(meta, params);
	if (psErr) return rej(psErr);

	// Lookup session
	const session = await AuthSess.findOne({
		token: ps.token
	});

	if (session == null) {
		return rej('session not found');
	}

	// Response
	res(await pack(session, user));
});
