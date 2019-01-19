import User from '../../../../models/user';
import { publishMainStream } from '../../../../stream';
import NoteUnread from '../../../../models/note-unread';
import define from '../../define';

export const meta = {
	desc: {
		'ja-JP': '未読の投稿をすべて既読にします。',
		'en-US': 'Mark all messages as read.'
	},

	requireCredential: true,

	kind: 'account-write',

	params: {
	}
};

export default define(meta, (_, user) => NoteUnread.remove({ userId: user._id })
	.then(() => {
		User.update({ _id: user._id }, {
			$set: {
				hasUnreadMentions: false,
				hasUnreadSpecifiedNotes: false
			}
		});
		publishMainStream(user._id, 'readAllUnreadMentions');
		publishMainStream(user._id, 'readAllUnreadSpecifiedNotes');
	}));
