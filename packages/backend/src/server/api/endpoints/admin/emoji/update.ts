import { Inject, Injectable } from '@nestjs/common';
import { IsNull } from 'typeorm';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { CustomEmojiService } from '@/core/CustomEmojiService.js';
import type { DriveFilesRepository, EmojisRepository } from '@/models/index.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../../../error.js';
import { RoleService } from '@/core/RoleService.js';
import { LogInfoValue } from '@/models/entities/EmojiModerationLog.js';
import { EmojiModerationLogService } from '@/core/EmojiModerationLogService.js';

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
		noSuchFile: {
			message: 'No such file.',
			code: 'NO_SUCH_FILE',
			id: '14fb9fd9-0731-4e2f-aeb9-f09e4740333d',
		},
		sameNameEmojiExists: {
			message: 'Emoji that have same name already exists.',
			code: 'SAME_NAME_EMOJI_EXISTS',
			id: '7180fe9d-1ee3-bff9-647d-fe9896d2ffb8',
		},
		notOwnerOrpermissionDenied: {
			message: 'You are not this emoji owner or not assigned to a required role.',
			code: 'NOT_OWNER_OR_PERMISSION_DENIED',
			id: '73952b00-d3e3-4038-b2c6-f4b4532e3906'
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		id: { type: 'string', format: 'misskey:id' },
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
	required: ['id', 'name', 'aliases'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		@Inject(DI.emojisRepository)
		private emojisRepository: EmojisRepository,

		private roleService: RoleService,

		private customEmojiService: CustomEmojiService,

		private emojiModerationLogService: EmojiModerationLogService,
	) {
		super(meta, paramDef, async (ps, me) => {
			let driveFile;

			if (ps.fileId) {
				driveFile = await this.driveFilesRepository.findOneBy({
					id: ps.fileId,
				});
				if (driveFile == null) throw new ApiError(meta.errors.noSuchFile);
			}

			const oldEmoji = await this.emojisRepository.findOneBy({
				id: ps.id,
			});

			if (oldEmoji == null) throw new ApiError(meta.errors.noSuchEmoji);

			const isEmojiModerator = await this.roleService.isEmojiModerator(me);

			if (oldEmoji.name !== ps.name) {
				const existEmoji = await this.emojisRepository.exist({
					where: {
						name: ps.name,
						host: IsNull(),
					},
				});

				if (existEmoji) {
					throw new ApiError(meta.errors.sameNameEmojiExists);
				}
			}

			if ((
				driveFile ||
				oldEmoji.name !== ps.name ||
				oldEmoji.category !== ps.category ||
				oldEmoji.license !== ps.license ||
				oldEmoji.isSensitive !== ps.isSensitive ||
				oldEmoji.localOnly !== ps.localOnly) &&
				!isEmojiModerator &&
				oldEmoji.userId !== me.id
			) {
				throw new ApiError(meta.errors.notOwnerOrpermissionDenied);
			}

			await this.customEmojiService.update(ps.id, {
				driveFile,
				name: ps.name,
				category: ps.category ?? null,
				aliases: ps.aliases,
				license: ps.license ?? null,
				isSensitive: ps.isSensitive,
				localOnly: ps.localOnly,
				roleIdsThatCanBeUsedThisEmojiAsReaction:
					ps.roleIdsThatCanBeUsedThisEmojiAsReaction,
			});

			const changes: LogInfoValue[] = [];
			if (driveFile) {
				changes.push({
					type: 'originalUrl',
					changeInfo: {
						before: oldEmoji.originalUrl,
						after: driveFile.url,
					},
				});
			}
			if (oldEmoji.name !== ps.name) {
				changes.push({
					type: 'name',
					changeInfo: {
						before: oldEmoji.name,
						after: ps.name,
					},
				});
			}
			if (oldEmoji.category !== ps.category) {
				changes.push({
					type: 'category',
					changeInfo: {
						before: oldEmoji.category,
						after: ps.category,
					},
				});
			}
			if (oldEmoji.license !== ps.license) {
				changes.push({
					type: 'license',
					changeInfo: {
						before: oldEmoji.license,
						after: ps.license,
					},
				});
			}
			if (oldEmoji.isSensitive !== ps.isSensitive) {
				changes.push({
					type: 'isSensitive',
					changeInfo: {
						before: oldEmoji.isSensitive,
						after: ps.isSensitive,
					},
				});
			}
			if (oldEmoji.localOnly !== ps.localOnly) {
				changes.push({
					type: 'localOnly',
					changeInfo: {
						before: oldEmoji.localOnly,
						after: ps.localOnly,
					},
				});
			}

			//エイリアスはbeforeに削除されたもの、afterに追加されたものを書く
			if (oldEmoji.aliases.length !== ps.aliases.length || !oldEmoji.aliases.every(v => ps.aliases.includes(v))) {
				changes.push({
					type: 'aliases',
					changeInfo: {
						before: oldEmoji.aliases.filter(v => !ps.aliases.includes(v)),
						after: ps.aliases.filter(v => !oldEmoji.aliases.includes(v)),
					},
				});
			}

			await this.emojiModerationLogService.insertEmojiModerationLog(me, { id: ps.id }, 'Update', changes);
		});
	}
}
