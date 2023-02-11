import { Ctor, IServiceCollection, addSingletonCtor } from 'yohira';
import { DI } from '@/di-symbols.js';
import { DbQueueProcessorsService } from '@/queue/DbQueueProcessorsService.js';
import { ObjectStorageQueueProcessorsService } from '@/queue/ObjectStorageQueueProcessorsService.js';
import { QueueLoggerService } from '@/queue/QueueLoggerService.js';
import { QueueProcessorService } from '@/queue/QueueProcessorService.js';
import { SystemQueueProcessorsService } from '@/queue/SystemQueueProcessorsService.js';
import { AggregateRetentionProcessorService } from '@/queue/processors/AggregateRetentionProcessorService.js';
import { CheckExpiredMutingsProcessorService } from '@/queue/processors/CheckExpiredMutingsProcessorService.js';
import { CleanChartsProcessorService } from '@/queue/processors/CleanChartsProcessorService.js';
import { CleanProcessorService } from '@/queue/processors/CleanProcessorService.js';
import { CleanRemoteFilesProcessorService } from '@/queue/processors/CleanRemoteFilesProcessorService.js';
import { DeleteAccountProcessorService } from '@/queue/processors/DeleteAccountProcessorService.js';
import { DeleteDriveFilesProcessorService } from '@/queue/processors/DeleteDriveFilesProcessorService.js';
import { DeleteFileProcessorService } from '@/queue/processors/DeleteFileProcessorService.js';
import { DeliverProcessorService } from '@/queue/processors/DeliverProcessorService.js';
import { EndedPollNotificationProcessorService } from '@/queue/processors/EndedPollNotificationProcessorService.js';
import { ExportBlockingProcessorService } from '@/queue/processors/ExportBlockingProcessorService.js';
import { ExportCustomEmojisProcessorService } from '@/queue/processors/ExportCustomEmojisProcessorService.js';
import { ExportFavoritesProcessorService } from '@/queue/processors/ExportFavoritesProcessorService.js';
import { ExportFollowingProcessorService } from '@/queue/processors/ExportFollowingProcessorService.js';
import { ExportMutingProcessorService } from '@/queue/processors/ExportMutingProcessorService.js';
import { ExportNotesProcessorService } from '@/queue/processors/ExportNotesProcessorService.js';
import { ExportUserListsProcessorService } from '@/queue/processors/ExportUserListsProcessorService.js';
import { ImportBlockingProcessorService } from '@/queue/processors/ImportBlockingProcessorService.js';
import { ImportCustomEmojisProcessorService } from '@/queue/processors/ImportCustomEmojisProcessorService.js';
import { ImportFollowingProcessorService } from '@/queue/processors/ImportFollowingProcessorService.js';
import { ImportMutingProcessorService } from '@/queue/processors/ImportMutingProcessorService.js';
import { ImportUserListsProcessorService } from '@/queue/processors/ImportUserListsProcessorService.js';
import { InboxProcessorService } from '@/queue/processors/InboxProcessorService.js';
import { ResyncChartsProcessorService } from '@/queue/processors/ResyncChartsProcessorService.js';
import { TickChartsProcessorService } from '@/queue/processors/TickChartsProcessorService.js';
import { WebhookDeliverProcessorService } from '@/queue/processors/WebhookDeliverProcessorService.js';

const QueueProcessorServices: readonly (readonly [symbol, Ctor<object>])[] = [
	[DI.QueueLoggerService, QueueLoggerService],
	[DI.TickChartsProcessorService, TickChartsProcessorService],
	[DI.ResyncChartsProcessorService, ResyncChartsProcessorService],
	[DI.CleanChartsProcessorService, CleanChartsProcessorService],
	[DI.CheckExpiredMutingsProcessorService, CheckExpiredMutingsProcessorService],
	[DI.CleanProcessorService, CleanProcessorService],
	[DI.DeleteDriveFilesProcessorService, DeleteDriveFilesProcessorService],
	[DI.ExportCustomEmojisProcessorService, ExportCustomEmojisProcessorService],
	[DI.ExportNotesProcessorService, ExportNotesProcessorService],
	[DI.ExportFavoritesProcessorService, ExportFavoritesProcessorService],
	[DI.ExportFollowingProcessorService, ExportFollowingProcessorService],
	[DI.ExportMutingProcessorService, ExportMutingProcessorService],
	[DI.ExportBlockingProcessorService, ExportBlockingProcessorService],
	[DI.ExportUserListsProcessorService, ExportUserListsProcessorService],
	[DI.ImportFollowingProcessorService, ImportFollowingProcessorService],
	[DI.ImportMutingProcessorService, ImportMutingProcessorService],
	[DI.ImportBlockingProcessorService, ImportBlockingProcessorService],
	[DI.ImportUserListsProcessorService, ImportUserListsProcessorService],
	[DI.ImportCustomEmojisProcessorService, ImportCustomEmojisProcessorService],
	[DI.DeleteAccountProcessorService, DeleteAccountProcessorService],
	[DI.DeleteFileProcessorService, DeleteFileProcessorService],
	[DI.CleanRemoteFilesProcessorService, CleanRemoteFilesProcessorService],
	[DI.SystemQueueProcessorsService, SystemQueueProcessorsService],
	[DI.ObjectStorageQueueProcessorsService, ObjectStorageQueueProcessorsService],
	[DI.DbQueueProcessorsService, DbQueueProcessorsService],
	[DI.WebhookDeliverProcessorService, WebhookDeliverProcessorService],
	[DI.EndedPollNotificationProcessorService, EndedPollNotificationProcessorService],
	[DI.DeliverProcessorService, DeliverProcessorService],
	[DI.InboxProcessorService, InboxProcessorService],
	[DI.AggregateRetentionProcessorService, AggregateRetentionProcessorService],
	[DI.QueueProcessorService, QueueProcessorService],
];

export function addQueueProcessorServices(services: IServiceCollection): void {
	for (const [serviceType, implCtor] of QueueProcessorServices) {
		addSingletonCtor(services, serviceType, implCtor);
	}
}
