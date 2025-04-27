/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { S3Client } from '@aws-sdk/client-s3';
import { Test, TestingModule } from '@nestjs/testing';
import { mockClient } from 'aws-sdk-client-mock';
import { FastifyInstance } from 'fastify';
import request from 'supertest';
import { CoreModule } from '@/core/CoreModule.js';
import { RoleService } from '@/core/RoleService.js';
import { DI } from '@/di-symbols.js';
import { GlobalModule } from '@/GlobalModule.js';
import { MiRole, UserProfilesRepository, UsersRepository } from '@/models/_.js';
import { MiUser } from '@/models/User.js';
import { ServerModule } from '@/server/ServerModule.js';
import { ServerService } from '@/server/ServerService.js';

describe('/drive/files/create', () => {
	let module: TestingModule;
	let server: FastifyInstance;
	const s3Mock = mockClient(S3Client);
	let roleService: RoleService;

	let root: MiUser;
	let role_tinyAttachment: MiRole;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [GlobalModule, CoreModule, ServerModule],
		}).compile();
		module.enableShutdownHooks();

		const serverService = module.get<ServerService>(ServerService);
		server = await serverService.launch();

		const usersRepository = module.get<UsersRepository>(DI.usersRepository);
		root = await usersRepository.insert({
			id: 'root',
			username: 'root',
			usernameLower: 'root',
			token: '1234567890123456',
		}).then(x => usersRepository.findOneByOrFail(x.identifiers[0]));

		const userProfilesRepository = module.get<UserProfilesRepository>(DI.userProfilesRepository);
		await userProfilesRepository.insert({
			userId: root.id,
		});

		roleService = module.get<RoleService>(RoleService);
		role_tinyAttachment = await roleService.create({
			name: 'test-role001',
			description: 'Test role001 description',
			target: 'manual',
			policies: {
				maxFileSizeMb: {
					useDefault: false,
					priority: 1,
					// 10byte
					value: 10 / 1024 / 1024,
				},
			},
		});
	});

	beforeEach(async () => {
		s3Mock.reset();
		await roleService.unassign(root.id, role_tinyAttachment.id).catch(() => {});
	});

	afterAll(async () => {
		await server.close();
		await module.close();
	});

	test('200 ok', async () => {
		const result = await request(server.server)
			.post('/api/drive/files/create')
			.set('Content-Type', 'multipart/form-data')
			.set('Authorization', `Bearer ${root.token}`)
			.attach('file', Buffer.from('a'.repeat(1024 * 1024)));
		expect(result.statusCode).toBe(200);
	});

	test('200 ok(with role)', async () => {
		await roleService.assign(root.id, role_tinyAttachment.id);

		const result = await request(server.server)
			.post('/api/drive/files/create')
			.set('Content-Type', 'multipart/form-data')
			.set('Authorization', `Bearer ${root.token}`)
			.attach('file', Buffer.from('a'.repeat(10)));
		expect(result.statusCode).toBe(200);
	});

	test('413 too large', async () => {
		await roleService.assign(root.id, role_tinyAttachment.id);

		const result = await request(server.server)
			.post('/api/drive/files/create')
			.set('Content-Type', 'multipart/form-data')
			.set('Authorization', `Bearer ${root.token}`)
			.attach('file', Buffer.from('a'.repeat(11)));
		expect(result.statusCode).toBe(413);
		expect(result.body.error.code).toBe('FILE_SIZE_TOO_LARGE');
	});
});
