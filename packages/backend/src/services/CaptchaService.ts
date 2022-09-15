import { Inject, Injectable } from '@nestjs/common';
import { DI_SYMBOLS } from '@/di-symbols.js';
import type { Users } from '@/models/index.js';
import { Config } from '@/config.js';
import { HttpRequestService } from './HttpRequestService.js';

type CaptchaResponse = {
	success: boolean;
	'error-codes'?: string[];
};

@Injectable()
export class CaptchaService {
	constructor(
		@Inject(DI_SYMBOLS.config)
		private config: Config,

		private httpRequestService: HttpRequestService,
	) {
	}

	async #getCaptchaResponse(url: string, secret: string, response: string): Promise<CaptchaResponse> {
		const params = new URLSearchParams({
			secret,
			response,
		});
	
		const res = await fetch(url, {
			method: 'POST',
			body: params,
			headers: {
				'User-Agent': this.config.userAgent,
			},
			// TODO
			//timeout: 10 * 1000,
			agent: (url, bypassProxy) => this.httpRequestService.getAgentByUrl(url, bypassProxy),
		}).catch(e => {
			throw `${e.message || e}`;
		});
	
		if (!res.ok) {
			throw `${res.status}`;
		}
	
		return await res.json() as CaptchaResponse;
	}	
	
	public async verifyRecaptcha(secret: string, response: string): Promise<void> {
		const result = await this.#getCaptchaResponse('https://www.recaptcha.net/recaptcha/api/siteverify', secret, response).catch(e => {
			throw `recaptcha-request-failed: ${e}`;
		});

		if (result.success !== true) {
			const errorCodes = result['error-codes'] ? result['error-codes'].join(', ') : '';
			throw `recaptcha-failed: ${errorCodes}`;
		}
	}

	public async verifyHcaptcha(secret: string, response: string): Promise<void> {
		const result = await this.#getCaptchaResponse('https://hcaptcha.com/siteverify', secret, response).catch(e => {
			throw `hcaptcha-request-failed: ${e}`;
		});

		if (result.success !== true) {
			const errorCodes = result['error-codes'] ? result['error-codes'].join(', ') : '';
			throw `hcaptcha-failed: ${errorCodes}`;
		}
	}
}

