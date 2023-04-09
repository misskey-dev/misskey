import { Inject, Injectable } from '@nestjs/common';
import promiseLimit from 'promise-limit';
import { DataSource } from 'typeorm';
import { ModuleRef } from '@nestjs/core';
import { DI } from '@/di-symbols.js';
import type { FollowingsRepository, InstancesRepository, UserProfilesRepository, UserPublickeysRepository, UsersRepository } from '@/models/index.js';
import type { Config } from '@/config.js';
import type { RemoteUser } from '@/models/entities/User.js';
import { User } from '@/models/entities/User.js';
import { truncate } from '@/misc/truncate.js';
import type { CacheService } from '@/core/CacheService.js';
import { normalizeForSearch } from '@/misc/normalize-for-search.js';
import { isDuplicateKeyValueError } from '@/misc/is-duplicate-key-value-error.js';
import type Logger from '@/logger.js';
import type { Note } from '@/models/entities/Note.js';
import type { IdService } from '@/core/IdService.js';
import type { MfmService } from '@/core/MfmService.js';
import type { Emoji } from '@/models/entities/Emoji.js';
import { toArray } from '@/misc/prelude/array.js';
import type { GlobalEventService } from '@/core/GlobalEventService.js';
import type { FederatedInstanceService } from '@/core/FederatedInstanceService.js';
import type { FetchInstanceMetadataService } from '@/core/FetchInstanceMetadataService.js';
import { UserProfile } from '@/models/entities/UserProfile.js';
import { UserPublickey } from '@/models/entities/UserPublickey.js';
import type UsersChart from '@/core/chart/charts/users.js';
import type InstanceChart from '@/core/chart/charts/instance.js';
import type { HashtagService } from '@/core/HashtagService.js';
import { UserNotePining } from '@/models/entities/UserNotePining.js';
import { StatusError } from '@/misc/status-error.js';
import type { UtilityService } from '@/core/UtilityService.js';
import type { UserEntityService } from '@/core/entities/UserEntityService.js';
import { bindThis } from '@/decorators.js';
import { MetaService } from '@/core/MetaService.js';
import { DriveFileEntityService } from '@/core/entities/DriveFileEntityService.js';
import { getApId, getApType, getOneApHrefNullable, isActor, isCollection, isCollectionOrOrderedCollection, isPropertyValue } from '../type.js';
import { extractApHashtags } from './tag.js';
import type { OnModuleInit } from '@nestjs/common';
import type { ApNoteService } from './ApNoteService.js';
import type { ApMfmService } from '../ApMfmService.js';
import type { ApResolverService, Resolver } from '../ApResolverService.js';
import type { ApLoggerService } from '../ApLoggerService.js';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import type { ApImageService } from './ApImageService.js';
import type { IActor, IObject } from '../type.js';

const nameLength = 128;
const summaryLength = 2048;

@Injectable()
export class ApPersonService implements OnModuleInit {
	private utilityService: UtilityService;
	private userEntityService: UserEntityService;
	private driveFileEntityService: DriveFileEntityService;
	private idService: IdService;
	private globalEventService: GlobalEventService;
	private metaService: MetaService;
	private federatedInstanceService: FederatedInstanceService;
	private fetchInstanceMetadataService: FetchInstanceMetadataService;
	private cacheService: CacheService;
	private apResolverService: ApResolverService;
	private apNoteService: ApNoteService;
	private apImageService: ApImageService;
	private apMfmService: ApMfmService;
	private mfmService: MfmService;
	private hashtagService: HashtagService;
	private usersChart: UsersChart;
	private instanceChart: InstanceChart;
	private apLoggerService: ApLoggerService;
	private logger: Logger;

	constructor(
		private moduleRef: ModuleRef,

		@Inject(DI.config)
		private config: Config,

		@Inject(DI.db)
		private db: DataSource,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		@Inject(DI.userPublickeysRepository)
		private userPublickeysRepository: UserPublickeysRepository,

		@Inject(DI.instancesRepository)
		private instancesRepository: InstancesRepository,

		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,

		//private utilityService: UtilityService,
		//private userEntityService: UserEntityService,
		//private idService: IdService,
		//private globalEventService: GlobalEventService,
		//private metaService: MetaService,
		//private federatedInstanceService: FederatedInstanceService,
		//private fetchInstanceMetadataService: FetchInstanceMetadataService,
		//private cacheService: CacheService,
		//private apResolverService: ApResolverService,
		//private apNoteService: ApNoteService,
		//private apImageService: ApImageService,
		//private apMfmService: ApMfmService,
		//private mfmService: MfmService,
		//private hashtagService: HashtagService,
		//private usersChart: UsersChart,
		//private instanceChart: InstanceChart,
		//private apLoggerService: ApLoggerService,
	) {
	}

	onModuleInit() {
		this.utilityService = this.moduleRef.get('UtilityService');
		this.userEntityService = this.moduleRef.get('UserEntityService');
		this.driveFileEntityService = this.moduleRef.get('DriveFileEntityService');
		this.idService = this.moduleRef.get('IdService');
		this.globalEventService = this.moduleRef.get('GlobalEventService');
		this.metaService = this.moduleRef.get('MetaService');
		this.federatedInstanceService = this.moduleRef.get('FederatedInstanceService');
		this.fetchInstanceMetadataService = this.moduleRef.get('FetchInstanceMetadataService');
		this.cacheService = this.moduleRef.get('CacheService');
		this.apResolverService = this.moduleRef.get('ApResolverService');
		this.apNoteService = this.moduleRef.get('ApNoteService');
		this.apImageService = this.moduleRef.get('ApImageService');
		this.apMfmService = this.moduleRef.get('ApMfmService');
		this.mfmService = this.moduleRef.get('MfmService');
		this.hashtagService = this.moduleRef.get('HashtagService');
		this.usersChart = this.moduleRef.get('UsersChart');
		this.instanceChart = this.moduleRef.get('InstanceChart');
		this.apLoggerService = this.moduleRef.get('ApLoggerService');
		this.logger = this.apLoggerService.logger;
	}

	/**
	 * Validate and convert to actor object
	 * @param x Fetched object
	 * @param uri Fetch target URI
	 */
	@bindThis
	private validateActor(x: IObject, uri: string): IActor {
		const expectHost = this.utilityService.toPuny(new URL(uri).hostname);

		if (x == null) {
			throw new Error('invalid Actor: object is null');
		}

		if (!isActor(x)) {
			throw new Error(`invalid Actor type '${x.type}'`);
		}

		if (!(typeof x.id === 'string' && x.id.length > 0)) {
			throw new Error('invalid Actor: wrong id');
		}

		if (!(typeof x.inbox === 'string' && x.inbox.length > 0)) {
			throw new Error('invalid Actor: wrong inbox');
		}

		if (!(typeof x.preferredUsername === 'string' && x.preferredUsername.length > 0 && x.preferredUsername.length <= 128 && /^\w([\w-.]*\w)?$/.test(x.preferredUsername))) {
			throw new Error('invalid Actor: wrong username');
		}

		// These fields are only informational, and some AP software allows these
		// fields to be very long. If they are too long, we cut them off. This way
		// we can at least see these users and their activities.
		if (x.name) {
			if (!(typeof x.name === 'string' && x.name.length > 0)) {
				throw new Error('invalid Actor: wrong name');
			}
			x.name = truncate(x.name, nameLength);
		} else if (x.name === '') {
			// Mastodon emits empty string when the name is not set.
			x.name = undefined;
		}
		if (x.summary) {
			if (!(typeof x.summary === 'string' && x.summary.length > 0)) {
				throw new Error('invalid Actor: wrong summary');
			}
			x.summary = truncate(x.summary, summaryLength);
		}

		const idHost = this.utilityService.toPuny(new URL(x.id!).hostname);
		if (idHost !== expectHost) {
			throw new Error('invalid Actor: id has different host');
		}

		if (x.publicKey) {
			if (typeof x.publicKey.id !== 'string') {
				throw new Error('invalid Actor: publicKey.id is not a string');
			}

			const publicKeyIdHost = this.utilityService.toPuny(new URL(x.publicKey.id).hostname);
			if (publicKeyIdHost !== expectHost) {
				throw new Error('invalid Actor: publicKey.id has different host');
			}
		}

		return x;
	}

	/**
	 * Personをフェッチします。
	 *
	 * Misskeyに対象のPersonが登録されていればそれを返します。
	 */
	@bindThis
	public async fetchPerson(uri: string, resolver?: Resolver): Promise<User | null> {
		if (typeof uri !== 'string') throw new Error('uri is not string');

		const cached = this.cacheService.uriPersonCache.get(uri);
		if (cached) return cached;

		// URIがこのサーバーを指しているならデータベースからフェッチ
		if (uri.startsWith(this.config.url + '/')) {
			const id = uri.split('/').pop();
			const u = await this.usersRepository.findOneBy({ id });
			if (u) this.cacheService.uriPersonCache.set(uri, u);
			return u;
		}

		//#region このサーバーに既に登録されていたらそれを返す
		const exist = await this.usersRepository.findOneBy({ uri });

		if (exist) {
			this.cacheService.uriPersonCache.set(uri, exist);
			return exist;
		}
		//#endregion

		return null;
	}

	/**
	 * Personを作成します。
	 */
	@bindThis
	public async createPerson(uri: string, resolver?: Resolver): Promise<User> {
		if (typeof uri !== 'string') throw new Error('uri is not string');

		if (uri.startsWith(this.config.url)) {
			throw new StatusError('cannot resolve local user', 400, 'cannot resolve local user');
		}

		if (resolver == null) resolver = this.apResolverService.createResolver();

		const object = await resolver.resolve(uri) as any;

		const person = this.validateActor(object, uri);

		this.logger.info(`Creating the Person: ${person.id}`);

		const host = this.utilityService.toPuny(new URL(object.id).hostname);

		const { fields } = this.analyzeAttachments(person.attachment ?? []);

		const tags = extractApHashtags(person.tag).map(tag => normalizeForSearch(tag)).splice(0, 32);

		const isBot = getApType(object) === 'Service';

		const bday = person['vcard:bday']?.match(/^\d{4}-\d{2}-\d{2}/);

		const url = getOneApHrefNullable(person.url);

		if (url && !url.startsWith('https://')) {
			throw new Error('unexpected shcema of person url: ' + url);
		}

		// Create user
		let user: RemoteUser;
		try {
		// Start transaction
			await this.db.transaction(async transactionalEntityManager => {
				user = await transactionalEntityManager.save(new User({
					id: this.idService.genId(),
					avatarId: null,
					bannerId: null,
					createdAt: new Date(),
					lastFetchedAt: new Date(),
					name: truncate(person.name, nameLength),
					isLocked: !!person.manuallyApprovesFollowers,
					movedToUri: person.movedTo,
					alsoKnownAs: person.alsoKnownAs,
					isExplorable: !!person.discoverable,
					username: person.preferredUsername,
					usernameLower: person.preferredUsername!.toLowerCase(),
					host,
					inbox: person.inbox,
					sharedInbox: person.sharedInbox ?? (person.endpoints ? person.endpoints.sharedInbox : undefined),
					followersUri: person.followers ? getApId(person.followers) : undefined,
					featured: person.featured ? getApId(person.featured) : undefined,
					uri: person.id,
					tags,
					isBot,
					isCat: (person as any).isCat === true,
					showTimelineReplies: false,
				})) as RemoteUser;

				await transactionalEntityManager.save(new UserProfile({
					userId: user.id,
					description: person.summary ? this.apMfmService.htmlToMfm(truncate(person.summary, summaryLength), person.tag) : null,
					url: url,
					fields,
					birthday: bday ? bday[0] : null,
					location: person['vcard:Address'] ?? null,
					userHost: host,
				}));

				if (person.publicKey) {
					await transactionalEntityManager.save(new UserPublickey({
						userId: user.id,
						keyId: person.publicKey.id,
						keyPem: person.publicKey.publicKeyPem,
					}));
				}
			});
		} catch (e) {
		// duplicate key error
			if (isDuplicateKeyValueError(e)) {
			// /users/@a => /users/:id のように入力がaliasなときにエラーになることがあるのを対応
				const u = await this.usersRepository.findOneBy({
					uri: person.id,
				});

				if (u) {
					user = u as RemoteUser;
				} else {
					throw new Error('already registered');
				}
			} else {
				this.logger.error(e instanceof Error ? e : new Error(e as string));
				throw e;
			}
		}

		// Register host
		this.federatedInstanceService.fetch(host).then(async i => {
			this.instancesRepository.increment({ id: i.id }, 'usersCount', 1);
			this.fetchInstanceMetadataService.fetchInstanceMetadata(i);
			if ((await this.metaService.fetch()).enableChartsForFederatedInstances) {
				this.instanceChart.newUser(i.host);
			}
		});

		this.usersChart.update(user!, true);

		// ハッシュタグ更新
		this.hashtagService.updateUsertags(user!, tags);

		//#region アバターとヘッダー画像をフェッチ
		const [avatar, banner] = await Promise.all([
			person.icon,
			person.image,
		].map(img =>
			img == null
				? Promise.resolve(null)
				: this.apImageService.resolveImage(user!, img).catch(() => null),
		));

		const avatarId = avatar ? avatar.id : null;
		const bannerId = banner ? banner.id : null;
		const avatarUrl = avatar ? this.driveFileEntityService.getPublicUrl(avatar, 'avatar') : null;
		const bannerUrl = banner ? this.driveFileEntityService.getPublicUrl(banner) : null;
		const avatarBlurhash = avatar ? avatar.blurhash : null;
		const bannerBlurhash = banner ? banner.blurhash : null;

		await this.usersRepository.update(user!.id, {
			avatarId,
			bannerId,
			avatarUrl,
			bannerUrl,
			avatarBlurhash,
			bannerBlurhash,
		});

		user!.avatarId = avatarId;
		user!.bannerId = bannerId;
		user!.avatarUrl = avatarUrl;
		user!.bannerUrl = bannerUrl;
		user!.avatarBlurhash = avatarBlurhash;
		user!.bannerBlurhash = bannerBlurhash;
		//#endregion

		//#region カスタム絵文字取得
		const emojis = await this.apNoteService.extractEmojis(person.tag ?? [], host).catch(err => {
			this.logger.info(`extractEmojis: ${err}`);
			return [] as Emoji[];
		});

		const emojiNames = emojis.map(emoji => emoji.name);

		await this.usersRepository.update(user!.id, {
			emojis: emojiNames,
		});
		//#endregion

		await this.updateFeatured(user!.id, resolver).catch(err => this.logger.error(err));

		return user!;
	}

	/**
	 * Personの情報を更新します。
	 * Misskeyに対象のPersonが登録されていなければ無視します。
	 * @param uri URI of Person
	 * @param resolver Resolver
	 * @param hint Hint of Person object (この値が正当なPersonの場合、Remote resolveをせずに更新に利用します)
	 */
	@bindThis
	public async updatePerson(uri: string, resolver?: Resolver | null, hint?: IObject): Promise<void> {
		if (typeof uri !== 'string') throw new Error('uri is not string');

		// URIがこのサーバーを指しているならスキップ
		if (uri.startsWith(this.config.url + '/')) {
			return;
		}

		//#region このサーバーに既に登録されているか
		const exist = await this.usersRepository.findOneBy({ uri }) as RemoteUser;

		if (exist == null) {
			return;
		}
		//#endregion

		if (resolver == null) resolver = this.apResolverService.createResolver();

		const object = hint ?? await resolver.resolve(uri);

		const person = this.validateActor(object, uri);

		this.logger.info(`Updating the Person: ${person.id}`);

		// アバターとヘッダー画像をフェッチ
		const [avatar, banner] = await Promise.all([
			person.icon,
			person.image,
		].map(img =>
			img == null
				? Promise.resolve(null)
				: this.apImageService.resolveImage(exist, img).catch(() => null),
		));

		// カスタム絵文字取得
		const emojis = await this.apNoteService.extractEmojis(person.tag ?? [], exist.host).catch(e => {
			this.logger.info(`extractEmojis: ${e}`);
			return [] as Emoji[];
		});

		const emojiNames = emojis.map(emoji => emoji.name);

		const { fields } = this.analyzeAttachments(person.attachment ?? []);

		const tags = extractApHashtags(person.tag).map(tag => normalizeForSearch(tag)).splice(0, 32);

		const bday = person['vcard:bday']?.match(/^\d{4}-\d{2}-\d{2}/);

		const url = getOneApHrefNullable(person.url);

		if (url && !url.startsWith('https://')) {
			throw new Error('unexpected shcema of person url: ' + url);
		}

		const updates = {
			lastFetchedAt: new Date(),
			inbox: person.inbox,
			sharedInbox: person.sharedInbox ?? (person.endpoints ? person.endpoints.sharedInbox : undefined),
			followersUri: person.followers ? getApId(person.followers) : undefined,
			featured: person.featured,
			emojis: emojiNames,
			name: truncate(person.name, nameLength),
			tags,
			isBot: getApType(object) === 'Service',
			isCat: (person as any).isCat === true,
			isLocked: !!person.manuallyApprovesFollowers,
			movedToUri: person.movedTo ?? null,
			alsoKnownAs: person.alsoKnownAs ?? null,
			isExplorable: !!person.discoverable,
		} as Partial<User>;

		if (avatar) {
			updates.avatarId = avatar.id;
			updates.avatarUrl = this.driveFileEntityService.getPublicUrl(avatar, 'avatar');
			updates.avatarBlurhash = avatar.blurhash;
		}

		if (banner) {
			updates.bannerId = banner.id;
			updates.bannerUrl = this.driveFileEntityService.getPublicUrl(banner);
			updates.bannerBlurhash = banner.blurhash;
		}

		// Update user
		await this.usersRepository.update(exist.id, updates);

		if (person.publicKey) {
			await this.userPublickeysRepository.update({ userId: exist.id }, {
				keyId: person.publicKey.id,
				keyPem: person.publicKey.publicKeyPem,
			});
		}

		await this.userProfilesRepository.update({ userId: exist.id }, {
			url: url,
			fields,
			description: person.summary ? this.apMfmService.htmlToMfm(truncate(person.summary, summaryLength), person.tag) : null,
			birthday: bday ? bday[0] : null,
			location: person['vcard:Address'] ?? null,
		});

		this.globalEventService.publishInternalEvent('remoteUserUpdated', { id: exist.id });

		// ハッシュタグ更新
		this.hashtagService.updateUsertags(exist, tags);

		// 該当ユーザーが既にフォロワーになっていた場合はFollowingもアップデートする
		await this.followingsRepository.update({
			followerId: exist.id,
		}, {
			followerSharedInbox: person.sharedInbox ?? (person.endpoints ? person.endpoints.sharedInbox : undefined),
		});

		await this.updateFeatured(exist.id, resolver).catch(err => this.logger.error(err));
	}

	/**
	 * Personを解決します。
	 *
	 * Misskeyに対象のPersonが登録されていればそれを返し、そうでなければ
	 * リモートサーバーからフェッチしてMisskeyに登録しそれを返します。
	 */
	@bindThis
	public async resolvePerson(uri: string, resolver?: Resolver): Promise<User> {
		if (typeof uri !== 'string') throw new Error('uri is not string');

		//#region このサーバーに既に登録されていたらそれを返す
		const exist = await this.fetchPerson(uri);

		if (exist) {
			return exist;
		}
		//#endregion

		// リモートサーバーからフェッチしてきて登録
		if (resolver == null) resolver = this.apResolverService.createResolver();
		return await this.createPerson(uri, resolver);
	}

	@bindThis
	public analyzeAttachments(attachments: IObject | IObject[] | undefined) {
		const fields: {
		name: string,
		value: string
	}[] = [];
		if (Array.isArray(attachments)) {
			for (const attachment of attachments.filter(isPropertyValue)) {
				fields.push({
					name: attachment.name,
					value: this.mfmService.fromHtml(attachment.value),
				});
			}
		}

		return { fields };
	}

	@bindThis
	public async updateFeatured(userId: User['id'], resolver?: Resolver) {
		const user = await this.usersRepository.findOneByOrFail({ id: userId });
		if (!this.userEntityService.isRemoteUser(user)) return;
		if (!user.featured) return;

		this.logger.info(`Updating the featured: ${user.uri}`);

		const _resolver = resolver ?? this.apResolverService.createResolver();

		// Resolve to (Ordered)Collection Object
		const collection = await _resolver.resolveCollection(user.featured);
		if (!isCollectionOrOrderedCollection(collection)) throw new Error('Object is not Collection or OrderedCollection');

		// Resolve to Object(may be Note) arrays
		const unresolvedItems = isCollection(collection) ? collection.items : collection.orderedItems;
		const items = await Promise.all(toArray(unresolvedItems).map(x => _resolver.resolve(x)));

		// Resolve and regist Notes
		const limit = promiseLimit<Note | null>(2);
		const featuredNotes = await Promise.all(items
			.filter(item => getApType(item) === 'Note')	// TODO: Noteでなくてもいいかも
			.slice(0, 5)
			.map(item => limit(() => this.apNoteService.resolveNote(item, _resolver))));

		await this.db.transaction(async transactionalEntityManager => {
			await transactionalEntityManager.delete(UserNotePining, { userId: user.id });

			// とりあえずidを別の時間で生成して順番を維持
			let td = 0;
			for (const note of featuredNotes.filter(note => note != null)) {
				td -= 1000;
				transactionalEntityManager.insert(UserNotePining, {
					id: this.idService.genId(new Date(Date.now() + td)),
					createdAt: new Date(),
					userId: user.id,
					noteId: note!.id,
				});
			}
		});
	}
}
