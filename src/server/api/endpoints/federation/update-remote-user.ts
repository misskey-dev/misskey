import $ from 'cafy';
import { ID } from '@/misc/cafy-id.js';
import define from '../../define.js';
import { getRemoteUser } from '../../common/getters.js';
import { updatePerson } from '@/remote/activitypub/models/person.js';

export const meta = {
	tags: ['federation'],

	requireCredential: true as const,

	params: {
		userId: {
			validator: $.type(ID),
		},
	}
};

export default define(meta, async (ps) => {
	const user = await getRemoteUser(ps.userId);
	await updatePerson(user.uri!);
});
