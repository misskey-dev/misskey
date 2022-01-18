import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../define';
import { getRemoteUser } from '../../common/getters';
import { updatePerson } from '@/remote/activitypub/models/person';

export const meta = {
	tags: ['federation'],

	requireCredential: true,

	params: {
		userId: {
			validator: $.type(ID),
		},
	},
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps) => {
	const user = await getRemoteUser(ps.userId);
	await updatePerson(user.uri!);
});
