/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Brackets, ObjectLiteral } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { MiUser } from '@/models/User.js';
import type { UserProfilesRepository, FollowingsRepository, ChannelFollowingsRepository, BlockingsRepository, NoteThreadMutingsRepository, MutingsRepository, RenoteMutingsRepository, MiMeta } from '@/models/_.js';
import { bindThis } from '@/decorators.js';
import { IdService } from '@/core/IdService.js';
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

		@Inject(DI.blockingsRepository)
		private blockingsRepository: BlockingsRepository,

		@Inject(DI.noteThreadMutingsRepository)
		private noteThreadMutingsRepository: NoteThreadMutingsRepository,

		@Inject(DI.mutingsRepository)
		private mutingsRepository: MutingsRepository,

		@Inject(DI.renoteMutingsRepository)
		private renoteMutingsRepository: RenoteMutingsRepository,

		@Inject(DI.meta)
		private meta: MiMeta,

		private idService: IdService,
	) {
	}

	public makePaginationQuery<T extends ObjectLiteral>(
		q: SelectQueryBuilder<T>,
		sinceId?: string | null,
		untilId?: string | null,
		sinceDate?: number | null,
		untilDate?: number | null,
		targetColumn = 'id',
	): SelectQueryBuilder<T> {
		if (sinceId && untilId) {
			q.andWhere(`${q.alias}.${targetColumn} > :sinceId`, { sinceId: sinceId });
			q.andWhere(`${q.alias}.${targetColumn} < :untilId`, { untilId: untilId });
			q.orderBy(`${q.alias}.${targetColumn}`, 'DESC');
		} else if (sinceId) {
			q.andWhere(`${q.alias}.${targetColumn} > :sinceId`, { sinceId: sinceId });
			q.orderBy(`${q.alias}.${targetColumn}`, 'ASC');
		} else if (untilId) {
			q.andWhere(`${q.alias}.${targetColumn} < :untilId`, { untilId: untilId });
			q.orderBy(`${q.alias}.${targetColumn}`, 'DESC');
		} else if (sinceDate && untilDate) {
			q.andWhere(`${q.alias}.${targetColumn} > :sinceId`, { sinceId: this.idService.gen(sinceDate) });
			q.andWhere(`${q.alias}.${targetColumn} < :untilId`, { untilId: this.idService.gen(untilDate) });
			q.orderBy(`${q.alias}.${targetColumn}`, 'DESC');
		} else if (sinceDate) {
			q.andWhere(`${q.alias}.${targetColumn} > :sinceId`, { sinceId: this.idService.gen(sinceDate) });
			q.orderBy(`${q.alias}.${targetColumn}`, 'ASC');
		} else if (untilDate) {
			q.andWhere(`${q.alias}.${targetColumn} < :untilId`, { untilId: this.idService.gen(untilDate) });
			q.orderBy(`${q.alias}.${targetColumn}`, 'DESC');
		} else {
			q.orderBy(`${q.alias}.${targetColumn}`, 'DESC');
		}
		return q;
	}

	/**
	 * ミュートやブロックのようにすべてのタイムラインで共通に使用するフィルターを定義します。
	 *
	 * 特別な事情がない限り、各タイムラインはこの関数を呼び出してフィルターを適用してください。
	 *
	 * Notes for future maintainers:
	 * 1) この関数で生成するクエリと同等の処理が FanoutTimelineEndpointService にあります。
	 *    この関数を変更した場合、FanoutTimelineEndpointService の方も変更する必要があります。
	 * 2) 以下のエンドポイントでは特別な事情があるため queryService のそれぞれの関数を呼び出しています。
	 *    この関数を変更した場合、以下のエンドポイントの方も変更する必要があることがあります。
	 *    - packages/backend/src/server/api/endpoints/clips/notes.ts
	 */
	@bindThis
	public generateBaseNoteFilteringQuery(
		query: SelectQueryBuilder<any>,
		me: { id: MiUser['id'] } | null,
		{
			excludeUserFromMute,
			excludeAuthor,
		}: {
			excludeUserFromMute?: MiUser['id'],
			excludeAuthor?: boolean,
		} = {},
	): void {
		this.generateBlockedHostQueryForNote(query, excludeAuthor);
		this.generateSuspendedUserQueryForNote(query, excludeAuthor);
		if (me) {
			this.generateMutedUserQueryForNotes(query, me, { excludeUserFromMute });
			this.generateBlockedUserQueryForNotes(query, me);
			this.generateMutedUserQueryForNotes(query, me, { noteColumn: 'renote', excludeUserFromMute });
			this.generateBlockedUserQueryForNotes(query, me, { noteColumn: 'renote' });
		}
	}

	// ここでいうBlockedは被Blockedの意
	@bindThis
	public generateBlockedUserQueryForNotes(
		q: SelectQueryBuilder<any>,
		me: { id: MiUser['id'] },
		{
			noteColumn = 'note',
		}: {
			noteColumn?: string,
		} = {},
	): void {
		const blockingQuery = this.blockingsRepository.createQueryBuilder('blocking')
			.select('blocking.blockerId')
			.where('blocking.blockeeId = :blockeeId', { blockeeId: me.id });

		// 投稿の作者にブロックされていない かつ
		// 投稿の返信先の作者にブロックされていない かつ
		// 投稿の引用元の作者にブロックされていない
		q
			.andWhere(new Brackets(qb => {
				qb
					.where(`${noteColumn}.userId IS NULL`)
					.orWhere(`${noteColumn}.userId NOT IN (${ blockingQuery.getQuery() })`);
			}))
			.andWhere(new Brackets(qb => {
				qb
					.where(`${noteColumn}.replyUserId IS NULL`)
					.orWhere(`${noteColumn}.replyUserId NOT IN (${ blockingQuery.getQuery() })`);
			}))
			.andWhere(new Brackets(qb => {
				qb
					.where(`${noteColumn}.renoteUserId IS NULL`)
					.orWhere(`${noteColumn}.renoteUserId NOT IN (${ blockingQuery.getQuery() })`);
			}));

		q.setParameters(blockingQuery.getParameters());
	}

	@bindThis
	public generateBlockQueryForUsers(q: SelectQueryBuilder<any>, me: { id: MiUser['id'] }): void {
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
	public generateMutedNoteThreadQuery(q: SelectQueryBuilder<any>, me: { id: MiUser['id'] }): void {
		const mutedQuery = this.noteThreadMutingsRepository.createQueryBuilder('threadMuted')
			.select('threadMuted.threadId')
			.where('threadMuted.userId = :userId', { userId: me.id });

		q.andWhere(`note.id NOT IN (${ mutedQuery.getQuery() })`);
		q.andWhere(new Brackets(qb => {
			qb
				.where('note.threadId IS NULL')
				.orWhere(`note.threadId NOT IN (${ mutedQuery.getQuery() })`);
		}));

		q.setParameters(mutedQuery.getParameters());
	}

	@bindThis
	public generateMutedUserQueryForNotes(
		q: SelectQueryBuilder<any>,
		me: { id: MiUser['id'] },
		{
			excludeUserFromMute,
			noteColumn = 'note',
		}: {
			excludeUserFromMute?: MiUser['id'],
			noteColumn?: string,
		} = {},
	): void {
		const mutingQuery = this.mutingsRepository.createQueryBuilder('muting')
			.select('muting.muteeId')
			.where('muting.muterId = :muterId', { muterId: me.id });

		if (excludeUserFromMute) {
			mutingQuery.andWhere('muting.muteeId != :excludeId', { excludeId: excludeUserFromMute });
		}

		const mutingInstanceQuery = this.userProfilesRepository.createQueryBuilder('user_profile')
			.select('user_profile.mutedInstances')
			.where('user_profile.userId = :muterId', { muterId: me.id });

		// 投稿の作者をミュートしていない かつ
		// 投稿の返信先の作者をミュートしていない かつ
		// 投稿の引用元の作者をミュートしていない
		q
			.andWhere(new Brackets(qb => {
				qb
					.where(`${noteColumn}.userId IS NULL`)
					.orWhere(`${noteColumn}.userId NOT IN (${ mutingQuery.getQuery() })`);
			}))
			.andWhere(new Brackets(qb => {
				qb
					.where(`${noteColumn}.replyUserId IS NULL`)
					.orWhere(`${noteColumn}.replyUserId NOT IN (${ mutingQuery.getQuery() })`);
			}))
			.andWhere(new Brackets(qb => {
				qb
					.where(`${noteColumn}.renoteUserId IS NULL`)
					.orWhere(`${noteColumn}.renoteUserId NOT IN (${ mutingQuery.getQuery() })`);
			}))
			// mute instances
			.andWhere(new Brackets(qb => {
				qb
					.andWhere(`${noteColumn}.userHost IS NULL`)
					.orWhere(`NOT ((${ mutingInstanceQuery.getQuery() })::jsonb ? ${noteColumn}.userHost)`);
			}))
			.andWhere(new Brackets(qb => {
				qb
					.where(`${noteColumn}.replyUserHost IS NULL`)
					.orWhere(`NOT ((${ mutingInstanceQuery.getQuery() })::jsonb ? ${noteColumn}.replyUserHost)`);
			}))
			.andWhere(new Brackets(qb => {
				qb
					.where(`${noteColumn}.renoteUserHost IS NULL`)
					.orWhere(`NOT ((${ mutingInstanceQuery.getQuery() })::jsonb ? ${noteColumn}.renoteUserHost)`);
			}));

		q.setParameters(mutingQuery.getParameters());
		q.setParameters(mutingInstanceQuery.getParameters());
	}

	@bindThis
	public generateMutedUserQueryForUsers(q: SelectQueryBuilder<any>, me: { id: MiUser['id'] }): void {
		const mutingQuery = this.mutingsRepository.createQueryBuilder('muting')
			.select('muting.muteeId')
			.where('muting.muterId = :muterId', { muterId: me.id });

		q.andWhere(`user.id NOT IN (${ mutingQuery.getQuery() })`);

		q.setParameters(mutingQuery.getParameters());
	}

	@bindThis
	public generateVisibilityQuery(q: SelectQueryBuilder<any>, me?: { id: MiUser['id'] } | null): void {
		// This code must always be synchronized with the checks in Notes.isVisibleForMe.
		if (me == null) {
			q.andWhere(new Brackets(qb => {
				qb
					.where('note.visibility = \'public\'')
					.orWhere('note.visibility = \'home\'');
			}));
		} else {
			const followingQuery = this.followingsRepository.createQueryBuilder('following')
				.select('following.followeeId')
				.where('following.followerId = :meId');

			q.andWhere(new Brackets(qb => {
				qb
				// 公開投稿である
					.where(new Brackets(qb => {
						qb
							.where('note.visibility = \'public\'')
							.orWhere('note.visibility = \'home\'');
					}))
				// または 自分自身
					.orWhere('note.userId = :meId')
				// または 自分宛て
					.orWhere(':meIdAsList <@ note.visibleUserIds')
					.orWhere(':meIdAsList <@ note.mentions')
					.orWhere(new Brackets(qb => {
						qb
						// または フォロワー宛ての投稿であり、
							.where('note.visibility = \'followers\'')
							.andWhere(new Brackets(qb => {
								qb
								// 自分がフォロワーである
									.where(`note.userId IN (${ followingQuery.getQuery() })`)
								// または 自分の投稿へのリプライ
									.orWhere('note.replyUserId = :meId');
							}));
					}));
			}));

			q.setParameters({ meId: me.id, meIdAsList: [me.id] });
		}
	}

	@bindThis
	public generateMutedUserRenotesQueryForNotes(q: SelectQueryBuilder<any>, me: { id: MiUser['id'] }): void {
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

	@bindThis
	public generateBlockedHostQueryForNote(q: SelectQueryBuilder<any>, excludeAuthor?: boolean): void {
		let nonBlockedHostQuery: (part: string) => string;
		if (this.meta.blockedHosts.length === 0) {
			nonBlockedHostQuery = () => '1=1';
		} else {
			nonBlockedHostQuery = (match: string) => `${match} NOT ILIKE ALL(ARRAY[:...blocked])`;
			q.setParameters({ blocked: this.meta.blockedHosts.flatMap(x => [x, `%.${x}`]) });
		}

		if (excludeAuthor) {
			const instanceSuspension = (user: string) => new Brackets(qb => qb
				.where(`note.${user}Id IS NULL`) // no corresponding user
				.orWhere(`note.userId = note.${user}Id`)
				.orWhere(`note.${user}Host IS NULL`) // local
				.orWhere(nonBlockedHostQuery(`note.${user}Host`)));

			q
				.andWhere(instanceSuspension('replyUser'))
				.andWhere(instanceSuspension('renoteUser'));
		} else {
			const instanceSuspension = (user: string) => new Brackets(qb => qb
				.where(`note.${user}Id IS NULL`) // no corresponding user
				.orWhere(`note.${user}Host IS NULL`) // local
				.orWhere(nonBlockedHostQuery(`note.${user}Host`)));

			q
				.andWhere(instanceSuspension('user'))
				.andWhere(instanceSuspension('replyUser'))
				.andWhere(instanceSuspension('renoteUser'));
		}
	}

	// Requirements: user replyUser renoteUser must be joined
	@bindThis
	public generateSuspendedUserQueryForNote(q: SelectQueryBuilder<any>, excludeAuthor?: boolean): void {
		if (excludeAuthor) {
			const brakets = (user: string) => new Brackets(qb => qb
				.where(`${user}.id IS NULL`) // そもそもreplyやrenoteではない、もしくはleftjoinなどでuserが存在しなかった場合を考慮
				.orWhere(`user.id = ${user}.id`)
				.orWhere(`${user}.isSuspended = FALSE`));
			q
				.andWhere(brakets('replyUser'))
				.andWhere(brakets('renoteUser'));
		} else {
			const brakets = (user: string) => new Brackets(qb => qb
				.where(`${user}.id IS NULL`) // そもそもreplyやrenoteではない、もしくはleftjoinなどでuserが存在しなかった場合を考慮
				.orWhere(`${user}.isSuspended = FALSE`));
			q
				.andWhere('user.isSuspended = FALSE')
				.andWhere(brakets('replyUser'))
				.andWhere(brakets('renoteUser'));
		}
	}
}
