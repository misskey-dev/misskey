import Mute from '../../../models/mute';
import { pack } from '../../../models/note';
import shouldMuteThisNote from '../../../misc/should-mute-this-note';
import { Channel } from '.';

export default class extends Channel {
	public init = async (params: any) => {
		const mute = user ? await Mute.find({ muterId: user._id }) : null;
		const mutedUserIds = mute ? mute.map(m => m.muteeId.toString()) : [];

		const q: Array<string[]> = JSON.parse((request.resourceURL.query as any).q);

		// Subscribe stream
		subscriber.on('hashtag', async note => {
			const matched = q.some(tags => tags.every(tag => note.tags.map((t: string) => t.toLowerCase()).includes(tag.toLowerCase())));
			if (!matched) return;

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
