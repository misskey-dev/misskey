import { Inject, Injectable } from '@nestjs/common';
import { Brackets, ObjectLiteral } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { User } from '@/models/entities/User.js';
import type { UserProfilesRepository, FollowingsRepository, ChannelFollowingsRepository, MutedNotesRepository, BlockingsRepository, NoteThreadMutingsRepository, MutingsRepository, RenoteMutingsRepository } from '@/models/index.js';
import { bindThis } from '@/decorators.js';
import type { SelectQueryBuilder } from 'typeorm';

@Injectable()
export class QueryService {
	constructor(
		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,

		@Inject(DI.channelFollowingsRepository)
		private channelFollowingsRepository: ChannelFollowingsRepository,

		@Inject(DI.mutedNotesRepository)
		private mutedNotesRepository: MutedNotesRepository,

		@Inject(DI.blockingsRepository)
		private blockingsRepository: BlockingsRepository,

		@Inject(DI.noteThreadMutingsRepository)
		private noteThreadMutingsRepository: NoteThreadMutingsRepository,

		@Inject(DI.mutingsRepository)
		private mutingsRepository: MutingsRepository,

		@Inject(DI.renoteMutingsRepository)
		private renoteMutingsRepository: RenoteMutingsRepository,
	) {
	}

	public makePaginationQuery<T extends ObjectLiteral>(q: SelectQueryBuilder<T>, sinceId?: string, untilId?: string, sinceDate?: number, untilDate?: number): SelectQueryBuilder<T> {
		if (sinceId && untilId) {
			q.andWhere(`${q.alias}.id > :sinceId`, { sinceId: sinceId });
			q.andWhere(`${q.alias}.id < :untilId`, { untilId: untilId });
			q.orderBy(`${q.alias}.id`, 'DESC');
		} else if (sinceId) {
			q.andWhere(`${q.alias}.id > :sinceId`, { sinceId: sinceId });
			q.orderBy(`${q.alias}.id`, 'ASC');
		} else if (untilId) {
			q.andWhere(`${q.alias}.id < :untilId`, { untilId: untilId });
			q.orderBy(`${q.alias}.id`, 'DESC');
		} else if (sinceDate && untilDate) {
			q.andWhere(`${q.alias}.createdAt > :sinceDate`, { sinceDate: new Date(sinceDate) });
			q.andWhere(`${q.alias}.createdAt < :untilDate`, { untilDate: new Date(untilDate) });
			q.orderBy(`${q.alias}.createdAt`, 'DESC');
		} else if (sinceDate) {
			q.andWhere(`${q.alias}.createdAt > :sinceDate`, { sinceDate: new Date(sinceDate) });
			q.orderBy(`${q.alias}.createdAt`, 'ASC');
		} else if (untilDate) {
			q.andWhere(`${q.alias}.createdAt < :untilDate`, { untilDate: new Date(untilDate) });
			q.orderBy(`${q.alias}.createdAt`, 'DESC');
		} else {
			q.orderBy(`${q.alias}.id`, 'DESC');
		}
		return q;
	}	
	
	// ここでいうBlockedは被Blockedの意
	@bindThis
	public generateBlockedUserQuery(q: SelectQueryBuilder<any>, me: { id: User['id'] }): void {
		const blockingQuery = this.blockingsRepository.createQueryBuilder('blocking')
			.select('blocking.blockerId')
			.where('blocking.blockeeId = :blockeeId', { blockeeId: me.id });

		// 投稿の作者にブロックされていない かつ
		// 投稿の返信先の作者にブロックされていない かつ
		// 投稿の引用元の作者にブロックされていない
		q
			.andWhere(`note.userId NOT IN (${ blockingQuery.getQuery() })`)
			.andWhere(new Brackets(qb => { qb
				.where('note.replyUserId IS NULL')
				.orWhere(`note.replyUserId NOT IN (${ blockingQuery.getQuery() })`);
			}))
			.andWhere(new Brackets(qb => { qb
				.where('note.renoteUserId IS NULL')
				.orWhere(`note.renoteUserId NOT IN (${ blockingQuery.getQuery() })`);
			}));

		q.setParameters(blockingQuery.getParameters());
	}

	@bindThis
	public generateBlockQueryForUsers(q: SelectQueryBuilder<any>, me: { id: User['id'] }): void {
		const blockingQuery = this.blockingsRepository.createQueryBuilder('blocking')
			.select('blocking.blockeeId')
			.where('blocking.blockerId = :blockerId', { blockerId: me.id });

		const blockedQuery = this.blockingsRepository.createQueryBuilder('blocking')
			.select('blocking.blockerId')
			.where('blocking.blockeeId = :blockeeId', { blockeeId: me.id });

		q.andWhere(`user.id NOT IN (${ blockingQuery.getQuery() })`);
		q.setParameters(blockingQuery.getParameters());

		q.andWhere(`user.id NOT IN (${ blockedQuery.getQuery() })`);
		q.setParameters(blockedQuery.getParameters());
	}

	@bindThis
	public generateChannelQuery(q: SelectQueryBuilder<any>, me?: { id: User['id'] } | null): void {
		if (me == null) {
			q.andWhere('note.channelId IS NULL');
		} else {
			q.leftJoinAndSelect('note.channel', 'channel');
	
			const channelFollowingQuery = this.channelFollowingsRepository.createQueryBuilder('channelFollowing')
				.select('channelFollowing.followeeId')
				.where('channelFollowing.followerId = :followerId', { followerId: me.id });
	
			q.andWhere(new Brackets(qb => { qb
				// チャンネルのノートではない
				.where('note.channelId IS NULL')
				// または自分がフォローしているチャンネルのノート
				.orWhere(`note.channelId IN (${ channelFollowingQuery.getQuery() })`);
			}));
	
			q.setParameters(channelFollowingQuery.getParameters());
		}
	}

	@bindThis
	public generateMutedNoteQuery(q: SelectQueryBuilder<any>, me: { id: User['id'] }): void {
		const mutedQuery = this.mutedNotesRepository.createQueryBuilder('muted')
			.select('muted.noteId')
			.where('muted.userId = :userId', { userId: me.id });
	
		q.andWhere(`note.id NOT IN (${ mutedQuery.getQuery() })`);
	
		q.setParameters(mutedQuery.getParameters());
	}

	@bindThis
	public generateMutedNoteThreadQuery(q: SelectQueryBuilder<any>, me: { id: User['id'] }): void {
		const mutedQuery = this.noteThreadMutingsRepository.createQueryBuilder('threadMuted')
			.select('threadMuted.threadId')
			.where('threadMuted.userId = :userId', { userId: me.id });
	
		q.andWhere(`note.id NOT IN (${ mutedQuery.getQuery() })`);
		q.andWhere(new Brackets(qb => { qb
			.where('note.threadId IS NULL')
			.orWhere(`note.threadId NOT IN (${ mutedQuery.getQuery() })`);
		}));
	
		q.setParameters(mutedQuery.getParameters());
	}

	@bindThis
	public generateMutedUserQuery(q: SelectQueryBuilder<any>, me: { id: User['id'] }, exclude?: User): void {
		const mutingQuery = this.mutingsRepository.createQueryBuilder('muting')
			.select('muting.muteeId')
			.where('muting.muterId = :muterId', { muterId: me.id });
	
		if (exclude) {
			mutingQuery.andWhere('muting.muteeId != :excludeId', { excludeId: exclude.id });
		}
	
		const mutingInstanceQuery = this.userProfilesRepository.createQueryBuilder('user_profile')
			.select('user_profile.mutedInstances')
			.where('user_profile.userId = :muterId', { muterId: me.id });
	
		// 投稿の作者をミュートしていない かつ
		// 投稿の返信先の作者をミュートしていない かつ
		// 投稿の引用元の作者をミュートしていない
		q
			.andWhere(`note.userId NOT IN (${ mutingQuery.getQuery() })`)
			.andWhere(new Brackets(qb => { qb
				.where('note.replyUserId IS NULL')
				.orWhere(`note.replyUserId NOT IN (${ mutingQuery.getQuery() })`);
			}))
			.andWhere(new Brackets(qb => { qb
				.where('note.renoteUserId IS NULL')
				.orWhere(`note.renoteUserId NOT IN (${ mutingQuery.getQuery() })`);
			}))
			// mute instances
			.andWhere(new Brackets(qb => { qb
				.andWhere('note.userHost IS NULL')
				.orWhere(`NOT ((${ mutingInstanceQuery.getQuery() })::jsonb ? note.userHost)`);
			}))
			.andWhere(new Brackets(qb => { qb
				.where('note.replyUserHost IS NULL')
				.orWhere(`NOT ((${ mutingInstanceQuery.getQuery() })::jsonb ? note.replyUserHost)`);
			}))
			.andWhere(new Brackets(qb => { qb
				.where('note.renoteUserHost IS NULL')
				.orWhere(`NOT ((${ mutingInstanceQuery.getQuery() })::jsonb ? note.renoteUserHost)`);
			}));
	
		q.setParameters(mutingQuery.getParameters());
		q.setParameters(mutingInstanceQuery.getParameters());
	}

	@bindThis
	public generateMutedUserQueryForUsers(q: SelectQueryBuilder<any>, me: { id: User['id'] }): void {
		const mutingQuery = this.mutingsRepository.createQueryBuilder('muting')
			.select('muting.muteeId')
			.where('muting.muterId = :muterId', { muterId: me.id });
	
		q.andWhere(`user.id NOT IN (${ mutingQuery.getQuery() })`);
	
		q.setParameters(mutingQuery.getParameters());
	}

	@bindThis
	public generateRepliesQuery(q: SelectQueryBuilder<any>, me?: Pick<User, 'id' | 'showTimelineReplies'> | null): void {
		if (me == null) {
			q.andWhere(new Brackets(qb => { qb
				.where('note.replyId IS NULL') // 返信ではない
				.orWhere(new Brackets(qb => { qb // 返信だけど投稿者自身への返信
					.where('note.replyId IS NOT NULL')
					.andWhere('note.replyUserId = note.userId');
				}));
			}));
		} else if (!me.showTimelineReplies) {
			q.andWhere(new Brackets(qb => { qb
				.where('note.replyId IS NULL') // 返信ではない
				.orWhere('note.replyUserId = :meId', { meId: me.id }) // 返信だけど自分のノートへの返信
				.orWhere(new Brackets(qb => { qb // 返信だけど自分の行った返信
					.where('note.replyId IS NOT NULL')
					.andWhere('note.userId = :meId', { meId: me.id });
				}))
				.orWhere(new Brackets(qb => { qb // 返信だけど投稿者自身への返信
					.where('note.replyId IS NOT NULL')
					.andWhere('note.replyUserId = note.userId');
				}));
			}));
		}
	}

	@bindThis
	public generateVisibilityQuery(q: SelectQueryBuilder<any>, me?: { id: User['id'] } | null): void {
		// This code must always be synchronized with the checks in Notes.isVisibleForMe.
		if (me == null) {
			q.andWhere(new Brackets(qb => { qb
				.where('note.visibility = \'public\'')
				.orWhere('note.visibility = \'home\'');
			}));
		} else {
			const followingQuery = this.followingsRepository.createQueryBuilder('following')
				.select('following.followeeId')
				.where('following.followerId = :meId');
	
			q.andWhere(new Brackets(qb => { qb
				// 公開投稿である
				.where(new Brackets(qb => { qb
					.where('note.visibility = \'public\'')
					.orWhere('note.visibility = \'home\'');
				}))
				// または 自分自身
				.orWhere('note.userId = :meId')
				// または 自分宛て
				.orWhere(':meId = ANY(note.visibleUserIds)')
				.orWhere(':meId = ANY(note.mentions)')
				.orWhere(new Brackets(qb => { qb
					// または フォロワー宛ての投稿であり、
					.where('note.visibility = \'followers\'')
					.andWhere(new Brackets(qb => { qb
						// 自分がフォロワーである
						.where(`note.userId IN (${ followingQuery.getQuery() })`)
						// または 自分の投稿へのリプライ
						.orWhere('note.replyUserId = :meId');
					}));
				}));
			}));
	
			q.setParameters({ meId: me.id });
		}
	}

	@bindThis
	public generateMutedUserRenotesQueryForNotes(q: SelectQueryBuilder<any>, me: { id: User['id'] }): void {
		const mutingQuery = this.renoteMutingsRepository.createQueryBuilder('renote_muting')
			.select('renote_muting.muteeId')
			.where('renote_muting.muterId = :muterId', { muterId: me.id });
	
		q.andWhere(new Brackets(qb => {
			qb
				.where(new Brackets(qb => { 
					qb.where('note.renoteId IS NOT NULL');
					qb.andWhere('note.text IS NULL');
					qb.andWhere(`note.userId NOT IN (${ mutingQuery.getQuery() })`);
				}))
				.orWhere('note.renoteId IS NULL')
				.orWhere('note.text IS NOT NULL');
		}));
		
		q.setParameters(mutingQuery.getParameters());
	}
}
