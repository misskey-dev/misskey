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

	const mockConfig = {
		url: 'https://test.misskey.io',
		slack: {
			enableSignupErrorNotification: true,
			webhookUrl: 'https://hooks.slack.com/services/TEST/WEBHOOK/URL',
			channel: '#test-channel',
			username: 'Test-Bot',
			iconEmoji: ':test:',
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
			expect(httpRequestService.send).toHaveBeenCalledWith(
				mockConfig.slack.webhookUrl,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: expect.stringContaining('"title":":warning: サインアップエラー発生"'),
				}
			);

			const callArgs = httpRequestService.send.mock.calls[0];
			const payload = JSON.parse(callArgs?.[1]?.body as string);

			expect(payload.channel).toBe('#test-channel');
			expect(payload.username).toBe('Test-Bot');
			expect(payload.icon_emoji).toBe(':test:');
			expect(payload.attachments[0].color).toBe('danger');
			expect(payload.attachments[0].fields).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						title: 'エラーメッセージ',
						value: 'Test error message',
					}),
					expect.objectContaining({
						title: 'ユーザー名',
						value: 'testuser',
					}),
					expect.objectContaining({
						title: 'IPアドレス',
						value: '192.168.1.1',
					}),
				])
			);
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

			expect(payload.icon_emoji).toBe(':white_check_mark:');
			expect(payload.attachments[0].color).toBe('good');
			expect(payload.attachments[0].title).toBe(':white_check_mark: 新規ユーザー登録完了');
			expect(payload.attachments[0].fields).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						title: 'ユーザー名',
						value: '@newuser',
					}),
					expect.objectContaining({
						title: 'IPアドレス',
						value: '192.168.1.2',
					}),
				])
			);
		});

		it('should truncate long user agent strings', async () => {
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
			const userAgentField = payload.attachments[0].fields.find((f: any) => f.title === 'User Agent');

			expect(userAgentField.value).toHaveLength(103); // 100 chars + "..."
			expect(userAgentField.value).toMatch(/\.\.\.$/); // ends with ...
		});
	});
});