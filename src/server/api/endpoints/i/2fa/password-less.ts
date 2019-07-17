import $ from 'cafy';
import define from '../../../define';
import { UserProfiles } from '../../../../../models';

export const meta = {
	requireCredential: true,

	secure: true,

	params: {
		value: {
			validator: $.boolean
		}
	}
};

export default define(meta, async (ps, user) => {
	await UserProfiles.update(user.id, {
		usePasswordLessLogin: ps.value
	});
});
