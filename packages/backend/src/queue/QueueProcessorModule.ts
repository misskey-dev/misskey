import { Module } from '@nestjs/common';
import { CoreModule } from '@/services/CoreModule.js';
import { QueueLoggerService } from './QueueLoggerService.js';
import { QueueProcessorService } from './QueueProcessorService.js';
import { DbQueueProcessorsService } from './DbQueueProcessorsService.js';
import { ObjectStorageQueueProcessorsService } from './ObjectStorageQueueProcessorsService.js';
import { DeliverProcessorService } from './processors/DeliverProcessorService.js';
import { EndedPollNotificationProcessorService } from './processors/EndedPollNotificationProcessorService.js';
import { InboxProcessorService } from './processors/InboxProcessorService.js';
import { WebhookDeliverProcessorService } from './processors/WebhookDeliverProcessorService.js';
import { SystemQueueProcessorsService } from './SystemQueueProcessorsService.js';

@Module({
	imports: [
		CoreModule,
	],
	providers: [
		QueueLoggerService,
		SystemQueueProcessorsService,
		ObjectStorageQueueProcessorsService,
		DbQueueProcessorsService,
		WebhookDeliverProcessorService,
		EndedPollNotificationProcessorService,
		DeliverProcessorService,
		InboxProcessorService,
		QueueProcessorService,
	],
	exports: [
		QueueProcessorService,
	],
})
export class QueueProcessorModule {}
