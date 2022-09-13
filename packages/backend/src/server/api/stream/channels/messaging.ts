import { Inject, Injectable } from '@nestjs/common';
import type { UserGroupJoinings , Users , MessagingMessages } from '@/models/index.js';
import type { User, ILocalUser, IRemoteUser } from '@/models/entities/user.js';
import type { UserGroup } from '@/models/entities/user-group.js';
import Channel from '../channel.js';
import { readUserMessagingMessage, readGroupMessagingMessage, deliverReadActivity } from '../../common/read-messaging-message.js';
import type { StreamMessages } from '../types.js';

class MessagingChannel extends Channel {
	public readonly chName = 'messaging';
	public static shouldShare = false;
	public static requireCredential = true;

	private otherpartyId: string | null;
	private otherparty: User | null;
	private groupId: string | null;
	private subCh: `messagingStream:${User['id']}-${User['id']}` | `messagingStream:${UserGroup['id']}`;
	private typers: Record<User['id'], Date> = {};
	private emitTypersIntervalId: ReturnType<typeof setInterval>;

	constructor(
		private usersRepository: typeof Users,
		private userGroupJoiningsRepository: typeof UserGroupJoinings,
		private messagingMessagesRepository: typeof MessagingMessages,

		id: string,
		connection: Channel['connection'],
	) {
		super(id, connection);
		this.onEvent = this.onEvent.bind(this);
		this.onMessage = this.onMessage.bind(this);
		this.emitTypers = this.emitTypers.bind(this);
	}

	public async init(params: any) {
		this.otherpartyId = params.otherparty;
		this.otherparty = this.otherpartyId ? await this.usersRepository.findOneByOrFail({ id: this.otherpartyId }) : null;
		this.groupId = params.group;

		// Check joining
		if (this.groupId) {
			const joining = await this.userGroupJoiningsRepository.findOneBy({
				userId: this.user!.id,
				userGroupId: this.groupId,
			});

			if (joining == null) {
				return;
			}
		}

		this.emitTypersIntervalId = setInterval(this.emitTypers, 5000);

		this.subCh = this.otherpartyId
			? `messagingStream:${this.user!.id}-${this.otherpartyId}`
			: `messagingStream:${this.groupId}`;

		// Subscribe messaging stream
		this.subscriber.on(this.subCh, this.onEvent);
	}

	private onEvent(data: StreamMessages['messaging']['payload'] | StreamMessages['groupMessaging']['payload']) {
		if (data.type === 'typing') {
			const id = data.body;
			const begin = this.typers[id] == null;
			this.typers[id] = new Date();
			if (begin) {
				this.emitTypers();
			}
		} else {
			this.send(data);
		}
	}

	public onMessage(type: string, body: any) {
		switch (type) {
			case 'read':
				if (this.otherpartyId) {
					readUserMessagingMessage(this.user!.id, this.otherpartyId, [body.id]);

					// リモートユーザーからのメッセージだったら既読配信
					if (this.usersRepository.isLocalUser(this.user!) && this.usersRepository.isRemoteUser(this.otherparty!)) {
						this.messagingMessagesRepository.findOneBy({ id: body.id }).then(message => {
							if (message) deliverReadActivity(this.user as ILocalUser, this.otherparty as IRemoteUser, message);
						});
					}
				} else if (this.groupId) {
					readGroupMessagingMessage(this.user!.id, this.groupId, [body.id]);
				}
				break;
		}
	}

	private async emitTypers() {
		const now = new Date();

		// Remove not typing users
		for (const [userId, date] of Object.entries(this.typers)) {
			if (now.getTime() - date.getTime() > 5000) delete this.typers[userId];
		}

		const users = await this.usersRepository.packMany(Object.keys(this.typers), null, { detail: false });

		this.send({
			type: 'typers',
			body: users,
		});
	}

	public dispose() {
		this.subscriber.off(this.subCh, this.onEvent);

		clearInterval(this.emitTypersIntervalId);
	}
}

@Injectable()
export class MessagingChannelService {
	public readonly shouldShare = MessagingChannel.shouldShare;
	public readonly requireCredential = MessagingChannel.requireCredential;

	constructor(
		@Inject('usersRepository')
		private usersRepository: typeof Users,

		@Inject('userGroupJoiningsRepository')
		private userGroupJoiningsRepository: typeof UserGroupJoinings,

		@Inject('messagingMessagesRepository')
		private messagingMessagesRepository: typeof MessagingMessages,
	) {
	}

	public create(id: string, connection: Channel['connection']): MessagingChannel {
		return new MessagingChannel(
			this.usersRepository,
			this.userGroupJoiningsRepository,
			this.messagingMessagesRepository,
			id,
			connection,
		);
	}
}
