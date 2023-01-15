import RE2 from 're2';
import * as mfm from 'mfm-js';
import { Inject, Injectable } from '@nestjs/common';
import { extractCustomEmojisFromMfm } from '@/misc/extract-custom-emojis-from-mfm.js';
import { extractHashtags } from '@/misc/extract-hashtags.js';
import type { UsersRepository, DriveFilesRepository, UserProfilesRepository, PagesRepository } from '@/models/index.js';
import type { User } from '@/models/entities/User.js';
import { birthdaySchema, descriptionSchema, locationSchema, nameSchema } from '@/models/entities/User.js';
import type { UserProfile } from '@/models/entities/UserProfile.js';
import { notificationTypes } from '@/types.js';
import { normalizeForSearch } from '@/misc/normalize-for-search.js';
import { langmap } from '@/misc/langmap.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { UserFollowingService } from '@/core/UserFollowingService.js';
import { AccountUpdateService } from '@/core/AccountUpdateService.js';
import { HashtagService } from '@/core/HashtagService.js';
import { DI } from '@/di-symbols.js';
import { RoleService } from '@/core/RoleService.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['account'],

	requireCredential: true,

	kind: 'write:account',

	errors: {
		noSuchAvatar: {
			message: 'No such avatar file.',
			code: 'NO_SUCH_AVATAR',
			id: '539f3a45-f215-4f81-a9a8-31293640207f',
		},

		noSuchBanner: {
			message: 'No such banner file.',
			code: 'NO_SUCH_BANNER',
			id: '0d8f5629-f210-41c2-9433-735831a58595',
		},

		avatarNotAnImage: {
			message: 'The file specified as an avatar is not an image.',
			code: 'AVATAR_NOT_AN_IMAGE',
			id: 'f419f9f8-2f4d-46b1-9fb4-49d3a2fd7191',
		},

		bannerNotAnImage: {
			message: 'The file specified as a banner is not an image.',
			code: 'BANNER_NOT_AN_IMAGE',
			id: '75aedb19-2afd-4e6d-87fc-67941256fa60',
		},

		noSuchPage: {
			message: 'No such page.',
			code: 'NO_SUCH_PAGE',
			id: '8e01b590-7eb9-431b-a239-860e086c408e',
		},

		invalidRegexp: {
			message: 'Invalid Regular Expression.',
			code: 'INVALID_REGEXP',
			id: '0d786918-10df-41cd-8f33-8dec7d9a89a5',
		},

		tooManyMutedWords: {
			message: 'Too many muted words.',
			code: 'TOO_MANY_MUTED_WORDS',
			id: '010665b1-a211-42d2-bc64-8f6609d79785',
		},
	},

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'MeDetailed',
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		name: { ...nameSchema, nullable: true },
		description: { ...descriptionSchema, nullable: true },
		location: { ...locationSchema, nullable: true },
		birthday: { ...birthdaySchema, nullable: true },
		lang: { type: 'string', enum: [null, ...Object.keys(langmap)] as string[], nullable: true },
		avatarId: { type: 'string', format: 'misskey:id', nullable: true },
		bannerId: { type: 'string', format: 'misskey:id', nullable: true },
		fields: {
			type: 'array',
			minItems: 0,
			maxItems: 16,
			items: {
				type: 'object',
				properties: {
					name: { type: 'string' },
					value: { type: 'string' },
				},
				required: ['name', 'value'],
			},
		},
		isLocked: { type: 'boolean' },
		isExplorable: { type: 'boolean' },
		hideOnlineStatus: { type: 'boolean' },
		publicReactions: { type: 'boolean' },
		carefulBot: { type: 'boolean' },
		autoAcceptFollowed: { type: 'boolean' },
		noCrawle: { type: 'boolean' },
		isBot: { type: 'boolean' },
		isCat: { type: 'boolean' },
		showTimelineReplies: { type: 'boolean' },
		injectFeaturedNote: { type: 'boolean' },
		receiveAnnouncementEmail: { type: 'boolean' },
		alwaysMarkNsfw: { type: 'boolean' },
		autoSensitive: { type: 'boolean' },
		ffVisibility: { type: 'string', enum: ['public', 'followers', 'private'] },
		pinnedPageId: { type: 'string', format: 'misskey:id' },
		mutedWords: { type: 'array' },
		mutedInstances: { type: 'array', items: {
			type: 'string',
		} },
		mutingNotificationTypes: { type: 'array', items: {
			type: 'string', enum: notificationTypes,
		} },
		emailNotificationTypes: { type: 'array', items: {
			type: 'string',
		} },
	},
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		@Inject(DI.pagesRepository)
		private pagesRepository: PagesRepository,

		private userEntityService: UserEntityService,
		private globalEventService: GlobalEventService,
		private userFollowingService: UserFollowingService,
		private accountUpdateService: AccountUpdateService,
		private hashtagService: HashtagService,
		private roleService: RoleService,
	) {
		super(meta, paramDef, async (ps, _user, token) => {
			const user = await this.usersRepository.findOneByOrFail({ id: _user.id });
			const isSecure = token == null;

			const updates = {} as Partial<User>;
			const profileUpdates = {} as Partial<UserProfile>;

			const profile = await this.userProfilesRepository.findOneByOrFail({ userId: user.id });

			if (ps.name !== undefined) updates.name = ps.name;
			if (ps.description !== undefined) profileUpdates.description = ps.description;
			if (ps.lang !== undefined) profileUpdates.lang = ps.lang;
			if (ps.location !== undefined) profileUpdates.location = ps.location;
			if (ps.birthday !== undefined) profileUpdates.birthday = ps.birthday;
			if (ps.ffVisibility !== undefined) profileUpdates.ffVisibility = ps.ffVisibility;
			if (ps.avatarId !== undefined) updates.avatarId = ps.avatarId;
			if (ps.bannerId !== undefined) updates.bannerId = ps.bannerId;
			if (ps.mutedWords !== undefined) {
				// TODO: ちゃんと数える
				const length = JSON.stringify(ps.mutedWords).length;
				if (length > (await this.roleService.getUserPolicies(user.id)).wordMuteLimit) {
					throw new ApiError(meta.errors.tooManyMutedWords);
				}

				// validate regular expression syntax
				ps.mutedWords.filter(x => !Array.isArray(x)).forEach(x => {
					const regexp = x.match(/^\/(.+)\/(.*)$/);
					if (!regexp) throw new ApiError(meta.errors.invalidRegexp);

					try {
						new RE2(regexp[1], regexp[2]);
					} catch (err) {
						throw new ApiError(meta.errors.invalidRegexp);
					}
				});

				profileUpdates.mutedWords = ps.mutedWords;
				profileUpdates.enableWordMute = ps.mutedWords.length > 0;
			}
			if (ps.mutedInstances !== undefined) profileUpdates.mutedInstances = ps.mutedInstances;
			if (ps.mutingNotificationTypes !== undefined) profileUpdates.mutingNotificationTypes = ps.mutingNotificationTypes as typeof notificationTypes[number][];
			if (typeof ps.isLocked === 'boolean') updates.isLocked = ps.isLocked;
			if (typeof ps.isExplorable === 'boolean') updates.isExplorable = ps.isExplorable;
			if (typeof ps.hideOnlineStatus === 'boolean') updates.hideOnlineStatus = ps.hideOnlineStatus;
			if (typeof ps.publicReactions === 'boolean') profileUpdates.publicReactions = ps.publicReactions;
			if (typeof ps.isBot === 'boolean') updates.isBot = ps.isBot;
			if (typeof ps.showTimelineReplies === 'boolean') updates.showTimelineReplies = ps.showTimelineReplies;
			if (typeof ps.carefulBot === 'boolean') profileUpdates.carefulBot = ps.carefulBot;
			if (typeof ps.autoAcceptFollowed === 'boolean') profileUpdates.autoAcceptFollowed = ps.autoAcceptFollowed;
			if (typeof ps.noCrawle === 'boolean') profileUpdates.noCrawle = ps.noCrawle;
			if (typeof ps.isCat === 'boolean') updates.isCat = ps.isCat;
			if (typeof ps.injectFeaturedNote === 'boolean') profileUpdates.injectFeaturedNote = ps.injectFeaturedNote;
			if (typeof ps.receiveAnnouncementEmail === 'boolean') profileUpdates.receiveAnnouncementEmail = ps.receiveAnnouncementEmail;
			if (typeof ps.alwaysMarkNsfw === 'boolean') profileUpdates.alwaysMarkNsfw = ps.alwaysMarkNsfw;
			if (typeof ps.autoSensitive === 'boolean') profileUpdates.autoSensitive = ps.autoSensitive;
			if (ps.emailNotificationTypes !== undefined) profileUpdates.emailNotificationTypes = ps.emailNotificationTypes;

			if (ps.avatarId) {
				const avatar = await this.driveFilesRepository.findOneBy({ id: ps.avatarId });

				if (avatar == null || avatar.userId !== user.id) throw new ApiError(meta.errors.noSuchAvatar);
				if (!avatar.type.startsWith('image/')) throw new ApiError(meta.errors.avatarNotAnImage);
			}

			if (ps.bannerId) {
				const banner = await this.driveFilesRepository.findOneBy({ id: ps.bannerId });

				if (banner == null || banner.userId !== user.id) throw new ApiError(meta.errors.noSuchBanner);
				if (!banner.type.startsWith('image/')) throw new ApiError(meta.errors.bannerNotAnImage);
			}

			if (ps.pinnedPageId) {
				const page = await this.pagesRepository.findOneBy({ id: ps.pinnedPageId });

				if (page == null || page.userId !== user.id) throw new ApiError(meta.errors.noSuchPage);

				profileUpdates.pinnedPageId = page.id;
			} else if (ps.pinnedPageId === null) {
				profileUpdates.pinnedPageId = null;
			}

			if (ps.fields) {
				profileUpdates.fields = ps.fields
					.filter(x => typeof x.name === 'string' && x.name !== '' && typeof x.value === 'string' && x.value !== '')
					.map(x => {
						return { name: x.name, value: x.value };
					});
			}

			//#region emojis/tags

			let emojis = [] as string[];
			let tags = [] as string[];

			const newName = updates.name === undefined ? user.name : updates.name;
			const newDescription = profileUpdates.description === undefined ? profile.description : profileUpdates.description;

			if (newName != null) {
				const tokens = mfm.parseSimple(newName);
				emojis = emojis.concat(extractCustomEmojisFromMfm(tokens!));
			}

			if (newDescription != null) {
				const tokens = mfm.parse(newDescription);
				emojis = emojis.concat(extractCustomEmojisFromMfm(tokens!));
				tags = extractHashtags(tokens!).map(tag => normalizeForSearch(tag)).splice(0, 32);
			}

			updates.emojis = emojis;
			updates.tags = tags;

			// ハッシュタグ更新
			this.hashtagService.updateUsertags(user, tags);
			//#endregion

			if (Object.keys(updates).length > 0) await this.usersRepository.update(user.id, updates);
			if (Object.keys(profileUpdates).length > 0) await this.userProfilesRepository.update(user.id, profileUpdates);

			const iObj = await this.userEntityService.pack<true, true>(user.id, user, {
				detail: true,
				includeSecrets: isSecure,
			});

			// Publish meUpdated event
			this.globalEventService.publishMainStream(user.id, 'meUpdated', iObj);
			this.globalEventService.publishUserEvent(user.id, 'updateUserProfile', await this.userProfilesRepository.findOneByOrFail({ userId: user.id }));

			// 鍵垢を解除したとき、溜まっていたフォローリクエストがあるならすべて承認
			if (user.isLocked && ps.isLocked === false) {
				this.userFollowingService.acceptAllFollowRequests(user);
			}

			// フォロワーにUpdateを配信
			this.accountUpdateService.publishToFollowers(user.id);

			return iObj;
		});
	}
}
