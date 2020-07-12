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
					if (this.muting.includes(body.userId)) return;
					if (body.note && body.note.isHidden) {
						body.note = await Notes.pack(body.note.id, this.user, {
							detail: true
						});
					}
					break;
				}
				case 'mention': {
					if (this.muting.includes(body.userId)) return;
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
