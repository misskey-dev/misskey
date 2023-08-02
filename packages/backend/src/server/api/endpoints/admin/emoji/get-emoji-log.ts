import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { EmojiModerationLog, EmojiModerationLogsRepository } from "@/models/index.js";
import { DI } from '@/di-symbols.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireRolePolicy: 'canManageCustomEmojis',

	cacheSec: 3600,

	res: {
		type: 'array',
		optional: false, nullable: false,
		ref: 'EmojiChangeLogs',
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

		private userEntityService: UserEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const logs = await this.emojiModerationLogsRepository.find({
				where: {
					emojiId: ps.id,
				},
				order: {
					createdAt: 'ASC',
				},
			});

			return await Promise.all(logs.map(async v => ({
				id: v.id,
				createDate: v.createdAt.toISOString(),
				userId: v.userId,
				user: await this.userEntityService.pack(v.user ?? v.userId),
				type: v.type,
				changesProperties: v.info
			})));
		});
	}
}
