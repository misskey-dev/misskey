import Channel from '../channel.js';
import { isInstanceMuted, isUserFromMutedInstance } from '@/misc/is-instance-muted.js';

export default class extends Channel {
	public readonly chName = 'main';
	public static shouldShare = true;
	public static requireCredential = true;

	public async init(params: any) {
		// Subscribe main stream channel
		this.subscriber.on(`mainStream:${this.user!.id}`, async data => {
			switch (data.type) {
				case 'notification': {
					// Ignore notifications from instances the user has muted
					if (isUserFromMutedInstance(data.body, new Set<string>(this.userProfile?.mutedInstances ?? []))) return;
					if (data.body.userId && this.muting.has(data.body.userId)) return;

					break;
				}
				case 'mention': {
					if (isInstanceMuted(data.body, new Set<string>(this.userProfile?.mutedInstances ?? []))) return;

					if (this.muting.has(data.body.userId)) return;
					break;
				}
			}

			this.send(data.type, data.body);
		});
	}
}
