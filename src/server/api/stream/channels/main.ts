import autobind from 'autobind-decorator';
import Channel from '../channel';
import { Mutings } from '../../../../models';

export default class extends Channel {
	public readonly chName = 'main';
	public static shouldShare = true;
	public static requireCredential = true;

	@autobind
	public async init(params: unknown) {
		const mute = await Mutings.find({ muterId: this.user!.id });

		// Subscribe main stream channel
		this.subscriber.on(`mainStream:${this.user!.id}`, async data => {
			const { type, body } = data;

			switch (type) {
				case 'notification': {
					if (mute.map(m => m.muteeId).includes(body.userId)) return;
					if (body.note && body.note.isHidden) return;
					break;
				}
				case 'mention': {
					if (mute.map(m => m.muteeId).includes(body.userId)) return;
					if (body.isHidden) return;
					break;
				}
			}

			this.send(type, body);
		});
	}
}
