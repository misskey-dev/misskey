/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Module } from '@nestjs/common';
import { CoreModule } from '@/core/CoreModule.js';
import { GlobalModule } from '@/GlobalModule.js';
import { AggregateRetentionProcessorService } from './processors/AggregateRetentionProcessorService.js';
import { BakeBufferedReactionsProcessorService } from './processors/BakeBufferedReactionsProcessorService.js';
import { CheckExpiredMutingsProcessorService } from './processors/CheckExpiredMutingsProcessorService.js';
import { CheckModeratorsActivityProcessorService } from './processors/CheckModeratorsActivityProcessorService.js';
import { CleanChartsProcessorService } from './processors/CleanChartsProcessorService.js';
import { CleanProcessorService } from './processors/CleanProcessorService.js';
import { CleanRemoteFilesProcessorService } from './processors/CleanRemoteFilesProcessorService.js';
import { CleanRemoteNotesProcessorService } from './processors/CleanRemoteNotesProcessorService.js';
import { DeleteAccountProcessorService } from './processors/DeleteAccountProcessorService.js';
import { DeleteDriveFilesProcessorService } from './processors/DeleteDriveFilesProcessorService.js';
import { DeleteFileProcessorService } from './processors/DeleteFileProcessorService.js';
import { DeliverProcessorService } from './processors/DeliverProcessorService.js';
import { EndedPollNotificationProcessorService } from './processors/EndedPollNotificationProcessorService.js';
import { ExportAntennasProcessorService } from './processors/ExportAntennasProcessorService.js';
import { ExportBlockingProcessorService } from './processors/ExportBlockingProcessorService.js';
import { ExportClipsProcessorService } from './processors/ExportClipsProcessorService.js';
import { ExportCustomEmojisProcessorService } from './processors/ExportCustomEmojisProcessorService.js';
import { ExportFavoritesProcessorService } from './processors/ExportFavoritesProcessorService.js';
import { ExportFollowingProcessorService } from './processors/ExportFollowingProcessorService.js';
import { ExportMutingProcessorService } from './processors/ExportMutingProcessorService.js';
import { ExportNotesProcessorService } from './processors/ExportNotesProcessorService.js';
import { ExportUserListsProcessorService } from './processors/ExportUserListsProcessorService.js';
import { ImportAntennasProcessorService } from './processors/ImportAntennasProcessorService.js';
import { ImportBlockingProcessorService } from './processors/ImportBlockingProcessorService.js';
import { ImportCustomEmojisProcessorService } from './processors/ImportCustomEmojisProcessorService.js';
import { ImportFollowingProcessorService } from './processors/ImportFollowingProcessorService.js';
import { ImportMutingProcessorService } from './processors/ImportMutingProcessorService.js';
import { ImportUserListsProcessorService } from './processors/ImportUserListsProcessorService.js';
import { InboxProcessorService } from './processors/InboxProcessorService.js';
import { PostScheduledNoteProcessorService } from './processors/PostScheduledNoteProcessorService.js';
import { RelationshipProcessorService } from './processors/RelationshipProcessorService.js';
import { ResyncChartsProcessorService } from './processors/ResyncChartsProcessorService.js';
import { SystemWebhookDeliverProcessorService } from './processors/SystemWebhookDeliverProcessorService.js';
import { TickChartsProcessorService } from './processors/TickChartsProcessorService.js';
import { UserWebhookDeliverProcessorService } from './processors/UserWebhookDeliverProcessorService.js';
import { QueueLoggerService } from './QueueLoggerService.js';
import { QueueProcessorService } from './QueueProcessorService.js';

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
		BakeBufferedReactionsProcessorService,
		CleanProcessorService,
		DeleteDriveFilesProcessorService,
		ExportCustomEmojisProcessorService,
		ExportNotesProcessorService,
		ExportClipsProcessorService,
		ExportFavoritesProcessorService,
		ExportFollowingProcessorService,
		ExportMutingProcessorService,
		ExportBlockingProcessorService,
		ExportUserListsProcessorService,
		ExportAntennasProcessorService,
		ImportFollowingProcessorService,
		ImportMutingProcessorService,
		ImportBlockingProcessorService,
		ImportUserListsProcessorService,
		ImportCustomEmojisProcessorService,
		ImportAntennasProcessorService,
		DeleteAccountProcessorService,
		DeleteFileProcessorService,
		CleanRemoteFilesProcessorService,
		RelationshipProcessorService,
		UserWebhookDeliverProcessorService,
		SystemWebhookDeliverProcessorService,
		EndedPollNotificationProcessorService,
		PostScheduledNoteProcessorService,
		DeliverProcessorService,
		InboxProcessorService,
		AggregateRetentionProcessorService,
		CheckExpiredMutingsProcessorService,
		CheckModeratorsActivityProcessorService,
		CleanRemoteNotesProcessorService,
		QueueProcessorService,
	],
	exports: [
		QueueProcessorService,
	],
})
export class QueueProcessorModule {}
