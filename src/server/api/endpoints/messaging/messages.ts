import $ from 'cafy'; import ID, { transform } from '../../../../misc/cafy-id';
import Message from '../../../../models/messaging-message';
import User from '../../../../models/user';
import { pack } from '../../../../models/messaging-message';
import read from '../../common/read-messaging-message';
import define from '../../define';
import { errorWhen } from '../../../../prelude/promise';

export const meta = {
	desc: {
		'ja-JP': '指定したユーザーとのMessagingのメッセージ一覧を取得します。',
		'en-US': 'Get messages of messaging.'
	},

	requireCredential: true,

	kind: 'messaging-read',

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

		sinceId: {
			validator: $.type(ID).optional,
			transform: transform,
		},

		untilId: {
			validator: $.type(ID).optional,
			transform: transform,
		},

		markAsRead: {
			validator: $.bool.optional,
			default: true
		}
	}
};

export default define(meta, (ps, user) => errorWhen(
	ps.sinceId && !!ps.untilId,
	'cannot set sinceId and untilId')
	.then(() => User.findOne({ _id: ps.userId }, {
			fields: { _id: true }
		}))
	.then(async x => {
		if (x === null) throw 'user not found';
		const messages = await Message.find({
			_id:
				ps.sinceId ? { $gt: ps.sinceId } :
				ps.untilId ? { $lt: ps.untilId } : undefined,
				$or: [{
					userId: user._id,
					recipientId: x._id
				}, {
					userId: x._id,
					recipientId: user._id
				}]
			}, {
				limit: ps.limit,
				sort: ps.sinceId ? 1 : -1
			});
		const response = await Promise.all(messages.map(message => pack(message, user, { populateRecipient: false })));
		if (messages.length !== 0 && ps.markAsRead) read(user._id, x._id, messages);
		return response;
	}));
