import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';
import { QueueService } from '@/core/QueueService.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		type: { type: 'string', enum: ['deliver', 'inbox'] },
	},
	required: ['type'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		private moderationLogService: ModerationLogService,
		private queueService: QueueService,
	) {
		super(meta, paramDef, async (ps, me) => {
			let delayedQueues;

			switch (ps.type) {
				case 'deliver':
					delayedQueues = await this.queueService.deliverQueue.getDelayed();
					for (let queueIndex = 0; queueIndex < delayedQueues.length; queueIndex++) {
						const queue = delayedQueues[queueIndex];
						await queue.promote();
					}
					break;
				
				case 'inbox':
					delayedQueues = await this.queueService.inboxQueue.getDelayed();
					for (let queueIndex = 0; queueIndex < delayedQueues.length; queueIndex++) {
						const queue = delayedQueues[queueIndex];
						await queue.promote();
					}
					break;
			}

			this.moderationLogService.insertModerationLog(me, 'promoteQueue');
		});
	}
}
