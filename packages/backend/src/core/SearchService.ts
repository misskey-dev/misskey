import { Index, MeiliSearch } from 'meilisearch';
import { Inject, Injectable } from '@nestjs/common';
import { In } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import { bindThis } from '@/decorators.js';
import { Note } from '@/models/entities/Note.js';
import { NotesRepository, User } from '@/models/index.js';
import { sqlLikeEscape } from '@/misc/sql-like-escape.js';
import { QueryService } from '@/core/QueryService.js';

type K = string;
type V = string | number | boolean;
type Q =
	{ op: '=', k: K, v: V } |
	{ op: '!=', k: K, v: V } |
	{ op: '>', k: K, v: V } |
	{ op: '<', k: K, v: V } |
	{ op: '>=', k: K, v: V } |
	{ op: '<=', k: K, v: V } |
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
		case 'and': return `(${ q.qs.map(_q => compileQuery(_q)).join(' AND ') })`;
		case 'or': return `(${ q.qs.map(_q => compileQuery(_q)).join(' OR ') })`;
		case 'not': return `(NOT ${compileQuery(q.q)})`;
		default: throw new Error('unrecognized query operator');
	}
}

@Injectable()
export class SearchService {
	private meilisearchClient: MeiliSearch | null = null;
	private meilisearchNoteIndex: Index | null = null;

	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		private queryService: QueryService,
	) {
		if (config.meilisearch) {
			this.meilisearchClient = new MeiliSearch({
				host: `http://${config.meilisearch.host}:${config.meilisearch.port}`, 
				apiKey: config.meilisearch.apiKey,
			});
			this.meilisearchNoteIndex = this.meilisearchClient.index('notes');
			this.meilisearchNoteIndex.updateSettings({
				searchableAttributes: [
					'text',
					'cw',
				],
				sortableAttributes: [
					'createdAt',
				],
				filterableAttributes: [
					'userId',
					'userHost',
					'channelId',
				],
				typoTolerance: {
					enabled: false,
				},
				pagination: {
					maxTotalHits: 10000,
				},
			});
		}
	}

	@bindThis
	public async indexNote(note: Note): Promise<void> {
		if (this.meilisearchClient) {
			this.meilisearchNoteIndex!.addDocuments([{
				id: note.id,
				createdAt: note.createdAt.getTime(),
				userId: note.userId,
				userHost: note.userHost,
				channelId: note.channelId,
				cw: note.cw,
				text: note.text,
			}]);
		}
	}

	@bindThis
	public async searchNote(q: string, me: User, opts: {
		userId?: Note['userId'];
		channelId?: Note['channelId'];
	}, pagination: {
		untilId?: Note['id'];
		sinceId?: Note['id'];
		limit?: number;
	}): Promise<Note[]> {
		if (this.meilisearchClient) {
			const filter: Q = {
				op: 'and',
				qs: [],
			};
			if (pagination.untilId) filter.qs.push({ op: '<', k: 'id', v: pagination.untilId });
			if (pagination.sinceId) filter.qs.push({ op: '>', k: 'id', v: pagination.sinceId });
			if (opts.userId) filter.qs.push({ op: '=', k: 'userId', v: opts.userId });
			if (opts.channelId) filter.qs.push({ op: '=', k: 'channelId', v: opts.channelId });
			const res = await this.meilisearchNoteIndex!.search(q, {
				sort: ['createdAt:desc'],
				matchingStrategy: 'all',
				attributesToRetrieve: ['id', 'createdAt'],
				filter: compileQuery(filter),
				limit: pagination.limit,
			});
			if (res.hits.length === 0) return [];
			return await this.notesRepository.findBy({
				id: In(res.hits.map(x => x.id)),
			});
		} else {
			const query = this.queryService.makePaginationQuery(this.notesRepository.createQueryBuilder('note'), pagination.sinceId, pagination.untilId);

			if (opts.userId) {
				query.andWhere('note.userId = :userId', { userId: opts.userId });
			} else if (opts.channelId) {
				query.andWhere('note.channelId = :channelId', { channelId: opts.channelId });
			}

			query
				.andWhere('note.text ILIKE :q', { q: `%${ sqlLikeEscape(q) }%` })
				.innerJoinAndSelect('note.user', 'user')
				.leftJoinAndSelect('note.reply', 'reply')
				.leftJoinAndSelect('note.renote', 'renote')
				.leftJoinAndSelect('reply.user', 'replyUser')
				.leftJoinAndSelect('renote.user', 'renoteUser');

			this.queryService.generateVisibilityQuery(query, me);
			if (me) this.queryService.generateMutedUserQuery(query, me);
			if (me) this.queryService.generateBlockedUserQuery(query, me);

			return await query.take(pagination.limit).getMany();
		}
	}
}
