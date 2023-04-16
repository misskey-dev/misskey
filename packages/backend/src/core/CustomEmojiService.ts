import { Inject, Injectable } from '@nestjs/common';
import { DataSource, In, IsNull } from 'typeorm';
import * as Redis from 'ioredis';
import { DI } from '@/di-symbols.js';
import { IdService } from '@/core/IdService.js';
import { EmojiEntityService } from '@/core/entities/EmojiEntityService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import type { DriveFile } from '@/models/entities/DriveFile.js';
import type { Emoji } from '@/models/entities/Emoji.js';
import type { EmojisRepository } from '@/models/index.js';
import { bindThis } from '@/decorators.js';
import { MemoryKVCache, RedisSingleCache } from '@/misc/cache.js';
import { UtilityService } from '@/core/UtilityService.js';
import type { Config } from '@/config.js';
import { query } from '@/misc/prelude/url.js';
import type { Serialized } from '@/server/api/stream/types.js';

@Injectable()
export class CustomEmojiService {
	private cache: MemoryKVCache<Emoji | null>;
	public localEmojisCache: RedisSingleCache<Map<string, Emoji>>;

	constructor(
		@Inject(DI.redis)
		private redisClient: Redis.Redis,

		@Inject(DI.config)
		private config: Config,

		@Inject(DI.db)
		private db: DataSource,

		@Inject(DI.emojisRepository)
		private emojisRepository: EmojisRepository,

		private utilityService: UtilityService,
		private idService: IdService,
		private emojiEntityService: EmojiEntityService,
		private globalEventService: GlobalEventService,
	) {
		this.cache = new MemoryKVCache<Emoji | null>(1000 * 60 * 60 * 12);

		this.localEmojisCache = new RedisSingleCache<Map<string, Emoji>>(this.redisClient, 'localEmojis', {
			lifetime: 1000 * 60 * 30, // 30m
			memoryCacheLifetime: 1000 * 60 * 3, // 3m
			fetcher: () => this.emojisRepository.find({ where: { host: IsNull() } }).then(emojis => new Map(emojis.map(emoji => [emoji.name, emoji]))),
			toRedisConverter: (value) => JSON.stringify(Array.from(value.values())),
			fromRedisConverter: (value) => {
				if (!Array.isArray(JSON.parse(value))) return undefined; // 古いバージョンの壊れたキャッシュが残っていることがある(そのうち消す)
				return new Map(JSON.parse(value).map((x: Serialized<Emoji>) => [x.name, {
					...x,
					updatedAt: x.updatedAt ? new Date(x.updatedAt) : null,
				}]));
			},
		});
	}

	@bindThis
	public async add(data: {
		driveFile: DriveFile;
		name: string;
		category: string | null;
		aliases: string[];
		host: string | null;
		license: string | null;
	}): Promise<Emoji> {
		const emoji = await this.emojisRepository.insert({
			id: this.idService.genId(),
			updatedAt: new Date(),
			name: data.name,
			category: data.category,
			host: data.host,
			aliases: data.aliases,
			originalUrl: data.driveFile.url,
			publicUrl: data.driveFile.webpublicUrl ?? data.driveFile.url,
			type: data.driveFile.webpublicType ?? data.driveFile.type,
			license: data.license,
		}).then(x => this.emojisRepository.findOneByOrFail(x.identifiers[0]));

		if (data.host == null) {
			this.localEmojisCache.refresh();

			this.globalEventService.publishBroadcastStream('emojiAdded', {
				emoji: await this.emojiEntityService.packDetailed(emoji.id),
			});
		}

		return emoji;
	}

	@bindThis
	public async update(id: Emoji['id'], data: {
		name?: string;
		category?: string | null;
		aliases?: string[];
		license?: string | null;
	}): Promise<void> {
		const emoji = await this.emojisRepository.findOneByOrFail({ id: id });
		const sameNameEmoji = await this.emojisRepository.findOneBy({ name: data.name, host: IsNull() });
		if (sameNameEmoji != null && sameNameEmoji.id !== id) throw new Error('name already exists');

		await this.emojisRepository.update(emoji.id, {
			updatedAt: new Date(),
			name: data.name,
			category: data.category,
			aliases: data.aliases,
			license: data.license,
		});

		this.localEmojisCache.refresh();

		const updated = await this.emojiEntityService.packDetailed(emoji.id);

		if (emoji.name === data.name) {
			this.globalEventService.publishBroadcastStream('emojiUpdated', {
				emojis: [updated],
			});
		} else {
			this.globalEventService.publishBroadcastStream('emojiDeleted', {
				emojis: [await this.emojiEntityService.packDetailed(emoji)],
			});

			this.globalEventService.publishBroadcastStream('emojiAdded', {
				emoji: updated,
			});	
		}
	}

	@bindThis
	public async addAliasesBulk(ids: Emoji['id'][], aliases: string[]) {
		const emojis = await this.emojisRepository.findBy({
			id: In(ids),
		});

		for (const emoji of emojis) {
			await this.emojisRepository.update(emoji.id, {
				updatedAt: new Date(),
				aliases: [...new Set(emoji.aliases.concat(aliases))],
			});
		}

		this.localEmojisCache.refresh();

		this.globalEventService.publishBroadcastStream('emojiUpdated', {
			emojis: await this.emojiEntityService.packDetailedMany(ids),
		});
	}

	@bindThis
	public async setAliasesBulk(ids: Emoji['id'][], aliases: string[]) {
		await this.emojisRepository.update({
			id: In(ids),
		}, {
			updatedAt: new Date(),
			aliases: aliases,
		});

		this.localEmojisCache.refresh();

		this.globalEventService.publishBroadcastStream('emojiUpdated', {
			emojis: await this.emojiEntityService.packDetailedMany(ids),
		});
	}

	@bindThis
	public async removeAliasesBulk(ids: Emoji['id'][], aliases: string[]) {
		const emojis = await this.emojisRepository.findBy({
			id: In(ids),
		});

		for (const emoji of emojis) {
			await this.emojisRepository.update(emoji.id, {
				updatedAt: new Date(),
				aliases: emoji.aliases.filter(x => !aliases.includes(x)),
			});
		}

		this.localEmojisCache.refresh();
	
		this.globalEventService.publishBroadcastStream('emojiUpdated', {
			emojis: await this.emojiEntityService.packDetailedMany(ids),
		});
	}

	@bindThis
	public async setCategoryBulk(ids: Emoji['id'][], category: string | null) {
		await this.emojisRepository.update({
			id: In(ids),
		}, {
			updatedAt: new Date(),
			category: category,
		});

		this.localEmojisCache.refresh();

		this.globalEventService.publishBroadcastStream('emojiUpdated', {
			emojis: await this.emojiEntityService.packDetailedMany(ids),
		});
	}

	@bindThis
	public async delete(id: Emoji['id']) {
		const emoji = await this.emojisRepository.findOneByOrFail({ id: id });

		await this.emojisRepository.delete(emoji.id);

		this.localEmojisCache.refresh();

		this.globalEventService.publishBroadcastStream('emojiDeleted', {
			emojis: [await this.emojiEntityService.packDetailed(emoji)],
		});
	}

	@bindThis
	public async deleteBulk(ids: Emoji['id'][]) {
		const emojis = await this.emojisRepository.findBy({
			id: In(ids),
		});

		for (const emoji of emojis) {
			await this.emojisRepository.delete(emoji.id);
		}

		this.localEmojisCache.refresh();

		this.globalEventService.publishBroadcastStream('emojiDeleted', {
			emojis: await this.emojiEntityService.packDetailedMany(emojis),
		});
	}

	@bindThis
	private normalizeHost(src: string | undefined, noteUserHost: string | null): string | null {
	// クエリに使うホスト
		let host = src === '.' ? null	// .はローカルホスト (ここがマッチするのはリアクションのみ)
			: src === undefined ? noteUserHost	// ノートなどでホスト省略表記の場合はローカルホスト (ここがリアクションにマッチすることはない)
			: this.utilityService.isSelfHost(src) ? null	// 自ホスト指定
			: (src || noteUserHost);	// 指定されたホスト || ノートなどの所有者のホスト (こっちがリアクションにマッチすることはない)

		host = this.utilityService.toPunyNullable(host);

		return host;
	}

	@bindThis
	public parseEmojiStr(emojiName: string, noteUserHost: string | null) {
		const match = emojiName.match(/^(\w+)(?:@([\w.-]+))?$/);
		if (!match) return { name: null, host: null };

		const name = match[1];

		// ホスト正規化
		const host = this.utilityService.toPunyNullable(this.normalizeHost(match[2], noteUserHost));

		return { name, host };
	}

	/**
	 * 添付用(リモート)カスタム絵文字URLを解決する
	 * @param emojiName ノートやユーザープロフィールに添付された、またはリアクションのカスタム絵文字名 (:は含めない, リアクションでローカルホストの場合は@.を付ける (これはdecodeReactionで可能))
	 * @param noteUserHost ノートやユーザープロフィールの所有者のホスト
	 * @returns URL, nullは未マッチを意味する
	 */
	@bindThis
	public async populateEmoji(emojiName: string, noteUserHost: string | null): Promise<string | null> {
		const { name, host } = this.parseEmojiStr(emojiName, noteUserHost);
		if (name == null) return null;
		if (host == null) return null;

		const queryOrNull = async () => (await this.emojisRepository.findOneBy({
			name,
			host: host ?? IsNull(),
		})) ?? null;

		const emoji = await this.cache.fetch(`${name} ${host}`, queryOrNull);

		if (emoji == null) return null;
		return emoji.publicUrl || emoji.originalUrl; // || emoji.originalUrl してるのは後方互換性のため（publicUrlはstringなので??はだめ）
	}

	/**
	 * 複数の添付用(リモート)カスタム絵文字URLを解決する (キャシュ付き, 存在しないものは結果から除外される)
	 */
	@bindThis
	public async populateEmojis(emojiNames: string[], noteUserHost: string | null): Promise<Record<string, string>> {
		const emojis = await Promise.all(emojiNames.map(x => this.populateEmoji(x, noteUserHost)));
		const res = {} as any;
		for (let i = 0; i < emojiNames.length; i++) {
			if (emojis[i] != null) {
				res[emojiNames[i]] = emojis[i];
			}
		}
		return res;
	}

	/**
	 * 与えられた絵文字のリストをデータベースから取得し、キャッシュに追加します
	 */
	@bindThis
	public async prefetchEmojis(emojis: { name: string; host: string | null; }[]): Promise<void> {
		const notCachedEmojis = emojis.filter(emoji => this.cache.get(`${emoji.name} ${emoji.host}`) == null);
		const emojisQuery: any[] = [];
		const hosts = new Set(notCachedEmojis.map(e => e.host));
		for (const host of hosts) {
			if (host == null) continue;
			emojisQuery.push({
				name: In(notCachedEmojis.filter(e => e.host === host).map(e => e.name)),
				host: host,
			});
		}
		const _emojis = emojisQuery.length > 0 ? await this.emojisRepository.find({
			where: emojisQuery,
			select: ['name', 'host', 'originalUrl', 'publicUrl'],
		}) : [];
		for (const emoji of _emojis) {
			this.cache.set(`${emoji.name} ${emoji.host}`, emoji);
		}
	}
}
