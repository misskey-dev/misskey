/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import { bindThis } from '@/decorators.js';
import { Packed } from '@/misc/json-schema.js';
import { MiNote } from '@/models/Note.js';
import { MiMeta, MiUser } from '@/models/_.js';
import type { NotesRepository } from '@/models/_.js';
import { isUserRelated } from '@/misc/is-user-related.js';
import { isInstanceMuted } from '@/misc/is-instance-muted.js';
import { CacheService } from '@/core/CacheService.js';
import { IdService } from '@/core/IdService.js';
import { UtilityService } from '@/core/UtilityService.js';
import { isMustRemove } from '@/misc/is-hidden-or-visibility-modified.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { removeMutedUsersReactions } from '@/misc/reactions-mute.js';
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
export class HanamiSearchService {
	private readonly hanamisearchIndexScope: 'local' | 'global' | string[] = 'global';
	private hanamisearchNoteIndex: Index | null = null;

	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.hanamisearch)
		private hanamisearch: MeiliSearch | null,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		@Inject(DI.meta)
		private meta: MiMeta,

		private noteEntityService: NoteEntityService,
		private cacheService: CacheService,
		private idService: IdService,
		private utilityService: UtilityService,
	) {
		this.hanamisearchIndexScope = config.hanamisearch?.scope || 'global';

		if (this.hanamisearch) {
			this.hanamisearchNoteIndex = this.initializeIndex(
				this.hanamisearch,
				`${config.hanamisearch!.index}---notes`,
			);
		}
	}

	private initializeIndex(searchClient: MeiliSearch, indexName: string): Index {
		const index = searchClient.index(indexName);
		index.updateSettings({
			searchableAttributes: ['text', 'cw'],
			sortableAttributes: ['createdAt'],
			filterableAttributes: [
				'createdAt',
				'userId',
				'userHost',
				'channelId',
				'tags',
				'fileIds',
			],
			typoTolerance: {
				enabled: false,
			},
			pagination: {
				maxTotalHits: 10000,
			},
		});
		return index;
	}

	@bindThis
	public async indexNote(note: MiNote): Promise<void> {
		if (note.text == null && note.cw == null) return;
		if (!['home', 'public'].includes(note.visibility)) return;

		// 配列が空の場合は null にする（検索時のパフォーマンスのためにインデックスしない）
		const fileIds = (note.fileIds.length > 0) ? note.fileIds : null;
		const tags = (note.tags.length > 0) ? note.tags : null;

		const createdAt = this.idService.parse(note.id).date.getTime();
		const noteData = {
			id: note.id,
			createdAt,
			userId: note.userId,
			userHost: note.userHost,
			channelId: note.channelId,
			cw: note.cw,
			text: note.text,
			tags: tags,
			fileIds: fileIds,
		};

		const shouldIndex = (scope: string | string[], userHost: string | null): boolean => {
			if (scope === 'global') return true;
			if (scope === 'local') return userHost === null;

			return false;
		};

		const indexHanamisearch = async () => {
			if (!this.hanamisearch || !this.hanamisearchNoteIndex) return;
			if (!shouldIndex(this.hanamisearchIndexScope, note.userHost)) return;

			await this.hanamisearchNoteIndex.addDocuments([noteData], { primaryKey: 'id' });
		};

		await Promise.all([
			indexHanamisearch(),
		]);
	}

	@bindThis
	public async unindexNote(note: MiNote): Promise<void> {
		if (!['home', 'public'].includes(note.visibility)) return;

		if (this.hanamisearch) {
			this.hanamisearchNoteIndex!.deleteDocument(note.id);
		}
	}

	@bindThis
	public async searchNote(
		q: string,
		me: MiUser | null,
		opts: {
			userId?: MiNote['userId'] | null;
			channelId?: MiNote['channelId'] | null;
			host?: string | null;
			preferredMethod?: 'hanamisearchv1' | 'hanamisearchv2' | null;
			onlyWithFiles?: boolean;
		},
		pagination: {
			untilId?: MiNote['id'];
			sinceId?: MiNote['id'];
			limit?: number;
		},
	): Promise<Packed<'Note'>[]> {
		const preferredMethod = opts.preferredMethod ?? 'hanamisearchv1';

		if ((preferredMethod === 'hanamisearchv1' && this.hanamisearch)) {
			const searchClient = this.hanamisearchNoteIndex!;
			const shouldTimeSeriesSort = true;
			return this.searchNoteWithHanamiSearchv1(searchClient, q, me, opts, pagination, shouldTimeSeriesSort);
		}

		throw new Error('no search engine available');
	}

	private async searchNoteWithHanamiSearchv1(
		searchClient: Index,
		q: string,
		me: MiUser | null,
		opts: {
			userId?: MiNote['userId'] | null;
			channelId?: MiNote['channelId'] | null;
			host?: string | null;
			onlyWithFiles?: boolean;
		},
		pagination: {
			untilId?: MiNote['id'];
			sinceId?: MiNote['id'];
			limit?: number;
		},
		shouldTimeSeriesSort: boolean,
	): Promise<Packed<'Note'>[]> {
		const filter: Q = { op: 'and', qs: [] };

		if (pagination.untilId) filter.qs.push({ op: '<', k: 'createdAt', v: this.idService.parse(pagination.untilId).date.getTime() });
		if (pagination.sinceId) filter.qs.push({ op: '>', k: 'createdAt', v: this.idService.parse(pagination.sinceId).date.getTime() });
		if (opts.userId) filter.qs.push({ op: '=', k: 'userId', v: opts.userId });
		if (opts.channelId) filter.qs.push({ op: '=', k: 'channelId', v: opts.channelId });
		if (opts.host) {
			filter.qs.push(opts.host === '.' ? { op: 'is null', k: 'userHost' } : { op: '=', k: 'userHost', v: opts.host });
		}
		if (opts.onlyWithFiles) filter.qs.push({ op: 'is not null', k: 'fileIds' });

		const limit = pagination.limit ?? 10;
		const compiledFilter = compileQuery(filter);

		const searchNext = async (
			offset: number,
			remainingRetries: number,
			userFilters: SearchUserFilters | null,
		): Promise<Packed<'Note'>[]> => {
			if (remainingRetries <= 0) return [];

			const res = await searchClient.search(q, {
				sort: shouldTimeSeriesSort ? ['createdAt:desc'] : undefined,
				matchingStrategy: 'all',
				attributesToRetrieve: ['id', 'createdAt'],
				filter: compiledFilter,
				limit,
				offset,
			});

			if (res.hits.length === 0) return [];

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

			if (notes.length === 0) {
				const nextOffset = offset + res.hits.length;
				if (res.hits.length < limit || nextOffset >= res.estimatedTotalHits) {
					return [];
				}
				return searchNext(nextOffset, remainingRetries - 1, nextUserFilters);
			}

			const packedNotes = (await this.noteEntityService.packMany(notes, me, { withReactionAndUserPairCache: true })).filter(note => !isMustRemove(note, 'home'));
			const userIdsWhoMeMuting = nextUserFilters?.userIdsWhoMeMuting ?? new Set<string>();
			await Promise.all(
				packedNotes.map(note => removeMutedUsersReactions(note, userIdsWhoMeMuting)),
			);

			if (packedNotes.length > 0) {
				return packedNotes;
			}

			const nextOffset = offset + res.hits.length;
			if (res.hits.length < limit || nextOffset >= res.estimatedTotalHits) {
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
