import { forwardRef, Inject, Injectable } from '@nestjs/common';
import promiseLimit from 'promise-limit';
import { DataSource } from 'typeorm';
import { DI_SYMBOLS } from '@/di-symbols.js';
import type { Followings , Instances, UserProfiles, UserPublickeys, Users } from '@/models/index.js';
import { Config } from '@/config.js';
import type { CacheableUser, IRemoteUser } from '@/models/entities/user.js';
import { User } from '@/models/entities/user.js';
import { toPuny } from '@/misc/convert-host.js';
import { truncate } from '@/misc/truncate.js';
import { UserCacheService } from '@/services/UserCacheService.js';
import { normalizeForSearch } from '@/misc/normalize-for-search.js';
import { isDuplicateKeyValueError } from '@/misc/is-duplicate-key-value-error.js';
import type Logger from '@/logger.js';
import type { Note } from '@/models/entities/note.js';
import { IdService } from '@/services/IdService.js';
import { MfmService } from '@/services/MfmService.js';
import type { Emoji } from '@/models/entities/emoji.js';
import { toArray } from '@/prelude/array.js';
import { GlobalEventService } from '@/services/GlobalEventService.js';
import { FederatedInstanceService } from '@/services/FederatedInstanceService.js';
import { FetchInstanceMetadataService } from '@/services/FetchInstanceMetadataService.js';
import { UserProfile } from '@/models/entities/user-profile.js';
import { UserPublickey } from '@/models/entities/user-publickey.js';
import UsersChart from '@/services/chart/charts/users.js';
import InstanceChart from '@/services/chart/charts/instance.js';
import { HashtagService } from '@/services/HashtagService.js';
import { UserNotePining } from '@/models/entities/user-note-pining.js';
import { StatusError } from '@/misc/status-error.js';
import { getApId, getApType, getOneApHrefNullable, isActor, isCollection, isCollectionOrOrderedCollection, isPropertyValue } from '../type.js';
import { ApMfmService } from '../ApMfmService.js';
import { ApResolverService } from '../ApResolverService.js';
import { ApLoggerService } from '../ApLoggerService.js';
import { extractApHashtags } from './tag.js';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { ApNoteService } from './ApNoteService.js';
import { ApImageService } from './ApImageService.js';
import type { Resolver } from '../ApResolverService.js';
import type { IActor, IObject , IApPropertyValue } from '../type.js';

const nameLength = 128;
const summaryLength = 2048;

const services: {
	[x: string]: (id: string, username: string) => any
} = {
	'misskey:authentication:twitter': (userId, screenName) => ({ userId, screenName }),
	'misskey:authentication:github': (id, login) => ({ id, login }),
	'misskey:authentication:discord': (id, name) => $discord(id, name),
};

const $discord = (id: string, name: string) => {
	if (typeof name !== 'string') {
		name = 'unknown#0000';
	}
	const [username, discriminator] = name.split('#');
	return { id, username, discriminator };
};

function addService(target: { [x: string]: any }, source: IApPropertyValue) {
	const service = services[source.name];

	if (typeof source.value !== 'string') {
		source.value = 'unknown';
	}

	const [id, username] = source.value.split('@');

	if (service) {
		target[source.name.split(':')[2]] = service(id, username);
	}
}

/**
 * Validate and convert to actor object
 * @param x Fetched object
 * @param uri Fetch target URI
 */
function validateActor(x: IObject, uri: string): IActor {
	const expectHost = toPuny(new URL(uri).hostname);

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
	}
	if (x.summary) {
		if (!(typeof x.summary === 'string' && x.summary.length > 0)) {
			throw new Error('invalid Actor: wrong summary');
		}
		x.summary = truncate(x.summary, summaryLength);
	}

	const idHost = toPuny(new URL(x.id!).hostname);
	if (idHost !== expectHost) {
		throw new Error('invalid Actor: id has different host');
	}

	if (x.publicKey) {
		if (typeof x.publicKey.id !== 'string') {
			throw new Error('invalid Actor: publicKey.id is not a string');
		}

		const publicKeyIdHost = toPuny(new URL(x.publicKey.id).hostname);
		if (publicKeyIdHost !== expectHost) {
			throw new Error('invalid Actor: publicKey.id has different host');
		}
	}

	return x;
}

@Injectable()
export class ApPersonService {
	#logger: Logger;

	constructor(
		@Inject(DI_SYMBOLS.config)
		private config: Config,

		@Inject(DI_SYMBOLS.db)
		private db: DataSource,

		@Inject('usersRepository')
		private usersRepository: typeof Users,

		@Inject('userProfilesRepository')
		private userProfilesRepository: typeof UserProfiles,

		@Inject('userPublickeysRepository')
		private userPublickeysRepository: typeof UserPublickeys,

		@Inject('instancesRepository')
		private instancesRepository: typeof Instances,

		@Inject('followingsRepository')
		private followingsRepository: typeof Followings,

		private idService: IdService,
		private globalEventService: GlobalEventService,
		private federatedInstanceService: FederatedInstanceService,
		private fetchInstanceMetadataService: FetchInstanceMetadataService,
		private userCacheService: UserCacheService,
		private apResolverService: ApResolverService,

		// 循環参照のため / for circular dependency
		@Inject(forwardRef(() => ApNoteService))
		private apNoteService: ApNoteService,

		private apImageService: ApImageService,
		private apMfmService: ApMfmService,
		private mfmService: MfmService,
		private hashtagService: HashtagService,
		private usersChart: UsersChart,
		private instanceChart: InstanceChart,
		private apLoggerService: ApLoggerService,
	) {
		this.#logger = this.apLoggerService.logger;
	}

	/**
	 * Personをフェッチします。
	 *
	 * Misskeyに対象のPersonが登録されていればそれを返します。
	 */
	public async fetchPerson(uri: string, resolver?: Resolver): Promise<CacheableUser | null> {
		if (typeof uri !== 'string') throw new Error('uri is not string');

		const cached = this.userCacheService.uriPersonCache.get(uri);
		if (cached) return cached;

		// URIがこのサーバーを指しているならデータベースからフェッチ
		if (uri.startsWith(this.config.url + '/')) {
			const id = uri.split('/').pop();
			const u = await this.usersRepository.findOneBy({ id });
			if (u) this.userCacheService.uriPersonCache.set(uri, u);
			return u;
		}

		//#region このサーバーに既に登録されていたらそれを返す
		const exist = await this.usersRepository.findOneBy({ uri });

		if (exist) {
			this.userCacheService.uriPersonCache.set(uri, exist);
			return exist;
		}
		//#endregion

		return null;
	}

	/**
	 * Personを作成します。
	 */
	public async createPerson(uri: string, resolver?: Resolver): Promise<User> {
		if (typeof uri !== 'string') throw new Error('uri is not string');

		if (uri.startsWith(this.config.url)) {
			throw new StatusError('cannot resolve local user', 400, 'cannot resolve local user');
		}

		if (resolver == null) resolver = this.apResolverService.createResolver();

		const object = await resolver.resolve(uri) as any;

		const person = validateActor(object, uri);

		this.#logger.info(`Creating the Person: ${person.id}`);

		const host = toPuny(new URL(object.id).hostname);

		const { fields } = this.analyzeAttachments(person.attachment || []);

		const tags = extractApHashtags(person.tag).map(tag => normalizeForSearch(tag)).splice(0, 32);

		const isBot = getApType(object) === 'Service';

		const bday = person['vcard:bday']?.match(/^\d{4}-\d{2}-\d{2}/);

		// Create user
		let user: IRemoteUser;
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
					isExplorable: !!person.discoverable,
					username: person.preferredUsername,
					usernameLower: person.preferredUsername!.toLowerCase(),
					host,
					inbox: person.inbox,
					sharedInbox: person.sharedInbox || (person.endpoints ? person.endpoints.sharedInbox : undefined),
					followersUri: person.followers ? getApId(person.followers) : undefined,
					featured: person.featured ? getApId(person.featured) : undefined,
					uri: person.id,
					tags,
					isBot,
					isCat: (person as any).isCat === true,
					showTimelineReplies: false,
				})) as IRemoteUser;

				await transactionalEntityManager.save(new UserProfile({
					userId: user.id,
					description: person.summary ? this.apMfmService.htmlToMfm(truncate(person.summary, summaryLength), person.tag) : null,
					url: getOneApHrefNullable(person.url),
					fields,
					birthday: bday ? bday[0] : null,
					location: person['vcard:Address'] || null,
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
					user = u as IRemoteUser;
				} else {
					throw new Error('already registered');
				}
			} else {
				this.#logger.error(e instanceof Error ? e : new Error(e as string));
				throw e;
			}
		}

		// Register host
		this.federatedInstanceService.registerOrFetchInstanceDoc(host).then(i => {
			this.instancesRepository.increment({ id: i.id }, 'usersCount', 1);
			this.instanceChart.newUser(i.host);
			this.fetchInstanceMetadataService.fetchInstanceMetadata(i);
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

		await this.usersRepository.update(user!.id, {
			avatarId,
			bannerId,
		});

	user!.avatarId = avatarId;
	user!.bannerId = bannerId;
	//#endregion

	//#region カスタム絵文字取得
	const emojis = await this.apNoteService.extractEmojis(person.tag || [], host).catch(e => {
		this.#logger.info(`extractEmojis: ${e}`);
		return [] as Emoji[];
	});

	const emojiNames = emojis.map(emoji => emoji.name);

	await this.usersRepository.update(user!.id, {
		emojis: emojiNames,
	});
	//#endregion

	await this.updateFeatured(user!.id).catch(err => this.#logger.error(err));

	return user!;
	}

	/**
	 * Personの情報を更新します。
	 * Misskeyに対象のPersonが登録されていなければ無視します。
	 * @param uri URI of Person
	 * @param resolver Resolver
	 * @param hint Hint of Person object (この値が正当なPersonの場合、Remote resolveをせずに更新に利用します)
	 */
	public async updatePerson(uri: string, resolver?: Resolver | null, hint?: IObject): Promise<void> {
		if (typeof uri !== 'string') throw new Error('uri is not string');

		// URIがこのサーバーを指しているならスキップ
		if (uri.startsWith(this.config.url + '/')) {
			return;
		}

		//#region このサーバーに既に登録されているか
		const exist = await this.usersRepository.findOneBy({ uri }) as IRemoteUser;

		if (exist == null) {
			return;
		}
		//#endregion

		if (resolver == null) resolver = this.apResolverService.createResolver();

		const object = hint || await resolver.resolve(uri);

		const person = validateActor(object, uri);

		this.#logger.info(`Updating the Person: ${person.id}`);

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
		const emojis = await this.apNoteService.extractEmojis(person.tag || [], exist.host).catch(e => {
			this.#logger.info(`extractEmojis: ${e}`);
			return [] as Emoji[];
		});

		const emojiNames = emojis.map(emoji => emoji.name);

		const { fields } = this.analyzeAttachments(person.attachment || []);

		const tags = extractApHashtags(person.tag).map(tag => normalizeForSearch(tag)).splice(0, 32);

		const bday = person['vcard:bday']?.match(/^\d{4}-\d{2}-\d{2}/);

		const updates = {
			lastFetchedAt: new Date(),
			inbox: person.inbox,
			sharedInbox: person.sharedInbox || (person.endpoints ? person.endpoints.sharedInbox : undefined),
			followersUri: person.followers ? getApId(person.followers) : undefined,
			featured: person.featured,
			emojis: emojiNames,
			name: truncate(person.name, nameLength),
			tags,
			isBot: getApType(object) === 'Service',
			isCat: (person as any).isCat === true,
			isLocked: !!person.manuallyApprovesFollowers,
			isExplorable: !!person.discoverable,
		} as Partial<User>;

		if (avatar) {
			updates.avatarId = avatar.id;
		}

		if (banner) {
			updates.bannerId = banner.id;
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
			url: getOneApHrefNullable(person.url),
			fields,
			description: person.summary ? this.apMfmService.htmlToMfm(truncate(person.summary, summaryLength), person.tag) : null,
			birthday: bday ? bday[0] : null,
			location: person['vcard:Address'] || null,
		});

		this.globalEventService.publishInternalEvent('remoteUserUpdated', { id: exist.id });

		// ハッシュタグ更新
		this.hashtagService.updateUsertags(exist, tags);

		// 該当ユーザーが既にフォロワーになっていた場合はFollowingもアップデートする
		await this.followingsRepository.update({
			followerId: exist.id,
		}, {
			followerSharedInbox: person.sharedInbox || (person.endpoints ? person.endpoints.sharedInbox : undefined),
		});

		await this.updateFeatured(exist.id).catch(err => this.#logger.error(err));
	}

	/**
	 * Personを解決します。
	 *
	 * Misskeyに対象のPersonが登録されていればそれを返し、そうでなければ
	 * リモートサーバーからフェッチしてMisskeyに登録しそれを返します。
	 */
	public async resolvePerson(uri: string, resolver?: Resolver): Promise<CacheableUser> {
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

	public analyzeAttachments(attachments: IObject | IObject[] | undefined) {
		const fields: {
		name: string,
		value: string
	}[] = [];
		const services: { [x: string]: any } = {};

		if (Array.isArray(attachments)) {
			for (const attachment of attachments.filter(isPropertyValue)) {
				if (isPropertyValue(attachment.identifier)) {
					addService(services, attachment.identifier);
				} else {
					fields.push({
						name: attachment.name,
						value: this.mfmService.fromHtml(attachment.value),
					});
				}
			}
		}

		return { fields, services };
	}

	public async updateFeatured(userId: User['id']) {
		const user = await this.usersRepository.findOneByOrFail({ id: userId });
		if (!this.userEntityService.isRemoteUser(user)) return;
		if (!user.featured) return;

		this.#logger.info(`Updating the featured: ${user.uri}`);

		const resolver = this.apResolverService.createResolver();

		// Resolve to (Ordered)Collection Object
		const collection = await resolver.resolveCollection(user.featured);
		if (!isCollectionOrOrderedCollection(collection)) throw new Error('Object is not Collection or OrderedCollection');

		// Resolve to Object(may be Note) arrays
		const unresolvedItems = isCollection(collection) ? collection.items : collection.orderedItems;
		const items = await Promise.all(toArray(unresolvedItems).map(x => resolver.resolve(x)));

		// Resolve and regist Notes
		const limit = promiseLimit<Note | null>(2);
		const featuredNotes = await Promise.all(items
			.filter(item => getApType(item) === 'Note')	// TODO: Noteでなくてもいいかも
			.slice(0, 5)
			.map(item => limit(() => this.apNoteService.resolveNote(item, resolver))));

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
