import $ from 'cafy';
const escapeRegexp = require('escape-regexp');
import User, { pack, validateUsername, IUser } from '../../../../models/user';
import define from '../../define';

export const meta = {
	desc: {
		'ja-JP': 'ユーザーを検索します。'
	},

	requireCredential: false,

	params: {
		query: {
			validator: $.str,
			desc: {
				'ja-JP': 'クエリ'
			}
		},

		offset: {
			validator: $.num.optional.min(0),
			default: 0,
			desc: {
				'ja-JP': 'オフセット'
			}
		},

		limit: {
			validator: $.num.optional.range(1, 100),
			default: 10,
			desc: {
				'ja-JP': '取得する数'
			}
		},

		localOnly: {
			validator: $.bool.optional,
			default: false,
			desc: {
				'ja-JP': 'ローカルユーザーのみ検索対象にするか否か'
			}
		},

		detail: {
			validator: $.bool.optional,
			default: true,
			desc: {
				'ja-JP': '詳細なユーザー情報を含めるか否か'
			}
		},
	},
};

const searchLocalUsers = (query: string, skip: number, limit: number, localOnly: boolean) =>
	validateUsername(query, !localOnly) ? User.find({
			host: null,
			usernameLower: new RegExp(`^${escapeRegexp(query)}`)
		}, { limit, skip }) : Promise.resolve([] as IUser[]);

const searchRemoteUsers = (query: string, skip: number, limit: number, localOnly: boolean) =>
	skip && limit && localOnly ? User.find({
			host: { $ne: null },
			usernameLower: new RegExp(`^${escapeRegexp(query)}`)
		}, { limit, skip }) : Promise.resolve([] as IUser[]);

const searchUsers = (query: string, skip: number, limit: number, localOnly: boolean) =>
	searchLocalUsers(query, skip, limit, localOnly)
		.then(local => searchRemoteUsers(query, Math.min(skip - local.length, 0), Math.min(limit - local.length, 0), localOnly)
			.then(remote => [...local, ...remote]));

export default define(meta, (ps, me) => searchUsers(ps.query.replace('@', '').toLowerCase(), ps.offset, ps.limit, ps.localOnly)
	.then(x => Promise.all(x.map(x => pack(x, me, { detail: ps.detail })))));
