import $ from 'cafy';
import ID, { transform } from '../../../../../misc/cafy-id';
import Message from '../../../../../models/messaging-message';
import define from '../../../define';
import { publishMessagingStream } from '../../../../../services/stream';
import * as ms from 'ms';

export const meta = {
	stability: 'stable',

	desc: {
		'ja-JP': '指定したメッセージを削除します。',
		'en-US': 'Delete a message.'
	},

	requireCredential: true,

	kind: 'messaging-write',

	limit: {
		duration: ms('1hour'),
		max: 300,
		minInterval: ms('1sec')
	},

	params: {
		messageId: {
			validator: $.type(ID),
			transform: transform,
			desc: {
				'ja-JP': '対象のメッセージのID',
				'en-US': 'Target message ID.'
			}
		}
	}
};

export default define(meta, (ps, user) => new Promise(async (res, rej) => {
	const message = await Message.findOne({
		_id: ps.messageId,
		userId: user._id
	});

	if (message === null) {
		return rej('message not found');
	}

	await Message.remove({ _id: message._id });

	publishMessagingStream(message.userId, message.recipientId, 'deleted', message._id);
	publishMessagingStream(message.recipientId, message.userId, 'deleted', message._id);

	res();
}));
