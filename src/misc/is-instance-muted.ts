import { PackedNote } from '@/models/repositories/note';
import { User } from '@/models/entities/user';

export function isInstanceMuted(note: PackedNote, muted_instances: string[]): boolean {
	const note_user = (note.user as User);
	const note_reply_user = ((note.reply as PackedNote)?.user as User);
	const note_renote_user = ((note.renote as PackedNote)?.user as User);

	return muted_instances.includes(note_user.host ?? '') ||
		muted_instances.includes(note_reply_user?.host ?? '') ||
		muted_instances.includes(note_renote_user?.host ?? '');
}
