import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { EmojisRepository } from '@/models/index.js';
import { DI } from '@/di-symbols.js';
import { EmojiEntityService } from '@/core/entities/EmojiEntityService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireRolePolicy: 'canManageCustomEmojis',

	errors: {
		noSuchEmoji: {
			message: 'No such emoji.',
			code: 'NO_SUCH_EMOJI',
			id: '684dec9d-a8c2-4364-9aa8-456c49cb1dc8',
		},
		alreadyexistsemoji: {
			message: 'Emoji already exists',
			code: 'EMOJI_ALREADY_EXISTS',
			id: '7180fe9d-1ee3-bff9-647d-fe9896d2ffb8',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		id: { type: 'string', format: 'misskey:id' },
		name: { type: 'string', pattern: '^[a-zA-Z0-9_]+$' },
		category: {
			type: 'string',
			nullable: true,
			description: 'Use `null` to reset the category.',
		},
		aliases: { type: 'array', items: {
			type: 'string',
		} },
		license: { type: 'string', nullable: true },
	},
	required: ['id', 'name', 'aliases'],
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
			const emoji = await this.emojisRepository.findOneBy({ id: ps.id });
			const emojiname = await this.emojisRepository.findOneBy({ name: ps.name });
			if (emoji == null) throw new ApiError(meta.errors.noSuchEmoji);
			if (emojiname != null && emojiname.id !== ps.id) throw new ApiError(meta.errors.alreadyexistsemoji);
			await this.emojisRepository.update(emoji.id, {
				updatedAt: new Date(),
				name: ps.name,
				category: ps.category,
				aliases: ps.aliases,
				license: ps.license,
			});

			await this.db.queryResultCache?.remove(['meta_emojis']);

			const updated = await this.emojiEntityService.packDetailed(emoji.id);

			if (emoji.name === ps.name) {
				this.globalEventService.publishBroadcastStream('emojiUpdated', {
					emojis: [updated],
				});
			} else {
				this.globalEventService.publishBroadcastStream('emojiDeleted', {
					emojis: [await this.emojiEntityService.packDetailed(emoji)],
				});

				this.globalEventService.publishBroadcastStream('emojiAdded', {
					emoji: updated,
				});	
			}
		});
	}
}
