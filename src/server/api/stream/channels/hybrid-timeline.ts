import autobind from 'autobind-decorator';
import shouldMuteThisNote from '../../../../misc/should-mute-this-note';
import Channel from '../channel';
import fetchMeta from '../../../../misc/fetch-meta';
import { Mutings, Notes } from '../../../../models';

export default class extends Channel {
	public readonly chName = 'hybridTimeline';
	public static shouldShare = true;
	public static requireCredential = true;

	private mutedUserIds: string[] = [];

	@autobind
	public async init(params: any) {
		const meta = await fetchMeta();
		if (meta.disableLocalTimeline && !this.user.isAdmin && !this.user.isModerator) return;

		// Subscribe events
		this.subscriber.on('hybridTimeline', this.onNewNote);
		this.subscriber.on(`hybridTimeline:${this.user.id}`, this.onNewNote);

		const mute = await Mutings.find({ muterId: this.user.id });
		this.mutedUserIds = mute.map(m => m.muteeId.toString());
	}

	@autobind
	private async onNewNote(note: any) {
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
		if (shouldMuteThisNote(note, this.mutedUserIds)) return;

		this.send('note', note);
	}

	@autobind
	public dispose() {
		// Unsubscribe events
		this.subscriber.off('hybridTimeline', this.onNewNote);
		this.subscriber.off(`hybridTimeline:${this.user.id}`, this.onNewNote);
	}
}
