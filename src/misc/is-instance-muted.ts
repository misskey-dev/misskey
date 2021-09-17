import { Packed } from './schema';

export function isInstanceMuted(note: Packed<'Note'>, muted_instances: string[]): boolean {
	const note_user = note.user;
	const note_reply_user = note.reply?.user;
	const note_renote_user = note.renote?.user;

	return muted_instances.includes(note_user.host ?? '') ||
		muted_instances.includes(note_reply_user?.host ?? '') ||
		muted_instances.includes(note_renote_user?.host ?? '');
}
