/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import { In, IsNull } from 'typeorm';
import * as Redis from 'ioredis';
import { DI } from '@/di-symbols.js';
import { IdService } from '@/core/IdService.js';
import { EmojiEntityService } from '@/core/entities/EmojiEntityService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import type { MiDriveFile } from '@/models/DriveFile.js';
import type { MiEmoji } from '@/models/Emoji.js';
import type { EmojisRepository, MiRole, MiUser } from '@/models/_.js';
import { bindThis } from '@/decorators.js';
import { MemoryKVCache, RedisSingleCache } from '@/misc/cache.js';
import { UtilityService } from '@/core/UtilityService.js';
import type { Serialized } from '@/types.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';

const parseEmojiStrRegexp = /^(\w+)(?:@([\w.-]+))?$/;

@Injectable()
export class CustomEmojiService implements OnApplicationShutdown {
	private cache: MemoryKVCache<MiEmoji | null>;
	public localEmojisCache: RedisSingleCache<Map<string, MiEmoji>>;

	constructor(
		@Inject(DI.redis)
		private redisClient: Redis.Redis,
		@Inject(DI.emojisRepository)
		private emojisRepository: EmojisRepository,
		private utilityService: UtilityService,
		private idService: IdService,
		private emojiEntityService: EmojiEntityService,
		private moderationLogService: ModerationLogService,
		private globalEventService: GlobalEventService,
	) {
		this.cache = new MemoryKVCache<MiEmoji | null>(1000 * 60 * 60 * 12);

		this.localEmojisCache = new RedisSingleCache<Map<string, MiEmoji>>(this.redisClient, 'localEmojis', {
			lifetime: 1000 * 60 * 30, // 30m
			memoryCacheLifetime: 1000 * 60 * 3, // 3m
			fetcher: () => this.emojisRepository.find({ where: { host: IsNull() } }).then(emojis => new Map(emojis.map(emoji => [emoji.name, emoji]))),
			toRedisConverter: (value) => JSON.stringify(Array.from(value.values())),
			fromRedisConverter: (value) => {
				return new Map(JSON.parse(value).map((x: Serialized<MiEmoji>) => [x.name, {
					...x,
					updatedAt: x.updatedAt ? new Date(x.updatedAt) : null,
				}]));
			},
		});
	}

	@bindThis
	public async add(data: {
		driveFile: MiDriveFile;
		name: string;
		category: string | null;
		aliases: string[];
		host: string | null;
		license: string | null;
		isSensitive: boolean;
		localOnly: boolean;
		roleIdsThatCanBeUsedThisEmojiAsReaction: MiRole['id'][];
	}, moderator?: MiUser): Promise<MiEmoji> {
		const emoji = await this.emojisRepository.insert({
			id: this.idService.gen(),
			updatedAt: new Date(),
			name: data.name,
			category: data.category,
			host: data.host,
			aliases: data.aliases,
			originalUrl: data.driveFile.url,
			publicUrl: data.driveFile.webpublicUrl ?? data.driveFile.url,
			type: data.driveFile.webpublicType ?? data.driveFile.type,
			license: data.license,
			isSensitive: data.isSensitive,
			localOnly: data.localOnly,
			roleIdsThatCanBeUsedThisEmojiAsReaction: data.roleIdsThatCanBeUsedThisEmojiAsReaction,
		}).then(x => this.emojisRepository.findOneByOrFail(x.identifiers[0]));

		if (data.host == null) {
			this.localEmojisCache.refresh();

			this.globalEventService.publishBroadcastStream('emojiAdded', {
				emoji: await this.emojiEntityService.packDetailed(emoji.id),
			});

			if (moderator) {
				this.moderationLogService.log(moderator, 'addCustomEmoji', {
					emojiId: emoji.id,
					emoji: emoji,
				});
			}
		}

		return emoji;
	}

	@bindThis
	public async addBulk(
		params: {
			driveFile: MiDriveFile;
			name: string;
			category: string | null;
			aliases: string[];
			host: string | null;
			license: string | null;
			isSensitive: boolean;
			localOnly: boolean;
			roleIdsThatCanBeUsedThisEmojiAsReaction: MiRole['id'][];
		}[],
		moderator?: MiUser,
	): Promise<MiEmoji[]> {
		const emojis = await this.emojisRepository
			.insert(
				params.map(it => ({
					id: this.idService.gen(),
					updatedAt: new Date(),
					name: it.name,
					category: it.category,
					host: it.host,
					aliases: it.aliases,
					originalUrl: it.driveFile.url,
					publicUrl: it.driveFile.webpublicUrl ?? it.driveFile.url,
					type: it.driveFile.webpublicType ?? it.driveFile.type,
					license: it.license,
					isSensitive: it.isSensitive,
					localOnly: it.localOnly,
					roleIdsThatCanBeUsedThisEmojiAsReaction: it.roleIdsThatCanBeUsedThisEmojiAsReaction,
				})),
			)
			.then(x => this.emojisRepository.createQueryBuilder('emoji').whereInIds(x.identifiers).getMany());

		const localEmojis = emojis.filter(it => it.host == null);
		if (localEmojis.length > 0) {
			this.localEmojisCache.refresh();

			this.emojiEntityService.packDetailedMany(localEmojis).then(it => {
				for (const emoji of it) {
					this.globalEventService.publishBroadcastStream('emojiAdded', { emoji });
				}
			});

			if (moderator) {
				for (const emoji of localEmojis) {
					this.moderationLogService.log(moderator, 'addCustomEmoji', {
						emojiId: emoji.id,
						emoji: emoji,
					});
				}
			}
		}

		return emojis;
	}

	@bindThis
	public async update(id: MiEmoji['id'], data: {
		driveFile?: MiDriveFile;
		name?: string;
		category?: string | null;
		aliases?: string[];
		license?: string | null;
		isSensitive?: boolean;
		localOnly?: boolean;
		roleIdsThatCanBeUsedThisEmojiAsReaction?: MiRole['id'][];
	}, moderator?: MiUser): Promise<void> {
		const emoji = await this.emojisRepository.findOneByOrFail({ id: id });
		const sameNameEmoji = await this.emojisRepository.findOneBy({ name: data.name, host: IsNull() });
		if (sameNameEmoji != null && sameNameEmoji.id !== id) throw new Error('name already exists');

		await this.emojisRepository.update(emoji.id, {
			updatedAt: new Date(),
			name: data.name,
			category: data.category,
			aliases: data.aliases,
			license: data.license,
			isSensitive: data.isSensitive,
			localOnly: data.localOnly,
			originalUrl: data.driveFile != null ? data.driveFile.url : undefined,
			publicUrl: data.driveFile != null ? (data.driveFile.webpublicUrl ?? data.driveFile.url) : undefined,
			type: data.driveFile != null ? (data.driveFile.webpublicType ?? data.driveFile.type) : undefined,
			roleIdsThatCanBeUsedThisEmojiAsReaction: data.roleIdsThatCanBeUsedThisEmojiAsReaction ?? undefined,
		});

		this.localEmojisCache.refresh();

		const packed = await this.emojiEntityService.packDetailed(emoji.id);

		if (emoji.name === data.name) {
			this.globalEventService.publishBroadcastStream('emojiUpdated', {
				emojis: [packed],
			});
		} else {
			this.globalEventService.publishBroadcastStream('emojiDeleted', {
				emojis: [await this.emojiEntityService.packDetailed(emoji)],
			});

			this.globalEventService.publishBroadcastStream('emojiAdded', {
				emoji: packed,
			});
		}

		if (moderator) {
			const updated = await this.emojisRepository.findOneByOrFail({ id: id });
			this.moderationLogService.log(moderator, 'updateCustomEmoji', {
				emojiId: emoji.id,
				before: emoji,
				after: updated,
			});
		}
	}

	@bindThis
	public async updateBulk(
		params: {
			id: MiEmoji['id'];
			driveFile?: MiDriveFile;
			name?: string;
			category?: string | null;
			aliases?: string[];
			license?: string | null;
			isSensitive?: boolean;
			localOnly?: boolean;
			roleIdsThatCanBeUsedThisEmojiAsReaction?: MiRole['id'][];
		}[],
		moderator?: MiUser,
	): Promise<void> {
		const ids = params.map(it => it.id);

		// IDに対応するものと、新しく設定しようとしている名前と同じ名前を持つレコードをそれぞれ取得する
		const [storedEmojis, sameNameEmojis] = await Promise.all([
			this.emojisRepository.createQueryBuilder('emoji')
				.whereInIds(ids)
				.getMany()
				.then(emojis => new Map(emojis.map(it => [it.id, it]))),
			this.emojisRepository.createQueryBuilder('emoji')
				.where('emoji.name IN (:...names) AND emoji.host IS NULL', { names: params.map(it => it.name) })
				.getMany(),
		]);

		// 新しく設定しようとしている名前と同じ名前を持つ別レコードがある場合、重複とみなしてエラーとする
		const alreadyExists = Array.of<string>();
		for (const sameNameEmoji of sameNameEmojis) {
			const emoji = storedEmojis.get(sameNameEmoji.id);
			if (emoji != null && emoji.id !== sameNameEmoji.id) {
				alreadyExists.push(sameNameEmoji.name);
			}
		}
		if (alreadyExists.length > 0) {
			throw new Error(`name already exists: ${alreadyExists.join(', ')}`);
		}

		for (const emoji of params) {
			await this.emojisRepository.update(emoji.id, {
				updatedAt: new Date(),
				name: emoji.name,
				category: emoji.category,
				aliases: emoji.aliases,
				license: emoji.license,
				isSensitive: emoji.isSensitive,
				localOnly: emoji.localOnly,
				originalUrl: emoji.driveFile != null ? emoji.driveFile.url : undefined,
				publicUrl: emoji.driveFile != null ? (emoji.driveFile.webpublicUrl ?? emoji.driveFile.url) : undefined,
				type: emoji.driveFile != null ? (emoji.driveFile.webpublicType ?? emoji.driveFile.type) : undefined,
				roleIdsThatCanBeUsedThisEmojiAsReaction: emoji.roleIdsThatCanBeUsedThisEmojiAsReaction ?? undefined,
			});
		}

		this.localEmojisCache.refresh();

		// 名前が変わっていないものはそのまま更新としてイベント発信
		const updateEmojis = params.filter(it => storedEmojis.get(it.id)?.name === it.name);
		if (updateEmojis.length > 0) {
			const packedList = await this.emojiEntityService.packDetailedMany(updateEmojis);
			this.globalEventService.publishBroadcastStream('emojiUpdated', {
				emojis: packedList,
			});
		}

		// 名前が変わったものは削除・追加としてイベント発信
		const nameChangeEmojis = params.filter(it => storedEmojis.get(it.id)?.name !== it.name);
		if (nameChangeEmojis.length > 0) {
			const packedList = await this.emojiEntityService.packDetailedMany(nameChangeEmojis);
			this.globalEventService.publishBroadcastStream('emojiDeleted', {
				emojis: packedList,
			});

			for (const packed of packedList) {
				this.globalEventService.publishBroadcastStream('emojiAdded', {
					emoji: packed,
				});
			}
		}

		if (moderator) {
			const updatedEmojis = await this.emojisRepository.createQueryBuilder('emoji')
				.whereInIds(storedEmojis.keys())
				.getMany()
				.then(it => new Map(it.map(it => [it.id, it])));
			for (const emoji of storedEmojis.values()) {
				this.moderationLogService.log(moderator, 'updateCustomEmoji', {
					emojiId: emoji.id,
					before: emoji,
					after: updatedEmojis.get(emoji.id),
				});
			}
		}
	}

	@bindThis
	public async addAliasesBulk(ids: MiEmoji['id'][], aliases: string[]) {
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
	public async setAliasesBulk(ids: MiEmoji['id'][], aliases: string[]) {
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
	public async removeAliasesBulk(ids: MiEmoji['id'][], aliases: string[]) {
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
	public async setCategoryBulk(ids: MiEmoji['id'][], category: string | null) {
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
	public async setLicenseBulk(ids: MiEmoji['id'][], license: string | null) {
		await this.emojisRepository.update({
			id: In(ids),
		}, {
			updatedAt: new Date(),
			license: license,
		});

		this.localEmojisCache.refresh();

		this.globalEventService.publishBroadcastStream('emojiUpdated', {
			emojis: await this.emojiEntityService.packDetailedMany(ids),
		});
	}

	@bindThis
	public async delete(id: MiEmoji['id'], moderator?: MiUser) {
		const emoji = await this.emojisRepository.findOneByOrFail({ id: id });

		await this.emojisRepository.delete(emoji.id);

		this.localEmojisCache.refresh();

		this.globalEventService.publishBroadcastStream('emojiDeleted', {
			emojis: [await this.emojiEntityService.packDetailed(emoji)],
		});

		if (moderator) {
			this.moderationLogService.log(moderator, 'deleteCustomEmoji', {
				emojiId: emoji.id,
				emoji: emoji,
			});
		}
	}

	@bindThis
	public async deleteBulk(ids: MiEmoji['id'][], moderator?: MiUser) {
		const emojis = await this.emojisRepository.findBy({
			id: In(ids),
		});

		for (const emoji of emojis) {
			await this.emojisRepository.delete(emoji.id);

			if (moderator) {
				this.moderationLogService.log(moderator, 'deleteCustomEmoji', {
					emojiId: emoji.id,
					emoji: emoji,
				});
			}
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
		const match = emojiName.match(parseEmojiStrRegexp);
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
			host,
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

	/**
	 * ローカル内の絵文字に重複がないかチェックします
	 * @param name 絵文字名
	 */
	@bindThis
	public checkDuplicate(name: string): Promise<boolean> {
		return this.emojisRepository.exist({ where: { name, host: IsNull() } });
	}

	@bindThis
	public getEmojiById(id: string): Promise<MiEmoji | null> {
		return this.emojisRepository.findOneBy({ id });
	}

	@bindThis
	public dispose(): void {
		this.cache.dispose();
	}

	@bindThis
	public onApplicationShutdown(signal?: string | undefined): void {
		this.dispose();
	}
}
