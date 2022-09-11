import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { AccessTokens } from '@/models/index.js';
import { publishUserEvent } from '@/services/stream.js';

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
	) {
		super(meta, paramDef, async (ps, me) => {
			const token = await AccessTokens.findOneBy({ id: ps.tokenId });

			if (token) {
				await AccessTokens.delete({
					id: ps.tokenId,
					userId: me.id,
				});

				// Terminate streaming
				publishUserEvent(me.id, 'terminate');
			}
		});
	}
}
