import { Inject, Injectable } from '@nestjs/common';
import type { DbJobData } from '@/queue/types.js';
import { DI } from '@/di-symbols.js';
import { Config } from '@/config.js';
import { DeleteDriveFilesProcessorService } from './processors/DeleteDriveFilesProcessorService.js';
import { ExportCustomEmojisProcessorService } from './processors/ExportCustomEmojisProcessorService.js';
import { ExportNotesProcessorService } from './processors/ExportNotesProcessorService.js';
import { ExportFollowingProcessorService } from './processors/ExportFollowingProcessorService.js';
import { ExportMutingProcessorService } from './processors/ExportMutingProcessorService.js';
import { ExportBlockingProcessorService } from './processors/ExportBlockingProcessorService.js';
import { ExportUserListsProcessorService } from './processors/ExportUserListsProcessorService.js';
import { ImportFollowingProcessorService } from './processors/ImportFollowingProcessorService.js';
import { ImportMutingProcessorService } from './processors/ImportMutingProcessorService.js';
import { ImportBlockingProcessorService } from './processors/ImportBlockingProcessorService.js';
import { ImportUserListsProcessorService } from './processors/ImportUserListsProcessorService.js';
import { ImportCustomEmojisProcessorService } from './processors/ImportCustomEmojisProcessorService.js';
import { DeleteAccountProcessorService } from './processors/DeleteAccountProcessorService.js';
import type Bull from 'bull';

@Injectable()
export class DbQueueProcessorsService {
	constructor(
		@Inject(DI.config)
		private config: Config,

		private deleteDriveFilesProcessorService: DeleteDriveFilesProcessorService,
		private exportCustomEmojisProcessorService: ExportCustomEmojisProcessorService,
		private exportNotesProcessorService: ExportNotesProcessorService,
		private exportFollowingProcessorService: ExportFollowingProcessorService,
		private exportMutingProcessorService: ExportMutingProcessorService,
		private exportBlockingProcessorService: ExportBlockingProcessorService,
		private exportUserListsProcessorService: ExportUserListsProcessorService,
		private importFollowingProcessorService: ImportFollowingProcessorService,
		private importMutingProcessorService: ImportMutingProcessorService,
		private importBlockingProcessorService: ImportBlockingProcessorService,
		private importUserListsProcessorService: ImportUserListsProcessorService,
		private importCustomEmojisProcessorService: ImportCustomEmojisProcessorService,
		private deleteAccountProcessorService: DeleteAccountProcessorService,
	) {
	}

	public start(dbQueue: Bull.Queue<DbJobData>) {
		const jobs = {
			deleteDriveFiles: this.deleteDriveFilesProcessorService.process,
			exportCustomEmojis: this.exportCustomEmojisProcessorService.process,
			exportNotes: this.exportNotesProcessorService.process,
			exportFollowing: this.exportFollowingProcessorService.process,
			exportMuting: this.exportMutingProcessorService.process,
			exportBlocking: this.exportBlockingProcessorService.process,
			exportUserLists: this.exportUserListsProcessorService.process,
			importFollowing: this.importFollowingProcessorService.process,
			importMuting: this.importMutingProcessorService.process,
			importBlocking: this.importBlockingProcessorService.process,
			importUserLists: this.importUserListsProcessorService.process,
			importCustomEmojis: this.importCustomEmojisProcessorService.process,
			deleteAccount: this.deleteAccountProcessorService.process,
		} as Record<string, Bull.ProcessCallbackFunction<DbJobData | Bull.ProcessPromiseFunction<DbJobData>>>;
		
		for (const [k, v] of Object.entries(jobs)) {
			dbQueue.process(k, v);
		}
	}
}
