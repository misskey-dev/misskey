import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../../define';
import { ApiError } from '../../../error';
import { MessagingMessages } from '@/models/index';
import { readUserMessagingMessage, readGroupMessagingMessage } from '../../../common/read-messaging-message';

export const meta = {
	tags: ['messaging'],

	requireCredential: true as const,

	kind: 'write:messaging',

	params: {
		messageId: {
			validator: $.type(ID),
		}
	},

	errors: {
		noSuchMessage: {
			message: 'No such message.',
			code: 'NO_SUCH_MESSAGE',
			id: '86d56a2f-a9c3-4afb-b13c-3e9bfef9aa14'
		},
	}
};

export default define(meta, async (ps, user) => {
	const message = await MessagingMessages.findOne(ps.messageId);

	if (message == null) {
		throw new ApiError(meta.errors.noSuchMessage);
	}

	if (message.recipientId) {
		await readUserMessagingMessage(user.id, message.userId, [message.id]).catch(e => {
			if (e.id === 'e140a4bf-49ce-4fb6-b67c-b78dadf6b52f') throw new ApiError(meta.errors.noSuchMessage);
			throw e;
		});
	} else if (message.groupId) {
		await readGroupMessagingMessage(user.id, message.groupId, [message.id]).catch(e => {
			if (e.id === '930a270c-714a-46b2-b776-ad27276dc569') throw new ApiError(meta.errors.noSuchMessage);
			throw e;
		});
	}
});
