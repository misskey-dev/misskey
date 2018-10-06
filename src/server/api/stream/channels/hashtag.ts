import autobind from 'autobind-decorator';
import Mute from '../../../../models/mute';
import { pack } from '../../../../models/note';
import shouldMuteThisNote from '../../../../misc/should-mute-this-note';
import Channel from '../channel';

export default class extends Channel {
	@autobind
	public async init(params: any) {
		const mute = this.user ? await Mute.find({ muterId: this.user._id }) : null;
		const mutedUserIds = mute ? mute.map(m => m.muteeId.toString()) : [];

		const q: Array<string[]> = params.q;

		// Subscribe stream
		this.subscriber.on('hashtag', async note => {
			const matched = q.some(tags => tags.every(tag => note.tags.map((t: string) => t.toLowerCase()).includes(tag.toLowerCase())));
			if (!matched) return;

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
