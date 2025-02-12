import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import * as Redis from 'ioredis';
import { RedisKVCache } from '@/misc/cache.js';
import { GlobalEvents, GlobalEventService } from '@/core/GlobalEventService.js';
import { IdService } from '@/core/IdService.js';
import { bindThis } from '@/decorators.js';
import { DI } from '@/di-symbols.js';
import type { MiNoteMuting, NoteMutingsRepository } from '@/models/_.js';

@Injectable()
export class NoteMutingService implements OnApplicationShutdown {
	public static NoSuchItemError = class extends Error {
	};

	private cache: RedisKVCache<Set<string>>;

	constructor(
		@Inject(DI.redis)
		private redisClient: Redis.Redis,
		@Inject(DI.redisForSub)
		private redisForSub: Redis.Redis,
		@Inject(DI.noteMutingsRepository)
		private noteMutingsRepository: NoteMutingsRepository,
		private idService: IdService,
		private globalEventService: GlobalEventService,
	) {
		this.redisForSub.on('message', this.onMessage);
		this.cache = new RedisKVCache<Set<string>>(this.redisClient, 'noteMutings', {
			lifetime: 1000 * 60 * 30, // 30m
			memoryCacheLifetime: 1000 * 60, // 1m
			fetcher: (userId) => this.listByUserId(userId).then(xs => new Set(xs.map(x => x.noteId))),
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
		userId: MiNoteMuting['userId'],
		opts?: {
			joinUser?: boolean;
			joinNote?: boolean;
		},
	): Promise<MiNoteMuting[]> {
		const q = this.noteMutingsRepository.createQueryBuilder('noteMuting');

		q.where('noteMuting.userId = :userId', { userId });
		if (opts?.joinUser) {
			q.leftJoinAndSelect('noteMuting.user', 'user');
		}
		if (opts?.joinNote) {
			q.leftJoinAndSelect('noteMuting.note', 'note');
		}

		return q.getMany();
	}

	@bindThis
	public async getMutingNoteIdsSet(userId: MiNoteMuting['userId']): Promise<Set<string>> {
		return this.cache.fetch(userId);
	}

	@bindThis
	public async get(id: MiNoteMuting['id']): Promise<MiNoteMuting> {
		const result = await this.noteMutingsRepository.findOne({ where: { id } });
		if (!result) {
			throw new NoteMutingService.NoSuchItemError();
		}

		return result;
	}

	@bindThis
	public async create(
		params: Pick<MiNoteMuting, 'userId' | 'noteId' | 'expiresAt'>,
	): Promise<void> {
		const id = this.idService.gen();
		const result = await this.noteMutingsRepository.insertOne({
			id,
			...params,
		});

		this.globalEventService.publishInternalEvent('noteMuteCreated', result);
	}

	@bindThis
	public async update(
		id: MiNoteMuting['id'],
		params: Partial<Pick<MiNoteMuting, 'expiresAt'>>,
	): Promise<void> {
		await this.noteMutingsRepository.update(id, params);

		// 現状、ミュート設定の有無しかキャッシュしていないので更新時はイベントを発行しない。
		// 他に細かい設定が登場した場合はキャッシュの型をSetからMapに変えつつ、イベントを発行するようにする。
	}

	@bindThis
	public async delete(id: MiNoteMuting['id']): Promise<void> {
		const value = await this.noteMutingsRepository.findOne({ where: { id } });
		if (!value) {
			return;
		}

		await this.noteMutingsRepository.delete(id);
		this.globalEventService.publishInternalEvent('noteMuteDeleted', value);
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
