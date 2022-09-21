import { Inject, Injectable } from '@nestjs/common';
import type { DbJobData } from '@/queue/types.js';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
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
			deleteDriveFiles: (job, done) => this.deleteDriveFilesProcessorService.process(job, done),
			exportCustomEmojis: (job, done) => this.exportCustomEmojisProcessorService.process(job, done),
			exportNotes: (job, done) => this.exportNotesProcessorService.process(job, done),
			exportFollowing: (job, done) => this.exportFollowingProcessorService.process(job, done),
			exportMuting: (job, done) => this.exportMutingProcessorService.process(job, done),
			exportBlocking: (job, done) => this.exportBlockingProcessorService.process(job, done),
			exportUserLists: (job, done) => this.exportUserListsProcessorService.process(job, done),
			importFollowing: (job, done) => this.importFollowingProcessorService.process(job, done),
			importMuting: (job, done) => this.importMutingProcessorService.process(job, done),
			importBlocking: (job, done) => this.importBlockingProcessorService.process(job, done),
			importUserLists: (job, done) => this.importUserListsProcessorService.process(job, done),
			importCustomEmojis: (job, done) => this.importCustomEmojisProcessorService.process(job, done),
			deleteAccount: (job, done) => this.deleteAccountProcessorService.process(job, done),
		} as Record<string, Bull.ProcessCallbackFunction<DbJobData | Bull.ProcessPromiseFunction<DbJobData>>>;
		
		for (const [k, v] of Object.entries(jobs)) {
			dbQueue.process(k, v);
		}
	}
}
