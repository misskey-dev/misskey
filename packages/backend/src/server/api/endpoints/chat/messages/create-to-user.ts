/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import ms from 'ms';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { GetterService } from '@/server/api/GetterService.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '@/server/api/error.js';
import { ChatService } from '@/core/ChatService.js';
import type { DriveFilesRepository, MiUser } from '@/models/_.js';
import { bindThis } from '@/decorators.js';

export const meta = {
	tags: ['chat'],

	requireCredential: true,

	prohibitMoved: true,

	kind: 'write:chat',

	limit: {
		duration: ms('1hour'),
		max: 500,
	},

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'ChatMessageLiteFor1on1',
	},

	errors: {
		recipientIsYourself: {
			message: 'You can not send a message to yourself.',
			code: 'RECIPIENT_IS_YOURSELF',
			id: '17e2ba79-e22a-4cbc-bf91-d327643f4a7e',
		},

		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: '11795c64-40ea-4198-b06e-3c873ed9039d',
		},

		noSuchFile: {
			message: 'No such file.',
			code: 'NO_SUCH_FILE',
			id: '4372b8e2-185d-4146-8749-2f68864a3e5f',
		},

		contentRequired: {
			message: 'Content required. You need to set text or fileId.',
			code: 'CONTENT_REQUIRED',
			id: '25587321-b0e6-449c-9239-f8925092942c',
		},

		youHaveBeenBlocked: {
			message: 'You cannot send a message because you have been blocked by this user.',
			code: 'YOU_HAVE_BEEN_BLOCKED',
			id: 'c15a5199-7422-4968-941a-2a462c478f7d',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		text: { type: 'string', nullable: true, maxLength: 2000 },
		fileId: { type: 'string', format: 'misskey:id' },
		toUserId: { type: 'string', format: 'misskey:id' },
	},
	required: ['toUserId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private getterService: GetterService,
		private chatService: ChatService,
	) {
		super(meta, paramDef, async (ps, me) => {
			console.log('🔍 [DEBUG] Chat API create-to-user called', {
				userId: me.id,
				toUserId: ps.toUserId,
				hasText: !!ps.text,
				textLength: ps.text?.length,
				hasFileId: !!ps.fileId,
				timestamp: new Date().toISOString()
			});

			try {
				await this.chatService.checkChatAvailability(me.id, 'write');
				console.log('✅ [DEBUG] Chat availability check passed for user:', me.id);

				let file = null;
				if (ps.fileId != null) {
					console.log('🔍 [DEBUG] Looking for file:', ps.fileId);
					file = await this.driveFilesRepository.findOneBy({
						id: ps.fileId,
						userId: me.id,
					});

					if (file == null) {
						console.log('❌ [DEBUG] File not found:', ps.fileId);
						throw new ApiError(meta.errors.noSuchFile);
					}
					console.log('✅ [DEBUG] File found:', { id: file.id, name: file.name });
				}

				// テキストが無いかつ添付ファイルも無かったらエラー
				if (ps.text == null && file == null) {
					console.log('❌ [DEBUG] No content provided (no text and no file)');
					throw new ApiError(meta.errors.contentRequired);
				}

				// Myself
				if (ps.toUserId === me.id) {
					console.log('❌ [DEBUG] User trying to send message to themselves');
					throw new ApiError(meta.errors.recipientIsYourself);
				}

				console.log('🔍 [DEBUG] Getting target user:', ps.toUserId);
				const toUser = await this.getterService.getUser(ps.toUserId).catch(err => {
					console.log('❌ [DEBUG] Failed to get target user:', { error: err.message, id: err.id });
					if (err.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw new ApiError(meta.errors.noSuchUser);
					throw err;
				});

				console.log('✅ [DEBUG] Target user found:', { id: toUser.id, username: toUser.username });

				console.log('🚀 [DEBUG] Creating chat message...');
				const result = await this.chatService.createMessageToUser(me, toUser, {
					text: ps.text,
					file: file,
				});

				console.log('✅ [DEBUG] Chat message created successfully:', { messageId: result.id });
				return result;

			} catch (error) {
				console.log('💥 [DEBUG] Chat API error:', {
					error: error instanceof Error ? error.message : String(error),
					stack: error instanceof Error ? error.stack : undefined,
					code: (error as any)?.code,
					id: (error as any)?.id
				});
				throw error;
			}
		});
	}
}
