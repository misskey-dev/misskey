import { Inject, Injectable } from '@nestjs/common';
import rndstr from 'rndstr';
import { DataSource } from 'typeorm';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { DriveFilesRepository, EmojisRepository } from '@/models/index.js';
import { IdService } from '@/core/IdService.js';
import { DI } from '@/di-symbols.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';
import { EmojiEntityService } from '@/core/entities/EmojiEntityService.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	errors: {
		noSuchFile: {
			message: 'No such file.',
			code: 'MO_SUCH_FILE',
			id: 'fc46b5a4-6b92-4c33-ac66-b806659bb5cf',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		fileId: { type: 'string', format: 'misskey:id' },
	},
	required: ['fileId'],
} as const;

// TODO: ロジックをサービスに切り出す

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.db)
		private db: DataSource,

		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		@Inject(DI.emojisRepository)
		private emojisRepository: EmojisRepository,

		private emojiEntityService: EmojiEntityService,
		private idService: IdService,
		private globalEventService: GlobalEventService,
		private moderationLogService: ModerationLogService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const file = await this.driveFilesRepository.findOneBy({ id: ps.fileId });

			if (file == null) throw new ApiError(meta.errors.noSuchFile);

			const name = file.name.split('.')[0].match(/^[a-z0-9_]+$/) ? file.name.split('.')[0] : `_${rndstr('a-z0-9', 8)}_`;

			const emoji = await this.emojisRepository.insert({
				id: this.idService.genId(),
				updatedAt: new Date(),
				name: name,
				category: null,
				host: null,
				aliases: [],
				originalUrl: file.url,
				publicUrl: file.webpublicUrl ?? file.url,
				type: file.webpublicType ?? file.type,
			}).then(x => this.emojisRepository.findOneByOrFail(x.identifiers[0]));

			await this.db.queryResultCache!.remove(['meta_emojis']);

			this.globalEventService.publishBroadcastStream('emojiAdded', {
				emoji: await this.emojiEntityService.pack(emoji.id),
			});

			this.moderationLogService.insertModerationLog(me, 'addEmoji', {
				emojiId: emoji.id,
			});

			return {
				id: emoji.id,
			};
		});
	}
}
