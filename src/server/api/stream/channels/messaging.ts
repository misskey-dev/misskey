import autobind from 'autobind-decorator';
import { readUserMessagingMessage, readGroupMessagingMessage, deliverReadActivity } from '../../common/read-messaging-message';
import Channel from '../channel';
import { UserGroupJoinings, Users, MessagingMessages } from '../../../../models';
import { User, ILocalUser, IRemoteUser } from '../../../../models/entities/user';

export default class extends Channel {
	public readonly chName = 'messaging';
	public static shouldShare = false;
	public static requireCredential = true;

	private otherpartyId: string | null;
	private otherparty?: User;
	private groupId: string | null;

	@autobind
	public async init(params: any) {
		this.otherpartyId = params.otherparty as string;
		this.otherparty = await Users.findOne({ id: this.otherpartyId });
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

					// リモートユーザーからのメッセージだったら既読配信
					if (Users.isLocalUser(this.user!) && Users.isRemoteUser(this.otherparty!)) {
						MessagingMessages.findOne(body.id).then(message => {
							if (message) deliverReadActivity(this.user as ILocalUser, this.otherparty as IRemoteUser, message);
						});
					}
				} else if (this.groupId) {
					readGroupMessagingMessage(this.user!.id, this.groupId, [body.id]);
				}
				break;
		}
	}
}
