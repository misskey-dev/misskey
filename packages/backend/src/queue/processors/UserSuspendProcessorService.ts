import { Inject, Injectable } from '@nestjs/common';
import { bindThis } from '@/decorators.js';
import { DI } from '@/di-symbols.js';
import type Logger from '@/logger.js';
import type {
	AntennasRepository,
	ClipNotesRepository,
	ClipsRepository,
	FollowRequestsRepository,
	UserListMembershipsRepository,
	UserListsRepository, UsersRepository,
	WebhooksRepository,
} from '@/models/_.js';
import { QueueLoggerService } from '@/queue/QueueLoggerService.js';
import type * as Bull from "bullmq";
import type { DbUserSuspendJobData } from '@/queue/types.js';

@Injectable()
export class UserSuspendProcessorService {
	public logger: Logger;

	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.followRequestsRepository)
		private followRequestsRepository: FollowRequestsRepository,

		@Inject(DI.antennasRepository)
		private antennasRepository: AntennasRepository,

		@Inject(DI.webhooksRepository)
		private webhooksRepository: WebhooksRepository,

		@Inject(DI.userListsRepository)
		private userListsRepository: UserListsRepository,

		@Inject(DI.clipsRepository)
		private clipsRepository: ClipsRepository,

		@Inject(DI.clipNotesRepository)
		private clipNotesRepository: ClipNotesRepository,

		@Inject(DI.userListMembershipsRepository)
		private userListMembershipsRepository: UserListMembershipsRepository,

		private queueLoggerService: QueueLoggerService,
	) {
		this.logger = this.queueLoggerService.logger.createSubLogger('account:suspend');
	}

	@bindThis
	public async process(job: Bull.Job<DbUserSuspendJobData>): Promise<string | void> {
		this.logger.warn(`Cleaning up suspended account of ${job.data.user.id} ...`, { userSuspendJobData: job.data });

		const user = await this.usersRepository.findOneBy({ id: job.data.user.id });
		if (user == null) {
			return 'User not found';
		}

		const promises: Promise<unknown>[] = [];

		let cursor = '';
		while (true) { // eslint-disable-line @typescript-eslint/no-unnecessary-condition, no-constant-condition
			const clipNotes = await this.clipNotesRepository.createQueryBuilder('c')
				.select('c.id')
				.innerJoin('c.note', 'n')
				.where('n.userId = :userId', { userId: user.id })
				.andWhere('c.id > :cursor', { cursor })
				.orderBy('c.id', 'ASC')
				.limit(100)
				.getRawMany<{ id: string }>();

			if (clipNotes.length === 0) break;

			cursor = clipNotes.at(-1)?.id ?? '';

			promises.push(this.clipNotesRepository.createQueryBuilder()
				.delete()
				.where('id IN (:...ids)', { ids: clipNotes.map((clipNote) => clipNote.id) })
				.execute());
		}

		await Promise.allSettled([
			this.followRequestsRepository.delete({ followeeId: user.id }),
			this.followRequestsRepository.delete({ followerId: user.id }),

			this.antennasRepository.delete({ userId: user.id }),
			this.webhooksRepository.delete({ userId: user.id }),
			this.userListsRepository.delete({ userId: user.id }),
			this.clipsRepository.delete({ userId: user.id }),

			...promises,
			this.userListMembershipsRepository.delete({ userId: user.id }),
		]);

		this.logger.info(`Completed cleaning up suspended account of ${job.data.user.id}`);

		return 'done';
	}
}
