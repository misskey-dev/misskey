import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';
import { QueueService } from '@/core/QueueService.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'admin/queue/clear'> {
	name = 'admin/queue/clear' as const;
	constructor(
		private moderationLogService: ModerationLogService,
		private queueService: QueueService,
	) {
		super(async (ps, me) => {
			this.queueService.destroy();

			this.moderationLogService.insertModerationLog(me, 'clearQueue');
		});
	}
}
