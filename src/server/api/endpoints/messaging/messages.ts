import $ from 'cafy';
import ID, { transform } from '../../../../misc/cafy-id';
import Message from '../../../../models/messaging-message';
import { pack } from '../../../../models/messaging-message';
import read from '../../common/read-messaging-message';
import define from '../../define';
import { ApiError } from '../../error';
import { getUser } from '../../common/getters';

export const meta = {
	desc: {
		'ja-JP': '指定したユーザーとのMessagingのメッセージ一覧を取得します。',
		'en-US': 'Get messages of messaging.'
	},

	tags: ['messaging'],

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
	},

	errors: {
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: '11795c64-40ea-4198-b06e-3c873ed9039d'
		},
	}
};

export default define(meta, async (ps, user) => {
	// Fetch recipient
	const recipient = await getUser(ps.userId).catch(e => {
		if (e.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw new ApiError(meta.errors.noSuchUser);
		throw e;
	});

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

	// Mark all as read
	if (ps.markAsRead) {
		read(user._id, recipient._id, messages);
	}

	return await Promise.all(messages.map(message => pack(message, user, {
		populateRecipient: false
	})));
});
