import autobind from 'autobind-decorator';
import shouldMuteThisNote from '../../../../misc/should-mute-this-note';
import Channel from '../channel';
import { Notes } from '../../../../models';
import { PackedNote } from '../../../../models/repositories/note';

export default class extends Channel {
	public readonly chName = 'hashtag';
	public static shouldShare = false;
	public static requireCredential = false;
	private q: string[][];

	@autobind
	public async init(params: unknown) {
		this.q = params.q;

		if (this.q == null) return;

		// Subscribe stream
		this.subscriber.on('notesStream', this.onNote);
	}

	@autobind
	private async onNote(note: PackedNote) {
		const noteTags = note.tags ? note.tags.map((t: string) => t.toLowerCase()) : [];
		const matched = this.q.some(tags => tags.every(tag => noteTags.includes(tag.toLowerCase())));
		if (!matched) return;

		// Renoteなら再pack
		if (note.renoteId != null) {
			note.renote = await Notes.pack(note.renoteId, this.user, {
				detail: true
			});
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
