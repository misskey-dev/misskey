/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { In } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import { bindThis } from '@/decorators.js';
import { MiNote } from '@/models/Note.js';
import { MiUser } from '@/models/_.js';
import type { NotesRepository } from '@/models/_.js';
import { isUserRelated } from '@/misc/is-user-related.js';
import { CacheService } from '@/core/CacheService.js';
import { QueryService } from '@/core/QueryService.js';
import { IdService } from '@/core/IdService.js';
import type { Index, MeiliSearch } from 'meilisearch';

type K = string;
type V = string | number | boolean;
type Q =
	{ op: '=', k: K, v: V } |
	{ op: '!=', k: K, v: V } |
	{ op: '>', k: K, v: number } |
	{ op: '<', k: K, v: number } |
	{ op: '>=', k: K, v: number } |
	{ op: '<=', k: K, v: number } |
	{ op: 'is null', k: K} |
	{ op: 'is not null', k: K} |
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

		private cacheService: CacheService,
		private queryService: QueryService,
		private idService: IdService,
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

		const createdAt = this.idService.parse(note.id).date.getTime();
		const noteData = {
			id: note.id,
			createdAt,
			userId: note.userId,
			userHost: note.userHost,
			channelId: note.channelId,
			cw: note.cw,
			text: note.text,
			tags: note.tags,
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
		},
		pagination: {
			untilId?: MiNote['id'];
			sinceId?: MiNote['id'];
			limit?: number;
		},
	): Promise<MiNote[]> {
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
		},
		pagination: {
			untilId?: MiNote['id'];
			sinceId?: MiNote['id'];
			limit?: number;
		},
		shouldTimeSeriesSort: boolean,
	): Promise<MiNote[]> {
		const filter: Q = { op: 'and', qs: [] };

		if (pagination.untilId) filter.qs.push({ op: '<', k: 'createdAt', v: this.idService.parse(pagination.untilId).date.getTime() });
		if (pagination.sinceId) filter.qs.push({ op: '>', k: 'createdAt', v: this.idService.parse(pagination.sinceId).date.getTime() });
		if (opts.userId) filter.qs.push({ op: '=', k: 'userId', v: opts.userId });
		if (opts.channelId) filter.qs.push({ op: '=', k: 'channelId', v: opts.channelId });
		if (opts.host) {
			filter.qs.push(opts.host === '.' ? { op: 'is null', k: 'userHost' } : { op: '=', k: 'userHost', v: opts.host });
		}

		const res = await searchClient.search(q, {
			sort: shouldTimeSeriesSort ? ['createdAt:desc'] : undefined,
			matchingStrategy: 'all',
			attributesToRetrieve: ['id', 'createdAt'],
			filter: compileQuery(filter),
			limit: pagination.limit,
		});

		if (res.hits.length === 0) return [];

		const [userIdsWhoMeMuting, userIdsWhoBlockingMe] = me
			? await Promise.all([
				this.cacheService.userMutingsCache.fetch(me.id),
				this.cacheService.userBlockedCache.fetch(me.id),
			])
			: [new Set<string>(), new Set<string>()];

		const notes = (await this.notesRepository.findBy({
			id: In(res.hits.map((x) => x.id)),
		})).filter((note) => {
			if (me && isUserRelated(note, userIdsWhoBlockingMe)) return false;
			if (me && isUserRelated(note, userIdsWhoMeMuting)) return false;
			return true;
		});

		return shouldTimeSeriesSort ? notes.sort((a, b) => (a.id > b.id ? -1 : 1)) : notes;
	}
}
