import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import * as Redis from 'ioredis';
import { RedisKVCache } from '@/misc/cache.js';
import { GlobalEvents, GlobalEventService } from '@/core/GlobalEventService.js';
import { IdService } from '@/core/IdService.js';
import { bindThis } from '@/decorators.js';
import { DI } from '@/di-symbols.js';
import type { MiNoteMuting, NoteMutingsRepository, NotesRepository } from '@/models/_.js';
import { QueryService } from '@/core/QueryService.js';

@Injectable()
export class NoteMutingService implements OnApplicationShutdown {
	public static NoSuchNoteError = class extends Error {
	};
	public static NotMutedError = class extends Error {
	};

	private cache: RedisKVCache<Set<string>>;

	constructor(
		@Inject(DI.redis)
		private redisClient: Redis.Redis,
		@Inject(DI.redisForSub)
		private redisForSub: Redis.Redis,
		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,
		@Inject(DI.noteMutingsRepository)
		private noteMutingsRepository: NoteMutingsRepository,
		private idService: IdService,
		private globalEventService: GlobalEventService,
		private queryService: QueryService,
	) {
		this.redisForSub.on('message', this.onMessage);
		this.cache = new RedisKVCache<Set<MiNoteMuting['noteId']>>(this.redisClient, 'noteMutings', {
			// 使用頻度が高く使用される期間も長いためキャッシュの有効期限切れ→再取得が頻発すると思われる。
			// よって、有効期限を長めに設定して再取得の頻度を抑える（キャッシュの鮮度はRedisイベント経由で保たれているので問題ないはず）
			lifetime: 1000 * 60 * 60 * 24, // 1d
			memoryCacheLifetime: 1000 * 60 * 60 * 24, // 1d
			fetcher: async (userId) => {
				return this.noteMutingsRepository.createQueryBuilder('noteMuting')
					.select('noteMuting.noteId')
					.where('noteMuting.userId = :userId', { userId })
					.getRawMany<{ noteMuting_noteId: string }>()
					.then((results) => new Set(results.map(x => x.noteMuting_noteId)));
			},
			toRedisConverter: (value) => JSON.stringify(Array.from(value)),
			fromRedisConverter: (value) => new Set(JSON.parse(value)),
		});
	}

	@bindThis
	private async onMessage(_: string, data: string): Promise<void> {
		const obj = JSON.parse(data);
		if (obj.channel !== 'internal') {
			return;
		}

		const { type, body } = obj.message as GlobalEvents['internal']['payload'];
		switch (type) {
			case 'noteMuteCreated': {
				const noteIds = await this.cache.get(body.userId);
				if (noteIds) {
					noteIds.add(body.noteId);
				}
				break;
			}
			case 'noteMuteDeleted': {
				const noteIds = await this.cache.get(body.userId);
				if (noteIds) {
					noteIds.delete(body.noteId);
				}
				break;
			}
		}
	}

	@bindThis
	public async listByUserId(
		params: {
			userId: MiNoteMuting['userId'],
			sinceId?: MiNoteMuting['id'] | null,
			untilId?: MiNoteMuting['id'] | null,
		},
		opts?: {
			limit?: number;
			offset?: number;
			joinUser?: boolean;
			joinNote?: boolean;
		},
	): Promise<MiNoteMuting[]> {
		const q = this.queryService.makePaginationQuery(this.noteMutingsRepository.createQueryBuilder('noteMuting'), params.sinceId, params.untilId);

		q.where('noteMuting.userId = :userId', { userId: params.userId });
		if (opts?.joinUser) {
			q.leftJoinAndSelect('noteMuting.user', 'user');
		}
		if (opts?.joinNote) {
			q.leftJoinAndSelect('noteMuting.note', 'note');
		}

		q.orderBy('noteMuting.id', 'DESC');

		const limit = opts?.limit ?? 10;
		q.limit(limit);

		if (opts?.offset) {
			q.offset(opts.offset);
		}

		return q.getMany();
	}

	@bindThis
	public async getMutingNoteIdsSet(userId: MiNoteMuting['userId']): Promise<Set<string>> {
		return this.cache.fetch(userId);
	}

	@bindThis
	public async isMuting(userId: MiNoteMuting['userId'], noteId: MiNoteMuting['noteId']): Promise<boolean> {
		return this.cache.fetch(userId).then(noteIds => noteIds.has(noteId));
	}

	@bindThis
	public async create(
		params: Pick<MiNoteMuting, 'userId' | 'noteId' | 'expiresAt'>,
	): Promise<void> {
		if (!await this.notesRepository.existsBy({ id: params.noteId })) {
			throw new NoteMutingService.NoSuchNoteError();
		}

		const id = this.idService.gen();
		const result = await this.noteMutingsRepository.insertOne({
			id,
			...params,
		});

		this.globalEventService.publishInternalEvent('noteMuteCreated', result);
	}

	@bindThis
	public async delete(userId: MiNoteMuting['userId'], noteId: MiNoteMuting['noteId']): Promise<void> {
		const value = await this.noteMutingsRepository.findOne({ where: { userId, noteId } });
		if (!value) {
			throw new NoteMutingService.NotMutedError();
		}

		await this.noteMutingsRepository.delete(value.id);
		this.globalEventService.publishInternalEvent('noteMuteDeleted', value);
	}

	@bindThis
	public async cleanupExpiredMutes(): Promise<void> {
		const now = new Date();
		const noteMutings = await this.noteMutingsRepository.createQueryBuilder('noteMuting')
			.select(['noteMuting.id', 'noteMuting.userId'])
			.where('noteMuting.expiresAt < :now', { now })
			.andWhere('noteMuting.expiresAt IS NOT NULL')
			.getRawMany<{ noteMuting_id: MiNoteMuting['id'], noteMuting_userId: MiNoteMuting['id'] }>();

		await this.noteMutingsRepository.delete(noteMutings.map(x => x.noteMuting_id));

		for (const id of [...new Set(noteMutings.map(x => x.noteMuting_userId))]) {
			// 同時多発的なDBアクセスが発生することを避けるため1回ごとにawaitする
			await this.cache.refresh(id);
		}
	}

	@bindThis
	public dispose(): void {
		this.redisForSub.off('message', this.onMessage);
	}

	@bindThis
	public onApplicationShutdown(): void {
		this.dispose();
	}
}
