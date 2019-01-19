import $ from 'cafy';
import ID, { transform } from '../../../../../misc/cafy-id';
import Message from '../../../../../models/messaging-message';
import define from '../../../define';
import { publishMessagingStream } from '../../../../../stream';
const ms = require('ms');

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

export default define(meta, (ps, user) => Message.findOne({
		_id: ps.messageId,
		userId: user._id
	})
	.then(async x => {
		if (x === null) throw 'message not found';
		await Message.remove({ _id: x._id });
		publishMessagingStream(x.userId, x.recipientId, 'deleted', x._id);
		publishMessagingStream(x.recipientId, x.userId, 'deleted', x._id);
	}));
