import $ from 'cafy';
import define from '../define';
import { ID } from '@/misc/cafy-id';
import { publishMainStream } from '../../../services/stream';
import { Users, Pages } from '../../../models';
import { ApiError } from '../error';

export const meta = {
	requireCredential: true as const,
	secure: true,

	params: {
		pageId: {
			validator: $.type(ID)
		},

		event: {
			validator: $.str
		},

		var: {
			validator: $.optional.nullable.any
		}
	},

	errors: {
		noSuchPage: {
			message: 'No such page.',
			code: 'NO_SUCH_PAGE',
			id: '4a13ad31-6729-46b4-b9af-e86b265c2e74'
		}
	}
};

export default define(meta, async (ps, user) => {
	const page = await Pages.findOne(ps.pageId);
	if (page == null) {
		throw new ApiError(meta.errors.noSuchPage);
	}

	publishMainStream(page.userId, 'pageEvent', {
		pageId: ps.pageId,
		event: ps.event,
		var: ps.var,
		userId: user.id,
		user: await Users.pack(user, page.userId, {
			detail: true
		})
	});
});
