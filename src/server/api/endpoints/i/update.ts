import $ from 'cafy';
import * as mfm from 'mfm-js';
import { ID } from '@/misc/cafy-id';
import { publishMainStream, publishUserEvent } from '../../../../services/stream';
import acceptAllFollowRequests from '../../../../services/following/requests/accept-all';
import { publishToFollowers } from '../../../../services/i/update';
import define from '../../define';
import { extractCustomEmojisFromMfm } from '@/misc/extract-custom-emojis-from-mfm';
import { extractHashtags } from '@/misc/extract-hashtags';
import * as langmap from 'langmap';
import { updateUsertags } from '../../../../services/update-hashtag';
import { ApiError } from '../../error';
import { Users, DriveFiles, UserProfiles, Pages } from '../../../../models';
import { User } from '../../../../models/entities/user';
import { UserProfile } from '../../../../models/entities/user-profile';
import { notificationTypes } from '../../../../types';
import { normalizeForSearch } from '@/misc/normalize-for-search';

export const meta = {
	tags: ['account'],

	requireCredential: true as const,

	kind: 'write:account',

	params: {
		name: {
			validator: $.optional.nullable.use(Users.validateName),
		},

		description: {
			validator: $.optional.nullable.use(Users.validateDescription),
		},

		lang: {
			validator: $.optional.nullable.str.or(Object.keys(langmap)),
		},

		location: {
			validator: $.optional.nullable.use(Users.validateLocation),
		},

		birthday: {
			validator: $.optional.nullable.use(Users.validateBirthday),
		},

		avatarId: {
			validator: $.optional.nullable.type(ID),
		},

		bannerId: {
			validator: $.optional.nullable.type(ID),
		},

		fields: {
			validator: $.optional.arr($.object()).range(1, 4),
		},

		isLocked: {
			validator: $.optional.bool,
		},

		isExplorable: {
			validator: $.optional.bool,
		},

		hideOnlineStatus: {
			validator: $.optional.bool,
		},

		carefulBot: {
			validator: $.optional.bool,
		},

		autoAcceptFollowed: {
			validator: $.optional.bool,
		},

		noCrawle: {
			validator: $.optional.bool,
		},

		isBot: {
			validator: $.optional.bool,
		},

		isCat: {
			validator: $.optional.bool,
		},

		injectFeaturedNote: {
			validator: $.optional.bool,
		},

		receiveAnnouncementEmail: {
			validator: $.optional.bool,
		},

		alwaysMarkNsfw: {
			validator: $.optional.bool,
		},

		pinnedPageId: {
			validator: $.optional.nullable.type(ID),
		},

		mutedWords: {
			validator: $.optional.arr($.arr($.str))
		},

		mutingNotificationTypes: {
			validator: $.optional.arr($.str.or(notificationTypes as unknown as string[]))
		},

		emailNotificationTypes: {
			validator: $.optional.arr($.str)
		},
	},

	errors: {
		noSuchAvatar: {
			message: 'No such avatar file.',
			code: 'NO_SUCH_AVATAR',
			id: '539f3a45-f215-4f81-a9a8-31293640207f'
		},

		noSuchBanner: {
			message: 'No such banner file.',
			code: 'NO_SUCH_BANNER',
			id: '0d8f5629-f210-41c2-9433-735831a58595'
		},

		avatarNotAnImage: {
			message: 'The file specified as an avatar is not an image.',
			code: 'AVATAR_NOT_AN_IMAGE',
			id: 'f419f9f8-2f4d-46b1-9fb4-49d3a2fd7191'
		},

		bannerNotAnImage: {
			message: 'The file specified as a banner is not an image.',
			code: 'BANNER_NOT_AN_IMAGE',
			id: '75aedb19-2afd-4e6d-87fc-67941256fa60'
		},

		noSuchPage: {
			message: 'No such page.',
			code: 'NO_SUCH_PAGE',
			id: '8e01b590-7eb9-431b-a239-860e086c408e'
		},
	},

	res: {
		type: 'object' as const,
		optional: false as const, nullable: false as const,
		ref: 'User'
	}
};

export default define(meta, async (ps, _user, token) => {
	const user = await Users.findOneOrFail(_user.id);
	const isSecure = token == null;

	const updates = {} as Partial<User>;
	const profileUpdates = {} as Partial<UserProfile>;

	const profile = await UserProfiles.findOneOrFail(user.id);

	if (ps.name !== undefined) updates.name = ps.name;
	if (ps.description !== undefined) profileUpdates.description = ps.description;
	if (ps.lang !== undefined) profileUpdates.lang = ps.lang;
	if (ps.location !== undefined) profileUpdates.location = ps.location;
	if (ps.birthday !== undefined) profileUpdates.birthday = ps.birthday;
	if (ps.avatarId !== undefined) updates.avatarId = ps.avatarId;
	if (ps.bannerId !== undefined) updates.bannerId = ps.bannerId;
	if (ps.mutedWords !== undefined) {
		profileUpdates.mutedWords = ps.mutedWords;
		profileUpdates.enableWordMute = ps.mutedWords.length > 0;
	}
	if (ps.mutingNotificationTypes !== undefined) profileUpdates.mutingNotificationTypes = ps.mutingNotificationTypes as typeof notificationTypes[number][];
	if (typeof ps.isLocked === 'boolean') updates.isLocked = ps.isLocked;
	if (typeof ps.isExplorable === 'boolean') updates.isExplorable = ps.isExplorable;
	if (typeof ps.hideOnlineStatus === 'boolean') updates.hideOnlineStatus = ps.hideOnlineStatus;
	if (typeof ps.isBot === 'boolean') updates.isBot = ps.isBot;
	if (typeof ps.carefulBot === 'boolean') profileUpdates.carefulBot = ps.carefulBot;
	if (typeof ps.autoAcceptFollowed === 'boolean') profileUpdates.autoAcceptFollowed = ps.autoAcceptFollowed;
	if (typeof ps.noCrawle === 'boolean') profileUpdates.noCrawle = ps.noCrawle;
	if (typeof ps.isCat === 'boolean') updates.isCat = ps.isCat;
	if (typeof ps.injectFeaturedNote === 'boolean') profileUpdates.injectFeaturedNote = ps.injectFeaturedNote;
	if (typeof ps.receiveAnnouncementEmail === 'boolean') profileUpdates.receiveAnnouncementEmail = ps.receiveAnnouncementEmail;
	if (typeof ps.alwaysMarkNsfw === 'boolean') profileUpdates.alwaysMarkNsfw = ps.alwaysMarkNsfw;
	if (ps.emailNotificationTypes !== undefined) profileUpdates.emailNotificationTypes = ps.emailNotificationTypes;

	if (ps.avatarId) {
		const avatar = await DriveFiles.findOne(ps.avatarId);

		if (avatar == null || avatar.userId !== user.id) throw new ApiError(meta.errors.noSuchAvatar);
		if (!avatar.type.startsWith('image/')) throw new ApiError(meta.errors.avatarNotAnImage);

		updates.avatarUrl = DriveFiles.getPublicUrl(avatar, true);

		if (avatar.blurhash) {
			updates.avatarBlurhash = avatar.blurhash;
		}
	}

	if (ps.bannerId) {
		const banner = await DriveFiles.findOne(ps.bannerId);

		if (banner == null || banner.userId !== user.id) throw new ApiError(meta.errors.noSuchBanner);
		if (!banner.type.startsWith('image/')) throw new ApiError(meta.errors.bannerNotAnImage);

		updates.bannerUrl = DriveFiles.getPublicUrl(banner, false);

		if (banner.blurhash) {
			updates.bannerBlurhash = banner.blurhash;
		}
	}

	if (ps.pinnedPageId) {
		const page = await Pages.findOne(ps.pinnedPageId);

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
		const tokens = mfm.parsePlain(newName);
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
	updateUsertags(user, tags);
	//#endregion

	if (Object.keys(updates).length > 0) await Users.update(user.id, updates);
	if (Object.keys(profileUpdates).length > 0) await UserProfiles.update(user.id, profileUpdates);

	const iObj = await Users.pack(user.id, user, {
		detail: true,
		includeSecrets: isSecure
	});

	// Publish meUpdated event
	publishMainStream(user.id, 'meUpdated', iObj);
	publishUserEvent(user.id, 'updateUserProfile', await UserProfiles.findOne(user.id));

	// 鍵垢を解除したとき、溜まっていたフォローリクエストがあるならすべて承認
	if (user.isLocked && ps.isLocked === false) {
		acceptAllFollowRequests(user);
	}

	// フォロワーにUpdateを配信
	publishToFollowers(user.id);

	return iObj;
});
