import { Module } from '@nestjs/common';
import { CoreModule } from '@/services/CoreModule.js';
import { QueueLoggerService } from './QueueLoggerService.js';
import { QueueProcessorService } from './QueueProcessorService.js';

@Module({
	imports: [
		CoreModule,
	],
	providers: [
		QueueLoggerService,
		QueueProcessorService,
	],
	exports: [
		QueueProcessorService,
	],
})
export class QueueProcessorModule {}
