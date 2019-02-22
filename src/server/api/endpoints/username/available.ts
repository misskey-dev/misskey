import $ from 'cafy';
import User from '../../../../models/user';
import { validateUsername } from '../../../../models/user';
import define from '../../define';

export const meta = {
	tags: ['users'],

	requireCredential: false,

	params: {
		username: {
			validator: $.str.pipe(validateUsername)
		}
	}
};

export default define(meta, async (ps) => {
	// Get exist
	const exist = await User.count({
		host: null,
		usernameLower: ps.username.toLowerCase()
	}, {
		limit: 1
	});

	return {
		available: exist === 0
	};
});
