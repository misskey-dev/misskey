import { Injectable } from '@nestjs/common';
import { HttpRequestService } from '@/core/HttpRequestService.js';
import { bindThis } from '@/decorators.js';

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
			throw `${res.status}`;
		}
	
		return await res.json() as CaptchaResponse;
	}	
	
	@bindThis
	public async verifyRecaptcha(secret: string, response: string | null | undefined): Promise<void> {
		if (response == null) {
			throw 'recaptcha-failed: no response provided';
		}

		const result = await this.getCaptchaResponse('https://www.recaptcha.net/recaptcha/api/siteverify', secret, response).catch(err => {
			throw `recaptcha-request-failed: ${err}`;
		});

		if (result.success !== true) {
			const errorCodes = result['error-codes'] ? result['error-codes'].join(', ') : '';
			throw `recaptcha-failed: ${errorCodes}`;
		}
	}

	@bindThis
	public async verifyHcaptcha(secret: string, response: string | null | undefined): Promise<void> {
		if (response == null) {
			throw 'hcaptcha-failed: no response provided';
		}

		const result = await this.getCaptchaResponse('https://hcaptcha.com/siteverify', secret, response).catch(err => {
			throw `hcaptcha-request-failed: ${err}`;
		});

		if (result.success !== true) {
			const errorCodes = result['error-codes'] ? result['error-codes'].join(', ') : '';
			throw `hcaptcha-failed: ${errorCodes}`;
		}
	}

	@bindThis
	public async verifyTurnstile(secret: string, response: string | null | undefined): Promise<void> {
		if (response == null) {
			throw 'turnstile-failed: no response provided';
		}
	
		const result = await this.getCaptchaResponse('https://challenges.cloudflare.com/turnstile/v0/siteverify', secret, response).catch(err => {
			throw `turnstile-request-failed: ${err}`;
		});

		if (result.success !== true) {
			const errorCodes = result['error-codes'] ? result['error-codes'].join(', ') : '';
			throw `turnstile-failed: ${errorCodes}`;
		}
	}
}

