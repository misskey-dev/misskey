import User from '../../../../models/user';
import { publishMainStream } from '../../../../services/stream';
import NoteUnread from '../../../../models/note-unread';
import define from '../../define';

export const meta = {
	desc: {
		'ja-JP': '未読の投稿をすべて既読にします。',
		'en-US': 'Mark all messages as read.'
	},

	tags: ['account'],

	requireCredential: true,

	kind: 'account-write',

	params: {
	}
};

export default define(meta, async (ps, user) => {
	// Remove documents
	await NoteUnread.remove({
		userId: user._id
	});

	User.update({ _id: user._id }, {
		$set: {
			hasUnreadMentions: false,
			hasUnreadSpecifiedNotes: false
		}
	});

	// 全て既読になったイベントを発行
	publishMainStream(user._id, 'readAllUnreadMentions');
	publishMainStream(user._id, 'readAllUnreadSpecifiedNotes');

	return;
});
