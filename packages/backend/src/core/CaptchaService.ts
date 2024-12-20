/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { HttpRequestService } from '@/core/HttpRequestService.js';
import { bindThis } from '@/decorators.js';

export const supportedCaptchaProviders = ['hcaptcha', 'mcaptcha', 'recaptcha', 'turnstile', 'testcaptcha'] as const;
export type CaptchaProvider = typeof supportedCaptchaProviders[number];

export const captchaErrorCodes = {
	invalidProvider: Symbol('invalidProvider'),
	invalidParameters: Symbol('invalidParameters'),
	noResponseProvided: Symbol('noResponseProvided'),
	requestFailed: Symbol('requestFailed'),
	verificationFailed: Symbol('verificationFailed'),
	unknown: Symbol('unknown'),
} as const;
export type CaptchaErrorCode = typeof captchaErrorCodes[keyof typeof captchaErrorCodes];

export class CaptchaError extends Error {
	public readonly code: CaptchaErrorCode;

	constructor(code: CaptchaErrorCode, message: string) {
		super(message);
		this.code = code;
		this.name = 'CaptchaError';
	}
}

export type ValidateSuccess = {
	success: true;
}
export type ValidateFailure = {
	success: false;
	error: CaptchaError;
}
export type ValidateResult = ValidateSuccess | ValidateFailure;

type CaptchaResponse = {
	success: boolean;
	'error-codes'?: string[];
};

@Injectable()
export class CaptchaService {
	constructor(
		private httpRequestService: HttpRequestService,
	) {
	}

	@bindThis
	private async getCaptchaResponse(url: string, secret: string, response: string): Promise<CaptchaResponse> {
		const params = new URLSearchParams({
			secret,
			response,
		});

		const res = await this.httpRequestService.send(url, {
			method: 'POST',
			body: params.toString(),
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
		}, { throwErrorWhenResponseNotOk: false });

		if (!res.ok) {
			throw new Error(`${res.status}`);
		}

		return await res.json() as CaptchaResponse;
	}

	@bindThis
	public async verifyRecaptcha(secret: string, response: string | null | undefined): Promise<void> {
		if (response == null) {
			throw new CaptchaError(captchaErrorCodes.noResponseProvided, 'recaptcha-failed: no response provided');
		}

		const result = await this.getCaptchaResponse('https://www.recaptcha.net/recaptcha/api/siteverify', secret, response).catch(err => {
			throw new CaptchaError(captchaErrorCodes.requestFailed, `recaptcha-request-failed: ${err}`);
		});

		if (result.success !== true) {
			const errorCodes = result['error-codes'] ? result['error-codes'].join(', ') : '';
			throw new CaptchaError(captchaErrorCodes.verificationFailed, `recaptcha-failed: ${errorCodes}`);
		}
	}

	@bindThis
	public async verifyHcaptcha(secret: string, response: string | null | undefined): Promise<void> {
		if (response == null) {
			throw new CaptchaError(captchaErrorCodes.noResponseProvided, 'hcaptcha-failed: no response provided');
		}

		const result = await this.getCaptchaResponse('https://hcaptcha.com/siteverify', secret, response).catch(err => {
			throw new CaptchaError(captchaErrorCodes.requestFailed, `hcaptcha-request-failed: ${err}`);
		});

		if (result.success !== true) {
			const errorCodes = result['error-codes'] ? result['error-codes'].join(', ') : '';
			throw new CaptchaError(captchaErrorCodes.verificationFailed, `hcaptcha-failed: ${errorCodes}`);
		}
	}

	// https://codeberg.org/Gusted/mCaptcha/src/branch/main/mcaptcha.go
	@bindThis
	public async verifyMcaptcha(secret: string, siteKey: string, instanceHost: string, response: string | null | undefined): Promise<void> {
		if (response == null) {
			throw new CaptchaError(captchaErrorCodes.noResponseProvided, 'mcaptcha-failed: no response provided');
		}

		const endpointUrl = new URL('/api/v1/pow/siteverify', instanceHost);
		const result = await this.httpRequestService.send(endpointUrl.toString(), {
			method: 'POST',
			body: JSON.stringify({
				key: siteKey,
				secret: secret,
				token: response,
			}),
			headers: {
				'Content-Type': 'application/json',
			},
		});

		if (result.status !== 200) {
			throw new CaptchaError(captchaErrorCodes.requestFailed, 'mcaptcha-failed: mcaptcha didn\'t return 200 OK');
		}

		const resp = (await result.json()) as { valid: boolean };

		if (!resp.valid) {
			throw new CaptchaError(captchaErrorCodes.verificationFailed, 'mcaptcha-request-failed');
		}
	}

	@bindThis
	public async verifyTurnstile(secret: string, response: string | null | undefined): Promise<void> {
		if (response == null) {
			throw new CaptchaError(captchaErrorCodes.noResponseProvided, 'turnstile-failed: no response provided');
		}

		const result = await this.getCaptchaResponse('https://challenges.cloudflare.com/turnstile/v0/siteverify', secret, response).catch(err => {
			throw new CaptchaError(captchaErrorCodes.requestFailed, `turnstile-request-failed: ${err}`);
		});

		if (result.success !== true) {
			const errorCodes = result['error-codes'] ? result['error-codes'].join(', ') : '';
			throw new CaptchaError(captchaErrorCodes.verificationFailed, `turnstile-failed: ${errorCodes}`);
		}
	}

	@bindThis
	public async verifyTestcaptcha(response: string | null | undefined): Promise<void> {
		if (response == null) {
			throw new CaptchaError(captchaErrorCodes.noResponseProvided, 'testcaptcha-failed: no response provided');
		}

		const success = response === 'testcaptcha-passed';

		if (!success) {
			throw new CaptchaError(captchaErrorCodes.verificationFailed, 'testcaptcha-failed');
		}
	}

	/**
	 * フロントエンド側で受け取ったcaptchaからの戻り値を検証します.
	 * 実際の検証処理はサービス内で定義されている各captchaプロバイダの検証関数に委譲します.
	 *
	 * @param params
	 * @param params.provider 検証するcaptchaのプロバイダ
	 * @param params.sitekey mcaptchaの場合に指定するsitekey. それ以外のプロバイダでは無視されます
	 * @param params.secret hcaptcha, recaptcha, turnstile, mcaptchaの場合に指定するsecret. それ以外のプロバイダでは無視されます
	 * @param params.instanceUrl mcaptchaの場合に指定するインスタンスのURL. それ以外のプロバイダでは無視されます
	 * @param params.captchaResult フロントエンド側で受け取ったcaptchaプロバイダからの戻り値. この値を使ってサーバサイドでの検証を行います
	 *
	 * @see verifyHcaptcha
	 * @see verifyMcaptcha
	 * @see verifyRecaptcha
	 * @see verifyTurnstile
	 * @see verifyTestcaptcha
	 */
	@bindThis
	public async verify(params: {
		provider: CaptchaProvider;
		sitekey?: string;
		secret?: string;
		instanceUrl?: string;
		captchaResult?: string | null;
	}): Promise<ValidateResult> {
		if (!supportedCaptchaProviders.includes(params.provider)) {
			return {
				success: false,
				error: new CaptchaError(captchaErrorCodes.invalidProvider, `Invalid captcha provider: ${params.provider}`),
			};
		}

		const operation = {
			hcaptcha: async () => {
				if (!params.secret) {
					throw new CaptchaError(captchaErrorCodes.invalidParameters, 'hcaptcha-failed: secret and response are required');
				}

				return this.verifyHcaptcha(params.secret, params.captchaResult);
			},
			mcaptcha: async () => {
				if (!params.secret || !params.sitekey || !params.instanceUrl) {
					throw new CaptchaError(captchaErrorCodes.invalidParameters, 'mcaptcha-failed: secret, sitekey, instanceUrl and response are required');
				}

				return this.verifyMcaptcha(params.secret, params.sitekey, params.instanceUrl, params.captchaResult);
			},
			recaptcha: async () => {
				if (!params.secret) {
					throw new CaptchaError(captchaErrorCodes.invalidParameters, 'recaptcha-failed: secret and response are required');
				}

				return this.verifyRecaptcha(params.secret, params.captchaResult);
			},
			turnstile: async () => {
				if (!params.secret) {
					throw new CaptchaError(captchaErrorCodes.invalidParameters, 'turnstile-failed: secret and response are required');
				}

				return this.verifyTurnstile(params.secret, params.captchaResult);
			},
			testcaptcha: async () => {
				return this.verifyTestcaptcha(params.captchaResult);
			},
		}[params.provider];

		return operation()
			.then(() => ({ success: true }) as ValidateSuccess)
			.catch(err => {
				const error = err instanceof CaptchaError
					? err
					: new CaptchaError(captchaErrorCodes.unknown, `unknown error: ${err}`);
				return {
					success: false,
					error,
				};
			});
	}
}

