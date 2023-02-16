import { Inject, Injectable } from '@nestjs/common';
import type { UsersRepository, PollsRepository, PollVotesRepository } from '@/models/index.js';
import type { RemoteUser } from '@/models/entities/User.js';
import { IdService } from '@/core/IdService.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { GetterService } from '@/server/api/GetterService.js';
import { QueueService } from '@/core/QueueService.js';
import { PollService } from '@/core/PollService.js';
import { ApRendererService } from '@/core/activitypub/ApRendererService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { CreateNotificationService } from '@/core/CreateNotificationService.js';
import { DI } from '@/di-symbols.js';
import { UserBlockingService } from '@/core/UserBlockingService.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['notes'],

	requireCredential: true,

	kind: 'write:votes',

	errors: {
		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: 'ecafbd2e-c283-4d6d-aecb-1a0a33b75396',
		},

		noPoll: {
			message: 'The note does not attach a poll.',
			code: 'NO_POLL',
			id: '5f979967-52d9-4314-a911-1c673727f92f',
		},

		invalidChoice: {
			message: 'Choice ID is invalid.',
			code: 'INVALID_CHOICE',
			id: 'e0cc9a04-f2e8-41e4-a5f1-4127293260cc',
		},

		alreadyVoted: {
			message: 'You have already voted.',
			code: 'ALREADY_VOTED',
			id: '0963fc77-efac-419b-9424-b391608dc6d8',
		},

		alreadyExpired: {
			message: 'The poll is already expired.',
			code: 'ALREADY_EXPIRED',
			id: '1022a357-b085-4054-9083-8f8de358337e',
		},

		youHaveBeenBlocked: {
			message: 'You cannot vote this poll because you have been blocked by this user.',
			code: 'YOU_HAVE_BEEN_BLOCKED',
			id: '85a5377e-b1e9-4617-b0b9-5bea73331e49',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		noteId: { type: 'string', format: 'misskey:id' },
		choice: { type: 'integer' },
	},
	required: ['noteId', 'choice'],
} as const;

// TODO: ロジックをサービスに切り出す

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.pollsRepository)
		private pollsRepository: PollsRepository,

		@Inject(DI.pollVotesRepository)
		private pollVotesRepository: PollVotesRepository,

		private idService: IdService,
		private getterService: GetterService,
		private queueService: QueueService,
		private pollService: PollService,
		private apRendererService: ApRendererService,
		private globalEventService: GlobalEventService,
		private createNotificationService: CreateNotificationService,
		private userBlockingService: UserBlockingService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const createdAt = new Date();

			// Get votee
			const note = await this.getterService.getNote(ps.noteId).catch(err => {
				if (err.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw new ApiError(meta.errors.noSuchNote);
				throw err;
			});

			if (!note.hasPoll) {
				throw new ApiError(meta.errors.noPoll);
			}

			// Check blocking
			if (note.userId !== me.id) {
				const blocked = await this.userBlockingService.checkBlocked(note.userId, me.id);
				if (blocked) {
					throw new ApiError(meta.errors.youHaveBeenBlocked);
				}
			}

			const poll = await this.pollsRepository.findOneByOrFail({ noteId: note.id });

			if (poll.expiresAt && poll.expiresAt < createdAt) {
				throw new ApiError(meta.errors.alreadyExpired);
			}

			if (poll.choices[ps.choice] == null) {
				throw new ApiError(meta.errors.invalidChoice);
			}

			// if already voted
			const exist = await this.pollVotesRepository.findBy({
				noteId: note.id,
				userId: me.id,
			});

			if (exist.length) {
				if (poll.multiple) {
					if (exist.some(x => x.choice === ps.choice)) {
						throw new ApiError(meta.errors.alreadyVoted);
					}
				} else {
					throw new ApiError(meta.errors.alreadyVoted);
				}
			}

			// Create vote
			const vote = await this.pollVotesRepository.insert({
				id: this.idService.genId(),
				createdAt,
				noteId: note.id,
				userId: me.id,
				choice: ps.choice,
			}).then(x => this.pollVotesRepository.findOneByOrFail(x.identifiers[0]));

			// Increment votes count
			const index = ps.choice + 1; // In SQL, array index is 1 based
			await this.pollsRepository.query(`UPDATE poll SET votes[${index}] = votes[${index}] + 1 WHERE "noteId" = '${poll.noteId}'`);

			this.globalEventService.publishNoteStream(note.id, 'pollVoted', {
				choice: ps.choice,
				userId: me.id,
			});

			// リモート投票の場合リプライ送信
			if (note.userHost != null) {
				const pollOwner = await this.usersRepository.findOneByOrFail({ id: note.userId }) as RemoteUser;

				this.queueService.deliver(me, this.apRendererService.addContext(await this.apRendererService.renderVote(me, vote, note, poll, pollOwner)), pollOwner.inbox);
			}

			// リモートフォロワーにUpdate配信
			this.pollService.deliverQuestionUpdate(note.id);
		});
	}
}
