import autobind from 'autobind-decorator';
import shouldMuteThisNote from '../../../../misc/should-mute-this-note';
import Channel from '../channel';
import { fetchMeta } from '../../../../misc/fetch-meta';
import { Notes } from '../../../../models';
import { PackedNote } from '../../../../models/repositories/note';
import { PackedUser } from '../../../../models/repositories/user';

export default class extends Channel {
	public readonly chName = 'localTimeline';
	public static shouldShare = true;
	public static requireCredential = false;

	@autobind
	public async init(params: any) {
		const meta = await fetchMeta();
		if (meta.disableLocalTimeline) {
			if (!this.user || (!this.user.isAdmin && !this.user.isModerator)) return;
		}

		// Subscribe events
		this.subscriber.on('notesStream', this.onNote);
	}

	@autobind
	private async onNote(note: PackedNote) {
		if ((note.user as PackedUser).host !== null) return;
		if (note.visibility === 'home') return;
		if (!this.user && note.visibility === 'users') return;

		if (['followers', 'specified'].includes(note.visibility)) {
			note = await Notes.pack(note.id, this.user, {
				detail: true
			});

			if (note.isHidden) {
				return;
			}
		} else {
			// リプライなら再pack
			if (note.replyId != null) {
				note.reply = await Notes.pack(note.replyId, this.user, {
					detail: true
				});
			}
			// Renoteなら再pack
			if (note.renoteId != null) {
				note.renote = await Notes.pack(note.renoteId, this.user, {
					detail: true
				});
			}
		}

		// 流れてきたNoteがミュートしているユーザーが関わるものだったら無視する
		if (shouldMuteThisNote(note, this.muting)) return;

		this.send('note', note);
	}

	@autobind
	public dispose() {
		// Unsubscribe events
		this.subscriber.off('notesStream', this.onNote);
	}
}
