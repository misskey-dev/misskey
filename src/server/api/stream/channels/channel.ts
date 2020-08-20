import autobind from 'autobind-decorator';
import Channel from '../channel';
import { Notes } from '../../../../models';
import { isMutedUserRelated } from '../../../../misc/is-muted-user-related';
import { PackedNote } from '../../../../models/repositories/note';

export default class extends Channel {
	public readonly chName = 'channel';
	public static shouldShare = false;
	public static requireCredential = false;
	private channelId: string;

	@autobind
	public async init(params: any) {
		this.channelId = params.channelId as string;

		// Subscribe stream
		this.subscriber.on('notesStream', this.onNote);
	}

	@autobind
	private async onNote(note: PackedNote) {
		if (note.channelId !== this.channelId) return;

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

		// 流れてきたNoteがミュートしているユーザーが関わるものだったら無視する
		if (isMutedUserRelated(note, this.muting)) return;

		this.send('note', note);
	}

	@autobind
	public dispose() {
		// Unsubscribe events
		this.subscriber.off('notesStream', this.onNote);
	}
}
