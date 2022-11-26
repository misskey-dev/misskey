import { Inject, Injectable } from '@nestjs/common';
import { DataSource, In, IsNull } from 'typeorm';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import { IdService } from '@/core/IdService.js';
import type { DriveFile } from '@/models/entities/DriveFile.js';
import type { Emoji } from '@/models/entities/Emoji.js';
import { Cache } from '@/misc/cache.js';
import { query } from '@/misc/prelude/url.js';
import type { Note } from '@/models/entities/Note.js';
import type { EmojisRepository } from '@/models/index.js';
import { UtilityService } from './UtilityService.js';
import { ReactionService } from './ReactionService.js';

/**
 * 添付用絵文字情報
 */
type PopulatedEmoji = {
	name: string;
	url: string;
};

@Injectable()
export class CustomEmojiService {
	private cache: Cache<Emoji | null>;

	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.db)
		private db: DataSource,

		@Inject(DI.emojisRepository)
		private emojisRepository: EmojisRepository,

		private idService: IdService,
		private globalEventServie: GlobalEventService,
		private utilityService: UtilityService,
		private reactionService: ReactionService,
	) {
		this.cache = new Cache<Emoji | null>(1000 * 60 * 60 * 12);
	}

	public async add(data: {
		driveFile: DriveFile;
		name: string;
		category: string | null;
		aliases: string[];
		host: string | null;
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
		}).then(x => this.emojisRepository.findOneByOrFail(x.identifiers[0]));

		await this.db.queryResultCache!.remove(['meta_emojis']);

		return emoji;
	}
	
	private normalizeHost(src: string | undefined, noteUserHost: string | null): string | null {
	// クエリに使うホスト
		let host = src === '.' ? null	// .はローカルホスト (ここがマッチするのはリアクションのみ)
			: src === undefined ? noteUserHost	// ノートなどでホスト省略表記の場合はローカルホスト (ここがリアクションにマッチすることはない)
			: this.utilityService.isSelfHost(src) ? null	// 自ホスト指定
			: (src || noteUserHost);	// 指定されたホスト || ノートなどの所有者のホスト (こっちがリアクションにマッチすることはない)

		host = this.utilityService.toPunyNullable(host);

		return host;
	}

	private parseEmojiStr(emojiName: string, noteUserHost: string | null) {
		const match = emojiName.match(/^(\w+)(?:@([\w.-]+))?$/);
		if (!match) return { name: null, host: null };

		const name = match[1];

		// ホスト正規化
		const host = this.utilityService.toPunyNullable(this.normalizeHost(match[2], noteUserHost));

		return { name, host };
	}

	/**
 * 添付用絵文字情報を解決する
 * @param emojiName ノートやユーザープロフィールに添付された、またはリアクションのカスタム絵文字名 (:は含めない, リアクションでローカルホストの場合は@.を付ける (これはdecodeReactionで可能))
 * @param noteUserHost ノートやユーザープロフィールの所有者のホスト
 * @returns 絵文字情報, nullは未マッチを意味する
 */
	public async populateEmoji(emojiName: string, noteUserHost: string | null): Promise<PopulatedEmoji | null> {
		const { name, host } = this.parseEmojiStr(emojiName, noteUserHost);
		if (name == null) return null;

		const queryOrNull = async () => (await this.emojisRepository.findOneBy({
			name,
			host: host ?? IsNull(),
		})) ?? null;

		const emoji = await this.cache.fetch(`${name} ${host}`, queryOrNull);

		if (emoji == null) return null;

		const isLocal = emoji.host == null;
		const emojiUrl = emoji.publicUrl || emoji.originalUrl; // || emoji.originalUrl してるのは後方互換性のため
		const url = isLocal ? emojiUrl : `${this.config.url}/proxy/${encodeURIComponent((new URL(emojiUrl)).pathname)}?${query({ url: emojiUrl })}`;

		return {
			name: emojiName,
			url,
		};
	}

	/**
 * 複数の添付用絵文字情報を解決する (キャシュ付き, 存在しないものは結果から除外される)
 */
	public async populateEmojis(emojiNames: string[], noteUserHost: string | null): Promise<PopulatedEmoji[]> {
		const emojis = await Promise.all(emojiNames.map(x => this.populateEmoji(x, noteUserHost)));
		return emojis.filter((x): x is PopulatedEmoji => x != null);
	}

	public aggregateNoteEmojis(notes: Note[]) {
		let emojis: { name: string | null; host: string | null; }[] = [];
		for (const note of notes) {
			emojis = emojis.concat(note.emojis
				.map(e => this.parseEmojiStr(e, note.userHost)));
			if (note.renote) {
				emojis = emojis.concat(note.renote.emojis
					.map(e => this.parseEmojiStr(e, note.renote!.userHost)));
				if (note.renote.user) {
					emojis = emojis.concat(note.renote.user.emojis
						.map(e => this.parseEmojiStr(e, note.renote!.userHost)));
				}
			}
			const customReactions = Object.keys(note.reactions).map(x => this.reactionService.decodeReaction(x)).filter(x => x.name != null) as typeof emojis;
			emojis = emojis.concat(customReactions);
			if (note.user) {
				emojis = emojis.concat(note.user.emojis
					.map(e => this.parseEmojiStr(e, note.userHost)));
			}
		}
		return emojis.filter(x => x.name != null) as { name: string; host: string | null; }[];
	}

	/**
 * 与えられた絵文字のリストをデータベースから取得し、キャッシュに追加します
 */
	public async prefetchEmojis(emojis: { name: string; host: string | null; }[]): Promise<void> {
		const notCachedEmojis = emojis.filter(emoji => this.cache.get(`${emoji.name} ${emoji.host}`) == null);
		const emojisQuery: any[] = [];
		const hosts = new Set(notCachedEmojis.map(e => e.host));
		for (const host of hosts) {
			emojisQuery.push({
				name: In(notCachedEmojis.filter(e => e.host === host).map(e => e.name)),
				host: host ?? IsNull(),
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
