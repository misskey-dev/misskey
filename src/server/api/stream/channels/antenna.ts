import autobind from 'autobind-decorator';
import Channel from '../channel';
import { Notes } from '../../../../models';
import shouldMuteThisNote from '../../../../misc/should-mute-this-note';
import { PackedNote } from '../../../../models/repositories/note';

export default class extends Channel {
	public readonly chName = 'antenna';
	public static shouldShare = false;
	public static requireCredential = false;
	private antennaId: string;

	@autobind
	public async init(params: any) {
		this.antennaId = params.antennaId as string;

		// Subscribe stream
		this.subscriber.on(`antennaStream:${this.antennaId}`, this.onEvent);
	}

	@autobind
	private async onEvent(key: string, value: any) {
		if (key === 'note') {
			this.onNote(value);
		} else {
			this.send(key, value);
		}
	}

	@autobind
	private async onNote(note: PackedNote) {
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
		this.subscriber.off(`antennaStream:${this.antennaId}`, this.onEvent);
	}
}
