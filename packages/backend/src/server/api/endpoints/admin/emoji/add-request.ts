import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { DriveFilesRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { CustomEmojiService } from '@/core/CustomEmojiService.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';
import { MetaService } from '@/core/MetaService.js';
import { DriveService } from '@/core/DriveService.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireRolePolicy: 'canRequestCustomEmojis',
	kind: 'write:admin:emoji',

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
		isNotifyIsHome: { type: 'boolean', nullable: true },
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
		private metaService: MetaService,
		private customEmojiService: CustomEmojiService,
		private driveService: DriveService,
		private moderationLogService: ModerationLogService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const isDuplicate = await this.customEmojiService.checkDuplicate(ps.name);
			const isRequestDuplicate = await this.customEmojiService.checkRequestDuplicate(ps.name);

			if (isDuplicate || isRequestDuplicate) throw new ApiError(meta.errors.duplicateName);
			let driveFile;
			const tmp = await this.driveFilesRepository.findOneBy({ id: ps.fileId });
			if (tmp == null) throw new ApiError(meta.errors.noSuchFile);

			try {
				driveFile = await this.driveService.uploadFromUrl({ url: tmp.url, user: null, force: true });
			} catch (e) {
				throw new ApiError();
			}
			if (driveFile == null) throw new ApiError(meta.errors.noSuchFile);
			const { ApiBase, EmojiBotToken, requestEmojiAllOk } = (await this.metaService.fetch());
			let emoji;
			if (requestEmojiAllOk) {
				emoji = await this.customEmojiService.add({
					driveFile,
					name: ps.name,
					category: ps.category ?? null,
					aliases: ps.aliases ?? [],
					license: ps.license ?? null,
					host: null,
					isSensitive: ps.isSensitive ?? false,
					localOnly: ps.localOnly ?? false,
					roleIdsThatCanBeUsedThisEmojiAsReaction: [],
				}, undefined, me);
			} else {
				emoji = await this.customEmojiService.request({
					driveFile,
					name: ps.name,
					category: ps.category ?? null,
					aliases: ps.aliases ?? [],
					license: ps.license ?? null,
					isSensitive: ps.isSensitive ?? false,
					localOnly: ps.localOnly ?? false,
				}, me);
			}

			await this.moderationLogService.log(me, 'addCustomEmoji', {
				emojiId: emoji.id,
				emoji: emoji,
			});

			if (EmojiBotToken) {
				const data_Miss = {
					'i': EmojiBotToken,
					'visibility': ps.isNotifyIsHome ? 'home' : 'public',
					'text':
						'絵文字名 : :' + ps.name + ':\n' +
						'カテゴリ : ' + ps.category + '\n' +
						'ライセンス : ' + ps.license + '\n' +
						'タグ : ' + ps.aliases + '\n' +
						'追加したユーザー : ' + '@' + me.username + '\n',
				};
				await fetch(ApiBase + '/notes/create', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify( data_Miss),
				});
			}

			return {
				id: emoji.id,
			};
		});
	}
}
