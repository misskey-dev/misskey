import { Inject, Injectable } from '@nestjs/common';
import Channel from '../channel.js';

class DriveChannel extends Channel {
	public readonly chName = 'drive';
	public static shouldShare = true;
	public static requireCredential = true;

	public async init(params: any) {
		// Subscribe drive stream
		this.subscriber.on(`driveStream:${this.user!.id}`, data => {
			this.send(data);
		});
	}
}

@Injectable()
export class DriveChannelService {
	public readonly shouldShare = DriveChannel.shouldShare;
	public readonly requireCredential = DriveChannel.requireCredential;

	constructor(
	) {
	}

	public create(id: string, connection: Channel['connection']): DriveChannel {
		return new DriveChannel(
			id,
			connection,
		);
	}
}
