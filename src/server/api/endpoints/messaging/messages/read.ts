import $ from 'cafy';
import ID, { transform } from '../../../../../misc/cafy-id';
import Message from '../../../../../models/messaging-message';
import read from '../../../common/read-messaging-message';
import define from '../../../define';
import { ApiError } from '../../../error';

export const meta = {
	desc: {
		'ja-JP': '指定した自分宛てのメッセージを既読にします。',
		'en-US': 'Mark as read a message of messaging.'
	},

	tags: ['messaging'],

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
	const message = await Message.findOne({
		_id: ps.messageId,
		recipientId: user._id
	});

	if (message == null) {
		throw new ApiError(meta.errors.noSuchMessage);
	}

	read(user._id, message.userId, message);

	return;
});
