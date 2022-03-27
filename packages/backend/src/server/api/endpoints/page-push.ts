import define from '../define.js';
import { publishMainStream } from '@/services/stream.js';
import { Users, Pages } from '@/models/index.js';
import { ApiError } from '../error.js';

export const meta = {
	requireCredential: true,
	secure: true,

	errors: {
		noSuchPage: {
			message: 'No such page.',
			code: 'NO_SUCH_PAGE',
			id: '4a13ad31-6729-46b4-b9af-e86b265c2e74',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		pageId: { type: 'string', format: 'misskey:id' },
		event: { type: 'string' },
		var: {},
	},
	required: ['pageId', 'event'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	const page = await Pages.findOneBy({ id: ps.pageId });
	if (page == null) {
		throw new ApiError(meta.errors.noSuchPage);
	}

	publishMainStream(page.userId, 'pageEvent', {
		pageId: ps.pageId,
		event: ps.event,
		var: ps.var,
		userId: user.id,
		user: await Users.pack(user.id, { id: page.userId }, {
			detail: true,
		}),
	});
});
