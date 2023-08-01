import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { EmojiModerationLog, EmojiModerationLogsRepository } from "@/models/index.js";
import { DI } from '@/di-symbols.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireRolePolicy: 'canManageCustomEmojis',

	cacheSec: 3600,

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			changes: {
				type: 'array',
				optional: false, nullable: false,
				ref: 'EmojiChangeLogs',
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		id: { type: 'string', format: 'misskey:id' },
	},
	required: ['id'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.emojiModerationLogsRepository)
		private emojiModerationLogsRepository: EmojiModerationLogsRepository,
	) {
		super(meta, paramDef, async (ps, me) => {
			const logs: EmojiModerationLog[] = await this.emojiModerationLogsRepository.find({
				where: {
					emojiId: ps.id,
				},
				order: {
					createdAt: 'ASC',
				},
			});

			return {
				changes: logs.map(v => ({
					createDate: v.createdAt.toISOString(),
					type: v.type,
					changesProperties: v.info
				})),
			};
		});
	}
}
