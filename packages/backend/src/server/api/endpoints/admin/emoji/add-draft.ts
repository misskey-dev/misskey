import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { DriveFilesRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { CustomEmojiService } from '@/core/CustomEmojiService.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';
import { ApiError } from '../../../error.js';
import { MetaService } from '@/core/MetaService.js';
import {DriveService} from "@/core/DriveService.js";
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
		fileId: { type: 'string', format: 'misskey:id' },
		isSensitive: { type: 'boolean' },
		localOnly: { type: 'boolean' },
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
		private metaService: MetaService,
		private customEmojiService: CustomEmojiService,
		private moderationLogService: ModerationLogService,
		private driveService: DriveService,
	) {
		super(meta, paramDef, async (ps, me) => {
			let driveFile;
			let tmp = await this.driveFilesRepository.findOneBy({ id: ps.fileId });
			if (tmp == null) throw new ApiError(meta.errors.noSuchFile);

			try {
				driveFile = await this.driveService.uploadFromUrl({ url: tmp.url , user: null, force: true });
			} catch (e) {
				throw new ApiError();
			}

			const emoji = await this.customEmojiService.add({
				driveFile,
				name: ps.name,
				category: ps.category ?? null,
				aliases: ps.aliases ?? [],
				license: ps.license ?? null,
				host: null,
				draft: false,
				isSensitive: ps.isSensitive ?? false,
				localOnly: ps.localOnly ?? false,
				roleIdsThatCanBeUsedThisEmojiAsReaction: [],
			});
			const {ApiBase,EmojiBotToken,DiscordWebhookUrl} = (await this.metaService.fetch())

			if (EmojiBotToken){
				const data_Miss = {
					'i': EmojiBotToken,
					'text':
						'絵文字名 : :' + ps.name + ':\n' +
						'カテゴリ : ' + ps.category + '\n' +
						'ライセンス : ' + ps.license + '\n' +
						'タグ : ' + ps.aliases + '\n' +
						'追加したユーザー : ' + '@' + me.username + '\n'
				};
				await fetch(ApiBase+'/notes/create', {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body:JSON.stringify( data_Miss)
				})
			}

			if (DiscordWebhookUrl){
				const data_disc = {"username": "絵文字追加通知ちゃん",
					'content':
						'絵文字名 : :'+ ps.name +':\n' +
						'カテゴリ : ' + ps.category + '\n'+
						'ライセンス : '+ ps.license + '\n'+
						'タグ : '+ps.aliases+ '\n'+
						'追加したユーザー : ' + '@'+me.username + '\n'
				}
				await fetch(DiscordWebhookUrl, {
					'method':'post',
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(data_disc),
				})
			}


			return {
				id: emoji.id,
			};
		});
	}
}
