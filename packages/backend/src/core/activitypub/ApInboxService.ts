/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { In } from 'typeorm';
import * as Redis from 'ioredis';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import { UserFollowingService } from '@/core/UserFollowingService.js';
import { ReactionService } from '@/core/ReactionService.js';
import { RelayService } from '@/core/RelayService.js';
import { NotePiningService } from '@/core/NotePiningService.js';
import { UserBlockingService } from '@/core/UserBlockingService.js';
import { NoteDeleteService } from '@/core/NoteDeleteService.js';
import { NoteCreateService } from '@/core/NoteCreateService.js';
import { acquireApObjectLock } from '@/misc/distributed-lock.js';
import { concat, toArray, toSingle, unique } from '@/misc/prelude/array.js';
import type Logger from '@/logger.js';
import { IdService } from '@/core/IdService.js';
import { StatusError } from '@/misc/status-error.js';
import { UtilityService } from '@/core/UtilityService.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { QueueService } from '@/core/QueueService.js';
import type { UsersRepository, NotesRepository, FollowingsRepository, AbuseUserReportsRepository, FollowRequestsRepository, MiMeta } from '@/models/_.js';
import { bindThis } from '@/decorators.js';
import type { MiRemoteUser } from '@/models/User.js';
import type { MiNote } from '@/models/Note.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { AbuseReportService } from '@/core/AbuseReportService.js';
import { IdentifiableError } from '@/misc/identifiable-error.js';
import { getApHrefNullable, getApId, getApIds, getApType, getOneApId, isAccept, isActor, isAdd, isAnnounce, isBlock, isCollection, isCollectionOrOrderedCollection, isCreate, isDelete, isFlag, isFollow, isLike, isMove, isPost, isQuoteRequest, isReject, isRemove, isTombstone, isUndo, isUpdate, validActor, validPost } from './type.js';
import { ApNoteService } from './models/ApNoteService.js';
import { ApLoggerService } from './ApLoggerService.js';
import { ApDbResolverService } from './ApDbResolverService.js';
import { ApRendererService } from './ApRendererService.js';
import { ApDeliverManagerService } from './ApDeliverManagerService.js';
import { ApResolverService } from './ApResolverService.js';
import { ApAudienceService } from './ApAudienceService.js';
import { ApPersonService } from './models/ApPersonService.js';
import { ApQuestionService } from './models/ApQuestionService.js';
import type { Resolver } from './ApResolverService.js';
import type { IAccept, IAdd, IAnnounce, IBlock, ICreate, IDelete, IFlag, IFollow, ILike, IObject, IQuoteRequest, IReject, IRemove, IUndo, IUpdate, IMove, IPost } from './type.js';

@Injectable()
export class ApInboxService {
	private logger: Logger;

	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.redis)
		private redisClient: Redis.Redis,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,

		@Inject(DI.followRequestsRepository)
		private followRequestsRepository: FollowRequestsRepository,

		private userEntityService: UserEntityService,
		private noteEntityService: NoteEntityService,
		private utilityService: UtilityService,
		private idService: IdService,
		private abuseReportService: AbuseReportService,
		private userFollowingService: UserFollowingService,
		private apAudienceService: ApAudienceService,
		private reactionService: ReactionService,
		private relayService: RelayService,
		private notePiningService: NotePiningService,
		private userBlockingService: UserBlockingService,
		private noteCreateService: NoteCreateService,
		private noteDeleteService: NoteDeleteService,
		private apResolverService: ApResolverService,
		private apDbResolverService: ApDbResolverService,
		private apRendererService: ApRendererService,
		private apDeliverManagerService: ApDeliverManagerService,
		private apLoggerService: ApLoggerService,
		private apNoteService: ApNoteService,
		private apPersonService: ApPersonService,
		private apQuestionService: ApQuestionService,
		private queueService: QueueService,
		private globalEventService: GlobalEventService,
	) {
		this.logger = this.apLoggerService.logger;
	}

	@bindThis
	public async performActivity(actor: MiRemoteUser, activity: IObject, resolver?: Resolver): Promise<string | void> {
		let result = undefined as string | void;
		if (isCollectionOrOrderedCollection(activity)) {
			const results = [] as [string, string | void][];
			// eslint-disable-next-line no-param-reassign
			resolver ??= await this.apResolverService.createResolver();

			const items = toArray(isCollection(activity) ? activity.items : activity.orderedItems);
			if (items.length >= resolver.getRecursionLimit()) {
				throw new Error(`skipping activity: collection would surpass recursion limit: ${this.utilityService.extractDbHost(actor.uri)}`);
			}

			for (const item of items) {
				const act = await resolver.resolve(item);
				if (act.id == null || this.utilityService.extractDbHost(act.id) !== this.utilityService.extractDbHost(actor.uri)) {
					this.logger.debug('skipping activity: activity id is null or mismatching');
					continue;
				}
				try {
					results.push([getApId(item), await this.performOneActivity(actor, act, resolver)]);
				} catch (err) {
					if (err instanceof Error || typeof err === 'string') {
						this.logger.error(err);
					} else {
						throw err;
					}
				}
			}

			const hasReason = results.some(([, reason]) => (reason != null && !reason.startsWith('ok')));
			if (hasReason) {
				result = results.map(([id, reason]) => `${id}: ${reason}`).join('\n');
			}
		} else {
			result = await this.performOneActivity(actor, activity, resolver);
		}

		// ついでにリモートユーザーの情報が古かったら更新しておく
		if (actor.uri) {
			if (actor.lastFetchedAt == null || Date.now() - actor.lastFetchedAt.getTime() > 1000 * 60 * 60 * 24) {
				setImmediate(() => {
					// 同一ユーザーの情報を再度処理するので、使用済みのresolverを再利用してはいけない
					this.apPersonService.updatePerson(actor.uri);
				});
			}
		}
		return result;
	}

	@bindThis
	public async performOneActivity(actor: MiRemoteUser, activity: IObject, resolver?: Resolver): Promise<string | void> {
		if (actor.isSuspended) return;

		if (isCreate(activity)) {
			return await this.create(actor, activity, resolver);
		} else if (isDelete(activity)) {
			return await this.delete(actor, activity);
		} else if (isUpdate(activity)) {
			return await this.update(actor, activity, resolver);
		} else if (isFollow(activity)) {
			return await this.follow(actor, activity);
		} else if (isAccept(activity)) {
			return await this.accept(actor, activity, resolver);
		} else if (isReject(activity)) {
			return await this.reject(actor, activity, resolver);
		} else if (isAdd(activity)) {
			return await this.add(actor, activity, resolver);
		} else if (isRemove(activity)) {
			return await this.remove(actor, activity, resolver);
		} else if (isAnnounce(activity)) {
			return await this.announce(actor, activity, resolver);
		} else if (isLike(activity)) {
			return await this.like(actor, activity);
		} else if (isUndo(activity)) {
			return await this.undo(actor, activity, resolver);
		} else if (isBlock(activity)) {
			return await this.block(actor, activity);
		} else if (isFlag(activity)) {
			return await this.flag(actor, activity);
		} else if (isMove(activity)) {
			return await this.move(actor, activity, resolver);
		} else if (isQuoteRequest(activity)) {
			return await this.quoteRequest(actor, activity);
		} else {
			return `unrecognized activity type: ${activity.type}`;
		}
	}

	@bindThis
	private async follow(actor: MiRemoteUser, activity: IFollow): Promise<string> {
		const followee = await this.apDbResolverService.getUserFromApId(activity.object);

		if (followee == null) {
			return 'skip: followee not found';
		}

		if (followee.host != null) {
			return 'skip: フォローしようとしているユーザーはローカルユーザーではありません';
		}

		// don't queue because the sender may attempt again when timeout
		await this.userFollowingService.follow(actor, followee, { requestId: activity.id });
		return 'ok';
	}

	@bindThis
	private async like(actor: MiRemoteUser, activity: ILike): Promise<string> {
		const targetUri = getApId(activity.object);

		const note = await this.apNoteService.fetchNote(targetUri);
		if (!note) return `skip: target note not found ${targetUri}`;

		await this.apNoteService.extractEmojis(activity.tag ?? [], actor.host).catch(() => null);

		try {
			await this.reactionService.create(actor, note, activity._misskey_reaction ?? activity.content ?? activity.name);
			return 'ok';
		} catch (err) {
			if (err instanceof IdentifiableError && err.id === '51c42bb4-931a-456b-bff7-e5a8a70dd298') {
				return 'skip: already reacted';
			} else {
				throw err;
			}
		}
	}

	@bindThis
	private async accept(actor: MiRemoteUser, activity: IAccept, resolver?: Resolver): Promise<string> {
		const uri = activity.id ?? activity;

		this.logger.info(`Accept: ${uri}`);

		// FEP-044f: 自ホスト発の QuoteRequest への Accept は resolve せず URI 形式で判定する
		// (resolver.resolve に通すと resolveLocal が QuoteRequest でなくノート本体を返すケースがあるため)
		const quoteRequestNoteId = this.parseLocalQuoteRequestUri(activity.object);
		if (quoteRequestNoteId != null) {
			return await this.acceptQuoteRequest(actor, quoteRequestNoteId, activity);
		}

		// eslint-disable-next-line no-param-reassign
		resolver ??= await this.apResolverService.createResolver();

		const object = await resolver.resolve(activity.object).catch(err => {
			this.logger.error(`Resolution failed: ${err}`);
			throw err;
		});

		if (isFollow(object)) return await this.acceptFollow(actor, object);

		return `skip: Unknown Accept type: ${getApType(object)}`;
	}

	/**
	 * FEP-044f: object が自ホスト発の QuoteRequest URI (`/notes/:id/quote-request`) なら、その引用ノート ID を返す。
	 */
	@bindThis
	private parseLocalQuoteRequestUri(object: IObject | string): string | null {
		let objectUri: string;
		try {
			objectUri = getApId(object);
		} catch {
			return null;
		}
		const parsed = this.apDbResolverService.parseUri(objectUri);
		if (parsed.local && parsed.type === 'notes' && parsed.rest === 'quote-request') {
			return parsed.id;
		}
		return null;
	}

	/**
	 * FEP-044f: こちらから送った QuoteRequest への Accept を処理し、承認スタンプ URI を保存して Update を再配送する。
	 */
	@bindThis
	private async acceptQuoteRequest(actor: MiRemoteUser, noteId: string, activity: IAccept): Promise<string> {
		const note = await this.notesRepository.findOne({ where: { id: noteId }, relations: { renote: true } });
		if (note == null) return 'skip: note not found';
		if (note.userHost != null) return 'skip: not a local note';
		if (note.renote == null) return 'skip: not a quote';

		if (note.renote.userId !== actor.id) {
			return 'skip: actor is not the quoted note author';
		}

		if (activity.result == null) return 'skip: no result';
		let resultUri: string;
		try {
			resultUri = getOneApId(activity.result);
		} catch {
			return 'skip: invalid result';
		}
		// スタンプは被引用ノートの作者と同一ホストが発行しているべき
		if (!/^https?:\/\//.test(resultUri) || resultUri.length > 1024) {
			return 'skip: invalid result uri';
		}
		if (this.utilityService.extractDbHost(resultUri) !== actor.host) {
			return 'skip: result host mismatch';
		}

		const user = await this.usersRepository.findOneBy({ id: note.userId });
		if (user == null || !this.userEntityService.isLocalUser(user)) return 'skip: note author is not local';

		await this.notesRepository.update(note.id, {
			quoteAuthorizationUri: resultUri,
			quoteRejected: false,
		});

		// 承認スタンプ付きの Update を再配送する (Update<Note> を受信できない実装は無視するだけで無害)
		note.quoteAuthorizationUri = resultUri;
		note.quoteRejected = false;
		const content = this.apRendererService.addContext(this.apRendererService.renderUpdate(await this.apRendererService.renderNote(note, false), user));
		this.apDeliverManagerService.deliverToFollowers(user, content);
		this.queueService.deliver(user, content, actor.inbox, false);
		if (note.visibility === 'public') {
			this.relayService.deliverToRelays(user, content);
		}

		return 'ok';
	}

	@bindThis
	private async acceptFollow(actor: MiRemoteUser, activity: IFollow): Promise<string> {
		// ※ activityはこっちから投げたフォローリクエストなので、activity.actorは存在するローカルユーザーである必要がある

		const follower = await this.apDbResolverService.getUserFromApId(activity.actor);

		if (follower == null) {
			return 'skip: follower not found';
		}

		if (follower.host != null) {
			return 'skip: follower is not a local user';
		}

		// relay
		const match = activity.id?.match(/follow-relay\/(\w+)/);
		if (match) {
			return await this.relayService.relayAccepted(match[1]);
		}

		await this.userFollowingService.acceptFollowRequest(actor, follower);
		return 'ok';
	}

	@bindThis
	private async add(actor: MiRemoteUser, activity: IAdd, resolver?: Resolver): Promise<string | void> {
		if (actor.uri !== getApId(activity.actor)) {
			return 'invalid actor';
		}

		if (activity.target == null) {
			return 'target is null';
		}

		if (activity.target === actor.featured) {
			const note = await this.apNoteService.resolveNote(activity.object, { resolver });
			if (note == null) return 'note not found';
			await this.notePiningService.addPinned(actor, note.id);
			return;
		}

		return `unknown target: ${activity.target}`;
	}

	@bindThis
	private async announce(actor: MiRemoteUser, activity: IAnnounce, resolver?: Resolver): Promise<string | void> {
		const uri = getApId(activity);

		this.logger.info(`Announce: ${uri}`);

		// eslint-disable-next-line no-param-reassign
		resolver ??= await this.apResolverService.createResolver();

		if (!activity.object) return 'skip: activity has no object property';
		const targetUri = getApId(activity.object);
		if (targetUri.startsWith('bear:')) return 'skip: bearcaps url not supported.';

		const target = await resolver.resolve(activity.object).catch(e => {
			this.logger.error(`Resolution failed: ${e}`);
			throw e;
		});

		if (isPost(target)) return await this.announceNote(actor, activity, target);

		return `skip: unknown object type ${getApType(target)}`;
	}

	@bindThis
	private async announceNote(actor: MiRemoteUser, activity: IAnnounce, target: IPost, resolver?: Resolver): Promise<string | void> {
		if (actor.isSuspended) {
			return;
		}

		// リレーからのAnnounceかチェック
		const fromRelay = await this.relayService.isRelayActor(actor);
		const uri = getApId(fromRelay ? target : activity);

		// アナウンス先が許可されているかチェック
		if (!this.utilityService.isFederationAllowedUri(uri)) return;

		const activityUri = getApId(activity);
		const unlock = await acquireApObjectLock(this.redisClient, activityUri);

		try {
			// 既に同じURIを持つものが登録されていないかチェック
			const exist = await this.apNoteService.fetchNote(uri);
			if (exist) {
				return;
			}

			// Announce対象をresolve
			let renote;
			try {
				renote = await this.apNoteService.resolveNote(target, { resolver });
				if (renote == null) return 'announce target is null';
			} catch (err) {
				// 対象が4xxならスキップ
				if (err instanceof StatusError) {
					if (!err.isRetryable) {
						return `Ignored announce target ${target.id} - ${err.statusCode}`;
					}
					return `Error in announce target ${target.id} - ${err.statusCode}`;
				}
				throw err;
			}

			// リレーからのAnnounceはリノートを作成せず、ノートを直接公開する
			if (fromRelay) {
				this.logger.info(`Publishing relay-delivered note: ${uri}`);
				const noteObj = await this.noteEntityService.pack(renote, null, { skipHide: true, withReactionAndUserPairCache: true });
				this.globalEventService.publishNotesStream(noteObj);
				return;
			}

			if (!await this.noteEntityService.isVisibleForMe(renote, actor.id)) {
				return 'skip: invalid actor for this activity';
			}

			this.logger.info(`Creating the (Re)Note: ${uri}`);

			const activityAudience = await this.apAudienceService.parseAudience(actor, activity.to, activity.cc, resolver);
			const createdAt = activity.published ? new Date(activity.published) : null;

			if (createdAt && createdAt < this.idService.parse(renote.id).date) {
				return 'skip: malformed createdAt';
			}

			await this.noteCreateService.create(actor, {
				createdAt,
				renote,
				visibility: activityAudience.visibility,
				visibleUsers: activityAudience.visibleUsers,
				uri,
			});
		} finally {
			unlock();
		}
	}

	@bindThis
	private async block(actor: MiRemoteUser, activity: IBlock): Promise<string> {
		// ※ activity.objectにブロック対象があり、それは存在するローカルユーザーのはず

		const blockee = await this.apDbResolverService.getUserFromApId(activity.object);

		if (blockee == null) {
			return 'skip: blockee not found';
		}

		if (blockee.host != null) {
			return 'skip: ブロックしようとしているユーザーはローカルユーザーではありません';
		}

		await this.userBlockingService.block(await this.usersRepository.findOneByOrFail({ id: actor.id }), await this.usersRepository.findOneByOrFail({ id: blockee.id }));
		return 'ok';
	}

	@bindThis
	private async create(actor: MiRemoteUser, activity: ICreate, resolver?: Resolver): Promise<string | void> {
		const uri = getApId(activity);

		this.logger.info(`Create: ${uri}`);

		if (!activity.object) return 'skip: activity has no object property';
		const targetUri = getApId(activity.object);
		if (targetUri.startsWith('bear:')) return 'skip: bearcaps url not supported.';

		// copy audiences between activity <=> object.
		if (typeof activity.object === 'object') {
			const to = unique(concat([toArray(activity.to), toArray(activity.object.to)]));
			const cc = unique(concat([toArray(activity.cc), toArray(activity.object.cc)]));

			activity.to = to;
			activity.cc = cc;
			activity.object.to = to;
			activity.object.cc = cc;
		}

		// If there is no attributedTo, use Activity actor.
		if (typeof activity.object === 'object' && !activity.object.attributedTo) {
			activity.object.attributedTo = activity.actor;
		}

		// eslint-disable-next-line no-param-reassign
		resolver ??= await this.apResolverService.createResolver();

		const object = await resolver.resolve(activity.object).catch(e => {
			this.logger.error(`Resolution failed: ${e}`);
			throw e;
		});

		if (isPost(object)) {
			await this.createNote(resolver, actor, object, false, activity);
		} else {
			return `Unknown type: ${getApType(object)}`;
		}
	}

	@bindThis
	private async createNote(resolver: Resolver, actor: MiRemoteUser, note: IObject, silent = false, activity?: ICreate): Promise<string> {
		const uri = getApId(note);

		if (typeof note === 'object') {
			if (actor.uri !== note.attributedTo) {
				return 'skip: actor.uri !== note.attributedTo';
			}

			if (typeof note.id === 'string') {
				if (this.utilityService.extractDbHost(actor.uri) !== this.utilityService.extractDbHost(note.id)) {
					return 'skip: host in actor.uri !== note.id';
				}
			} else {
				return 'skip: note.id is not a string';
			}
		}

		const unlock = await acquireApObjectLock(this.redisClient, uri);

		try {
			const exist = await this.apNoteService.fetchNote(note);
			if (exist) return 'skip: note exists';

			await this.apNoteService.createNote(note, actor, resolver, silent);
			return 'ok';
		} catch (err) {
			if (err instanceof StatusError && !err.isRetryable) {
				return `skip ${err.statusCode}`;
			} else {
				throw err;
			}
		} finally {
			unlock();
		}
	}

	@bindThis
	private async delete(actor: MiRemoteUser, activity: IDelete): Promise<string> {
		if (actor.uri !== getApId(activity.actor)) {
			return 'invalid actor';
		}

		// 削除対象objectのtype
		let formerType: string | undefined;

		if (typeof activity.object === 'string') {
			// typeが不明だけど、どうせ消えてるのでremote resolveしない
			formerType = undefined;
		} else {
			const object = activity.object;
			if (isTombstone(object)) {
				formerType = toSingle(object.formerType);
			} else {
				formerType = toSingle(object.type);
			}
		}

		const uri = getApId(activity.object);

		// FEP-044f: QuoteAuthorization (承認スタンプ) の失効
		if (formerType == null || formerType === 'QuoteAuthorization') {
			const revoked = await this.deleteQuoteAuthorization(actor, uri);
			if (revoked != null) return revoked;
		}

		// type不明でもactorとobjectが同じならばそれはPersonに違いない
		if (!formerType && actor.uri === uri) {
			formerType = 'Person';
		}

		// それでもなかったらおそらくNote
		if (!formerType) {
			formerType = 'Note';
		}

		if (validPost.includes(formerType)) {
			return await this.deleteNote(actor, uri);
		} else if (validActor.includes(formerType)) {
			return await this.deleteActor(actor, uri);
		} else {
			return `Unknown type ${formerType}`;
		}
	}

	@bindThis
	private async deleteActor(actor: MiRemoteUser, uri: string): Promise<string> {
		this.logger.info(`Deleting the Actor: ${uri}`);

		if (actor.uri !== uri) {
			return `skip: delete actor ${actor.uri} !== ${uri}`;
		}

		if (!(await this.usersRepository.update({ id: actor.id, isDeleted: false }, { isDeleted: true })).affected) {
			return 'skip: already deleted or actor not found';
		}

		const job = await this.queueService.createDeleteAccountJob(actor);

		this.globalEventService.publishInternalEvent('remoteUserUpdated', { id: actor.id });

		return `ok: queued ${job.name} ${job.id}`;
	}

	@bindThis
	private async deleteNote(actor: MiRemoteUser, uri: string): Promise<string> {
		this.logger.info(`Deleting the Note: ${uri}`);

		const unlock = await acquireApObjectLock(this.redisClient, uri);

		try {
			const note = await this.apDbResolverService.getNoteFromApId(uri);

			if (note == null) {
				return 'message not found';
			}

			if (note.userId !== actor.id) {
				return '投稿を削除しようとしているユーザーは投稿の作成者ではありません';
			}

			await this.noteDeleteService.delete(actor, note);
			return 'ok: note deleted';
		} finally {
			unlock();
		}
	}

	/**
	 * FEP-044f: QuoteAuthorization への Delete (承認の失効)。
	 * uri が既知の承認スタンプでなければ null を返し、通常の Delete 処理を継続させる。
	 */
	@bindThis
	private async deleteQuoteAuthorization(actor: MiRemoteUser, uri: string): Promise<string | null> {
		const note = await this.notesRepository.findOne({ where: { quoteAuthorizationUri: uri }, relations: { renote: true } });
		if (note == null) return null;

		if (note.renote == null || note.renote.userId !== actor.id) {
			return 'skip: actor is not the quoted note author';
		}

		if (note.userHost == null) {
			return await this.revokeQuote(note, actor);
		} else {
			// リモートの引用ノートは記録だけ更新する (表示の enforcement はしない)
			await this.notesRepository.update(note.id, { quoteAuthorizationUri: null });
			return 'ok: quote authorization cleared';
		}
	}

	@bindThis
	private async flag(actor: MiRemoteUser, activity: IFlag): Promise<string> {
		// objectは `(User|Note) | (User|Note)[]` だけど、全パターンDBスキーマと対応させられないので
		// 対象ユーザーは一番最初のユーザー として あとはコメントとして格納する
		const uris = getApIds(activity.object);

		const userIds = uris
			.filter(uri => uri.startsWith(this.config.url + '/users/'))
			.map(uri => uri.split('/').at(-1))
			.filter(x => x != null);
		const users = await this.usersRepository.findBy({
			id: In(userIds),
		});
		if (users.length < 1) return 'skip';

		await this.abuseReportService.report([{
			targetUserId: users[0].id,
			targetUserHost: users[0].host,
			reporterId: actor.id,
			reporterHost: actor.host,
			comment: `${activity.content}\n${JSON.stringify(uris, null, 2)}`,
		}]);

		return 'ok';
	}

	@bindThis
	private async reject(actor: MiRemoteUser, activity: IReject, resolver?: Resolver): Promise<string> {
		const uri = activity.id ?? activity;

		this.logger.info(`Reject: ${uri}`);

		// FEP-044f: 自ホスト発の QuoteRequest への Reject
		const quoteRequestNoteId = this.parseLocalQuoteRequestUri(activity.object);
		if (quoteRequestNoteId != null) {
			return await this.rejectQuoteRequest(actor, quoteRequestNoteId);
		}

		// eslint-disable-next-line no-param-reassign
		resolver ??= await this.apResolverService.createResolver();

		const object = await resolver.resolve(activity.object).catch(e => {
			this.logger.error(`Resolution failed: ${e}`);
			throw e;
		});

		if (isFollow(object)) return await this.rejectFollow(actor, object);

		return `skip: Unknown Reject type: ${getApType(object)}`;
	}

	@bindThis
	private async rejectFollow(actor: MiRemoteUser, activity: IFollow): Promise<string> {
		// ※ activityはこっちから投げたフォローリクエストなので、activity.actorは存在するローカルユーザーである必要がある

		const follower = await this.apDbResolverService.getUserFromApId(activity.actor);

		if (follower == null) {
			return 'skip: follower not found';
		}

		if (!this.userEntityService.isLocalUser(follower)) {
			return 'skip: follower is not a local user';
		}

		// relay
		const match = activity.id?.match(/follow-relay\/(\w+)/);
		if (match) {
			return await this.relayService.relayRejected(match[1]);
		}

		await this.userFollowingService.remoteReject(actor, follower);
		return 'ok';
	}

	/**
	 * FEP-044f: こちらから送った QuoteRequest への Reject を処理する。
	 * ノートは削除せず、拒否フラグを立てて表示側で引用の埋め込みを止め、作者に通知する。
	 */
	@bindThis
	private async rejectQuoteRequest(actor: MiRemoteUser, noteId: string): Promise<string> {
		const note = await this.notesRepository.findOne({ where: { id: noteId }, relations: { renote: true } });
		if (note == null) return 'skip: note not found';
		if (note.userHost != null) return 'skip: not a local note';
		if (note.renote == null) return 'skip: not a quote';

		if (note.renote.userId !== actor.id) {
			return 'skip: actor is not the quoted note author';
		}

		return await this.revokeQuote(note, actor);
	}

	/**
	 * FEP-044f: 引用の拒否/失効をノートに記録し、作者へ通知する。冪等。
	 */
	@bindThis
	private async revokeQuote(note: MiNote, actor: MiRemoteUser): Promise<string> {
		const updated = await this.notesRepository.update({ id: note.id, quoteRejected: false }, {
			quoteRejected: true,
			quoteAuthorizationUri: null,
		});
		if (!updated.affected) {
			return 'skip: quote already revoked';
		}

		return 'ok: quote revoked';
	}

	/**
	 * FEP-044f: リモートからの QuoteRequest を処理する。
	 * ローカルユーザーの引用許可は常に自動 public 承認 (non-modifiable) なので、
	 * 対象が公開ノートであれば即 Accept + 承認スタンプ URL を返す。
	 */
	@bindThis
	private async quoteRequest(actor: MiRemoteUser, activity: IQuoteRequest): Promise<string> {
		if (actor.uri !== getApId(activity.actor)) {
			return 'skip: invalid actor';
		}

		this.logger.info(`QuoteRequest: ${activity.id ?? '(no id)'}`);

		const targetUri = getApId(activity.object);

		const note = await this.apDbResolverService.getNoteFromApId(targetUri);
		if (note == null || note.userHost != null) {
			return 'skip: quoted note is not local';
		}

		const instrument = toArray(activity.instrument).at(0);
		if (instrument == null) return 'skip: no instrument';
		let quotingUri: string;
		try {
			quotingUri = getApId(instrument);
		} catch {
			return 'skip: invalid instrument';
		}

		const quotedUser = await this.usersRepository.findOneBy({ id: note.userId });
		if (quotedUser == null || !this.userEntityService.isLocalUser(quotedUser)) {
			return 'skip: quoted note author is not local';
		}

		// Accept/Reject でエコーする QuoteRequest (instrument は embed しない)
		const echo: IQuoteRequest = {
			type: 'QuoteRequest',
			...(activity.id != null ? { id: activity.id } : {}),
			actor: getApId(activity.actor),
			object: targetUri,
			instrument: quotingUri,
		};

		const deliverReject = (): void => {
			const content = this.apRendererService.addContext(this.apRendererService.renderReject(echo, quotedUser));
			this.queueService.deliver(quotedUser, content, actor.inbox, false);
		};

		// なりすまし防止: 引用ノートは QuoteRequest の actor と同一ホストであること
		if (this.utilityService.extractDbHost(quotingUri) !== actor.host) {
			deliverReject();
			return 'ok: rejected (instrument host mismatch)';
		}

		// 引用できるのは公開 (public/home) かつ連合するノートのみ
		if (!['public', 'home'].includes(note.visibility) || note.localOnly) {
			deliverReject();
			return 'ok: rejected (quoted note is not publicly quotable)';
		}

		// ホームノートは public の引用を承認しない (ローカルでの引用が home 以下に制限されるのと同じ扱い)
		// instrument がインラインされていない場合は宛先を判定できないため、自動承認の既定に従って通す
		if (note.visibility === 'home' && typeof instrument !== 'string') {
			const publicIds = ['https://www.w3.org/ns/activitystreams#Public', 'as:Public', 'Public'];
			let isPublicQuote = false;
			try {
				isPublicQuote = getApIds(instrument.to).some(id => publicIds.includes(id));
			} catch {
				isPublicQuote = false;
			}
			if (isPublicQuote) {
				deliverReject();
				return 'ok: rejected (home note cannot be quoted publicly)';
			}
		}

		// ブロックしている相手には許可しない (スタンプ URL は決定論的なので完全な防御ではない)
		if (await this.userBlockingService.checkBlocked(note.userId, actor.id)) {
			deliverReject();
			return 'ok: rejected (blocked)';
		}

		const stampUrl = this.apRendererService.genQuoteAuthorizationUrl(note.id, quotingUri);
		const accept = this.apRendererService.addContext(this.apRendererService.renderAccept(echo, quotedUser, stampUrl));
		this.queueService.deliver(quotedUser, accept, actor.inbox, false);

		// Mastodon 等は Accept 後の引用ノートを Update で配送するが、Misskey は Update<Note> を受信できないため
		// ここで best-effort に取り込んでおく (取り込みに成功すれば既存の quote 通知も発火する)
		setImmediate(() => {
			this.apNoteService.resolveNote(quotingUri).catch(err => {
				this.logger.warn(`failed to resolve quoting note ${quotingUri}: ${err}`);
			});
		});

		return 'ok';
	}

	@bindThis
	private async remove(actor: MiRemoteUser, activity: IRemove, resolver?: Resolver): Promise<string | void> {
		if (actor.uri !== getApId(activity.actor)) {
			return 'invalid actor';
		}

		if (activity.target == null) {
			return 'target is null';
		}

		if (activity.target === actor.featured) {
			const note = await this.apNoteService.resolveNote(activity.object, { resolver });
			if (note == null) return 'note not found';
			await this.notePiningService.removePinned(actor, note.id);
			return;
		}

		return `unknown target: ${activity.target}`;
	}

	@bindThis
	private async undo(actor: MiRemoteUser, activity: IUndo, resolver?: Resolver): Promise<string> {
		if (actor.uri !== getApId(activity.actor)) {
			return 'invalid actor';
		}

		const uri = activity.id ?? activity;

		this.logger.info(`Undo: ${uri}`);

		// eslint-disable-next-line no-param-reassign
		resolver ??= await this.apResolverService.createResolver();

		const object = await resolver.resolve(activity.object).catch(e => {
			this.logger.error(`Resolution failed: ${e}`);
			throw e;
		});

		// don't queue because the sender may attempt again when timeout
		if (isFollow(object)) return await this.undoFollow(actor, object);
		if (isBlock(object)) return await this.undoBlock(actor, object);
		if (isLike(object)) return await this.undoLike(actor, object);
		if (isAnnounce(object)) return await this.undoAnnounce(actor, object);
		if (isAccept(object)) return await this.undoAccept(actor, object);

		return `skip: unknown object type ${getApType(object)}`;
	}

	@bindThis
	private async undoAccept(actor: MiRemoteUser, activity: IAccept): Promise<string> {
		const follower = await this.apDbResolverService.getUserFromApId(activity.object);
		if (follower == null) {
			return 'skip: follower not found';
		}

		const isFollowing = await this.followingsRepository.exists({
			where: {
				followerId: follower.id,
				followeeId: actor.id,
			},
		});

		if (isFollowing) {
			await this.userFollowingService.unfollow(follower, actor);
			return 'ok: unfollowed';
		}

		return 'skip: フォローされていない';
	}

	@bindThis
	private async undoAnnounce(actor: MiRemoteUser, activity: IAnnounce): Promise<string> {
		const uri = getApId(activity);

		const note = await this.notesRepository.findOneBy({
			uri,
			userId: actor.id,
		});

		if (!note) return 'skip: no such Announce';

		await this.noteDeleteService.delete(actor, note);
		return 'ok: deleted';
	}

	@bindThis
	private async undoBlock(actor: MiRemoteUser, activity: IBlock): Promise<string> {
		const blockee = await this.apDbResolverService.getUserFromApId(activity.object);

		if (blockee == null) {
			return 'skip: blockee not found';
		}

		if (blockee.host != null) {
			return 'skip: ブロック解除しようとしているユーザーはローカルユーザーではありません';
		}

		await this.userBlockingService.unblock(await this.usersRepository.findOneByOrFail({ id: actor.id }), blockee);
		return 'ok';
	}

	@bindThis
	private async undoFollow(actor: MiRemoteUser, activity: IFollow): Promise<string> {
		const followee = await this.apDbResolverService.getUserFromApId(activity.object);
		if (followee == null) {
			return 'skip: followee not found';
		}

		if (followee.host != null) {
			return 'skip: フォロー解除しようとしているユーザーはローカルユーザーではありません';
		}

		const requestExist = await this.followRequestsRepository.exists({
			where: {
				followerId: actor.id,
				followeeId: followee.id,
			},
		});

		const isFollowing = await this.followingsRepository.exists({
			where: {
				followerId: actor.id,
				followeeId: followee.id,
			},
		});

		if (requestExist) {
			await this.userFollowingService.cancelFollowRequest(followee, actor);
			return 'ok: follow request canceled';
		}

		if (isFollowing) {
			await this.userFollowingService.unfollow(actor, followee);
			return 'ok: unfollowed';
		}

		return 'skip: リクエストもフォローもされていない';
	}

	@bindThis
	private async undoLike(actor: MiRemoteUser, activity: ILike): Promise<string> {
		const targetUri = getApId(activity.object);

		const note = await this.apNoteService.fetchNote(targetUri);
		if (!note) return `skip: target note not found ${targetUri}`;

		await this.reactionService.delete(actor, note).catch(e => {
			if (e.id === '60527ec9-b4cb-4a88-a6bd-32d3ad26817d') return;
			throw e;
		});

		return 'ok';
	}

	@bindThis
	private async update(actor: MiRemoteUser, activity: IUpdate, resolver?: Resolver): Promise<string> {
		if (actor.uri !== getApId(activity.actor)) {
			return 'skip: invalid actor';
		}

		this.logger.debug('Update');

		// eslint-disable-next-line no-param-reassign
		resolver ??= await this.apResolverService.createResolver();

		const object = await resolver.resolve(activity.object).catch(e => {
			this.logger.error(`Resolution failed: ${e}`);
			throw e;
		});

		if (isActor(object)) {
			await this.apPersonService.updatePerson(actor.uri, resolver, object);
			return 'ok: Person updated';
		} else if (getApType(object) === 'Question') {
			await this.apQuestionService.updateQuestion(object, actor, resolver).catch(err => console.error(err));
			return 'ok: Question updated';
		} else {
			return `skip: Unknown type: ${getApType(object)}`;
		}
	}

	@bindThis
	private async move(actor: MiRemoteUser, activity: IMove, resolver?: Resolver): Promise<string> {
		// fetch the new and old accounts
		const targetUri = getApHrefNullable(activity.target);
		if (!targetUri) return 'skip: invalid activity target';

		return await this.apPersonService.updatePerson(actor.uri, resolver) ?? 'skip: nothing to do';
	}
}
