import User from '../../../../models/user';
import { publishMainStream } from '../../../../stream';
import Message from '../../../../models/messaging-message';
import define from '../../define';

export const meta = {
	desc: {
		'ja-JP': 'トークメッセージをすべて既読にします。',
		'en-US': 'Mark all talk messages as read.'
	},

	requireCredential: true,

	kind: 'account-write',

	params: {
	}
};

export default define(meta, (_, user) => Message.update({
			recipientId: user._id,
			isRead: false
		}, {
			$set: { isRead: true }
		}, { multi: true })
	.then(() => User.update({ _id: user._id }, {
		$set: { hasUnreadMessagingMessage: false }
	}))
	.then(() => (publishMainStream(user._id, 'readAllMessagingMessages'), undefined)));
