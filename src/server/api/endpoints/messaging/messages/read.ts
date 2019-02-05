import $ from 'cafy';
import ID, { transform } from '../../../../../misc/cafy-id';
import Message from '../../../../../models/messaging-message';
import read from '../../../common/read-messaging-message';
import define from '../../../define';

export const meta = {
	desc: {
		'ja-JP': '指定した自分宛てのメッセージを既読にします。',
		'en-US': 'Mark as read a message of messaging.'
	},

	requireCredential: true,

	kind: 'messaging-write',

	params: {
		messageId: {
			validator: $.type(ID),
			transform: transform,
			desc: {
				'ja-JP': '既読にするメッセージのID',
				'en-US': 'The ID of a message that you want to mark as read'
			}
		}
	}
};

export default define(meta, (ps, user) => new Promise(async (res, rej) => {
	const message = await Message.findOne({
		_id: ps.messageId,
		recipientId: user._id
	});

	if (message == null) {
		return rej('message not found');
	}

	read(user._id, message.userId, message);

	res();
}));
