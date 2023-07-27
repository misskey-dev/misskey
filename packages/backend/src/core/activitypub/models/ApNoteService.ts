/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { forwardRef, Inject, Injectable } from '@nestjs/common';
import promiseLimit from 'promise-limit';
import { In } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { PollsRepository, EmojisRepository } from '@/models/index.js';
import type { Config } from '@/config.js';
import type { RemoteUser } from '@/models/entities/User.js';
import type { Note } from '@/models/entities/Note.js';
import { toArray, toSingle, unique } from '@/misc/prelude/array.js';
import type { Emoji } from '@/models/entities/Emoji.js';
import { MetaService } from '@/core/MetaService.js';
import { AppLockService } from '@/core/AppLockService.js';
import type { DriveFile } from '@/models/entities/DriveFile.js';
import { NoteCreateService } from '@/core/NoteCreateService.js';
import type Logger from '@/logger.js';
import { IdService } from '@/core/IdService.js';
import { PollService } from '@/core/PollService.js';
import { StatusError } from '@/misc/status-error.js';
import { UtilityService } from '@/core/UtilityService.js';
import { bindThis } from '@/decorators.js';
import { checkHttps } from '@/misc/check-https.js';
import { getOneApId, getApId, getOneApHrefNullable, validPost, isEmoji, getApType } from '../type.js';
import { ApLoggerService } from '../ApLoggerService.js';
import { ApMfmService } from '../ApMfmService.js';
import { ApDbResolverService } from '../ApDbResolverService.js';
import { ApResolverService } from '../ApResolverService.js';
import { ApAudienceService } from '../ApAudienceService.js';
import { ApPersonService } from './ApPersonService.js';
import { extractApHashtags } from './tag.js';
import { ApMentionService } from './ApMentionService.js';
import { ApQuestionService } from './ApQuestionService.js';
import { ApImageService } from './ApImageService.js';
import type { Resolver } from '../ApResolverService.js';
import type { IObject, IPost } from '../type.js';

@Injectable()
export class ApNoteService {
	private logger: Logger;

	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.pollsRepository)
		private pollsRepository: PollsRepository,

		@Inject(DI.emojisRepository)
		private emojisRepository: EmojisRepository,

		private idService: IdService,
		private apMfmService: ApMfmService,
		private apResolverService: ApResolverService,

		// 循環参照のため / for circular dependency
		@Inject(forwardRef(() => ApPersonService))
		private apPersonService: ApPersonService,

		private utilityService: UtilityService,
		private apAudienceService: ApAudienceService,
		private apMentionService: ApMentionService,
		private apImageService: ApImageService,
		private apQuestionService: ApQuestionService,
		private metaService: MetaService,
		private appLockService: AppLockService,
		private pollService: PollService,
		private noteCreateService: NoteCreateService,
		private apDbResolverService: ApDbResolverService,
		private apLoggerService: ApLoggerService,
	) {
		this.logger = this.apLoggerService.logger;
	}

	@bindThis
	public validateNote(object: IObject, uri: string): Error | null {
		const expectHost = this.utilityService.extractDbHost(uri);

		if (!validPost.includes(getApType(object))) {
			return new Error(`invalid Note: invalid object type ${getApType(object)}`);
		}

		if (object.id && this.utilityService.extractDbHost(object.id) !== expectHost) {
			return new Error(`invalid Note: id has different host. expected: ${expectHost}, actual: ${this.utilityService.extractDbHost(object.id)}`);
		}

		const actualHost = object.attributedTo && this.utilityService.extractDbHost(getOneApId(object.attributedTo));
		if (object.attributedTo && actualHost !== expectHost) {
			return new Error(`invalid Note: attributedTo has different host. expected: ${expectHost}, actual: ${actualHost}`);
		}

		return null;
	}

	/**
	 * Noteをフェッチします。
	 *
	 * Misskeyに対象のNoteが登録されていればそれを返します。
	 */
	@bindThis
	public async fetchNote(object: string | IObject): Promise<Note | null> {
		return await this.apDbResolverService.getNoteFromApId(object);
	}

	/**
	 * Noteを作成します。
	 */
	@bindThis
	public async createNote(value: string | IObject, resolver?: Resolver, silent = false): Promise<Note | null> {
		// eslint-disable-next-line no-param-reassign
		if (resolver == null) resolver = this.apResolverService.createResolver();

		const object = await resolver.resolve(value);

		const entryUri = getApId(value);
		const err = this.validateNote(object, entryUri);
		if (err) {
			this.logger.error(err.message, {
				resolver: { history: resolver.getHistory() },
				value,
				object,
			});
			throw new Error('invalid note');
		}

		const note = object as IPost;

		this.logger.debug(`Note fetched: ${JSON.stringify(note, null, 2)}`);

		if (note.id && !checkHttps(note.id)) {
			throw new Error('unexpected shcema of note.id: ' + note.id);
		}

		const url = getOneApHrefNullable(note.url);

		if (url && !checkHttps(url)) {
			throw new Error('unexpected shcema of note url: ' + url);
		}

		this.logger.info(`Creating the Note: ${note.id}`);

		// 投稿者をフェッチ
		if (note.attributedTo == null) {
			throw new Error('invalid note.attributedTo: ' + note.attributedTo);
		}

		const actor = await this.apPersonService.resolvePerson(getOneApId(note.attributedTo), resolver) as RemoteUser;

		// 投稿者が凍結されていたらスキップ
		if (actor.isSuspended) {
			throw new Error('actor has been suspended');
		}

		const noteAudience = await this.apAudienceService.parseAudience(actor, note.to, note.cc, resolver);
		let visibility = noteAudience.visibility;
		const visibleUsers = noteAudience.visibleUsers;

		// Audience (to, cc) が指定されてなかった場合
		if (visibility === 'specified' && visibleUsers.length === 0) {
			if (typeof value === 'string') {	// 入力がstringならばresolverでGETが発生している
				// こちらから匿名GET出来たものならばpublic
				visibility = 'public';
			}
		}

		const apMentions = await this.apMentionService.extractApMentions(note.tag, resolver);
		const apHashtags = extractApHashtags(note.tag);

		// 添付ファイル
		// TODO: attachmentは必ずしもImageではない
		// TODO: attachmentは必ずしも配列ではない
		const limit = promiseLimit<DriveFile>(2);
		const files = (await Promise.all(toArray(note.attachment).map(attach => (
			limit(() => this.apImageService.resolveImage(actor, {
				...attach,
				sensitive: note.sensitive, // Noteがsensitiveなら添付もsensitiveにする
			}))
		))));

		// リプライ
		const reply: Note | null = note.inReplyTo
			? await this.resolveNote(note.inReplyTo, { resolver })
				.then(x => {
					if (x == null) {
						this.logger.warn('Specified inReplyTo, but not found');
						throw new Error('inReplyTo not found');
					}

					return x;
				})
				.catch(async err => {
					this.logger.warn(`Error in inReplyTo ${note.inReplyTo} - ${err.statusCode ?? err}`);
					throw err;
				})
			: null;

		// 引用
		let quote: Note | undefined | null = null;

		if (note._misskey_quote || note.quoteUrl) {
			const tryResolveNote = async (uri: string): Promise<
				| { status: 'ok'; res: Note }
				| { status: 'permerror' | 'temperror' }
			> => {
				if (!/^https?:/.test(uri)) return { status: 'permerror' };
				try {
					const res = await this.resolveNote(uri);
					if (res == null) return { status: 'permerror' };
					return { status: 'ok', res };
				} catch (e) {
					return {
						status: (e instanceof StatusError && e.isClientError) ? 'permerror' : 'temperror',
					};
				}
			};

			const uris = unique([note._misskey_quote, note.quoteUrl].filter((x): x is string => typeof x === 'string'));
			const results = await Promise.all(uris.map(tryResolveNote));

			quote = results.filter((x): x is { status: 'ok', res: Note } => x.status === 'ok').map(x => x.res).at(0);
			if (!quote) {
				if (results.some(x => x.status === 'temperror')) {
					throw new Error('quote resolve failed');
				}
			}
		}

		const cw = note.summary === '' ? null : note.summary;

		// テキストのパース
		let text: string | null = null;
		if (note.source?.mediaType === 'text/x.misskeymarkdown' && typeof note.source.content === 'string') {
			text = note.source.content;
		} else if (typeof note._misskey_content !== 'undefined') {
			text = note._misskey_content;
		} else if (typeof note.content === 'string') {
			text = this.apMfmService.htmlToMfm(note.content, note.tag);
		}

		// vote
		if (reply && reply.hasPoll) {
			const poll = await this.pollsRepository.findOneByOrFail({ noteId: reply.id });

			const tryCreateVote = async (name: string, index: number): Promise<null> => {
				if (poll.expiresAt && Date.now() > new Date(poll.expiresAt).getTime()) {
					this.logger.warn(`vote to expired poll from AP: actor=${actor.username}@${actor.host}, note=${note.id}, choice=${name}`);
				} else if (index >= 0) {
					this.logger.info(`vote from AP: actor=${actor.username}@${actor.host}, note=${note.id}, choice=${name}`);
					await this.pollService.vote(actor, reply, index);

					// リモートフォロワーにUpdate配信
					this.pollService.deliverQuestionUpdate(reply.id);
				}
				return null;
			};

			if (note.name) {
				return await tryCreateVote(note.name, poll.choices.findIndex(x => x === note.name));
			}
		}

		const emojis = await this.extractEmojis(note.tag ?? [], actor.host).catch(e => {
			this.logger.info(`extractEmojis: ${e}`);
			return [];
		});

		const apEmojis = emojis.map(emoji => emoji.name);

		const poll = await this.apQuestionService.extractPollFromQuestion(note, resolver).catch(() => undefined);

		return await this.noteCreateService.create(actor, {
			createdAt: note.published ? new Date(note.published) : null,
			files,
			reply,
			renote: quote,
			name: note.name,
			cw,
			text,
			localOnly: false,
			visibility,
			visibleUsers,
			apMentions,
			apHashtags,
			apEmojis,
			poll,
			uri: note.id,
			url: url,
		}, silent);
	}

	/**
	 * Noteを解決します。
	 *
	 * Misskeyに対象のNoteが登録されていればそれを返し、そうでなければ
	 * リモートサーバーからフェッチしてMisskeyに登録しそれを返します。
	 */
	@bindThis
	public async resolveNote(value: string | IObject, options: { sentFrom?: URL, resolver?: Resolver } = {}): Promise<Note | null> {
		const uri = getApId(value);

		// ブロックしていたら中断
		const meta = await this.metaService.fetch();
		if (this.utilityService.isBlockedHost(meta.blockedHosts, this.utilityService.extractDbHost(uri))) {
			throw new StatusError('blocked host', 451);
		}

		const unlock = await this.appLockService.getApLock(uri);

		try {
			//#region このサーバーに既に登録されていたらそれを返す
			const exist = await this.fetchNote(uri);
			if (exist) return exist;
			//#endregion

			if (uri.startsWith(this.config.url)) {
				throw new StatusError('cannot resolve local note', 400, 'cannot resolve local note');
			}

			// リモートサーバーからフェッチしてきて登録
			// ここでuriの代わりに添付されてきたNote Objectが指定されていると、サーバーフェッチを経ずにノートが生成されるが
			// 添付されてきたNote Objectは偽装されている可能性があるため、常にuriを指定してサーバーフェッチを行う。
			const createFrom = options.sentFrom?.origin === new URL(uri).origin ? value : uri;
			return await this.createNote(createFrom, options.resolver, true);
		} finally {
			unlock();
		}
	}

	@bindThis
	public async extractEmojis(tags: IObject | IObject[], host: string): Promise<Emoji[]> {
		// eslint-disable-next-line no-param-reassign
		host = this.utilityService.toPuny(host);

		const eomjiTags = toArray(tags).filter(isEmoji);

		const existingEmojis = await this.emojisRepository.findBy({
			host,
			name: In(eomjiTags.map(tag => tag.name.replaceAll(':', ''))),
		});

		return await Promise.all(eomjiTags.map(async tag => {
			const name = tag.name.replaceAll(':', '');
			tag.icon = toSingle(tag.icon);

			const exists = existingEmojis.find(x => x.name === name);

			if (exists) {
				if ((exists.updatedAt == null)
					|| (tag.id != null && exists.uri == null)
					|| (new Date(tag.updated) > exists.updatedAt)
					|| (tag.icon.url !== exists.originalUrl)
				) {
					await this.emojisRepository.update({
						host,
						name,
					}, {
						uri: tag.id,
						originalUrl: tag.icon.url,
						publicUrl: tag.icon.url,
						updatedAt: new Date(),
					});

					const emoji = await this.emojisRepository.findOneBy({ host, name });
					if (emoji == null) throw new Error('emoji update failed');
					return emoji;
				}

				return exists;
			}

			this.logger.info(`register emoji host=${host}, name=${name}`);

			return await this.emojisRepository.insert({
				id: this.idService.genId(),
				host,
				name,
				uri: tag.id,
				originalUrl: tag.icon.url,
				publicUrl: tag.icon.url,
				updatedAt: new Date(),
				aliases: [],
			}).then(x => this.emojisRepository.findOneByOrFail(x.identifiers[0]));
		}));
	}
}
