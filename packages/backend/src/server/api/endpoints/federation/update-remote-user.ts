import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../define';
import { getRemoteUser } from '../../common/getters';
import { updatePerson } from '@/remote/activitypub/models/person';

export const meta = {
	tags: ['federation'],

	requireCredential: true as const,

	params: {
		userId: {
			validator: $.type(ID),
		},
	},
};

export default define(meta, async (ps) => {
	const user = await getRemoteUser(ps.userId);
	await updatePerson(user.uri!);
});
