import { Inject, Injectable } from '@nestjs/common';
import Channel from '../channel.js';

class AdminChannel extends Channel {
	public readonly chName = 'admin';
	public static shouldShare = true;
	public static requireCredential = true;

	public async init(params: any) {
		// Subscribe admin stream
		this.subscriber.on(`adminStream:${this.user!.id}`, data => {
			this.send(data);
		});
	}
}

@Injectable()
export class AdminChannelService {
	public readonly shouldShare = AdminChannel.shouldShare;
	public readonly requireCredential = AdminChannel.requireCredential;

	constructor(
	) {
	}

	public create(id: string, connection: Channel['connection']): AdminChannel {
		return new AdminChannel(
			id,
			connection,
		);
	}
}
