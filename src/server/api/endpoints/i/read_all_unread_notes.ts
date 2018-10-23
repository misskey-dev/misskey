import User, { ILocalUser } from '../../../../models/user';
import { publishMainStream } from '../../../../stream';
import NoteUnread from '../../../../models/note-unread';

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

export default async (params: any, user: ILocalUser) => new Promise(async (res, rej) => {
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

	res();
});
