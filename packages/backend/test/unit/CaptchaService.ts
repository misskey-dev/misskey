import { afterAll, beforeAll, beforeEach, describe, expect, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'node-fetch';
import {
	CaptchaError,
	CaptchaErrorCode,
	captchaErrorCodes,
	CaptchaService,
	ValidateResult,
} from '@/core/CaptchaService.js';
import { GlobalModule } from '@/GlobalModule.js';
import { HttpRequestService } from '@/core/HttpRequestService.js';

describe('CaptchaService', () => {
	let app: TestingModule;
	let service: CaptchaService;
	let httpRequestService: jest.Mocked<HttpRequestService>;

	beforeAll(async () => {
		app = await Test.createTestingModule({
			imports: [
				GlobalModule,
			],
			providers: [
				CaptchaService,
				{
					provide: HttpRequestService, useFactory: () => ({ send: jest.fn() }),
				},
			],
		}).compile();

		app.enableShutdownHooks();

		service = app.get(CaptchaService);
		httpRequestService = app.get(HttpRequestService) as jest.Mocked<HttpRequestService>;
	});

	beforeEach(() => {
		httpRequestService.send.mockClear();
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
			console.log(e);
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

	describe('validateSettings', () => {
		const host = 'https://localhost';

		describe('success', () => {
			beforeEach(() => {
				successMock({ success: true, valid: true });
			});

			async function assertSuccess(promise: Promise<ValidateResult>) {
				await expect(promise)
					.resolves
					.toStrictEqual({ success: true });
			}

			test('hcaptcha', async () => {
				await assertSuccess(service.verify({ provider: 'hcaptcha', secret: 'secret', captchaResult: 'response' }));
			});

			test('mcaptcha', async () => {
				await assertSuccess(service.verify({
					provider: 'mcaptcha',
					secret: 'secret',
					sitekey: 'sitekey',
					instanceUrl: host,
					captchaResult: 'response',
				}));
			});

			test('recaptcha', async () => {
				await assertSuccess(service.verify({ provider: 'recaptcha', secret: 'secret', captchaResult: 'response' }));
			});

			test('turnstile', async () => {
				await assertSuccess(service.verify({ provider: 'turnstile', secret: 'secret', captchaResult: 'response' }));
			});

			test('testcaptcha', async () => {
				await assertSuccess(service.verify({ provider: 'testcaptcha', captchaResult: 'testcaptcha-passed' }));
			});
		});

		describe('failure', () => {
			async function assertFailure(code: CaptchaErrorCode, promise: Promise<ValidateResult>) {
				const res = await promise;
				expect(res.success).toBe(false);
				if (!res.success) {
					expect(res.error.code).toBe(code);
				}
			}

			describe('noResponseProvided', () => {
				test('hcaptcha', async () => {
					await assertFailure(captchaErrorCodes.noResponseProvided, service.verify({ provider: 'hcaptcha', secret: 'secret', captchaResult: null }));
				});

				test('mcaptcha', async () => {
					await assertFailure(captchaErrorCodes.noResponseProvided, service.verify({
						provider: 'mcaptcha',
						secret: 'secret',
						sitekey: 'sitekey',
						instanceUrl: host,
						captchaResult: null,
					}));
				});

				test('recaptcha', async () => {
					await assertFailure(captchaErrorCodes.noResponseProvided, service.verify({ provider: 'recaptcha', secret: 'secret', captchaResult: null }));
				});

				test('turnstile', async () => {
					await assertFailure(captchaErrorCodes.noResponseProvided, service.verify({ provider: 'turnstile', secret: 'secret', captchaResult: null }));
				});

				test('testcaptcha', async () => {
					await assertFailure(captchaErrorCodes.noResponseProvided, service.verify({ provider: 'testcaptcha', captchaResult: null }));
				});
			});

			describe('requestFailed', () => {
				beforeEach(() => {
					failureHttpMock();
				});

				test('hcaptcha', async () => {
					await assertFailure(captchaErrorCodes.requestFailed, service.verify({ provider: 'hcaptcha', secret: 'secret', captchaResult: 'res' }));
				});

				test('mcaptcha', async () => {
					await assertFailure(captchaErrorCodes.requestFailed, service.verify({
						provider: 'mcaptcha',
						secret: 'secret',
						sitekey: 'sitekey',
						instanceUrl: host,
						captchaResult: 'res',
					}));
				});

				test('recaptcha', async () => {
					await assertFailure(captchaErrorCodes.requestFailed, service.verify({ provider: 'recaptcha', secret: 'secret', captchaResult: 'res' }));
				});

				test('turnstile', async () => {
					await assertFailure(captchaErrorCodes.requestFailed, service.verify({ provider: 'turnstile', secret: 'secret', captchaResult: 'res' }));
				});

				// testcaptchaはrequestFailedが発生しない
				// test('testcaptcha', () => {});
			});

			describe('verificationFailed', () => {
				beforeEach(() => {
					failureVerificationMock({ success: false, valid: false, 'error-codes': ['code01', 'code02'] });
				});

				test('hcaptcha', async () => {
					await assertFailure(captchaErrorCodes.verificationFailed, service.verify({ provider: 'hcaptcha', secret: 'secret', captchaResult: 'res' }));
				});

				test('mcaptcha', async () => {
					await assertFailure(captchaErrorCodes.verificationFailed, service.verify({
						provider: 'mcaptcha',
						secret: 'secret',
						sitekey: 'sitekey',
						instanceUrl: host,
						captchaResult: 'res',
					}));
				});

				test('recaptcha', async () => {
					await assertFailure(captchaErrorCodes.verificationFailed, service.verify({ provider: 'recaptcha', secret: 'secret', captchaResult: 'res' }));
				});

				test('turnstile', async () => {
					await assertFailure(captchaErrorCodes.verificationFailed, service.verify({ provider: 'turnstile', secret: 'secret', captchaResult: 'res' }));
				});

				test('testcaptcha', async () => {
					await assertFailure(captchaErrorCodes.verificationFailed, service.verify({ provider: 'testcaptcha', captchaResult: 'testcaptcha-failed' }));
				});
			});
		});
	});
});
