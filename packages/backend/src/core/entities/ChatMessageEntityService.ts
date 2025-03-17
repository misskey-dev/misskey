/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { MiUser, ChatMessagesRepository, MiChatMessage } from '@/models/_.js';
import { awaitAll } from '@/misc/prelude/await-all.js';
import type { Packed } from '@/misc/json-schema.js';
import type { } from '@/models/Blocking.js';
import { bindThis } from '@/decorators.js';
import { IdService } from '@/core/IdService.js';
import { UserEntityService } from './UserEntityService.js';
import { DriveFileEntityService } from './DriveFileEntityService.js';

@Injectable()
export class ChatMessageEntityService {
	constructor(
		@Inject(DI.chatMessagesRepository)
		private chatMessagesRepository: ChatMessagesRepository,

		private userEntityService: UserEntityService,
		private driveFileEntityService: DriveFileEntityService,
		private idService: IdService,
	) {
	}

	@bindThis
	public async pack(
		src: MiChatMessage['id'] | MiChatMessage,
		me: { id: MiUser['id'] },
		options?: {
			_hint_?: {
				packedFiles: Map<MiChatMessage['fileId'], Packed<'DriveFile'> | null>;
				packedUsers: Map<MiChatMessage['id'], Packed<'UserLite'>>
			};
		},
	): Promise<Packed<'ChatMessage'>> {
		const packedUsers = options?._hint_?.packedUsers;
		const packedFiles = options?._hint_?.packedFiles;

		const message = typeof src === 'object' ? src : await this.chatMessagesRepository.findOneByOrFail({ id: src });

		return {
			id: message.id,
			createdAt: this.idService.parse(message.id).date.toISOString(),
			text: message.text,
			fromUserId: message.fromUserId,
			fromUser: message.fromUserId !== me.id ? (packedUsers?.get(message.fromUserId) ?? await this.userEntityService.pack(message.fromUser ?? message.fromUserId, me)) : undefined,
			toUserId: message.toUserId,
			toUser: (message.toUserId && message.toUserId !== me.id) ? (packedUsers?.get(message.toUserId) ?? await this.userEntityService.pack(message.toUser ?? message.toUserId, me)) : undefined,
			//toGroupId: message.toGroupId,
			//toGroup: message.toGroupId && opts.populateGroup ? await this.userGroupEntityService.pack(message.toGroup ?? message.toGroupId) : undefined,
			fileId: message.fileId,
			file: message.file ? (packedFiles?.get(message.fileId) ?? await this.driveFileEntityService.pack(message.file)) : null,
		};
	}

	@bindThis
	public async packMany(
		messages: MiChatMessage[],
		me: { id: MiUser['id'] },
	) {
		if (messages.length === 0) return [];

		const excludeMe = (x: MiUser | string) => {
			if (typeof x === 'string') {
				return x !== me.id;
			} else {
				return x.id !== me.id;
			}
		};

		const users = [
			...messages.map((m) => m.fromUser ?? m.fromUserId).filter(excludeMe),
			...messages.map((m) => m.toUser ?? m.toUserId).filter(x => x != null).filter(excludeMe),
		];

		const [packedUsers, packedFiles] = await Promise.all([
			this.userEntityService.packMany(users, me)
				.then(users => new Map(users.map(u => [u.id, u]))),
			this.driveFileEntityService.packMany(messages.map(m => m.file).filter(x => x != null)),
		]);

		return Promise.all(messages.map(message => this.pack(message, me, { _hint_: { packedUsers, packedFiles } })));
	}

	@bindThis
	public async packLite(
		src: MiChatMessage['id'] | MiChatMessage,
		options?: {
			_hint_?: {
				packedFiles: Map<MiChatMessage['fileId'], Packed<'DriveFile'> | null>;
			};
		},
	): Promise<Packed<'ChatMessageLite'>> {
		const packedFiles = options?._hint_?.packedFiles;

		const message = typeof src === 'object' ? src : await this.chatMessagesRepository.findOneByOrFail({ id: src });

		return {
			id: message.id,
			createdAt: this.idService.parse(message.id).date.toISOString(),
			text: message.text,
			fromUserId: message.fromUserId,
			toUserId: message.toUserId,
			//toGroupId: message.toGroupId,
			fileId: message.fileId,
			file: message.file ? (packedFiles?.get(message.fileId) ?? await this.driveFileEntityService.pack(message.file)) : null,
		};
	}

	@bindThis
	public async packLiteMany(
		messages: MiChatMessage[],
	) {
		if (messages.length === 0) return [];

		const [packedFiles] = await Promise.all([
			this.driveFileEntityService.packMany(messages.map(m => m.file).filter(x => x != null)),
		]);

		return Promise.all(messages.map(message => this.packLite(message, { _hint_: { packedFiles } })));
	}
}

