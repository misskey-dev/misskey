/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import type Logger from '@/logger.js';
import { bindThis } from '@/decorators.js';
import { UserMutingService } from '@/core/UserMutingService.js';
import { QueueLoggerService } from '../QueueLoggerService.js';
import type * as Bull from 'bullmq';
import type { DeleteUserMutingsJobData } from '../types.js';

@Injectable()
export class DeleteUserMutingsProcessorService {
	private logger: Logger;

	constructor(
		private userMutingService: UserMutingService,
		private queueLoggerService: QueueLoggerService,
	) {
		this.logger = this.queueLoggerService.logger.createSubLogger('delete-user-mutings');
	}

	@bindThis
	public async process(job: Bull.Job<DeleteUserMutingsJobData>): Promise<void> {
		await this.userMutingService.unmuteById(job.data.mutingId);
	}
}
