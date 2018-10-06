import Mute from '../../../models/mute';
import { pack } from '../../../models/note';
import shouldMuteThisNote from '../../../misc/should-mute-this-note';
import { Channel } from '.';

export default class extends Channel {
	private mutedUserIds: string[];

	public init = async (params: any) => {
		const mute = await Mute.find({ muterId: this.connection.user._id });
		this.mutedUserIds = mute.map(m => m.muteeId.toString());

		// Subscribe stream
		this.connection.subscriber.on('hybrid-timeline', this.onEvent);
		this.connection.subscriber.on(`hybrid-timeline:${this.connection.user._id}`, this.onEvent);
	}

	private onEvent = async (note: any) => {
		// Renoteなら再pack
		if (note.renoteId != null) {
			note.renote = await pack(note.renoteId, this.connection.user, {
				detail: true
			});
		}

		// 流れてきたNoteがミュートしているユーザーが関わるものだったら無視する
		if (shouldMuteThisNote(note, this.mutedUserIds)) return;

		this.send('note', note);
	}
}
