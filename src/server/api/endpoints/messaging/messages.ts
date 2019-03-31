import $ from 'cafy';
import { ID } from '../../../../misc/cafy-id';
import read from '../../common/read-messaging-message';
import define from '../../define';
import { ApiError } from '../../error';
import { getUser } from '../../common/getters';
import { MessagingMessages } from '../../../../models';
import { makePaginationQuery } from '../../common/make-pagination-query';

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
		},

		untilId: {
			validator: $.optional.type(ID),
		},

		markAsRead: {
			validator: $.optional.bool,
			default: true
		}
	},

	res: {
		type: 'array',
		items: {
			type: 'MessagingMessage',
		},
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

	const query = makePaginationQuery(MessagingMessages.createQueryBuilder('message'), ps.sinceId, ps.untilId)
		.andWhere(`(message.userId = :meId AND message.recipientId = :recipientId) OR (message.userId = :recipientId AND message.recipientId = :meId)`, { meId: user.id, recipientId: recipient.id });

	const messages = await query.getMany();

	// Mark all as read
	if (ps.markAsRead) {
		read(user.id, recipient.id, messages.map(x => x.id));
	}

	return await Promise.all(messages.map(message => MessagingMessages.pack(message, user, {
		populateRecipient: false
	})));
});
