import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../define';
import { getRemoteUser } from '../../common/getters';
import { updatePerson } from '../../../../remote/activitypub/models/person';

export const meta = {
	desc: {
		'ja-JP': '指定されたリモートユーザーの情報を更新します。',
		'en-US': 'Update specified remote user information.'
	},

	tags: ['federation'],

	requireCredential: true as const,

	params: {
		userId: {
			validator: $.type(ID),
			desc: {
				'ja-JP': '対象のユーザーID',
				'en-US': 'The user ID which you want to update'
			}
		},
	}
};

export default define(meta, async (ps) => {
	const user = await getRemoteUser(ps.userId);
	await updatePerson(user.uri!);
});
