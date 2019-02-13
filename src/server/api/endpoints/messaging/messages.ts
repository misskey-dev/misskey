import $ from 'cafy';
import ID, { transform } from '../../../../misc/cafy-id';
import Message from '../../../../models/messaging-message';
import User from '../../../../models/user';
import { pack } from '../../../../models/messaging-message';
import read from '../../common/read-messaging-message';
import define from '../../define';

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
			validator: $.optional.num.range(1, 100),
			default: 10
		},

		sinceId: {
			validator: $.optional.type(ID),
			transform: transform,
		},

		untilId: {
			validator: $.optional.type(ID),
			transform: transform,
		},

		markAsRead: {
			validator: $.optional.bool,
			default: true
		}
	}
};

export default define(meta, (ps, user) => new Promise(async (res, rej) => {
	// Check if both of sinceId and untilId is specified
	if (ps.sinceId && ps.untilId) {
		return rej('cannot set sinceId and untilId');
	}

	// Fetch recipient
	const recipient = await User.findOne({
		_id: ps.userId
	}, {
			fields: {
				_id: true
			}
		});

	if (recipient === null) {
		return rej('user not found');
	}

	const query = {
		$or: [{
			userId: user._id,
			recipientId: recipient._id
		}, {
			userId: recipient._id,
			recipientId: user._id
		}]
	} as any;

	const sort = {
		_id: -1
	};

	if (ps.sinceId) {
		sort._id = 1;
		query._id = {
			$gt: ps.sinceId
		};
	} else if (ps.untilId) {
		query._id = {
			$lt: ps.untilId
		};
	}

	const messages = await Message
		.find(query, {
			limit: ps.limit,
			sort: sort
		});

	res(await Promise.all(messages.map(message => pack(message, user, {
		populateRecipient: false
	}))));

	if (messages.length === 0) {
		return;
	}

	// Mark all as read
	if (ps.markAsRead) {
		read(user._id, recipient._id, messages);
	}
}));
