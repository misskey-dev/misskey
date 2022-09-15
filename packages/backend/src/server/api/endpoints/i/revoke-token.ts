import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { AccessTokens } from '@/models/index.js';
import { GlobalEventService } from '@/services/GlobalEventService.js';

export const meta = {
	requireCredential: true,

	secure: true,
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		tokenId: { type: 'string', format: 'misskey:id' },
	},
	required: ['tokenId'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject('accessTokensRepository')
		private accessTokensRepository: typeof AccessTokens,

		private globalEventService: GlobalEventService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const token = await this.accessTokensRepository.findOneBy({ id: ps.tokenId });

			if (token) {
				await this.accessTokensRepository.delete({
					id: ps.tokenId,
					userId: me.id,
				});

				// Terminate streaming
				this.globalEventService.publishUserEvent(me.id, 'terminate');
			}
		});
	}
}
