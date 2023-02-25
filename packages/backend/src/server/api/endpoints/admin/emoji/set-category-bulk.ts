import { Inject, Injectable } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { EmojisRepository } from '@/models/index.js';
import { DI } from '@/di-symbols.js';
import { EmojiEntityService } from '@/core/entities/EmojiEntityService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireRolePolicy: 'canManageCustomEmojis',
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		ids: { type: 'array', items: {
			type: 'string', format: 'misskey:id',
		} },
		category: {
			type: 'string',
			nullable: true,
			description: 'Use `null` to reset the category.',
		},
	},
	required: ['ids'],
} as const;

// TODO: ロジックをサービスに切り出す

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.db)
		private db: DataSource,

		@Inject(DI.emojisRepository)
		private emojisRepository: EmojisRepository,

		private emojiEntityService: EmojiEntityService,
		private globalEventService: GlobalEventService,
	) {
		super(meta, paramDef, async (ps, me) => {
			await this.emojisRepository.update({
				id: In(ps.ids),
			}, {
				updatedAt: new Date(),
				category: ps.category,
			});

			await this.db.queryResultCache!.remove(['meta_emojis']);

			this.globalEventService.publishBroadcastStream('emojiUpdated', {
				emojis: await this.emojiEntityService.packDetailedMany(ps.ids),
			});
		});
	}
}
