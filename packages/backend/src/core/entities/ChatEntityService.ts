/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { MiUser, ChatMessagesRepository, MiChatMessage, ChatRoomsRepository, MiChatRoom, MiChatRoomInvitation, ChatRoomInvitationsRepository, MiChatRoomMembership, ChatRoomMembershipsRepository } from '@/models/_.js';
import { awaitAll } from '@/misc/prelude/await-all.js';
import type { Packed } from '@/misc/json-schema.js';
import type { } from '@/models/Blocking.js';
import { bindThis } from '@/decorators.js';
import { IdService } from '@/core/IdService.js';
import { UserEntityService } from './UserEntityService.js';
import { DriveFileEntityService } from './DriveFileEntityService.js';

@Injectable()
export class ChatEntityService {
	constructor(
		@Inject(DI.chatMessagesRepository)
		private chatMessagesRepository: ChatMessagesRepository,

		@Inject(DI.chatRoomsRepository)
		private chatRoomsRepository: ChatRoomsRepository,

		@Inject(DI.chatRoomInvitationsRepository)
		private chatRoomInvitationsRepository: ChatRoomInvitationsRepository,

		@Inject(DI.chatRoomMembershipsRepository)
		private chatRoomMembershipsRepository: ChatRoomMembershipsRepository,

		private userEntityService: UserEntityService,
		private driveFileEntityService: DriveFileEntityService,
		private idService: IdService,
	) {
	}

	@bindThis
	public async packMessageDetailed(
		src: MiChatMessage['id'] | MiChatMessage,
		me?: { id: MiUser['id'] },
		options?: {
			_hint_?: {
				packedFiles?: Map<MiChatMessage['fileId'], Packed<'DriveFile'> | null>;
				packedUsers?: Map<MiChatMessage['id'], Packed<'UserLite'>>;
				packedRooms?: Map<MiChatMessage['toRoomId'], Packed<'ChatRoom'> | null>;
			};
		},
	): Promise<Packed<'ChatMessage'>> {
		const packedUsers = options?._hint_?.packedUsers;
		const packedFiles = options?._hint_?.packedFiles;
		const packedRooms = options?._hint_?.packedRooms;

		const message = typeof src === 'object' ? src : await this.chatMessagesRepository.findOneByOrFail({ id: src });

		return {
			id: message.id,
			createdAt: this.idService.parse(message.id).date.toISOString(),
			text: message.text,
			fromUserId: message.fromUserId,
			fromUser: packedUsers?.get(message.fromUserId) ?? await this.userEntityService.pack(message.fromUser ?? message.fromUserId, me),
			toUserId: message.toUserId,
			toUser: message.toUserId ? (packedUsers?.get(message.toUserId) ?? await this.userEntityService.pack(message.toUser ?? message.toUserId, me)) : undefined,
			toRoomId: message.toRoomId,
			toRoom: message.toRoomId ? (packedRooms?.get(message.toRoomId) ?? await this.packRoom(message.toRoom ?? message.toRoomId, me)) : undefined,
			fileId: message.fileId,
			file: message.fileId ? (packedFiles?.get(message.fileId) ?? await this.driveFileEntityService.pack(message.file ?? message.fileId)) : null,
		};
	}

	@bindThis
	public async packMessagesDetailed(
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
			this.driveFileEntityService.packMany(messages.map(m => m.file).filter(x => x != null))
				.then(files => new Map(files.map(f => [f.id, f]))),
		]);

		return Promise.all(messages.map(message => this.packMessageDetailed(message, me, { _hint_: { packedUsers, packedFiles } })));
	}

	@bindThis
	public async packMessageLite(
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
			fileId: message.fileId,
			file: message.fileId ? (packedFiles?.get(message.fileId) ?? await this.driveFileEntityService.pack(message.file ?? message.fileId)) : null,
		};
	}

	@bindThis
	public async packMessagesLite(
		messages: MiChatMessage[],
	) {
		if (messages.length === 0) return [];

		const [packedFiles] = await Promise.all([
			this.driveFileEntityService.packMany(messages.map(m => m.file).filter(x => x != null))
				.then(files => new Map(files.map(f => [f.id, f]))),
		]);

		return Promise.all(messages.map(message => this.packMessageLite(message, { _hint_: { packedFiles } })));
	}

	@bindThis
	public async packMessageLiteForRoom(
		src: MiChatMessage['id'] | MiChatMessage,
		options?: {
			_hint_?: {
				packedFiles: Map<MiChatMessage['fileId'], Packed<'DriveFile'> | null>;
				packedUsers: Map<MiChatMessage['id'], Packed<'UserLite'>>;
			};
		},
	): Promise<Packed<'ChatMessageLite'>> {
		const packedFiles = options?._hint_?.packedFiles;
		const packedUsers = options?._hint_?.packedUsers;

		const message = typeof src === 'object' ? src : await this.chatMessagesRepository.findOneByOrFail({ id: src });

		return {
			id: message.id,
			createdAt: this.idService.parse(message.id).date.toISOString(),
			text: message.text,
			fromUserId: message.fromUserId,
			fromUser: packedUsers?.get(message.fromUserId) ?? await this.userEntityService.pack(message.fromUser ?? message.fromUserId),
			toRoomId: message.toRoomId,
			fileId: message.fileId,
			file: message.fileId ? (packedFiles?.get(message.fileId) ?? await this.driveFileEntityService.pack(message.file ?? message.fileId)) : null,
		};
	}

	@bindThis
	public async packMessagesLiteForRoom(
		messages: MiChatMessage[],
	) {
		if (messages.length === 0) return [];

		const [packedUsers, packedFiles] = await Promise.all([
			this.userEntityService.packMany(messages.map(x => x.fromUser ?? x.fromUserId))
				.then(users => new Map(users.map(u => [u.id, u]))),
			this.driveFileEntityService.packMany(messages.map(m => m.file).filter(x => x != null))
				.then(files => new Map(files.map(f => [f.id, f]))),
		]);

		return Promise.all(messages.map(message => this.packMessageLiteForRoom(message, { _hint_: { packedFiles, packedUsers } })));
	}

	@bindThis
	public async packRoom(
		src: MiChatRoom['id'] | MiChatRoom,
		me?: { id: MiUser['id'] },
		options?: {
			_hint_?: {
				packedOwners: Map<MiChatRoom['id'], Packed<'UserLite'>>;
				memberships?: Map<MiChatRoom['id'], MiChatRoomMembership | null>;
			};
		},
	): Promise<Packed<'ChatRoom'>> {
		const room = typeof src === 'object' ? src : await this.chatRoomsRepository.findOneByOrFail({ id: src });

		// TODO: hint使う
		const membership = me ? await this.chatRoomMembershipsRepository.findOneBy({ roomId: room.id, userId: me.id }) : null;

		return {
			id: room.id,
			createdAt: this.idService.parse(room.id).date.toISOString(),
			name: room.name,
			description: room.description,
			ownerId: room.ownerId,
			owner: options?._hint_?.packedOwners.get(room.ownerId) ?? await this.userEntityService.pack(room.owner ?? room.ownerId, me),
			isMuted: membership != null ? membership.isMuted : false,
		};
	}

	@bindThis
	public async packRooms(
		rooms: MiChatRoom[],
		me: { id: MiUser['id'] },
	) {
		if (rooms.length === 0) return [];

		const owners = rooms.map(x => x.owner ?? x.ownerId);

		const packedOwners = await this.userEntityService.packMany(owners, me)
			.then(users => new Map(users.map(u => [u.id, u])));

		return Promise.all(rooms.map(room => this.packRoom(room, me, { _hint_: { packedOwners } })));
	}

	@bindThis
	public async packRoomInvitation(
		src: MiChatRoomInvitation['id'] | MiChatRoomInvitation,
		me: { id: MiUser['id'] },
		options?: {
			_hint_?: {
				packedRooms: Map<MiChatRoomInvitation['roomId'], Packed<'ChatRoom'>>;
				packedUsers: Map<MiChatRoomInvitation['id'], Packed<'UserLite'>>;
			};
		},
	): Promise<Packed<'ChatRoomInvitation'>> {
		const invitation = typeof src === 'object' ? src : await this.chatRoomInvitationsRepository.findOneByOrFail({ id: src });

		return {
			id: invitation.id,
			createdAt: this.idService.parse(invitation.id).date.toISOString(),
			roomId: invitation.roomId,
			room: options?._hint_?.packedRooms.get(invitation.roomId) ?? await this.packRoom(invitation.room ?? invitation.roomId, me),
			userId: invitation.userId,
			user: options?._hint_?.packedUsers.get(invitation.userId) ?? await this.userEntityService.pack(invitation.user ?? invitation.userId, me),
		};
	}

	@bindThis
	public async packRoomInvitations(
		invitations: MiChatRoomInvitation[],
		me: { id: MiUser['id'] },
	) {
		if (invitations.length === 0) return [];

		return Promise.all(invitations.map(invitation => this.packRoomInvitation(invitation, me)));
	}

	@bindThis
	public async packRoomMembership(
		src: MiChatRoomMembership['id'] | MiChatRoomMembership,
		me: { id: MiUser['id'] },
		options?: {
			_hint_?: {
				packedUsers: Map<MiChatRoomMembership['id'], Packed<'UserLite'>>;
			};
		},
	): Promise<Packed<'ChatRoomMembership'>> {
		const membership = typeof src === 'object' ? src : await this.chatRoomMembershipsRepository.findOneByOrFail({ id: src });

		return {
			id: membership.id,
			createdAt: this.idService.parse(membership.id).date.toISOString(),
			userId: membership.userId,
			user: options?._hint_?.packedUsers.get(membership.userId) ?? await this.userEntityService.pack(membership.user ?? membership.userId, me),
		};
	}

	@bindThis
	public async packRoomMemberships(
		memberships: MiChatRoomMembership[],
		me: { id: MiUser['id'] },
	) {
		if (memberships.length === 0) return [];

		const users = memberships.map(x => x.user ?? x.userId);

		const packedUsers = await this.userEntityService.packMany(users, me)
			.then(users => new Map(users.map(u => [u.id, u])));

		return Promise.all(memberships.map(membership => this.packRoomMembership(membership, me, { _hint_: { packedUsers } })));
	}
}
