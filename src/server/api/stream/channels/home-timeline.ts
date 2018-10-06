import Mute from '../../../../models/mute';
import { pack } from '../../../../models/note';
import shouldMuteThisNote from '../../../../misc/should-mute-this-note';
import Channel from '../channel';

export default class extends Channel {
	public init = async (params: any) => {
		const mute = await Mute.find({ muterId: this.user._id });
		const mutedUserIds = mute.map(m => m.muteeId.toString());

		// Subscribe Home stream channel
		this.subscriber.on(`homeTimeline:${this.user._id}`, async note => {
			// Renoteなら再pack
			if (note.renoteId != null) {
				note.renote = await pack(note.renoteId, this.user, {
					detail: true
				});
			}

			// 流れてきたNoteがミュートしているユーザーが関わるものだったら無視する
			if (shouldMuteThisNote(note, mutedUserIds)) return;

			this.send('note', note);
		});
	}
}
