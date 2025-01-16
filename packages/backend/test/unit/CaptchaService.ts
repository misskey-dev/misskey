/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { afterAll, beforeAll, beforeEach, describe, expect, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'node-fetch';
import {
	CaptchaError,
	CaptchaErrorCode,
	captchaErrorCodes,
	CaptchaSaveResult,
	CaptchaService,
} from '@/core/CaptchaService.js';
import { GlobalModule } from '@/GlobalModule.js';
import { HttpRequestService } from '@/core/HttpRequestService.js';
import { MetaService } from '@/core/MetaService.js';
import { MiMeta } from '@/models/Meta.js';
import { LoggerService } from '@/core/LoggerService.js';

describe('CaptchaService', () => {
	let app: TestingModule;
	let service: CaptchaService;
	let httpRequestService: jest.Mocked<HttpRequestService>;
	let metaService: jest.Mocked<MetaService>;

	beforeAll(async () => {
		app = await Test.createTestingModule({
			imports: [
				GlobalModule,
			],
			providers: [
				CaptchaService,
				LoggerService,
				{
					provide: HttpRequestService, useFactory: () => ({ send: jest.fn() }),
				},
				{
					provide: MetaService, useFactory: () => ({
						fetch: jest.fn(),
						update: jest.fn(),
					}),
				},
			],
		}).compile();

		app.enableShutdownHooks();

		service = app.get(CaptchaService);
		httpRequestService = app.get(HttpRequestService) as jest.Mocked<HttpRequestService>;
		metaService = app.get(MetaService) as jest.Mocked<MetaService>;
	});

	beforeEach(() => {
		httpRequestService.send.mockClear();
		metaService.update.mockClear();
		metaService.fetch.mockClear();
	});

	afterAll(async () => {
		await app.close();
	});

	function successMock(result: object) {
		httpRequestService.send.mockResolvedValue({
			ok: true,
			status: 200,
			json: async () => (result),
		} as Response);
	}

	function failureHttpMock() {
		httpRequestService.send.mockResolvedValue({
			ok: false,
			status: 400,
		} as Response);
	}

	function failureVerificationMock(result: object) {
		httpRequestService.send.mockResolvedValue({
			ok: true,
			status: 200,
			json: async () => (result),
		} as Response);
	}

	async function testCaptchaError(code: CaptchaErrorCode, test: () => Promise<void>) {
		try {
			await test();
			expect(false).toBe(true);
		} catch (e) {
			expect(e instanceof CaptchaError).toBe(true);

			const _e = e as CaptchaError;
			expect(_e.code).toBe(code);
		}
	}

	describe('verifyRecaptcha', () => {
		test('success', async () => {
			successMock({ success: true });
			await service.verifyRecaptcha('secret', 'response');
		});

		test('noResponseProvided', async () => {
			await testCaptchaError(captchaErrorCodes.noResponseProvided, () => service.verifyRecaptcha('secret', null));
		});

		test('requestFailed', async () => {
			failureHttpMock();
			await testCaptchaError(captchaErrorCodes.requestFailed, () => service.verifyRecaptcha('secret', 'response'));
		});

		test('verificationFailed', async () => {
			failureVerificationMock({ success: false, 'error-codes': ['code01', 'code02'] });
			await testCaptchaError(captchaErrorCodes.verificationFailed, () => service.verifyRecaptcha('secret', 'response'));
		});
	});

	describe('verifyHcaptcha', () => {
		test('success', async () => {
			successMock({ success: true });
			await service.verifyHcaptcha('secret', 'response');
		});

		test('noResponseProvided', async () => {
			await testCaptchaError(captchaErrorCodes.noResponseProvided, () => service.verifyHcaptcha('secret', null));
		});

		test('requestFailed', async () => {
			failureHttpMock();
			await testCaptchaError(captchaErrorCodes.requestFailed, () => service.verifyHcaptcha('secret', 'response'));
		});

		test('verificationFailed', async () => {
			failureVerificationMock({ success: false, 'error-codes': ['code01', 'code02'] });
			await testCaptchaError(captchaErrorCodes.verificationFailed, () => service.verifyHcaptcha('secret', 'response'));
		});
	});

	describe('verifyMcaptcha', () => {
		const host = 'https://localhost';

		test('success', async () => {
			successMock({ valid: true });
			await service.verifyMcaptcha('secret', 'sitekey', host, 'response');
		});

		test('noResponseProvided', async () => {
			await testCaptchaError(captchaErrorCodes.noResponseProvided, () => service.verifyMcaptcha('secret', 'sitekey', host, null));
		});

		test('requestFailed', async () => {
			failureHttpMock();
			await testCaptchaError(captchaErrorCodes.requestFailed, () => service.verifyMcaptcha('secret', 'sitekey', host, 'response'));
		});

		test('verificationFailed', async () => {
			failureVerificationMock({ valid: false });
			await testCaptchaError(captchaErrorCodes.verificationFailed, () => service.verifyMcaptcha('secret', 'sitekey', host, 'response'));
		});
	});

	describe('verifyTurnstile', () => {
		test('success', async () => {
			successMock({ success: true });
			await service.verifyTurnstile('secret', 'response');
		});

		test('noResponseProvided', async () => {
			await testCaptchaError(captchaErrorCodes.noResponseProvided, () => service.verifyTurnstile('secret', null));
		});

		test('requestFailed', async () => {
			failureHttpMock();
			await testCaptchaError(captchaErrorCodes.requestFailed, () => service.verifyTurnstile('secret', 'response'));
		});

		test('verificationFailed', async () => {
			failureVerificationMock({ success: false, 'error-codes': ['code01', 'code02'] });
			await testCaptchaError(captchaErrorCodes.verificationFailed, () => service.verifyTurnstile('secret', 'response'));
		});
	});

	describe('verifyTestcaptcha', () => {
		test('success', async () => {
			await service.verifyTestcaptcha('testcaptcha-passed');
		});

		test('noResponseProvided', async () => {
			await testCaptchaError(captchaErrorCodes.noResponseProvided, () => service.verifyTestcaptcha(null));
		});

		test('verificationFailed', async () => {
			await testCaptchaError(captchaErrorCodes.verificationFailed, () => service.verifyTestcaptcha('testcaptcha-failed'));
		});
	});

	describe('get', () => {
		function setupMeta(meta: Partial<MiMeta>) {
			metaService.fetch.mockResolvedValue(meta as MiMeta);
		}

		test('values', async () => {
			setupMeta({
				enableHcaptcha: false,
				enableMcaptcha: false,
				enableRecaptcha: false,
				enableTurnstile: false,
				enableTestcaptcha: false,
				hcaptchaSiteKey: 'hcaptcha-sitekey',
				hcaptchaSecretKey: 'hcaptcha-secret',
				mcaptchaSitekey: 'mcaptcha-sitekey',
				mcaptchaSecretKey: 'mcaptcha-secret',
				mcaptchaInstanceUrl: 'https://localhost',
				recaptchaSiteKey: 'recaptcha-sitekey',
				recaptchaSecretKey: 'recaptcha-secret',
				turnstileSiteKey: 'turnstile-sitekey',
				turnstileSecretKey: 'turnstile-secret',
			});

			const result = await service.get();
			expect(result.provider).toBe('none');
			expect(result.hcaptcha.siteKey).toBe('hcaptcha-sitekey');
			expect(result.hcaptcha.secretKey).toBe('hcaptcha-secret');
			expect(result.mcaptcha.siteKey).toBe('mcaptcha-sitekey');
			expect(result.mcaptcha.secretKey).toBe('mcaptcha-secret');
			expect(result.mcaptcha.instanceUrl).toBe('https://localhost');
			expect(result.recaptcha.siteKey).toBe('recaptcha-sitekey');
			expect(result.recaptcha.secretKey).toBe('recaptcha-secret');
			expect(result.turnstile.siteKey).toBe('turnstile-sitekey');
			expect(result.turnstile.secretKey).toBe('turnstile-secret');
		});

		describe('provider', () => {
			test('none', async () => {
				setupMeta({
					enableHcaptcha: false,
					enableMcaptcha: false,
					enableRecaptcha: false,
					enableTurnstile: false,
					enableTestcaptcha: false,
				});

				const result = await service.get();
				expect(result.provider).toBe('none');
			});

			test('hcaptcha', async () => {
				setupMeta({
					enableHcaptcha: true,
					enableMcaptcha: false,
					enableRecaptcha: false,
					enableTurnstile: false,
					enableTestcaptcha: false,
				});

				const result = await service.get();
				expect(result.provider).toBe('hcaptcha');
			});

			test('mcaptcha', async () => {
				setupMeta({
					enableHcaptcha: false,
					enableMcaptcha: true,
					enableRecaptcha: false,
					enableTurnstile: false,
					enableTestcaptcha: false,
				});

				const result = await service.get();
				expect(result.provider).toBe('mcaptcha');
			});

			test('recaptcha', async () => {
				setupMeta({
					enableHcaptcha: false,
					enableMcaptcha: false,
					enableRecaptcha: true,
					enableTurnstile: false,
					enableTestcaptcha: false,
				});

				const result = await service.get();
				expect(result.provider).toBe('recaptcha');
			});

			test('turnstile', async () => {
				setupMeta({
					enableHcaptcha: false,
					enableMcaptcha: false,
					enableRecaptcha: false,
					enableTurnstile: true,
					enableTestcaptcha: false,
				});

				const result = await service.get();
				expect(result.provider).toBe('turnstile');
			});

			test('testcaptcha', async () => {
				setupMeta({
					enableHcaptcha: false,
					enableMcaptcha: false,
					enableRecaptcha: false,
					enableTurnstile: false,
					enableTestcaptcha: true,
				});

				const result = await service.get();
				expect(result.provider).toBe('testcaptcha');
			});
		});
	});

	describe('save', () => {
		const host = 'https://localhost';

		describe('[success] 検証に成功した時だけ保存できる＋他のプロバイダの設定値を誤って更新しない', () => {
			beforeEach(() => {
				successMock({ success: true, valid: true });
			});

			async function assertSuccess(promise: Promise<CaptchaSaveResult>, expectMeta: Partial<MiMeta>) {
				await expect(promise)
					.resolves
					.toStrictEqual({ success: true });
				const partialParams = metaService.update.mock.calls[0][0];
				expect(partialParams).toStrictEqual(expectMeta);
			}

			test('none', async () => {
				await assertSuccess(
					service.save('none'),
					{
						enableHcaptcha: false,
						enableMcaptcha: false,
						enableRecaptcha: false,
						enableTurnstile: false,
						enableTestcaptcha: false,
					},
				);
			});

			test('hcaptcha', async () => {
				await assertSuccess(
					service.save('hcaptcha', {
						sitekey: 'hcaptcha-sitekey',
						secret: 'hcaptcha-secret',
						captchaResult: 'hcaptcha-passed',
					}),
					{
						enableHcaptcha: true,
						enableMcaptcha: false,
						enableRecaptcha: false,
						enableTurnstile: false,
						enableTestcaptcha: false,
						hcaptchaSiteKey: 'hcaptcha-sitekey',
						hcaptchaSecretKey: 'hcaptcha-secret',
					},
				);
			});

			test('mcaptcha', async () => {
				await assertSuccess(
					service.save('mcaptcha', {
						sitekey: 'mcaptcha-sitekey',
						secret: 'mcaptcha-secret',
						instanceUrl: host,
						captchaResult: 'mcaptcha-passed',
					}),
					{
						enableHcaptcha: false,
						enableMcaptcha: true,
						enableRecaptcha: false,
						enableTurnstile: false,
						enableTestcaptcha: false,
						mcaptchaSitekey: 'mcaptcha-sitekey',
						mcaptchaSecretKey: 'mcaptcha-secret',
						mcaptchaInstanceUrl: host,
					},
				);
			});

			test('recaptcha', async () => {
				await assertSuccess(
					service.save('recaptcha', {
						sitekey: 'recaptcha-sitekey',
						secret: 'recaptcha-secret',
						captchaResult: 'recaptcha-passed',
					}),
					{
						enableHcaptcha: false,
						enableMcaptcha: false,
						enableRecaptcha: true,
						enableTurnstile: false,
						enableTestcaptcha: false,
						recaptchaSiteKey: 'recaptcha-sitekey',
						recaptchaSecretKey: 'recaptcha-secret',
					},
				);
			});

			test('turnstile', async () => {
				await assertSuccess(
					service.save('turnstile', {
						sitekey: 'turnstile-sitekey',
						secret: 'turnstile-secret',
						captchaResult: 'turnstile-passed',
					}),
					{
						enableHcaptcha: false,
						enableMcaptcha: false,
						enableRecaptcha: false,
						enableTurnstile: true,
						enableTestcaptcha: false,
						turnstileSiteKey: 'turnstile-sitekey',
						turnstileSecretKey: 'turnstile-secret',
					},
				);
			});

			test('testcaptcha', async () => {
				await assertSuccess(
					service.save('testcaptcha', {
						sitekey: 'testcaptcha-sitekey',
						secret: 'testcaptcha-secret',
						captchaResult: 'testcaptcha-passed',
					}),
					{
						enableHcaptcha: false,
						enableMcaptcha: false,
						enableRecaptcha: false,
						enableTurnstile: false,
						enableTestcaptcha: true,
					},
				);
			});
		});

		describe('[failure] 検証に失敗した場合は保存できない＋設定値の更新そのものが発生しない', () => {
			async function assertFailure(code: CaptchaErrorCode, promise: Promise<CaptchaSaveResult>) {
				const res = await promise;
				expect(res.success).toBe(false);
				if (!res.success) {
					expect(res.error.code).toBe(code);
				}
				expect(metaService.update).not.toBeCalled();
			}

			describe('invalidParameters', () => {
				test('hcaptcha', async () => {
					await assertFailure(
						captchaErrorCodes.invalidParameters,
						service.save('hcaptcha', {
							sitekey: 'hcaptcha-sitekey',
							secret: 'hcaptcha-secret',
							captchaResult: null,
						}),
					);
				});

				test('mcaptcha', async () => {
					await assertFailure(
						captchaErrorCodes.invalidParameters,
						service.save('mcaptcha', {
							sitekey: 'mcaptcha-sitekey',
							secret: 'mcaptcha-secret',
							instanceUrl: host,
							captchaResult: null,
						}),
					);
				});

				test('recaptcha', async () => {
					await assertFailure(
						captchaErrorCodes.invalidParameters,
						service.save('recaptcha', {
							sitekey: 'recaptcha-sitekey',
							secret: 'recaptcha-secret',
							captchaResult: null,
						}),
					);
				});

				test('turnstile', async () => {
					await assertFailure(
						captchaErrorCodes.invalidParameters,
						service.save('turnstile', {
							sitekey: 'turnstile-sitekey',
							secret: 'turnstile-secret',
							captchaResult: null,
						}),
					);
				});

				test('testcaptcha', async () => {
					await assertFailure(
						captchaErrorCodes.invalidParameters,
						service.save('testcaptcha', {
							captchaResult: null,
						}),
					);
				});
			});

			describe('requestFailed', () => {
				beforeEach(() => {
					failureHttpMock();
				});

				test('hcaptcha', async () => {
					await assertFailure(
						captchaErrorCodes.requestFailed,
						service.save('hcaptcha', {
							sitekey: 'hcaptcha-sitekey',
							secret: 'hcaptcha-secret',
							captchaResult: 'hcaptcha-passed',
						}),
					);
				});

				test('mcaptcha', async () => {
					await assertFailure(
						captchaErrorCodes.requestFailed,
						service.save('mcaptcha', {
							sitekey: 'mcaptcha-sitekey',
							secret: 'mcaptcha-secret',
							instanceUrl: host,
							captchaResult: 'mcaptcha-passed',
						}),
					);
				});

				test('recaptcha', async () => {
					await assertFailure(
						captchaErrorCodes.requestFailed,
						service.save('recaptcha', {
							sitekey: 'recaptcha-sitekey',
							secret: 'recaptcha-secret',
							captchaResult: 'recaptcha-passed',
						}),
					);
				});

				test('turnstile', async () => {
					await assertFailure(
						captchaErrorCodes.requestFailed,
						service.save('turnstile', {
							sitekey: 'turnstile-sitekey',
							secret: 'turnstile-secret',
							captchaResult: 'turnstile-passed',
						}),
					);
				});

				// testchapchaはrequestFailedがない
			});

			describe('verificationFailed', () => {
				beforeEach(() => {
					failureVerificationMock({ success: false, valid: false, 'error-codes': ['code01', 'code02'] });
				});

				test('hcaptcha', async () => {
					await assertFailure(
						captchaErrorCodes.verificationFailed,
						service.save('hcaptcha', {
							sitekey: 'hcaptcha-sitekey',
							secret: 'hcaptcha-secret',
							captchaResult: 'hccaptcha-passed',
						}),
					);
				});

				test('mcaptcha', async () => {
					await assertFailure(
						captchaErrorCodes.verificationFailed,
						service.save('mcaptcha', {
							sitekey: 'mcaptcha-sitekey',
							secret: 'mcaptcha-secret',
							instanceUrl: host,
							captchaResult: 'mcaptcha-passed',
						}),
					);
				});

				test('recaptcha', async () => {
					await assertFailure(
						captchaErrorCodes.verificationFailed,
						service.save('recaptcha', {
							sitekey: 'recaptcha-sitekey',
							secret: 'recaptcha-secret',
							captchaResult: 'recaptcha-passed',
						}),
					);
				});

				test('turnstile', async () => {
					await assertFailure(
						captchaErrorCodes.verificationFailed,
						service.save('turnstile', {
							sitekey: 'turnstile-sitekey',
							secret: 'turnstile-secret',
							captchaResult: 'turnstile-passed',
						}),
					);
				});

				test('testcaptcha', async () => {
					await assertFailure(
						captchaErrorCodes.verificationFailed,
						service.save('testcaptcha', {
							captchaResult: 'testcaptcha-failed',
						}),
					);
				});
			});
		});
	});
});
