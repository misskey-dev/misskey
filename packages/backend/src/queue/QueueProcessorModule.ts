import { Module } from '@nestjs/common';
import { CoreModule } from '@/core/CoreModule.js';
import { GlobalModule } from '@/GlobalModule.js';
import { QueueLoggerService } from './QueueLoggerService.js';
import { QueueProcessorService } from './QueueProcessorService.js';
import { DbQueueProcessorsService } from './DbQueueProcessorsService.js';
import { ObjectStorageQueueProcessorsService } from './ObjectStorageQueueProcessorsService.js';
import { DeliverProcessorService } from './processors/DeliverProcessorService.js';
import { EndedPollNotificationProcessorService } from './processors/EndedPollNotificationProcessorService.js';
import { InboxProcessorService } from './processors/InboxProcessorService.js';
import { WebhookDeliverProcessorService } from './processors/WebhookDeliverProcessorService.js';
import { SystemQueueProcessorsService } from './SystemQueueProcessorsService.js';
import { CheckExpiredMutingsProcessorService } from './processors/CheckExpiredMutingsProcessorService.js';
import { CleanChartsProcessorService } from './processors/CleanChartsProcessorService.js';
import { CleanProcessorService } from './processors/CleanProcessorService.js';
import { CleanRemoteFilesProcessorService } from './processors/CleanRemoteFilesProcessorService.js';
import { DeleteAccountProcessorService } from './processors/DeleteAccountProcessorService.js';
import { DeleteDriveFilesProcessorService } from './processors/DeleteDriveFilesProcessorService.js';
import { DeleteFileProcessorService } from './processors/DeleteFileProcessorService.js';
import { ExportBlockingProcessorService } from './processors/ExportBlockingProcessorService.js';
import { ExportCustomEmojisProcessorService } from './processors/ExportCustomEmojisProcessorService.js';
import { ExportFollowingProcessorService } from './processors/ExportFollowingProcessorService.js';
import { ExportMutingProcessorService } from './processors/ExportMutingProcessorService.js';
import { ExportNotesProcessorService } from './processors/ExportNotesProcessorService.js';
import { ExportUserListsProcessorService } from './processors/ExportUserListsProcessorService.js';
import { ImportBlockingProcessorService } from './processors/ImportBlockingProcessorService.js';
import { ImportCustomEmojisProcessorService } from './processors/ImportCustomEmojisProcessorService.js';
import { ImportFollowingProcessorService } from './processors/ImportFollowingProcessorService.js';
import { ImportMutingProcessorService } from './processors/ImportMutingProcessorService.js';
import { ImportUserListsProcessorService } from './processors/ImportUserListsProcessorService.js';
import { ResyncChartsProcessorService } from './processors/ResyncChartsProcessorService.js';
import { TickChartsProcessorService } from './processors/TickChartsProcessorService.js';
import { AggregateRetentionProcessorService } from './processors/AggregateRetentionProcessorService.js';
import { ExportFavoritesProcessorService } from './processors/ExportFavoritesProcessorService.js';

@Module({
	imports: [
		GlobalModule,
		CoreModule,
	],
	providers: [
		QueueLoggerService,
		TickChartsProcessorService,
		ResyncChartsProcessorService,
		CleanChartsProcessorService,
		CheckExpiredMutingsProcessorService,
		CleanProcessorService,
		DeleteDriveFilesProcessorService,
		ExportCustomEmojisProcessorService,
		ExportNotesProcessorService,
		ExportFavoritesProcessorService,
		ExportFollowingProcessorService,
		ExportMutingProcessorService,
		ExportBlockingProcessorService,
		ExportUserListsProcessorService,
		ImportFollowingProcessorService,
		ImportMutingProcessorService,
		ImportBlockingProcessorService,
		ImportUserListsProcessorService,
		ImportCustomEmojisProcessorService,
		DeleteAccountProcessorService,
		DeleteFileProcessorService,
		CleanRemoteFilesProcessorService,
		SystemQueueProcessorsService,
		ObjectStorageQueueProcessorsService,
		DbQueueProcessorsService,
		WebhookDeliverProcessorService,
		EndedPollNotificationProcessorService,
		DeliverProcessorService,
		InboxProcessorService,
		AggregateRetentionProcessorService,
		QueueProcessorService,
	],
	exports: [
		QueueProcessorService,
	],
})
export class QueueProcessorModule {}
