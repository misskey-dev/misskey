/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { bindThis } from '@/decorators.js';
import { MetaService } from '@/core/MetaService.js';
import { QueueService } from '@/core/QueueService.js';
import type { SearchIndexMaintenanceRequest } from '@/queue/types.js';

@Injectable()
export class CommandService {
	constructor(
		private metaService: MetaService,
		private queueService: QueueService,
	) {
	}

	@bindThis
	public async ping() {
		console.log('pong');
	}

	@bindThis
	public async resetCaptcha() {
		await this.metaService.update({
			enableHcaptcha: false,
			hcaptchaSiteKey: null,
			hcaptchaSecretKey: null,
			enableMcaptcha: false,
			mcaptchaSitekey: null,
			mcaptchaSecretKey: null,
			mcaptchaInstanceUrl: null,
			enableRecaptcha: false,
			recaptchaSiteKey: null,
			recaptchaSecretKey: null,
			enableTurnstile: false,
			turnstileSiteKey: null,
			turnstileSecretKey: null,
			enableTestcaptcha: false,
		});
	}

	@bindThis
	public async enqueueSearchIndexMaintenance(request: SearchIndexMaintenanceRequest) {
		const { jobId } = await this.queueService.enqueueSearchIndexMaintenance(request, null);
		console.log(`Meilisearch maintenance job queued: ${jobId}`);
	}
}
