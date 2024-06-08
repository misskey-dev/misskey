/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { bindThis } from '@/decorators.js';
import Channel, { type MiChannelService } from '../channel.js';

class DriveChannel extends Channel {
	public readonly chName = 'drive';
	public static shouldShare = true;
	public static requireCredential = true as const;
	public static kind = 'read:account';

	@bindThis
	public async init(params: any) {
		// Subscribe drive stream
		this.subscriber.on(`driveStream:${this.user!.id}`, data => {
			this.send(data);
		});
	}
}

@Injectable()
export class DriveChannelService implements MiChannelService<true> {
	public readonly shouldShare = DriveChannel.shouldShare;
	public readonly requireCredential = DriveChannel.requireCredential;
	public readonly kind = DriveChannel.kind;

	constructor(
	) {
	}

	@bindThis
	public create(id: string, connection: Channel['connection']): DriveChannel {
		return new DriveChannel(
			id,
			connection,
		);
	}
}
