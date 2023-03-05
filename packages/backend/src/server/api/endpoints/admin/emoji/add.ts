import { Inject, Injectable } from '@nestjs/common';
import rndstr from 'rndstr';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { DriveFilesRepository } from '@/models/index.js';
import { DI } from '@/di-symbols.js';
import { CustomEmojiService } from '@/core/CustomEmojiService.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireRolePolicy: 'canManageCustomEmojis',

	errors: {
		noSuchFile: {
			message: 'No such file.',
			code: 'NO_SUCH_FILE',
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
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private customEmojiService: CustomEmojiService,

		private moderationLogService: ModerationLogService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const driveFile = await this.driveFilesRepository.findOneBy({ id: ps.fileId });

			if (driveFile == null) throw new ApiError(meta.errors.noSuchFile);

			const name = driveFile.name.split('.')[0].match(/^[a-z0-9_]+$/) ? driveFile.name.split('.')[0] : `_${rndstr('a-z0-9', 8)}_`;

			const emoji = await this.customEmojiService.add({
				driveFile,
				name,
				category: null,
				aliases: [],
				host: null,
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
