import autobind from 'autobind-decorator';
import Channel from '../channel';
import { Notes } from '../../../../models';

export default class extends Channel {
	public readonly chName = 'main';
	public static shouldShare = true;
	public static requireCredential = true;

	@autobind
	public async init(params: any) {
		// Subscribe main stream channel
		this.subscriber.on(`mainStream:${this.user!.id}`, async data => {
			const { type } = data;
			let { body } = data;

			switch (type) {
				case 'notification': {
					if (this.muting.has(body.userId)) return;
					if (body.note && body.note.isHidden) {
						const note = await Notes.pack(body.note.id, this.user, {
							detail: true
						});
						this.connection.cacheNote(note);
						body.note = note;
					}
					break;
				}
				case 'mention': {
					if (this.muting.has(body.userId)) return;
					if (body.isHidden) {
						const note = await Notes.pack(body.id, this.user, {
							detail: true
						});
						this.connection.cacheNote(note);
						body = note;
					}
					break;
				}
			}

			this.send(type, body);
		});
	}
}
