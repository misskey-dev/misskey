import autobind from 'autobind-decorator';
import { readUserMessagingMessage, readGroupMessagingMessage } from '~/server/api/common/read-messaging-message';
import Channel from '~/server/api/stream/channel';
import { UserGroupJoinings } from '~/models';

export default class extends Channel {
	public readonly chName = 'messaging';
	public static shouldShare = false;
	public static requireCredential = true;

	private otherpartyId: string | null;
	private groupId: string | null;

	@autobind
	public async init(params: any) {
		this.otherpartyId = params.otherparty as string;
		this.groupId = params.group as string;

		// Check joining
		if (this.groupId) {
			const joining = await UserGroupJoinings.findOne({
				userId: this.user!.id,
				userGroupId: this.groupId
			});

			if (joining == null) {
				return;
			}
		}

		const subCh = this.otherpartyId
			? `messagingStream:${this.user!.id}-${this.otherpartyId}`
			: `messagingStream:${this.groupId}`;

		// Subscribe messaging stream
		this.subscriber.on(subCh, data => {
			this.send(data);
		});
	}

	@autobind
	public onMessage(type: string, body: any) {
		switch (type) {
			case 'read':
				if (this.otherpartyId) {
					readUserMessagingMessage(this.user!.id, this.otherpartyId, [body.id]);
				} else if (this.groupId) {
					readGroupMessagingMessage(this.user!.id, this.groupId, [body.id]);
				}
				break;
		}
	}
}
