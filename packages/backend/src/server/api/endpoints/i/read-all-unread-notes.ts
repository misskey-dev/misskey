import { publishMainStream } from '@/services/stream';
import define from '../../define';
import { NoteUnreads } from '@/models/index';

export const meta = {
	tags: ['account'],

	requireCredential: true,

	kind: 'write:account',
} as const;

const paramDef = {

} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	// Remove documents
	await NoteUnreads.delete({
		userId: user.id,
	});

	// 全て既読になったイベントを発行
	publishMainStream(user.id, 'readAllUnreadMentions');
	publishMainStream(user.id, 'readAllUnreadSpecifiedNotes');
});
