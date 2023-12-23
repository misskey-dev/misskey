import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { DriveFilesRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { CustomEmojiService } from '@/core/CustomEmojiService.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireRolePolicy: 'canRequestCustomEmojis',

	errors: {
		noSuchFile: {
			message: 'No such file.',
			code: 'NO_SUCH_FILE',
			id: 'fc46b5a4-6b92-4c33-ac66-b806659bb5cf',
		},
		duplicateName: {
			message: 'Duplicate name.',
			code: 'DUPLICATE_NAME',
			id: 'f7a3462c-4e6e-4069-8421-b9bd4f4c3975',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
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
		isSensitive: { type: 'boolean', nullable: true },
		localOnly: { type: 'boolean', nullable: true },
		fileId: { type: 'string', format: 'misskey:id' },
	},
	required: ['name', 'fileId'],
} as const;

// TODO: ロジックをサービスに切り出す

@Injectable()
// eslint-disable-next-line import/no-default-export
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private customEmojiService: CustomEmojiService,

		private moderationLogService: ModerationLogService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const isDuplicate = await this.customEmojiService.checkDuplicate(ps.name);
			const isRequestDuplicate = await this.customEmojiService.checkRequestDuplicate(ps.name);

			if (isDuplicate || isRequestDuplicate) throw new ApiError(meta.errors.duplicateName);
			const driveFile = await this.driveFilesRepository.findOneBy({ id: ps.fileId });

			if (driveFile == null) throw new ApiError(meta.errors.noSuchFile);

			const emoji = await this.customEmojiService.request({
				driveFile,
				name: ps.name,
				category: ps.category ?? null,
				aliases: ps.aliases ?? [],
				license: ps.license ?? null,
				isSensitive: ps.isSensitive ?? false,
				localOnly: ps.localOnly ?? false,
			});

			await this.moderationLogService.log(me, 'addCustomEmoji', {
				emojiId: emoji.id,
				emoji: emoji,
			});

			return {
				id: emoji.id,
			};
		});
	}
}
