/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Test, TestingModule } from '@nestjs/testing';
import { jest } from '@jest/globals';
import { SlackNotificationService } from '@/core/SlackNotificationService.js';
import { HttpRequestService } from '@/core/HttpRequestService.js';
import { DI } from '@/di-symbols.js';

describe('SlackNotificationService', () => {
	let service: SlackNotificationService;
	let httpRequestService: jest.Mocked<HttpRequestService>;

	// 実際のサービスはbotToken + channelId (Slack Bot API) を使用する
	const mockConfig = {
		url: 'https://test.misskey.io',
		slack: {
			enableSignupErrorNotification: true,
			botToken: 'xoxb-test-bot-token',
			channelId: 'C01234567',
		},
	};

	beforeEach(async () => {
		const mockHttpRequestService = {
			send: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				SlackNotificationService,
				{
					provide: DI.config,
					useValue: mockConfig,
				},
				{
					provide: HttpRequestService,
					useValue: mockHttpRequestService,
				},
			],
		}).compile();

		service = module.get<SlackNotificationService>(SlackNotificationService);
		httpRequestService = module.get(HttpRequestService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('sendSignupErrorNotification', () => {
		it('should send error notification when enabled', async () => {
			const errorData = {
				username: 'testuser',
				message: 'Test error message',
				ip: '192.168.1.1',
				userAgent: 'Mozilla/5.0 Test Browser',
				timestamp: new Date('2024-01-01T00:00:00Z'),
			};

			httpRequestService.send.mockResolvedValue({} as any);

			await service.sendSignupErrorNotification(errorData);

			expect(httpRequestService.send).toHaveBeenCalledTimes(1);
			// Slack Bot API (chat.postMessage) を使用する
			expect(httpRequestService.send).toHaveBeenCalledWith(
				'https://slack.com/api/chat.postMessage',
				expect.objectContaining({
					method: 'POST',
					headers: expect.objectContaining({
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${mockConfig.slack.botToken}`,
					}),
					body: expect.any(String),
				})
			);

			const callArgs = httpRequestService.send.mock.calls[0];
			const payload = JSON.parse(callArgs?.[1]?.body as string);

			expect(payload.channel).toBe('C01234567');
			expect(payload.text).toContain('サインアップエラー発生');
			expect(payload.blocks).toBeDefined();
			expect(payload.blocks.length).toBeGreaterThan(0);
		});

		it('should not send notification when disabled', async () => {
			const disabledConfig = {
				...mockConfig,
				slack: {
					...mockConfig.slack,
					enableSignupErrorNotification: false,
				},
			};

			const module: TestingModule = await Test.createTestingModule({
				providers: [
					SlackNotificationService,
					{
						provide: DI.config,
						useValue: disabledConfig,
					},
					{
						provide: HttpRequestService,
						useValue: httpRequestService,
					},
				],
			}).compile();

			const disabledService = module.get<SlackNotificationService>(SlackNotificationService);

			const errorData = {
				username: 'testuser',
				message: 'Test error message',
				ip: '192.168.1.1',
				userAgent: 'Mozilla/5.0 Test Browser',
				timestamp: new Date(),
			};

			await disabledService.sendSignupErrorNotification(errorData);

			expect(httpRequestService.send).not.toHaveBeenCalled();
		});

		it('should not send notification when botToken is missing', async () => {
			const noBotTokenConfig = {
				...mockConfig,
				slack: {
					enableSignupErrorNotification: true,
					// botTokenなし
				},
			};

			const module: TestingModule = await Test.createTestingModule({
				providers: [
					SlackNotificationService,
					{
						provide: DI.config,
						useValue: noBotTokenConfig,
					},
					{
						provide: HttpRequestService,
						useValue: httpRequestService,
					},
				],
			}).compile();

			const noBotTokenService = module.get<SlackNotificationService>(SlackNotificationService);

			const errorData = {
				username: 'testuser',
				message: 'Test error message',
				ip: '192.168.1.1',
				userAgent: 'Mozilla/5.0 Test Browser',
				timestamp: new Date(),
			};

			await noBotTokenService.sendSignupErrorNotification(errorData);

			expect(httpRequestService.send).not.toHaveBeenCalled();
		});

		it('should handle HTTP request errors gracefully', async () => {
			const errorData = {
				username: 'testuser',
				message: 'Test error message',
				ip: '192.168.1.1',
				userAgent: 'Mozilla/5.0 Test Browser',
				timestamp: new Date(),
			};

			const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
			httpRequestService.send.mockRejectedValue(new Error('Network error'));

			await expect(service.sendSignupErrorNotification(errorData)).resolves.not.toThrow();
			expect(consoleSpy).toHaveBeenCalledWith('Failed to send Slack notification:', expect.any(Error));

			consoleSpy.mockRestore();
		});
	});

	describe('sendSignupSuccessNotification', () => {
		it('should send success notification when enabled', async () => {
			const userData = {
				username: 'newuser',
				ip: '192.168.1.2',
				timestamp: new Date('2024-01-01T01:00:00Z'),
			};

			httpRequestService.send.mockResolvedValue({} as any);

			await service.sendSignupSuccessNotification(userData);

			expect(httpRequestService.send).toHaveBeenCalledTimes(1);

			const callArgs = httpRequestService.send.mock.calls[0];
			const payload = JSON.parse(callArgs?.[1]?.body as string);

			expect(payload.channel).toBe('C01234567');
			expect(payload.text).toContain('@newuser');
			expect(payload.blocks).toBeDefined();
			expect(payload.blocks.length).toBeGreaterThan(0);
		});

		it('should truncate long user agent strings in error notifications', async () => {
			const longUserAgent = 'A'.repeat(150);
			const errorData = {
				username: 'testuser',
				message: 'Test error message',
				ip: '192.168.1.1',
				userAgent: longUserAgent,
				timestamp: new Date(),
			};

			httpRequestService.send.mockResolvedValue({} as any);

			await service.sendSignupErrorNotification(errorData);

			const callArgs = httpRequestService.send.mock.calls[0];
			const payload = JSON.parse(callArgs?.[1]?.body as string);

			// blocksの中にUser Agentが含まれるブロックを探す
			const bodyStr = JSON.stringify(payload.blocks);
			// 100文字 + "..." で切り詰められていることを確認
			expect(bodyStr).toContain('...');
			expect(bodyStr).not.toContain(longUserAgent);
		});
	});
});
