/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import * as Bull from 'bullmq';
import type Logger from '@/logger.js';
import { QueueLoggerService } from '@/queue/QueueLoggerService.js';
import { MailDeliverJobData } from '@/queue/types.js';
import { EmailService } from '@/core/EmailService.js';
import { bindThis } from '@/decorators.js';

@Injectable()
export class MailDeliverProcessorService {
	private logger: Logger;

	constructor(
		private emailService: EmailService,
		private queueLoggerService: QueueLoggerService,
	) {
		this.logger = this.queueLoggerService.logger.createSubLogger('webhook');
	}

	@bindThis
	public async process(job: Bull.Job<MailDeliverJobData>): Promise<string> {
		try {
			await this.emailService.sendEmail(job.data.to, job.data.subject, job.data.html, job.data.text);
			return 'Success';
		} catch (e) {
			this.logger.error(e as Error);
			throw e;
		}
	}
}
