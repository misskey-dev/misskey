import { Inject, Injectable } from '@nestjs/common';
import { awaitAll } from '@/misc/prelude/await-all.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DriveFileEntityService } from '@/core/entities/DriveFileEntityService.js';
import { DI } from '@/di-symbols.js';
import type { UsersRepository, NotesRepository, FollowingsRepository, DriveFilesRepository, NoteReactionsRepository, PageLikesRepository, NoteFavoritesRepository, PollVotesRepository } from '@/models/index.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['users'],

	requireCredential: false,

	description: 'Show statistics about a user.',

	errors: {
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: '9e638e45-3b25-4ef7-8f95-07e8498f1819',
		},
	},

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			notesCount: {
				type: 'integer',
				optional: false, nullable: false,
			},
			repliesCount: {
				type: 'integer',
				optional: false, nullable: false,
			},
			renotesCount: {
				type: 'integer',
				optional: false, nullable: false,
			},
			repliedCount: {
				type: 'integer',
				optional: false, nullable: false,
			},
			renotedCount: {
				type: 'integer',
				optional: false, nullable: false,
			},
			pollVotesCount: {
				type: 'integer',
				optional: false, nullable: false,
			},
			pollVotedCount: {
				type: 'integer',
				optional: false, nullable: false,
			},
			localFollowingCount: {
				type: 'integer',
				optional: false, nullable: false,
			},
			remoteFollowingCount: {
				type: 'integer',
				optional: false, nullable: false,
			},
			localFollowersCount: {
				type: 'integer',
				optional: false, nullable: false,
			},
			remoteFollowersCount: {
				type: 'integer',
				optional: false, nullable: false,
			},
			followingCount: {
				type: 'integer',
				optional: false, nullable: false,
			},
			followersCount: {
				type: 'integer',
				optional: false, nullable: false,
			},
			sentReactionsCount: {
				type: 'integer',
				optional: false, nullable: false,
			},
			receivedReactionsCount: {
				type: 'integer',
				optional: false, nullable: false,
			},
			noteFavoritesCount: {
				type: 'integer',
				optional: false, nullable: false,
			},
			pageLikesCount: {
				type: 'integer',
				optional: false, nullable: false,
			},
			pageLikedCount: {
				type: 'integer',
				optional: false, nullable: false,
			},
			driveFilesCount: {
				type: 'integer',
				optional: false, nullable: false,
			},
			driveUsage: {
				type: 'integer',
				optional: false, nullable: false,
				description: 'Drive usage in bytes',
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		userId: { type: 'string', format: 'misskey:id' },
	},
	required: ['userId'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,

		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		@Inject(DI.noteReactionsRepository)
		private noteReactionsRepository: NoteReactionsRepository,

		@Inject(DI.pageLikesRepository)
		private pageLikesRepository: PageLikesRepository,

		@Inject(DI.noteFavoritesRepository)
		private noteFavoritesRepository: NoteFavoritesRepository,

		@Inject(DI.pollVotesRepository)
		private pollVotesRepository: PollVotesRepository,

		private driveFileEntityService: DriveFileEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const user = await this.usersRepository.findOneBy({ id: ps.userId });
			if (user == null) {
				throw new ApiError(meta.errors.noSuchUser);
			}

			const result = await awaitAll({
				notesCount: this.notesRepository.createQueryBuilder('note')
					.where('note.userId = :userId', { userId: user.id })
					.getCount(),
				repliesCount: this.notesRepository.createQueryBuilder('note')
					.where('note.userId = :userId', { userId: user.id })
					.andWhere('note.replyId IS NOT NULL')
					.getCount(),
				renotesCount: this.notesRepository.createQueryBuilder('note')
					.where('note.userId = :userId', { userId: user.id })
					.andWhere('note.renoteId IS NOT NULL')
					.getCount(),
				repliedCount: this.notesRepository.createQueryBuilder('note')
					.where('note.replyUserId = :userId', { userId: user.id })
					.getCount(),
				renotedCount: this.notesRepository.createQueryBuilder('note')
					.where('note.renoteUserId = :userId', { userId: user.id })
					.getCount(),
				pollVotesCount: this.pollVotesRepository.createQueryBuilder('vote')
					.where('vote.userId = :userId', { userId: user.id })
					.getCount(),
				pollVotedCount: this.pollVotesRepository.createQueryBuilder('vote')
					.innerJoin('vote.note', 'note')
					.where('note.userId = :userId', { userId: user.id })
					.getCount(),
				localFollowingCount: this.followingsRepository.createQueryBuilder('following')
					.where('following.followerId = :userId', { userId: user.id })
					.andWhere('following.followeeHost IS NULL')
					.getCount(),
				remoteFollowingCount: this.followingsRepository.createQueryBuilder('following')
					.where('following.followerId = :userId', { userId: user.id })
					.andWhere('following.followeeHost IS NOT NULL')
					.getCount(),
				localFollowersCount: this.followingsRepository.createQueryBuilder('following')
					.where('following.followeeId = :userId', { userId: user.id })
					.andWhere('following.followerHost IS NULL')
					.getCount(),
				remoteFollowersCount: this.followingsRepository.createQueryBuilder('following')
					.where('following.followeeId = :userId', { userId: user.id })
					.andWhere('following.followerHost IS NOT NULL')
					.getCount(),
				sentReactionsCount: this.noteReactionsRepository.createQueryBuilder('reaction')
					.where('reaction.userId = :userId', { userId: user.id })
					.getCount(),
				receivedReactionsCount: this.noteReactionsRepository.createQueryBuilder('reaction')
					.innerJoin('reaction.note', 'note')
					.where('note.userId = :userId', { userId: user.id })
					.getCount(),
				noteFavoritesCount: this.noteFavoritesRepository.createQueryBuilder('favorite')
					.where('favorite.userId = :userId', { userId: user.id })
					.getCount(),
				pageLikesCount: this.pageLikesRepository.createQueryBuilder('like')
					.where('like.userId = :userId', { userId: user.id })
					.getCount(),
				pageLikedCount: this.pageLikesRepository.createQueryBuilder('like')
					.innerJoin('like.page', 'page')
					.where('page.userId = :userId', { userId: user.id })
					.getCount(),
				driveFilesCount: this.driveFilesRepository.createQueryBuilder('file')
					.where('file.userId = :userId', { userId: user.id })
					.getCount(),
				driveUsage: this.driveFileEntityService.calcDriveUsageOf(user),
			});

			return {
				...result,
				followingCount: result.localFollowingCount + result.remoteFollowingCount,
				followersCount: result.localFollowersCount + result.remoteFollowersCount,
			};
		});
	}
}
