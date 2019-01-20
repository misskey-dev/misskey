import $ from 'cafy'; import ID, { transform } from '../../../../misc/cafy-id';
import Note from '../../../../models/note';
import { getFriendIds } from '../../common/get-friends';
import { packMany } from '../../../../models/note';
import define from '../../define';
import read from '../../../../services/note/read';
import { ObjectID } from 'mongodb';
import { error } from '../../../../prelude/promise';
import Mute from '../../../../models/mute';
import { query } from '../../../../prelude/query';

export const meta = {
	desc: {
		'ja-JP': '自分に言及している投稿の一覧を取得します。',
		'en-US': 'Get mentions of myself.'
	},

	requireCredential: true,

	params: {
		following: {
			validator: $.bool.optional,
			default: false
		},

		limit: {
			validator: $.num.optional.range(1, 100),
			default: 10
		},

		sinceId: {
			validator: $.type(ID).optional,
			transform: transform,
		},

		untilId: {
			validator: $.type(ID).optional,
			transform: transform,
		},

		visibility: {
			validator: $.str.optional,
		},
	}
};

const fetchFriendIds = async (following: boolean, userId: ObjectID) => following ? { $in: await getFriendIds(userId) } : {};

const fetchMuteeIds = (muterId: ObjectID) => Mute.find({ muterId })
	.then(x => x && x.length ? { $nin: x.map(x => x.muteeId) } : {});

export default define(meta, (ps, user) => fetchFriendIds(ps.following, user._id)
	.then(friends =>
		ps.sinceId && ps.untilId ? error('cannot set sinceId and untilId') :
		fetchMuteeIds(user._id)
			.then(mutees => Note.find(query({
					_id:
						ps.sinceId ? { $gt: ps.sinceId } :
						ps.untilId ? { $lt: ps.untilId } : undefined,
					deletedAt: null,
					userId: { ...friends, ...mutees },
					visibility: ps.visibility || undefined,
					$or: [
						{ mentions: user._id },
						{ visibleUserIds: user._id }
					]
				}), {
					limit: ps.limit,
					sort: { _id: ps.sinceId ? 1 : -1 }
				})))
	.then(x => packMany(x, user))
	.then(x => (x.map(x => read(user._id, x._id), x))));
