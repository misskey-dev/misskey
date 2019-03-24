import { publishMainStream } from '../../../../services/stream';
import define from '../../define';
import { NoteUnreads, Users } from '../../../../models';

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
	await NoteUnreads.delete({
		userId: user.id
	});

	Users.update(user.id, {
		hasUnreadMentions: false,
		hasUnreadSpecifiedNotes: false
	});

	// 全て既読になったイベントを発行
	publishMainStream(user.id, 'readAllUnreadMentions');
	publishMainStream(user.id, 'readAllUnreadSpecifiedNotes');
});
