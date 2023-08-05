/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Module } from '@nestjs/common';
import { CoreModule } from '@/core/CoreModule.js';
import { GlobalModule } from '@/GlobalModule.js';
import { JanitorService } from './JanitorService.js';
import { QueueStatsService } from './QueueStatsService.js';
import { ServerStatsService } from './ServerStatsService.js';

@Module({
	imports: [
		GlobalModule,
		CoreModule,
	],
	providers: [
		JanitorService,
		QueueStatsService,
		ServerStatsService,
	],
	exports: [
		JanitorService,
		QueueStatsService,
		ServerStatsService,
	],
})
export class DaemonModule {}
