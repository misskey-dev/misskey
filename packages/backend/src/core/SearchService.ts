import { MeiliSearch } from 'meilisearch';
import { Inject, Injectable } from '@nestjs/common';
import { In } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import { bindThis } from '@/decorators.js';
import { Note } from '@/models/entities/Note.js';
import { NotesRepository, User } from '@/models/index.js';
import { sqlLikeEscape } from '@/misc/sql-like-escape.js';
import { QueryService } from '@/core/QueryService.js';

@Injectable()
export class SearchService {
	private meilisearchClient: MeiliSearch | null = null;

	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		private queryService: QueryService,
	) {
		if (config.meilisearch) {
			this.meilisearchClient = new MeiliSearch({ host: config.meilisearch.url });
		}
	}

	@bindThis
	public async indexNote(note: Note) {
		if (this.meilisearchClient) {
			this.meilisearchClient.index('notes').addDocuments([{
				id: note.id,
				createdAt: note.createdAt.getTime(),
				userId: note.userId,
				userHost: note.userHost,
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
			const res = await this.meilisearchClient.index('notes').search(q, {
				sort: ['createdAt:desc'],
				matchingStrategy: 'all',
				attributesToRetrieve: ['id', 'createdAt'],
				filter: pagination.untilId ? `id < '${pagination.untilId}'` : pagination.sinceId ? `id > '${pagination.untilId}'` : '',
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
