import $ from 'cafy'; import ID, { transform, transformMany } from '../../../../misc/cafy-id';
import User, { pack, isRemoteUser, ILocalUser } from '../../../../models/user';
import resolveRemoteUser from '../../../../remote/resolve-user';
import define from '../../define';
import { ObjectID } from 'mongodb';
import { error } from '../../../../prelude/promise';

export const meta = {
	desc: {
		'ja-JP': '指定したユーザーの情報を取得します。'
	},

	requireCredential: false,

	params: {
		userId: {
			validator: $.type(ID).optional,
			transform: transform,
			desc: {
				'ja-JP': '対象のユーザーのID',
				'en-US': 'Target user ID'
			}
		},

		userIds: {
			validator: $.arr($.type(ID)).optional.unique(),
			transform: transformMany,
			desc: {
				'ja-JP': 'ユーザーID (配列)'
			}
		},

		username: {
			validator: $.str.optional
		},

		host: {
			validator: $.str.optional.nullable
		}
	}
};

const options = {
	fields: { data: false }
};

const resolveUsers = ($in: ObjectID[], me: ILocalUser) => User.find({
		_id: { $in }
	})
	.then(x => Promise.all(x.map(x => pack(x, me, { detail: true }))));

const resolveLocalUser = (query: any) => User.findOne(query, options)
	.then(x => x === null ? error('user not found') : x);

export default define(meta, (ps, me) =>
	ps.userIds ? resolveUsers(ps.userIds, me) :
	(ps.host ?
		resolveRemoteUser(ps.username, ps.host, options)
			.catch(e => (
				console.warn(`failed to resolve remote user: ${e}`),
				error('failed to resolve remote user'))) :
		resolveLocalUser(ps.userId ? { _id: ps.userId } : {
				usernameLower: ps.username.toLowerCase(),
				host: null
			}))
		.then(user => pack(user, me, { detail: true })
			.then(x => (isRemoteUser(user) &&
					(!user.lastFetchedAt || Date.now() - user.lastFetchedAt.getTime() > 1000 * 60 * 60 * 24) &&
					resolveRemoteUser(ps.username, ps.host, {}, true),
				x))));
