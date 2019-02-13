import $ from 'cafy';
import ID, { transform, transformMany } from '../../../../misc/cafy-id';
import User, { pack, isRemoteUser } from '../../../../models/user';
import resolveRemoteUser from '../../../../remote/resolve-user';
import define from '../../define';
import { apiLogger } from '../../logger';

const cursorOption = { fields: { data: false } };

export const meta = {
	desc: {
		'ja-JP': '指定したユーザーの情報を取得します。'
	},

	requireCredential: false,

	params: {
		userId: {
			validator: $.optional.type(ID),
			transform: transform,
			desc: {
				'ja-JP': '対象のユーザーのID',
				'en-US': 'Target user ID'
			}
		},

		userIds: {
			validator: $.optional.arr($.type(ID)).unique(),
			transform: transformMany,
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
	}
};

export default define(meta, (ps, me) => new Promise(async (res, rej) => {
	let user;

	if (ps.userIds) {
		const users = await User.find({
			_id: {
				$in: ps.userIds
			}
		});

		res(await Promise.all(users.map(u => pack(u, me, {
			detail: true
		}))));
	} else {
		// Lookup user
		if (typeof ps.host === 'string') {
			try {
				user = await resolveRemoteUser(ps.username, ps.host, cursorOption);
			} catch (e) {
				apiLogger.warn(`failed to resolve remote user: ${e}`);
				return rej('failed to resolve remote user');
			}
		} else {
			const q: any = ps.userId != null
				? { _id: ps.userId }
				: { usernameLower: ps.username.toLowerCase(), host: null };

			user = await User.findOne(q, cursorOption);

			if (user === null) {
				return rej('user not found');
			}
		}

		// Send response
		res(await pack(user, me, {
			detail: true
		}));

		if (isRemoteUser(user)) {
			if (user.lastFetchedAt == null || Date.now() - user.lastFetchedAt.getTime() > 1000 * 60 * 60 * 24) {
				resolveRemoteUser(ps.username, ps.host, { }, true);
			}
		}
	}
}));
