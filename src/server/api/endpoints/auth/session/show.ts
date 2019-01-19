import $ from 'cafy';
import AuthSess, { pack } from '../../../../../models/auth-session';
import define from '../../../define';
import { error } from '../../../../../prelude/promise';

export const meta = {
	requireCredential: false,

	params: {
		token: {
			validator: $.str
		}
	}
};

export default define(meta, (ps, user) => AuthSess.findOne({ token: ps.token })
	.then(x =>
		!x ? error('session not found') :
		pack(x, user)));
