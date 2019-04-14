import $ from 'cafy';
import { resolveUser } from '../../../../remote/resolve-user';
import define from '../../define';
import { apiLogger } from '../../logger';
import { ApiError } from '../../error';
import { ID } from '../../../../misc/cafy-id';
import { Users } from '../../../../models';
import { In } from 'typeorm';

export const meta = {
	desc: {
		'ja-JP': '指定したユーザーの情報を取得します。'
	},

	tags: ['users'],

	requireCredential: false,

	params: {
		userId: {
			validator: $.optional.type(ID),
			desc: {
				'ja-JP': '対象のユーザーのID',
				'en-US': 'Target user ID'
			}
		},

		userIds: {
			validator: $.optional.arr($.type(ID)).unique(),
			desc: {
				'ja-JP': 'ユーザーID (配列)'
			}
		},

		username: {
			validator: $.optional.str
		},

		host: {
			validator: $.optional.nullable.str
		}
	},

	res: {
		type: 'User',
	},

	errors: {
		failedToResolveRemoteUser: {
			message: 'Failed to resolve remote user.',
			code: 'FAILED_TO_RESOLVE_REMOTE_USER',
			id: 'ef7b9be4-9cba-4e6f-ab41-90ed171c7d3c',
			kind: 'server' as 'server'
		},

		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: '4362f8dc-731f-4ad8-a694-be5a88922a24'
		},
	}
};

export default define(meta, async (ps, me) => {
	let user;

	if (ps.userIds) {
		const users = await Users.find({
			id: In(ps.userIds)
		});

		return await Promise.all(users.map(u => Users.pack(u, me, {
			detail: true
		})));
	} else {
		// Lookup user
		if (typeof ps.host === 'string' && typeof ps.username === 'string') {
			user = await resolveUser(ps.username, ps.host).catch(e => {
				apiLogger.warn(`failed to resolve remote user: ${e}`);
				throw new ApiError(meta.errors.failedToResolveRemoteUser);
			});
		} else {
			const q: any = ps.userId != null
				? { id: ps.userId }
				: { usernameLower: ps.username!.toLowerCase(), host: null };

			user = await Users.findOne(q);
		}

		if (user == null) {
			throw new ApiError(meta.errors.noSuchUser);
		}

		// ユーザー情報更新
		if (Users.isRemoteUser(user)) {
			if (user.lastFetchedAt == null || Date.now() - user.lastFetchedAt.getTime() > 1000 * 60 * 60 * 24) {
				resolveUser(user.username, user.host, { }, true);
			}
		}

		return await Users.pack(user, me, {
			detail: true
		});
	}
});
