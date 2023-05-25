import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { QueueService } from '@/core/QueueService.js';

export const meta = {
	secure: true,
	requireCredential: true,
	requireRolePolicy: 'canManageCustomEmojis',
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		fileId: { type: 'string', format: 'misskey:id' },
	},
	required: ['fileId'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'admin/emoji/import-zip'> {
	name = 'admin/emoji/import-zip' as const;
	constructor(
		private queueService: QueueService,
	) {
		super(async (ps, me) => {
			this.queueService.createImportCustomEmojisJob(me, ps.fileId);
		});
	}
}
