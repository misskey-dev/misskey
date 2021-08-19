import { publishMainStream } from '@/services/stream.js';
import define from '../../define.js';
import { NoteUnreads } from '@/models/index.js';

export const meta = {
	tags: ['account'],

	requireCredential: true as const,

	kind: 'write:account',

	params: {
	}
};

export default define(meta, async (ps, user) => {
	// Remove documents
	await NoteUnreads.delete({
		userId: user.id
	});

	// 全て既読になったイベントを発行
	publishMainStream(user.id, 'readAllUnreadMentions');
	publishMainStream(user.id, 'readAllUnreadSpecifiedNotes');
});
