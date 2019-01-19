import $ from 'cafy';
import User from '../../../../models/user';
import { validateUsername } from '../../../../models/user';
import define from '../../define';

export const meta = {
	requireCredential: false,

	params: {
		username: {
			validator: $.str.pipe(validateUsername)
		}
	}
};

export default define(meta, (ps) => User.count({
		host: null,
		usernameLower: ps.username.toLowerCase()
	}, { limit: 1 })
	.then(x => ({ available: !x })));
