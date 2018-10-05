import Mute from '../../../models/mute';
import { pack } from '../../../models/note';
import shouldMuteThisNote from '../../../misc/should-mute-this-note';
import { Channel } from '.';

export default class extends Channel {
	public init = async (params: any) => {
		const mute = user ? await Mute.find({ muterId: user._id }) : null;
		const mutedUserIds = mute ? mute.map(m => m.muteeId.toString()) : [];

		// Subscribe stream
		subscriber.on('local-timeline', async note => {
			// Renoteなら再pack
			if (note.renoteId != null) {
				note.renote = await pack(note.renoteId, user, {
					detail: true
				});
			}

			// 流れてきたNoteがミュートしているユーザーが関わるものだったら無視する
			if (shouldMuteThisNote(note, mutedUserIds)) return;

			connection.send(JSON.stringify({
				type: 'note',
				body: note
			}));
		});
	}
}
