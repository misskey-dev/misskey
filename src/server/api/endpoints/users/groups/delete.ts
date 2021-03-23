import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../../define';
import { ApiError } from '../../../error';
import { UserGroups } from '../../../../../models';

export const meta = {
	desc: {
		'ja-JP': '指定したユーザーグループを削除します。',
		'en-US': 'Delete a user group'
	},

	tags: ['groups'],

	requireCredential: true as const,

	kind: 'write:user-groups',

	params: {
		groupId: {
			validator: $.type(ID),
			desc: {
				'ja-JP': '対象となるユーザーグループのID',
				'en-US': 'ID of target user group'
			}
		}
	},

	errors: {
		noSuchGroup: {
			message: 'No such group.',
			code: 'NO_SUCH_GROUP',
			id: '63dbd64c-cd77-413f-8e08-61781e210b38'
		}
	}
};

export default define(meta, async (ps, user) => {
	const userGroup = await UserGroups.findOne({
		id: ps.groupId,
		userId: user.id
	});

	if (userGroup == null) {
		throw new ApiError(meta.errors.noSuchGroup);
	}

	await UserGroups.delete(userGroup.id);
});
