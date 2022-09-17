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
