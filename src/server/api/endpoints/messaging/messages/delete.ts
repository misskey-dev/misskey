import $ from 'cafy';
import { ID } from '../../../../../misc/cafy-id';
import define from '../../../define';
import { publishMessagingStream, publishGroupMessagingStream } from '../../../../../services/stream';
import * as ms from 'ms';
import { ApiError } from '../../../error';
import { MessagingMessages } from '../../../../../models';

export const meta = {
	stability: 'stable',

	desc: {
		'ja-JP': '指定したトークメッセージを削除します。',
		'en-US': 'Delete a message.'
	},

	tags: ['messaging'],

	requireCredential: true as const,

	kind: 'write:messaging',

	limit: {
		duration: ms('1hour'),
		max: 300,
		minInterval: ms('1sec')
	},

	params: {
		messageId: {
			validator: $.type(ID),
			desc: {
				'ja-JP': '対象のメッセージのID',
				'en-US': 'Target message ID.'
			}
		}
	},

	errors: {
		noSuchMessage: {
			message: 'No such message.',
			code: 'NO_SUCH_MESSAGE',
			id: '54b5b326-7925-42cf-8019-130fda8b56af'
		},
	}
};

export default define(meta, async (ps, user) => {
	const message = await MessagingMessages.findOne({
		id: ps.messageId,
		userId: user.id
	});

	if (message == null) {
		throw new ApiError(meta.errors.noSuchMessage);
	}

	await MessagingMessages.delete(message.id);

	if (message.recipientId) {
		publishMessagingStream(message.userId, message.recipientId, 'deleted', message.id);
		publishMessagingStream(message.recipientId, message.userId, 'deleted', message.id);
	} else if (message.groupId) {
		publishGroupMessagingStream(message.groupId, 'deleted', message.id);
	}
});
