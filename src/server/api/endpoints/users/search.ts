import $ from 'cafy';
const escapeRegexp = require('escape-regexp');
import User, { pack, ILocalUser, validateUsername, IUser } from '../../../../models/user';
import getParams from '../../get-params';

export const meta = {
	desc: {
		'ja-JP': 'ユーザーを検索します。'
	},

	requireCredential: false,

	params: {
		query: $.str.note({
			desc: {
				'ja-JP': 'クエリ'
			}
		}),

		offset: $.num.optional.min(0).note({
			default: 0,
			desc: {
				'ja-JP': 'オフセット'
			}
		}),

		limit: $.num.optional.range(1, 100).note({
			default: 10,
			desc: {
				'ja-JP': '取得する数'
			}
		}),

		localOnly: $.bool.optional.note({
			default: false,
			desc: {
				'ja-JP': 'ローカルユーザーのみ検索対象にするか否か'
			}
		}),
	},
};

/**
 * Search a user
 */
export default (params: any, me: ILocalUser) => new Promise(async (res, rej) => {
	const [ps, psErr] = getParams(meta, params);
	if (psErr) return rej(psErr);

	const isUsername = validateUsername(ps.query.replace('@', ''));

	let users: IUser[] = [];

	if (isUsername) {
		users = await User
			.find({
				host: null,
				usernameLower: new RegExp('^' + escapeRegexp(ps.query.replace('@', '').toLowerCase()))
			}, {
				limit: ps.limit,
				skip: ps.offset
			});

		if (users.length < ps.limit && !ps.localOnly) {
			const otherUsers = await User
				.find({
					host: { $ne: null },
					usernameLower: new RegExp('^' + escapeRegexp(ps.query.replace('@', '').toLowerCase()))
				}, {
					limit: ps.limit - users.length
				});

			users = users.concat(otherUsers);
		}

		if (users.length < ps.limit) {
			const otherUsers = await User
				.find({
					_id: { $nin: users.map(u => u._id) },
					host: null,
					usernameLower: new RegExp(escapeRegexp(ps.query.replace('@', '').toLowerCase()))
				}, {
					limit: ps.limit - users.length
				});

			users = users.concat(otherUsers);
		}

		if (users.length < ps.limit && !ps.localOnly) {
			const otherUsers = await User
				.find({
					_id: { $nin: users.map(u => u._id) },
					host: { $ne: null },
					usernameLower: new RegExp(escapeRegexp(ps.query.replace('@', '').toLowerCase()))
				}, {
					limit: ps.limit - users.length
				});

			users = users.concat(otherUsers);
		}
	}

	if (users.length < ps.limit) {
		const otherUsers = await User
			.find({
				_id: { $nin: users.map(u => u._id) },
				host: null,
				name: new RegExp('^' + escapeRegexp(ps.query.toLowerCase()))
			}, {
				limit: ps.limit - users.length
			});

		users = users.concat(otherUsers);
	}

	if (users.length < ps.limit && !ps.localOnly) {
		const otherUsers = await User
			.find({
				_id: { $nin: users.map(u => u._id) },
				host: { $ne: null },
				name: new RegExp('^' + escapeRegexp(ps.query.toLowerCase()))
			}, {
				limit: ps.limit - users.length
			});

		users = users.concat(otherUsers);
	}

	if (users.length < ps.limit) {
		const otherUsers = await User
			.find({
				_id: { $nin: users.map(u => u._id) },
				host: null,
				name: new RegExp(escapeRegexp(ps.query.toLowerCase()))
			}, {
				limit: ps.limit - users.length
			});

		users = users.concat(otherUsers);
	}

	if (users.length < ps.limit && !ps.localOnly) {
		const otherUsers = await User
			.find({
				_id: { $nin: users.map(u => u._id) },
				host: { $ne: null },
				name: new RegExp(escapeRegexp(ps.query.toLowerCase()))
			}, {
				limit: ps.limit - users.length
			});

		users = users.concat(otherUsers);
	}

	// Serialize
	res(await Promise.all(users.map(user => pack(user, me, { detail: true }))));
});
