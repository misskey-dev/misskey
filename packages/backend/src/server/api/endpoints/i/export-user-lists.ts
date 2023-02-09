import { Inject, Injectable } from '@/di-decorators.js';
import ms from 'ms';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { QueueService } from '@/core/QueueService.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	secure: true,
	requireCredential: true,
	limit: {
		duration: ms('1min'),
		max: 1,
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.QueueService)
		private queueService: QueueService,
	) {
		super(meta, paramDef, async (ps, me) => {
			this.queueService.createExportUserListsJob(me);
		});
	}
}
