import define from '../../../define';
import { ApiError } from '../../../error';
import { UserGroups } from '@/models/index';

export const meta = {
	tags: ['groups'],

	requireCredential: true,

	kind: 'write:user-groups',

	errors: {
		noSuchGroup: {
			message: 'No such group.',
			code: 'NO_SUCH_GROUP',
			id: '63dbd64c-cd77-413f-8e08-61781e210b38',
		},
	},
} as const;

const paramDef = {
	type: 'object',
	properties: {
		groupId: { type: 'string', format: 'misskey:id' },
	},
	required: ['groupId'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	const userGroup = await UserGroups.findOne({
		id: ps.groupId,
		userId: user.id,
	});

	if (userGroup == null) {
		throw new ApiError(meta.errors.noSuchGroup);
	}

	await UserGroups.delete(userGroup.id);
});
