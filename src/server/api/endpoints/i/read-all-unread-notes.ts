import User from '../../../../models/entities/user';
import { publishMainStream } from '../../../../services/stream';
import NoteUnread from '../../../../models/entities/note-unread';
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
		userId: user.id
	});

	User.update({ _id: user.id }, {
		$set: {
			hasUnreadMentions: false,
			hasUnreadSpecifiedNotes: false
		}
	});

	// 全て既読になったイベントを発行
	publishMainStream(user.id, 'readAllUnreadMentions');
	publishMainStream(user.id, 'readAllUnreadSpecifiedNotes');

	return;
});
