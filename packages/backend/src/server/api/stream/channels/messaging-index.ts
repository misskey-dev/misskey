import { Inject, Injectable } from '@nestjs/common';
import Channel from '../channel.js';

class MessagingIndexChannel extends Channel {
	public readonly chName = 'messagingIndex';
	public static shouldShare = true;
	public static requireCredential = true;

	public async init(params: any) {
		// Subscribe messaging index stream
		this.subscriber.on(`messagingIndexStream:${this.user!.id}`, data => {
			this.send(data);
		});
	}
}

@Injectable()
export class MessagingIndexChannelService {
	public readonly shouldShare = MessagingIndexChannel.shouldShare;
	public readonly requireCredential = MessagingIndexChannel.requireCredential;

	constructor(
	) {
	}

	public create(id: string, connection: Channel['connection']): MessagingIndexChannel {
		return new MessagingIndexChannel(
			id,
			connection,
		);
	}
}
