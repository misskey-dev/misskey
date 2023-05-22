import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { QueueService } from '@/core/QueueService.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'admin/drive/clean-remote-files'> {
	name = 'admin/drive/clean-remote-files' as const;
	constructor(
		private queueService: QueueService,
	) {
		super(async (ps, me) => {
			this.queueService.createCleanRemoteFilesJob();
		});
	}
}
