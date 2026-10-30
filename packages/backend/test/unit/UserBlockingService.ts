/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, test } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';
import type { BlockingsRepository, ChatRoomsRepository, UserListsRepository } from '@/models/_.js';
import type { MiMeta } from '@/models/Meta.js';
import type { MiUser } from '@/models/User.js';
import { UserBlockingService } from '@/core/UserBlockingService.js';
import { UserFollowingService } from '@/core/UserFollowingService.js';
import { RoleService } from '@/core/RoleService.js';
import { DI } from '@/di-symbols.js';

describe('交流を断てないユーザーのブロック制限', () => {
	let service: UserBlockingService;
	const blockings = mockDeep<BlockingsRepository>();
	const userLists = mockDeep<UserListsRepository>();
	const chatRooms = mockDeep<ChatRoomsRepository>();
	const userFollowingService = mockDeep<UserFollowingService>();
	const roleService = mockDeep<RoleService>();
	const blockee = { id: 'forcibly', host: null } as MiUser;

	beforeEach(async () => {
		mockReset(blockings);
		mockReset(userLists);
		mockReset(chatRooms);
		mockReset(userFollowingService);
		mockReset(roleService);
		const module = await Test.createTestingModule({
			providers: [
				UserBlockingService,
				{ provide: DI.meta, useValue: { forciblyFollowedUsers: [blockee.id] } as MiMeta },
				{ provide: DI.blockingsRepository, useValue: blockings },
				{ provide: DI.userListsRepository, useValue: userLists },
				{ provide: DI.chatRoomsRepository, useValue: chatRooms },
				{ provide: 'UserFollowingService', useValue: userFollowingService },
				{ provide: RoleService, useValue: roleService },
			],
		}).useMocker(() => mockDeep()).compile();
		service = module.get(UserBlockingService);
		service.onModuleInit();
		roleService.isModerator.mockResolvedValue(false);
		userLists.findBy.mockResolvedValue([]);
		chatRooms.find.mockResolvedValue([]);
	});

	test('ローカルユーザーはブロックできない', async () => {
		const blocker = { id: 'blocker', host: null } as MiUser;

		await expect(service.block(blocker, blockee)).rejects.toMatchObject({ id: 'e2f04d25-0d94-4ac3-a4d8-ba401062741b' });
		expect(blockings.insert).not.toHaveBeenCalled();
	});

	// リモートから届いた Block アクティビティを処理できるよう、リモートユーザーには制限をかけない
	test('リモートユーザーのブロックは制限しない', async () => {
		const blocker = { id: 'blocker', host: 'remote.example.com' } as MiUser;

		await service.block(blocker, blockee);

		expect(blockings.insert).toHaveBeenCalledOnce();
		expect(roleService.isModerator).not.toHaveBeenCalled();
	});
});
