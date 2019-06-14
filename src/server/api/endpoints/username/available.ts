import $ from 'cafy';
import define from '../../define';
import { Users } from '../../../../models';

export const meta = {
	tags: ['users'],

	requireCredential: false,

	params: {
		username: {
			validator: $.use(Users.validateLocalUsername)
		}
	}
};

export default define(meta, async (ps) => {
	// Get exist
	const exist = await Users.count({
		host: null,
		usernameLower: ps.username.toLowerCase()
	});

	return {
		available: exist === 0
	};
});
