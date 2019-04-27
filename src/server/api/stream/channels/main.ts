import autobind from 'autobind-decorator';
import Mute from '../../../../models/mute';
import Channel from '../channel';

export default class extends Channel {
	public readonly chName = 'main';
	public static shouldShare = true;
	public static requireCredential = true;

	@autobind
	public async init(params: any) {
		const mute = await Mute.find({ muterId: this.user._id });
		const mutedUserIds = mute.map(m => m.muteeId.toString());

		// Subscribe main stream channel
		this.subscriber.on(`mainStream:${this.user._id}`, async data => {
			const { type, body } = data;

			switch (type) {
				case 'notification': {
					if (mutedUserIds.includes(body.userId)) return;
					if (body.note && body.note.isHidden) return;
					break;
				}
				case 'mention': {
					if (mutedUserIds.includes(body.userId)) return;
					if (body.isHidden) return;
					break;
				}
			}

			this.send(type, body);
		});
	}
}
