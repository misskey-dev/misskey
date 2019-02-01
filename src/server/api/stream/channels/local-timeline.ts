import autobind from 'autobind-decorator';
import Mute from '../../../../models/mute';
import { pack } from '../../../../models/note';
import shouldMuteThisNote from '../../../../misc/should-mute-this-note';
import Channel from '../channel';
import fetchMeta from '../../../../misc/fetch-meta';

export default class extends Channel {
	public readonly chName = 'localTimeline';
	public static shouldShare = true;
	public static requireCredential = false;

	private mutedUserIds: string[] = [];

	@autobind
	public async init(params: any) {
		const meta = await fetchMeta();
		if (meta.disableLocalTimeline) {
			if (this.user == null || (!this.user.isAdmin && !this.user.isModerator)) return;
		}

		// Subscribe events
		this.subscriber.on('localTimeline', this.onNote);

		const mute = this.user ? await Mute.find({ muterId: this.user._id }) : null;
		this.mutedUserIds = mute ? mute.map(m => m.muteeId.toString()) : [];
	}

	@autobind
	private async onNote(note: any) {
		// リプライなら再pack
		if (note.replyId != null) {
			note.reply = await pack(note.replyId, this.user, {
				detail: true
			});
		}
		// Renoteなら再pack
		if (note.renoteId != null) {
			note.renote = await pack(note.renoteId, this.user, {
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
		this.subscriber.off('localTimeline', this.onNote);
	}
}
