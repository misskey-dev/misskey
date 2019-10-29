import autobind from 'autobind-decorator';
import Channel from '../channel';
import { Mutings, Notes } from '../../../../models';

export default class extends Channel {
	public readonly chName = 'main';
	public static shouldShare = true;
	public static requireCredential = true;

	@autobind
	public async init(params: any) {
		const mute = await Mutings.find({ muterId: this.user!.id });

		// Subscribe main stream channel
		this.subscriber.on(`mainStream:${this.user!.id}`, async data => {
			let { type, body } = data;

			switch (type) {
				case 'notification': {
					if (mute.map(m => m.muteeId).includes(body.userId)) return;
					if (body.note && body.note.isHidden) {
						body.note = await Notes.pack(body.note.id, this.user, {
							detail: true
						});
					}
					break;
				}
				case 'mention': {
					if (mute.map(m => m.muteeId).includes(body.userId)) return;
					if (body.isHidden) {
						body = await Notes.pack(body.id, this.user, {
							detail: true
						});
					}
					break;
				}
			}

			this.send(type, body);
		});
	}
}
