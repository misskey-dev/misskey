import $ from 'cafy'; import ID, { transform } from '../../../../misc/cafy-id';
import Note, { INote } from '../../../../models/note';
import User, { pack } from '../../../../models/user';
import define from '../../define';
import { maximum } from '../../../../prelude/array';
import { error } from '../../../../prelude/promise';

export const meta = {
	requireCredential: false,

	params: {
		userId: {
			validator: $.type(ID),
			transform: transform,
			desc: {
				'ja-JP': '対象のユーザーのID',
				'en-US': 'Target user ID'
			}
		},

		limit: {
			validator: $.num.optional.range(1, 100),
			default: 10
		},
	}
};

const countUsers = (notes: INote[]) => {
	const users: { [x: string]: number } = {};
	for (const userId of notes.map(x => x.userId.toString()))
		users[userId] = ++users[userId] || 1;
	return users;
};

export default define(meta, (ps, me) => User.findOne({ _id: ps.userId　}, {
		fields: { _id: true　}
	})
	.then(user =>
		user === null ? error('user not found') :
		Note.find({
			userId: user._id,
			replyId: {
				$exists: true,
				$ne: null
			}
		}, {
			sort: { _id: -1 },
			limit: 1000,
			fields: {
				_id: false,
				replyId: true
			}
		})
		.then(x =>
			x.length === 0 ? [] :
			Note.find({
				_id: { $in: x.map(p => p.replyId) },
				userId: { $ne: user._id }
			}, {
				fields: {
					_id: false,
					userId: true
				}
			}))
		.then(x => countUsers(x))
		.then(x => Promise.all(Object.entries(x)
				.sort(([, a], [, b]) => b - a)
				.slice(0, ps.limit)
				.map(([userId, count]) => pack(userId, me, { detail: true })
					.then(user => ({
						user,
						weight: count / maximum(Object.values(x))
					})))))));
