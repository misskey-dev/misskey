import * as mongo from 'mongodb';
import $ from 'cafy';
import ID, { transform } from '../../../../misc/cafy-id';
import define from '../../define';
import { getRemoteUser } from '../../common/getters';
import { updatePerson } from '../../../../remote/activitypub/models/person';

export const meta = {
	desc: {
		'ja-JP': '指定されたリモートユーザーの情報を更新します。',
		'en-US': 'Update specified remote user information.'
	},

	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	params: {
		userId: {
			validator: $.type(ID),
			transform: transform,
			desc: {
				'ja-JP': '対象のユーザーID',
				'en-US': 'The user ID which you want to update'
			}
		},
	}
};

export default define(meta, async (ps) => {
	await updatePersonById(ps.userId);
	return;
});

async function updatePersonById(userId: mongo.ObjectID) {
	const user = await getRemoteUser(userId);
	await updatePerson(user.uri);
}
