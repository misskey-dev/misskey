import Mute from '../../../models/mute';
import { pack } from '../../../models/note';
import shouldMuteThisNote from '../../../misc/should-mute-this-note';
import { Channel } from '.';

export default class extends Channel {
	public init = async (params: any) => {
		const mute = await Mute.find({ muterId: this.user._id });
		const mutedUserIds = mute.map(m => m.muteeId.toString());

		// Subscribe Home stream channel
		this.connection.subscriber.on(`home-timeline:${this.user._id}`, async x => {
			// Renoteなら再pack
			if (x.type == 'note' && x.body.renoteId != null) {
				x.body.renote = await pack(x.body.renoteId, this.user, {
					detail: true
				});
			}

			//#region 流れてきたメッセージがミュートしているユーザーが関わるものだったら無視する
			if (x.type == 'note') {
				if (shouldMuteThisNote(x.body, mutedUserIds)) return;
			} else if (x.type == 'notification') {
				if (mutedUserIds.includes(x.body.userId)) {
					return;
				}
			}
			//#endregion

			this.send(x);
		});
	}
}
