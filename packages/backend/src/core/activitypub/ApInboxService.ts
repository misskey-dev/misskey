/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { In } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import { UserFollowingService } from '@/core/UserFollowingService.js';
import { ReactionService } from '@/core/ReactionService.js';
import { RelayService } from '@/core/RelayService.js';
import { NotePiningService } from '@/core/NotePiningService.js';
import { UserBlockingService } from '@/core/UserBlockingService.js';
import { NoteDeleteService } from '@/core/NoteDeleteService.js';
import { NoteCreateService } from '@/core/NoteCreateService.js';
import { concat, toArray, toSingle, unique } from '@/misc/prelude/array.js';
import { AppLockService } from '@/core/AppLockService.js';
import type Logger from '@/logger.js';
import { MetaService } from '@/core/MetaService.js';
import { AccountMoveService } from '@/core/AccountMoveService.js';
import { IdService } from '@/core/IdService.js';
import { StatusError } from '@/misc/status-error.js';
import { UtilityService } from '@/core/UtilityService.js';
import { CacheService } from '@/core/CacheService.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { QueueService } from '@/core/QueueService.js';
import type { UsersRepository, NotesRepository, FollowingsRepository, AbuseUserReportsRepository, FollowRequestsRepository } from '@/models/index.js';
import { bindThis } from '@/decorators.js';
import type { RemoteUser } from '@/models/entities/User.js';
import { getApHrefNullable, getApId, getApIds, getApType, isAccept, isActor, isAdd, isAnnounce, isBlock, isCollection, isCollectionOrOrderedCollection, isCreate, isDelete, isFlag, isFollow, isLike, isMove, isPost, isReject, isRemove, isTombstone, isUndo, isUpdate, validActor, validPost } from './type.js';
import { ApNoteService } from './models/ApNoteService.js';
import { ApLoggerService } from './ApLoggerService.js';
import { ApDbResolverService } from './ApDbResolverService.js';
import { ApResolverService } from './ApResolverService.js';
import { ApAudienceService } from './ApAudienceService.js';
import { ApPersonService } from './models/ApPersonService.js';
import { ApQuestionService } from './models/ApQuestionService.js';
import type { Resolver } from './ApResolverService.js';
import type { IAccept, IAdd, IAnnounce, IBlock, ICreate, IDelete, IFlag, IFollow, ILike, IObject, IReject, IRemove, IUndo, IUpdate, IMove } from './type.js';

@Injectable()
export class ApInboxService {
	private logger: Logger;

	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,

		@Inject(DI.abuseUserReportsRepository)
		private abuseUserReportsRepository: AbuseUserReportsRepository,

		@Inject(DI.followRequestsRepository)
		private followRequestsRepository: FollowRequestsRepository,

		private userEntityService: UserEntityService,
		private noteEntityService: NoteEntityService,
		private utilityService: UtilityService,
		private idService: IdService,
		private metaService: MetaService,
		private userFollowingService: UserFollowingService,
		private apAudienceService: ApAudienceService,
		private reactionService: ReactionService,
		private relayService: RelayService,
		private notePiningService: NotePiningService,
		private userBlockingService: UserBlockingService,
		private noteCreateService: NoteCreateService,
		private noteDeleteService: NoteDeleteService,
		private appLockService: AppLockService,
		private apResolverService: ApResolverService,
		private apDbResolverService: ApDbResolverService,
		private apLoggerService: ApLoggerService,
		private apNoteService: ApNoteService,
		private apPersonService: ApPersonService,
		private apQuestionService: ApQuestionService,
		private accountMoveService: AccountMoveService,
		private cacheService: CacheService,
		private queueService: QueueService,
	) {
		this.logger = this.apLoggerService.logger;
	}

	@bindThis
	public async performActivity(actor: RemoteUser, activity: IObject): Promise<void> {
		if (isCollectionOrOrderedCollection(activity)) {
			const resolver = this.apResolverService.createResolver();
			for (const item of toArray(isCollection(activity) ? activity.items : activity.orderedItems)) {
				const act = await resolver.resolve(item);
				try {
					await this.performOneActivity(actor, act);
				} catch (err) {
					if (err instanceof Error || typeof err === 'string') {
						this.logger.error(err);
					}
				}
			}
		} else {
			await this.performOneActivity(actor, activity);
		}

		// ついでにリモートユーザーの情報が古かったら更新しておく
		if (actor.uri) {
			if (actor.lastFetchedAt == null || Date.now() - actor.lastFetchedAt.getTime() > 1000 * 60 * 60 * 24) {
				setImmediate(() => {
					this.apPersonService.updatePerson(actor.uri);
				});
			}
		}
	}

	@bindThis
	public async performOneActivity(actor: RemoteUser, activity: IObject): Promise<void> {
		if (actor.isSuspended) return;

		if (isCreate(activity)) {
			await this.create(actor, activity);
		} else if (isDelete(activity)) {
			await this.delete(actor, activity);
		} else if (isUpdate(activity)) {
			await this.update(actor, activity);
		} else if (isFollow(activity)) {
			await this.follow(actor, activity);
		} else if (isAccept(activity)) {
			await this.accept(actor, activity);
		} else if (isReject(activity)) {
			await this.reject(actor, activity);
		} else if (isAdd(activity)) {
			await this.add(actor, activity).catch(err => this.logger.error(err));
		} else if (isRemove(activity)) {
			await this.remove(actor, activity).catch(err => this.logger.error(err));
		} else if (isAnnounce(activity)) {
			await this.announce(actor, activity);
		} else if (isLike(activity)) {
			await this.like(actor, activity);
		} else if (isUndo(activity)) {
			await this.undo(actor, activity);
		} else if (isBlock(activity)) {
			await this.block(actor, activity);
		} else if (isFlag(activity)) {
			await this.flag(actor, activity);
		} else if (isMove(activity)) {
			await this.move(actor, activity);
		} else {
			this.logger.warn(`unrecognized activity type: ${activity.type}`);
		}
	}

	@bindThis
	private async follow(actor: RemoteUser, activity: IFollow): Promise<string> {
		const followee = await this.apDbResolverService.getUserFromApId(activity.object);

		if (followee == null) {
			return 'skip: followee not found';
		}

		if (followee.host != null) {
			return 'skip: フォローしようとしているユーザーはローカルユーザーではありません';
		}

		// don't queue because the sender may attempt again when timeout
		await this.userFollowingService.follow(actor, followee, activity.id);
		return 'ok';
	}

	@bindThis
	private async like(actor: RemoteUser, activity: ILike): Promise<string> {
		const targetUri = getApId(activity.object);

		const note = await this.apNoteService.fetchNote(targetUri);
		if (!note) return `skip: target note not found ${targetUri}`;

		await this.apNoteService.extractEmojis(activity.tag ?? [], actor.host).catch(() => null);

		return await this.reactionService.create(actor, note, activity._misskey_reaction ?? activity.content ?? activity.name).catch(err => {
			if (err.id === '51c42bb4-931a-456b-bff7-e5a8a70dd298') {
				return 'skip: already reacted';
			} else {
				throw err;
			}
		}).then(() => 'ok');
	}

	@bindThis
	private async accept(actor: RemoteUser, activity: IAccept): Promise<string> {
		const uri = activity.id ?? activity;

		this.logger.info(`Accept: ${uri}`);

		const resolver = this.apResolverService.createResolver();

		const object = await resolver.resolve(activity.object).catch(err => {
			this.logger.error(`Resolution failed: ${err}`);
			throw err;
		});

		if (isFollow(object)) return await this.acceptFollow(actor, object);

		return `skip: Unknown Accept type: ${getApType(object)}`;
	}

	@bindThis
	private async acceptFollow(actor: RemoteUser, activity: IFollow): Promise<string> {
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
	private async add(actor: RemoteUser, activity: IAdd): Promise<void> {
		if (actor.uri !== activity.actor) {
			throw new Error('invalid actor');
		}

		if (activity.target == null) {
			throw new Error('target is null');
		}

		if (activity.target === actor.featured) {
			const note = await this.apNoteService.resolveNote(activity.object);
			if (note == null) throw new Error('note not found');
			await this.notePiningService.addPinned(actor, note.id);
			return;
		}

		throw new Error(`unknown target: ${activity.target}`);
	}

	@bindThis
	private async announce(actor: RemoteUser, activity: IAnnounce): Promise<void> {
		const uri = getApId(activity);

		this.logger.info(`Announce: ${uri}`);

		const targetUri = getApId(activity.object);

		this.announceNote(actor, activity, targetUri);
	}

	@bindThis
	private async announceNote(actor: RemoteUser, activity: IAnnounce, targetUri: string): Promise<void> {
		const uri = getApId(activity);

		if (actor.isSuspended) {
			return;
		}

		// アナウンス先をブロックしてたら中断
		const meta = await this.metaService.fetch();
		if (this.utilityService.isBlockedHost(meta.blockedHosts, this.utilityService.extractDbHost(uri))) return;

		const unlock = await this.appLockService.getApLock(uri);

		try {
			// 既に同じURIを持つものが登録されていないかチェック
			const exist = await this.apNoteService.fetchNote(uri);
			if (exist) {
				return;
			}

			// Announce対象をresolve
			let renote;
			try {
				renote = await this.apNoteService.resolveNote(targetUri);
				if (renote == null) throw new Error('announce target is null');
			} catch (err) {
				// 対象が4xxならスキップ
				if (err instanceof StatusError) {
					if (err.isClientError) {
						this.logger.warn(`Ignored announce target ${targetUri} - ${err.statusCode}`);
						return;
					}

					this.logger.warn(`Error in announce target ${targetUri} - ${err.statusCode}`);
				}
				throw err;
			}

			if (!await this.noteEntityService.isVisibleForMe(renote, actor.id)) {
				this.logger.warn('skip: invalid actor for this activity');
				return;
			}

			this.logger.info(`Creating the (Re)Note: ${uri}`);

			const activityAudience = await this.apAudienceService.parseAudience(actor, activity.to, activity.cc);

			await this.noteCreateService.create(actor, {
				createdAt: activity.published ? new Date(activity.published) : null,
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
	private async block(actor: RemoteUser, activity: IBlock): Promise<string> {
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
	private async create(actor: RemoteUser, activity: ICreate): Promise<void> {
		const uri = getApId(activity);

		this.logger.info(`Create: ${uri}`);

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

		const resolver = this.apResolverService.createResolver();

		const object = await resolver.resolve(activity.object).catch(e => {
			this.logger.error(`Resolution failed: ${e}`);
			throw e;
		});

		if (isPost(object)) {
			this.createNote(resolver, actor, object, false, activity);
		} else {
			this.logger.warn(`Unknown type: ${getApType(object)}`);
		}
	}

	@bindThis
	private async createNote(resolver: Resolver, actor: RemoteUser, note: IObject, silent = false, activity?: ICreate): Promise<string> {
		const uri = getApId(note);

		if (typeof note === 'object') {
			if (actor.uri !== note.attributedTo) {
				return 'skip: actor.uri !== note.attributedTo';
			}

			if (typeof note.id === 'string') {
				if (this.utilityService.extractDbHost(actor.uri) !== this.utilityService.extractDbHost(note.id)) {
					return 'skip: host in actor.uri !== note.id';
				}
			}
		}

		const unlock = await this.appLockService.getApLock(uri);

		try {
			const exist = await this.apNoteService.fetchNote(note);
			if (exist) return 'skip: note exists';

			await this.apNoteService.createNote(note, resolver, silent);
			return 'ok';
		} catch (err) {
			if (err instanceof StatusError && err.isClientError) {
				return `skip ${err.statusCode}`;
			} else {
				throw err;
			}
		} finally {
			unlock();
		}
	}

	@bindThis
	private async delete(actor: RemoteUser, activity: IDelete): Promise<string> {
		if (actor.uri !== activity.actor) {
			throw new Error('invalid actor');
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
	private async deleteActor(actor: RemoteUser, uri: string): Promise<string> {
		this.logger.info(`Deleting the Actor: ${uri}`);

		if (actor.uri !== uri) {
			return `skip: delete actor ${actor.uri} !== ${uri}`;
		}

		const user = await this.usersRepository.findOneBy({ id: actor.id });
		if (user == null) {
			return 'skip: actor not found';
		} else if (user.isDeleted) {
			return 'skip: already deleted';
		}

		const job = await this.queueService.createDeleteAccountJob(actor);

		await this.usersRepository.update(actor.id, {
			isDeleted: true,
		});

		return `ok: queued ${job.name} ${job.id}`;
	}

	@bindThis
	private async deleteNote(actor: RemoteUser, uri: string): Promise<string> {
		this.logger.info(`Deleting the Note: ${uri}`);

		const unlock = await this.appLockService.getApLock(uri);

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

	@bindThis
	private async flag(actor: RemoteUser, activity: IFlag): Promise<string> {
		// objectは `(User|Note) | (User|Note)[]` だけど、全パターンDBスキーマと対応させられないので
		// 対象ユーザーは一番最初のユーザー として あとはコメントとして格納する
		const uris = getApIds(activity.object);

		const userIds = uris
			.filter(uri => uri.startsWith(this.config.url + '/users/'))
			.map(uri => uri.split('/').at(-1))
			.filter((userId): userId is string => userId !== undefined);
		const users = await this.usersRepository.findBy({
			id: In(userIds),
		});
		if (users.length < 1) return 'skip';

		await this.abuseUserReportsRepository.insert({
			id: this.idService.genId(),
			createdAt: new Date(),
			targetUserId: users[0].id,
			targetUserHost: users[0].host,
			reporterId: actor.id,
			reporterHost: actor.host,
			comment: `${activity.content}\n${JSON.stringify(uris, null, 2)}`,
		});

		return 'ok';
	}

	@bindThis
	private async reject(actor: RemoteUser, activity: IReject): Promise<string> {
		const uri = activity.id ?? activity;

		this.logger.info(`Reject: ${uri}`);

		const resolver = this.apResolverService.createResolver();

		const object = await resolver.resolve(activity.object).catch(e => {
			this.logger.error(`Resolution failed: ${e}`);
			throw e;
		});

		if (isFollow(object)) return await this.rejectFollow(actor, object);

		return `skip: Unknown Reject type: ${getApType(object)}`;
	}

	@bindThis
	private async rejectFollow(actor: RemoteUser, activity: IFollow): Promise<string> {
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

	@bindThis
	private async remove(actor: RemoteUser, activity: IRemove): Promise<void> {
		if (actor.uri !== activity.actor) {
			throw new Error('invalid actor');
		}

		if (activity.target == null) {
			throw new Error('target is null');
		}

		if (activity.target === actor.featured) {
			const note = await this.apNoteService.resolveNote(activity.object);
			if (note == null) throw new Error('note not found');
			await this.notePiningService.removePinned(actor, note.id);
			return;
		}

		throw new Error(`unknown target: ${activity.target}`);
	}

	@bindThis
	private async undo(actor: RemoteUser, activity: IUndo): Promise<string> {
		if (actor.uri !== activity.actor) {
			throw new Error('invalid actor');
		}

		const uri = activity.id ?? activity;

		this.logger.info(`Undo: ${uri}`);

		const resolver = this.apResolverService.createResolver();

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
	private async undoAccept(actor: RemoteUser, activity: IAccept): Promise<string> {
		const follower = await this.apDbResolverService.getUserFromApId(activity.object);
		if (follower == null) {
			return 'skip: follower not found';
		}

		const isFollowing = await this.followingsRepository.exist({
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
	private async undoAnnounce(actor: RemoteUser, activity: IAnnounce): Promise<string> {
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
	private async undoBlock(actor: RemoteUser, activity: IBlock): Promise<string> {
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
	private async undoFollow(actor: RemoteUser, activity: IFollow): Promise<string> {
		const followee = await this.apDbResolverService.getUserFromApId(activity.object);
		if (followee == null) {
			return 'skip: followee not found';
		}

		if (followee.host != null) {
			return 'skip: フォロー解除しようとしているユーザーはローカルユーザーではありません';
		}

		const requestExist = await this.followRequestsRepository.exist({
			where: {
				followerId: actor.id,
				followeeId: followee.id,
			},
		});

		const isFollowing = await this.followingsRepository.exist({
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
	private async undoLike(actor: RemoteUser, activity: ILike): Promise<string> {
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
	private async update(actor: RemoteUser, activity: IUpdate): Promise<string> {
		if (actor.uri !== activity.actor) {
			return 'skip: invalid actor';
		}

		this.logger.debug('Update');

		const resolver = this.apResolverService.createResolver();

		const object = await resolver.resolve(activity.object).catch(e => {
			this.logger.error(`Resolution failed: ${e}`);
			throw e;
		});

		if (isActor(object)) {
			await this.apPersonService.updatePerson(actor.uri, resolver, object);
			return 'ok: Person updated';
		} else if (getApType(object) === 'Question') {
			await this.apQuestionService.updateQuestion(object, resolver).catch(err => console.error(err));
			return 'ok: Question updated';
		} else {
			return `skip: Unknown type: ${getApType(object)}`;
		}
	}

	@bindThis
	private async move(actor: RemoteUser, activity: IMove): Promise<string> {
		// fetch the new and old accounts
		const targetUri = getApHrefNullable(activity.target);
		if (!targetUri) return 'skip: invalid activity target';

		return await this.apPersonService.updatePerson(actor.uri) ?? 'skip: nothing to do';
	}
}
