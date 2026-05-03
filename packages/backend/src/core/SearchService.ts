/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import { type Config, FulltextSearchProvider } from '@/config.js';
import { bindThis } from '@/decorators.js';
import { MiNote } from '@/models/Note.js';
import { MiMeta } from '@/models/_.js';
import type { NotesRepository } from '@/models/_.js';
import { MiUser } from '@/models/_.js';
import { sqlLikeEscape } from '@/misc/sql-like-escape.js';
import { isUserRelated } from '@/misc/is-user-related.js';
import { isInstanceMuted } from '@/misc/is-instance-muted.js';
import { CacheService } from '@/core/CacheService.js';
import { QueryService } from '@/core/QueryService.js';
import { IdService } from '@/core/IdService.js';
import { LoggerService } from '@/core/LoggerService.js';
import { UtilityService } from '@/core/UtilityService.js';
import type { Index, MeiliSearch } from 'meilisearch';

const SEARCH_EMPTY_PAGE_RETRY_LIMIT = 5;

type K = string;
type V = string | number | boolean;
type SearchUserFilters = {
	userIdsWhoMeMuting: Set<string>;
	userIdsWhoBlockingMe: Set<string>;
	userMutedInstances: Set<string>;
};
type Q =
	{ op: '=', k: K, v: V } |
	{ op: '!=', k: K, v: V } |
	{ op: '>', k: K, v: number } |
	{ op: '<', k: K, v: number } |
	{ op: '>=', k: K, v: number } |
	{ op: '<=', k: K, v: number } |
	{ op: 'is null', k: K } |
	{ op: 'is not null', k: K } |
	{ op: 'and', qs: Q[] } |
	{ op: 'or', qs: Q[] } |
	{ op: 'not', q: Q };

export type SearchOpts = {
	userId?: MiNote['userId'] | null;
	channelId?: MiNote['channelId'] | null;
	host?: string | null;
};

export type SearchPagination = {
	untilId?: MiNote['id'];
	sinceId?: MiNote['id'];
	limit: number;
};

function compileValue(value: V): string {
	if (typeof value === 'string') {
		return `'${value}'`; // TODO: escape
	} else if (typeof value === 'number') {
		return value.toString();
	} else if (typeof value === 'boolean') {
		return value.toString();
	}
	throw new Error('unrecognized value');
}

function compileQuery(q: Q): string {
	switch (q.op) {
		case '=': return `(${q.k} = ${compileValue(q.v)})`;
		case '!=': return `(${q.k} != ${compileValue(q.v)})`;
		case '>': return `(${q.k} > ${compileValue(q.v)})`;
		case '<': return `(${q.k} < ${compileValue(q.v)})`;
		case '>=': return `(${q.k} >= ${compileValue(q.v)})`;
		case '<=': return `(${q.k} <= ${compileValue(q.v)})`;
		case 'and': return q.qs.length === 0 ? '' : `(${ q.qs.map(_q => compileQuery(_q)).join(' AND ') })`;
		case 'or': return q.qs.length === 0 ? '' : `(${ q.qs.map(_q => compileQuery(_q)).join(' OR ') })`;
		case 'is null': return `(${q.k} IS NULL)`;
		case 'is not null': return `(${q.k} IS NOT NULL)`;
		case 'not': return `(NOT ${compileQuery(q.q)})`;
		default: throw new Error('unrecognized query operator');
	}
}

@Injectable()
export class SearchService {
	private readonly meilisearchIndexScope: 'local' | 'global' | string[] = 'local';
	private readonly meilisearchNoteIndex: Index | null = null;
	private readonly provider: FulltextSearchProvider;

	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.meilisearch)
		private meilisearch: MeiliSearch | null,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		@Inject(DI.meta)
		private meta: MiMeta,

		private cacheService: CacheService,
		private queryService: QueryService,
		private idService: IdService,
		private loggerService: LoggerService,
		private utilityService: UtilityService,
	) {
		if (meilisearch) {
			this.meilisearchNoteIndex = meilisearch.index(`${config.meilisearch!.index}---notes`);
			this.meilisearchNoteIndex.updateSettings({
				searchableAttributes: [
					'text',
					'cw',
				],
				sortableAttributes: [
					'createdAt',
				],
				filterableAttributes: [
					'createdAt',
					'userId',
					'userHost',
					'channelId',
					'tags',
				],
				typoTolerance: {
					enabled: false,
				},
				pagination: {
					maxTotalHits: 10000,
				},
			});
		}

		if (config.meilisearch?.scope) {
			this.meilisearchIndexScope = config.meilisearch.scope;
		}

		this.provider = config.fulltextSearch?.provider ?? 'sqlLike';
		this.loggerService.getLogger('SearchService').info(`-- Provider: ${this.provider}`);
	}

	@bindThis
	public async indexNote(note: MiNote): Promise<void> {
		if (!this.meilisearch) return;
		if (note.text == null && note.cw == null) return;
		if (!['home', 'public'].includes(note.visibility)) return;

		switch (this.meilisearchIndexScope) {
			case 'global':
				break;

			case 'local':
				if (note.userHost == null) break;
				return;

			default: {
				if (note.userHost == null) break;
				if (this.meilisearchIndexScope.includes(note.userHost)) break;
				return;
			}
		}

		await this.meilisearchNoteIndex?.addDocuments([{
			id: note.id,
			createdAt: this.idService.parse(note.id).date.getTime(),
			userId: note.userId,
			userHost: note.userHost,
			channelId: note.channelId,
			cw: note.cw,
			text: note.text,
			tags: note.tags,
		}], {
			primaryKey: 'id',
		});
	}

	@bindThis
	public async unindexNote(note: MiNote): Promise<void> {
		if (!this.meilisearch) return;
		if (!['home', 'public'].includes(note.visibility)) return;

		await this.meilisearchNoteIndex?.deleteDocument(note.id);
	}

	@bindThis
	public async searchNote(
		q: string,
		me: MiUser | null,
		opts: SearchOpts,
		pagination: SearchPagination,
	): Promise<MiNote[]> {
		switch (this.provider) {
			case 'sqlLike':
			case 'sqlPgroonga': {
				// ほとんど内容に差がないのでsqlLikeとsqlPgroongaを同じ処理にしている.
				// 今後の拡張で差が出る用であれば関数を分ける.
				return this.searchNoteByLike(q, me, opts, pagination);
			}
			case 'meilisearch': {
				return this.searchNoteByMeiliSearch(q, me, opts, pagination);
			}
			default: {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const typeCheck: never = this.provider;
				return [];
			}
		}
	}

	@bindThis
	private async searchNoteByLike(
		q: string,
		me: MiUser | null,
		opts: SearchOpts,
		pagination: SearchPagination,
	): Promise<MiNote[]> {
		const query = this.queryService.makePaginationQuery(this.notesRepository.createQueryBuilder('note'), pagination.sinceId, pagination.untilId);

		if (opts.userId) {
			query.andWhere('note.userId = :userId', { userId: opts.userId });
		} else if (opts.channelId) {
			query.andWhere('note.channelId = :channelId', { channelId: opts.channelId });
		}

		query
			.innerJoinAndSelect('note.user', 'user')
			.leftJoinAndSelect('note.reply', 'reply')
			.leftJoinAndSelect('note.renote', 'renote')
			.leftJoinAndSelect('reply.user', 'replyUser')
			.leftJoinAndSelect('renote.user', 'renoteUser');

		if (this.config.fulltextSearch?.provider === 'sqlPgroonga') {
			query.andWhere('note.text &@~ :q', { q });
		} else {
			query.andWhere('LOWER(note.text) LIKE :q', { q: `%${ sqlLikeEscape(q.toLowerCase()) }%` });
		}

		if (opts.host) {
			if (opts.host === '.') {
				query.andWhere('note.userHost IS NULL');
			} else {
				query.andWhere('note.userHost = :host', { host: opts.host });
			}
		}

		this.queryService.generateVisibilityQuery(query, me);
		this.queryService.generateBaseNoteFilteringQuery(query, me);

		return query.limit(pagination.limit).getMany();
	}

	@bindThis
	private async searchNoteByMeiliSearch(
		q: string,
		me: MiUser | null,
		opts: SearchOpts,
		pagination: SearchPagination,
	): Promise<MiNote[]> {
		if (!this.meilisearch || !this.meilisearchNoteIndex) {
			throw new Error('MeiliSearch is not available');
		}
		const searchIndex = this.meilisearchNoteIndex;

		const filter: Q = {
			op: 'and',
			qs: [],
		};
		if (pagination.untilId) filter.qs.push({
			op: '<',
			k: 'createdAt',
			v: this.idService.parse(pagination.untilId).date.getTime(),
		});
		if (pagination.sinceId) filter.qs.push({
			op: '>',
			k: 'createdAt',
			v: this.idService.parse(pagination.sinceId).date.getTime(),
		});
		if (opts.userId) {
			filter.qs.push({ op: '=', k: 'userId', v: opts.userId });
		} else if (opts.channelId) {
			filter.qs.push({ op: '=', k: 'channelId', v: opts.channelId });
		}
		if (opts.host) {
			if (opts.host === '.') {
				filter.qs.push({ op: 'is null', k: 'userHost' });
			} else {
				filter.qs.push({ op: '=', k: 'userHost', v: opts.host });
			}
		}

		const compiledFilter = compileQuery(filter);

		const searchNext = async (
			offset: number,
			remainingRetries: number,
			userFilters: SearchUserFilters | null,
		): Promise<MiNote[]> => {
			if (remainingRetries <= 0) return [];

			const res = await searchIndex.search(q, {
				sort: ['createdAt:desc'],
				matchingStrategy: 'all',
				attributesToRetrieve: ['id', 'createdAt'],
				filter: compiledFilter,
				limit: pagination.limit,
				offset,
			});
			if (res.hits.length === 0) {
				return [];
			}

			const query = this.notesRepository.createQueryBuilder('note')
				.innerJoinAndSelect('note.user', 'user')
				.leftJoinAndSelect('note.reply', 'reply')
				.leftJoinAndSelect('note.renote', 'renote')
				.leftJoinAndSelect('reply.user', 'replyUser')
				.leftJoinAndSelect('renote.user', 'renoteUser');

			query.where('note.id IN (:...noteIds)', { noteIds: res.hits.map(x => x.id) });

			const rawNotes = await query.getMany();
			const nextUserFilters = me && rawNotes.length > 0
				? userFilters ?? await this.fetchSearchUserFilters(me)
				: userFilters;

			const notes = rawNotes.filter((note) => {
				if (this.utilityService.isBlockedHost(this.meta.blockedHosts, note.userHost)) return false;
				if (note.userId !== note.renoteUserId && this.utilityService.isBlockedHost(this.meta.blockedHosts, note.renoteUserHost)) return false;
				if (note.userId !== note.replyUserId && this.utilityService.isBlockedHost(this.meta.blockedHosts, note.replyUserHost)) return false;

				if (note.user!.isSuspended) return false;
				if (note.userId !== note.renoteUserId && note.renote?.user?.isSuspended) return false;
				if (note.userId !== note.replyUserId && note.reply?.user?.isSuspended) return false;

				if (nextUserFilters && isUserRelated(note, nextUserFilters.userIdsWhoBlockingMe)) return false;
				if (nextUserFilters && isUserRelated(note, nextUserFilters.userIdsWhoMeMuting)) return false;
				if (nextUserFilters && isUserRelated(note.renote, nextUserFilters.userIdsWhoBlockingMe)) return false;
				if (nextUserFilters && isUserRelated(note.renote, nextUserFilters.userIdsWhoMeMuting)) return false;
				if (nextUserFilters && isInstanceMuted(note, nextUserFilters.userMutedInstances)) return false;

				return true;
			}).sort((a, b) => a.id > b.id ? -1 : 1);

			if (notes.length > 0) {
				return notes;
			}

			const nextOffset = offset + res.hits.length;
			if (res.hits.length < pagination.limit || nextOffset >= res.estimatedTotalHits) {
				return [];
			}

			return searchNext(nextOffset, remainingRetries - 1, nextUserFilters);
		};

		return searchNext(0, SEARCH_EMPTY_PAGE_RETRY_LIMIT, null);
	}

	@bindThis
	private async fetchSearchUserFilters(me: MiUser): Promise<SearchUserFilters> {
		const [
			userIdsWhoMeMuting,
			userIdsWhoBlockingMe,
			userMutedInstances,
		] = await Promise.all([
			this.cacheService.userMutingsCache.fetch(me.id),
			this.cacheService.userBlockedCache.fetch(me.id),
			this.cacheService.userProfileCache.fetch(me.id).then(p => new Set(p.mutedInstances)),
		]);

		return {
			userIdsWhoMeMuting,
			userIdsWhoBlockingMe,
			userMutedInstances,
		};
	}
}
