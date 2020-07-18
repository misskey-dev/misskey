import $ from 'cafy';
import { ID } from '../../../../../misc/cafy-id';
import define from '../../../define';
import { ApiError } from '../../../error';
import { UserGroups } from '../../../../../models';

export const meta = {
	desc: {
		'ja-JP': '指定したユーザーグループを更新します。',
		'en-US': 'Update a user group'
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
		},

		name: {
			validator: $.str.range(1, 100),
			desc: {
				'ja-JP': 'このユーザーグループの名前',
				'en-US': 'name of this user group'
			}
		}
	},

	res: {
		type: 'object' as const,
		optional: false as const, nullable: false as const,
		ref: 'UserGroup',
	},

	errors: {
		noSuchGroup: {
			message: 'No such group.',
			code: 'NO_SUCH_GROUP',
			id: '9081cda3-7a9e-4fac-a6ce-908d70f282f6'
		},
	}
};

export default define(meta, async (ps, me) => {
	// Fetch the group
	const userGroup = await UserGroups.findOne({
		id: ps.groupId,
		userId: me.id
	});

	if (userGroup == null) {
		throw new ApiError(meta.errors.noSuchGroup);
	}

	await UserGroups.update(userGroup.id, {
		name: ps.name
	});

	return await UserGroups.pack(userGroup.id);
});
