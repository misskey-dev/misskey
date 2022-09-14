import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { Emojis } from '@/models/index.js';
import { DI_SYMBOLS } from '@/di-symbols.js';
import { ModerationLogService } from '@/services/ModerationLogService.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	errors: {
		noSuchEmoji: {
			message: 'No such emoji.',
			code: 'NO_SUCH_EMOJI',
			id: 'be83669b-773a-44b7-b1f8-e5e5170ac3c2',
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

// TODO: ロジックをサービスに切り出す

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI_SYMBOLS.db)
		private db: DataSource,

		@Inject('emojisRepository')
		private emojisRepository: typeof Emojis,

		private moderationLogService: ModerationLogService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const emoji = await this.emojisRepository.findOneBy({ id: ps.id });

			if (emoji == null) throw new ApiError(meta.errors.noSuchEmoji);

			await this.emojisRepository.delete(emoji.id);

			await this.db.queryResultCache!.remove(['meta_emojis']);

			this.moderationLogService.insertModerationLog(me, 'deleteEmoji', {
				emoji: emoji,
			});
		});
	}
}
