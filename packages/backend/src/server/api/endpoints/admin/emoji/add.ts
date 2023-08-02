import { Inject, Injectable } from '@nestjs/common';
import { IsNull } from 'typeorm';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { DriveFilesRepository, EmojisRepository } from "@/models/index.js";
import { DI } from '@/di-symbols.js';
import { CustomEmojiService } from '@/core/CustomEmojiService.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';
import { EmojiEntityService } from '@/core/entities/EmojiEntityService.js';
import { ApiError } from '../../../error.js';
import { EmojiModerationLogService } from '@/core/EmojiModerationLogService.js';

export const meta = {
	tags: ["admin"],

	requireCredential: true,
	requireRolePolicy: "canManageCustomEmojis",

	errors: {
		noSuchFile: {
			message: "No such file.",
			code: "NO_SUCH_FILE",
			id: "fc46b5a4-6b92-4c33-ac66-b806659bb5cf",
		},
		sameNameEmojiExists: {
			message: "Emoji that have same name already exists.",
			code: "SAME_NAME_EMOJI_EXISTS",
			id: "c85c8b53-084e-6f13-7688-c7bef8dee383",
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		name: { type: 'string', pattern: '^[a-z0-9_]+$' },
		fileId: { type: 'string', format: 'misskey:id' },
		category: {
			type: 'string',
			nullable: true,
			description: 'Use `null` to reset the category.',
		},
		aliases: { type: 'array', items: {
			type: 'string',
		} },
		license: { type: 'string', nullable: true },
		isSensitive: { type: 'boolean' },
		localOnly: { type: 'boolean' },
		roleIdsThatCanBeUsedThisEmojiAsReaction: { type: 'array', items: {
			type: 'string',
		} },
	},
	required: ['name', 'fileId'],
} as const;

// TODO: ロジックをサービスに切り出す

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		@Inject(DI.emojisRepository)
		private emojisRepository: EmojisRepository,

		private customEmojiService: CustomEmojiService,

		private emojiEntityService: EmojiEntityService,
		private moderationLogService: ModerationLogService,
		private emojiModerationLogService: EmojiModerationLogService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const driveFile = await this.driveFilesRepository.findOneBy({
				id: ps.fileId,
			});
			if (driveFile == null) throw new ApiError(meta.errors.noSuchFile);

			const existEmoji = await this.emojisRepository.exist({
				where: {
					name: ps.name,
					host: IsNull(),
				},
			});

			if (existEmoji) {
				throw new ApiError(meta.errors.sameNameEmojiExists);
			}

			const emoji = await this.customEmojiService.add({
				driveFile,
				name: ps.name,
				category: ps.category ?? null,
				aliases: ps.aliases ?? [],
				host: null,
				license: ps.license ?? null,
				isSensitive: ps.isSensitive ?? false,
				localOnly: ps.localOnly ?? false,
				roleIdsThatCanBeUsedThisEmojiAsReaction:
					ps.roleIdsThatCanBeUsedThisEmojiAsReaction ?? [],
				userId: me.id,
			});

			this.moderationLogService.insertModerationLog(me, "addEmoji", {
				emojiId: emoji.id,
			});

			await this.emojiModerationLogService.insertEmojiModerationLog(me, emoji, 'Add');

			return this.emojiEntityService.packDetailed(emoji);
		});
	}
}
