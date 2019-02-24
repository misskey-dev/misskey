import User from '../../../../models/user';
import { publishMainStream } from '../../../../services/stream';
import Message from '../../../../models/messaging-message';
import define from '../../define';

export const meta = {
	desc: {
		'ja-JP': 'トークメッセージをすべて既読にします。',
		'en-US': 'Mark all talk messages as read.'
	},

	tags: ['account', 'messaging'],

	requireCredential: true,

	kind: 'account-write',

	params: {
	}
};

export default define(meta, async (ps, user) => {
	// Update documents
	await Message.update({
		recipientId: user._id,
		isRead: false
	}, {
		$set: {
			isRead: true
		}
	}, {
		multi: true
	});

	User.update({ _id: user._id }, {
		$set: {
			hasUnreadMessagingMessage: false
		}
	});

	publishMainStream(user._id, 'readAllMessagingMessages');

	return;
});
