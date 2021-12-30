import $ from 'cafy';
import define from '../../define';
import { getConnection } from 'typeorm';
import { Meta } from '@/models/entities/meta';
import { insertModerationLog } from '@/services/insert-moderation-log';
import { DB_MAX_NOTE_TEXT_LENGTH } from '@/misc/hard-limits';
import { ID } from '@/misc/cafy-id';

export const meta = {
	tags: ['admin'],

	requireCredential: true as const,
	requireAdmin: true,

	params: {
		disableRegistration: {
			validator: $.optional.nullable.bool,
		},

		disableLocalTimeline: {
			validator: $.optional.nullable.bool,
		},

		disableGlobalTimeline: {
			validator: $.optional.nullable.bool,
		},

		useStarForReactionFallback: {
			validator: $.optional.nullable.bool,
		},

		pinnedUsers: {
			validator: $.optional.nullable.arr($.str),
		},

		hiddenTags: {
			validator: $.optional.nullable.arr($.str),
		},

		blockedHosts: {
			validator: $.optional.nullable.arr($.str),
		},

		mascotImageUrl: {
			validator: $.optional.nullable.str,
		},

		bannerUrl: {
			validator: $.optional.nullable.str,
		},

		errorImageUrl: {
			validator: $.optional.nullable.str,
		},

		iconUrl: {
			validator: $.optional.nullable.str,
		},

		backgroundImageUrl: {
			validator: $.optional.nullable.str,
		},

		logoImageUrl: {
			validator: $.optional.nullable.str,
		},

		name: {
			validator: $.optional.nullable.str,
		},

		description: {
			validator: $.optional.nullable.str,
		},

		maxNoteTextLength: {
			validator: $.optional.num.min(0).max(DB_MAX_NOTE_TEXT_LENGTH),
		},

		localDriveCapacityMb: {
			validator: $.optional.num.min(0),
		},

		remoteDriveCapacityMb: {
			validator: $.optional.num.min(0),
		},

		cacheRemoteFiles: {
			validator: $.optional.bool,
		},

		proxyRemoteFiles: {
			validator: $.optional.bool,
		},

		emailRequiredForSignup: {
			validator: $.optional.bool,
		},

		enableHcaptcha: {
			validator: $.optional.bool,
		},

		hcaptchaSiteKey: {
			validator: $.optional.nullable.str,
		},

		hcaptchaSecretKey: {
			validator: $.optional.nullable.str,
		},

		enableRecaptcha: {
			validator: $.optional.bool,
		},

		recaptchaSiteKey: {
			validator: $.optional.nullable.str,
		},

		recaptchaSecretKey: {
			validator: $.optional.nullable.str,
		},

		proxyAccountId: {
			validator: $.optional.nullable.type(ID),
		},

		maintainerName: {
			validator: $.optional.nullable.str,
		},

		maintainerEmail: {
			validator: $.optional.nullable.str,
		},

		pinnedPages: {
			validator: $.optional.arr($.str),
		},

		pinnedClipId: {
			validator: $.optional.nullable.type(ID),
		},

		langs: {
			validator: $.optional.arr($.str),
		},

		summalyProxy: {
			validator: $.optional.nullable.str,
		},

		deeplAuthKey: {
			validator: $.optional.nullable.str,
		},

		deeplIsPro: {
			validator: $.optional.bool,
		},

		enableTwitterIntegration: {
			validator: $.optional.bool,
		},

		twitterConsumerKey: {
			validator: $.optional.nullable.str,
		},

		twitterConsumerSecret: {
			validator: $.optional.nullable.str,
		},

		enableGithubIntegration: {
			validator: $.optional.bool,
		},

		githubClientId: {
			validator: $.optional.nullable.str,
		},

		githubClientSecret: {
			validator: $.optional.nullable.str,
		},

		enableDiscordIntegration: {
			validator: $.optional.bool,
		},

		discordClientId: {
			validator: $.optional.nullable.str,
		},

		discordClientSecret: {
			validator: $.optional.nullable.str,
		},

		enableEmail: {
			validator: $.optional.bool,
		},

		email: {
			validator: $.optional.nullable.str,
		},

		smtpSecure: {
			validator: $.optional.bool,
		},

		smtpHost: {
			validator: $.optional.nullable.str,
		},

		smtpPort: {
			validator: $.optional.nullable.num,
		},

		smtpUser: {
			validator: $.optional.nullable.str,
		},

		smtpPass: {
			validator: $.optional.nullable.str,
		},

		enableServiceWorker: {
			validator: $.optional.bool,
		},

		swPublicKey: {
			validator: $.optional.nullable.str,
		},

		swPrivateKey: {
			validator: $.optional.nullable.str,
		},

		tosUrl: {
			validator: $.optional.nullable.str,
		},

		repositoryUrl: {
			validator: $.optional.str,
		},

		feedbackUrl: {
			validator: $.optional.str,
		},

		useObjectStorage: {
			validator: $.optional.bool,
		},

		objectStorageBaseUrl: {
			validator: $.optional.nullable.str,
		},

		objectStorageBucket: {
			validator: $.optional.nullable.str,
		},

		objectStoragePrefix: {
			validator: $.optional.nullable.str,
		},

		objectStorageEndpoint: {
			validator: $.optional.nullable.str,
		},

		objectStorageRegion: {
			validator: $.optional.nullable.str,
		},

		objectStoragePort: {
			validator: $.optional.nullable.num,
		},

		objectStorageAccessKey: {
			validator: $.optional.nullable.str,
		},

		objectStorageSecretKey: {
			validator: $.optional.nullable.str,
		},

		objectStorageUseSSL: {
			validator: $.optional.bool,
		},

		objectStorageUseProxy: {
			validator: $.optional.bool,
		},

		objectStorageSetPublicRead: {
			validator: $.optional.bool,
		},

		objectStorageS3ForcePathStyle: {
			validator: $.optional.bool,
		},
	},
};

export default define(meta, async (ps, me) => {
	const set = {} as Partial<Meta>;

	if (typeof ps.disableRegistration === 'boolean') {
		set.disableRegistration = ps.disableRegistration;
	}

	if (typeof ps.disableLocalTimeline === 'boolean') {
		set.disableLocalTimeline = ps.disableLocalTimeline;
	}

	if (typeof ps.disableGlobalTimeline === 'boolean') {
		set.disableGlobalTimeline = ps.disableGlobalTimeline;
	}

	if (typeof ps.useStarForReactionFallback === 'boolean') {
		set.useStarForReactionFallback = ps.useStarForReactionFallback;
	}

	if (Array.isArray(ps.pinnedUsers)) {
		set.pinnedUsers = ps.pinnedUsers.filter(Boolean);
	}

	if (Array.isArray(ps.hiddenTags)) {
		set.hiddenTags = ps.hiddenTags.filter(Boolean);
	}

	if (Array.isArray(ps.blockedHosts)) {
		set.blockedHosts = ps.blockedHosts.filter(Boolean);
	}

	if (ps.mascotImageUrl !== undefined) {
		set.mascotImageUrl = ps.mascotImageUrl;
	}

	if (ps.bannerUrl !== undefined) {
		set.bannerUrl = ps.bannerUrl;
	}

	if (ps.iconUrl !== undefined) {
		set.iconUrl = ps.iconUrl;
	}

	if (ps.backgroundImageUrl !== undefined) {
		set.backgroundImageUrl = ps.backgroundImageUrl;
	}

	if (ps.logoImageUrl !== undefined) {
		set.logoImageUrl = ps.logoImageUrl;
	}

	if (ps.name !== undefined) {
		set.name = ps.name;
	}

	if (ps.description !== undefined) {
		set.description = ps.description;
	}

	if (ps.maxNoteTextLength) {
		set.maxNoteTextLength = ps.maxNoteTextLength;
	}

	if (ps.localDriveCapacityMb !== undefined) {
		set.localDriveCapacityMb = ps.localDriveCapacityMb;
	}

	if (ps.remoteDriveCapacityMb !== undefined) {
		set.remoteDriveCapacityMb = ps.remoteDriveCapacityMb;
	}

	if (ps.cacheRemoteFiles !== undefined) {
		set.cacheRemoteFiles = ps.cacheRemoteFiles;
	}

	if (ps.proxyRemoteFiles !== undefined) {
		set.proxyRemoteFiles = ps.proxyRemoteFiles;
	}

	if (ps.emailRequiredForSignup !== undefined) {
		set.emailRequiredForSignup = ps.emailRequiredForSignup;
	}

	if (ps.enableHcaptcha !== undefined) {
		set.enableHcaptcha = ps.enableHcaptcha;
	}

	if (ps.hcaptchaSiteKey !== undefined) {
		set.hcaptchaSiteKey = ps.hcaptchaSiteKey;
	}

	if (ps.hcaptchaSecretKey !== undefined) {
		set.hcaptchaSecretKey = ps.hcaptchaSecretKey;
	}

	if (ps.enableRecaptcha !== undefined) {
		set.enableRecaptcha = ps.enableRecaptcha;
	}

	if (ps.recaptchaSiteKey !== undefined) {
		set.recaptchaSiteKey = ps.recaptchaSiteKey;
	}

	if (ps.recaptchaSecretKey !== undefined) {
		set.recaptchaSecretKey = ps.recaptchaSecretKey;
	}

	if (ps.proxyAccountId !== undefined) {
		set.proxyAccountId = ps.proxyAccountId;
	}

	if (ps.maintainerName !== undefined) {
		set.maintainerName = ps.maintainerName;
	}

	if (ps.maintainerEmail !== undefined) {
		set.maintainerEmail = ps.maintainerEmail;
	}

	if (Array.isArray(ps.langs)) {
		set.langs = ps.langs.filter(Boolean);
	}

	if (Array.isArray(ps.pinnedPages)) {
		set.pinnedPages = ps.pinnedPages.filter(Boolean);
	}

	if (ps.pinnedClipId !== undefined) {
		set.pinnedClipId = ps.pinnedClipId;
	}

	if (ps.summalyProxy !== undefined) {
		set.summalyProxy = ps.summalyProxy;
	}

	if (ps.enableTwitterIntegration !== undefined) {
		set.enableTwitterIntegration = ps.enableTwitterIntegration;
	}

	if (ps.twitterConsumerKey !== undefined) {
		set.twitterConsumerKey = ps.twitterConsumerKey;
	}

	if (ps.twitterConsumerSecret !== undefined) {
		set.twitterConsumerSecret = ps.twitterConsumerSecret;
	}

	if (ps.enableGithubIntegration !== undefined) {
		set.enableGithubIntegration = ps.enableGithubIntegration;
	}

	if (ps.githubClientId !== undefined) {
		set.githubClientId = ps.githubClientId;
	}

	if (ps.githubClientSecret !== undefined) {
		set.githubClientSecret = ps.githubClientSecret;
	}

	if (ps.enableDiscordIntegration !== undefined) {
		set.enableDiscordIntegration = ps.enableDiscordIntegration;
	}

	if (ps.discordClientId !== undefined) {
		set.discordClientId = ps.discordClientId;
	}

	if (ps.discordClientSecret !== undefined) {
		set.discordClientSecret = ps.discordClientSecret;
	}

	if (ps.enableEmail !== undefined) {
		set.enableEmail = ps.enableEmail;
	}

	if (ps.email !== undefined) {
		set.email = ps.email;
	}

	if (ps.smtpSecure !== undefined) {
		set.smtpSecure = ps.smtpSecure;
	}

	if (ps.smtpHost !== undefined) {
		set.smtpHost = ps.smtpHost;
	}

	if (ps.smtpPort !== undefined) {
		set.smtpPort = ps.smtpPort;
	}

	if (ps.smtpUser !== undefined) {
		set.smtpUser = ps.smtpUser;
	}

	if (ps.smtpPass !== undefined) {
		set.smtpPass = ps.smtpPass;
	}

	if (ps.errorImageUrl !== undefined) {
		set.errorImageUrl = ps.errorImageUrl;
	}

	if (ps.enableServiceWorker !== undefined) {
		set.enableServiceWorker = ps.enableServiceWorker;
	}

	if (ps.swPublicKey !== undefined) {
		set.swPublicKey = ps.swPublicKey;
	}

	if (ps.swPrivateKey !== undefined) {
		set.swPrivateKey = ps.swPrivateKey;
	}

	if (ps.tosUrl !== undefined) {
		set.ToSUrl = ps.tosUrl;
	}

	if (ps.repositoryUrl !== undefined) {
		set.repositoryUrl = ps.repositoryUrl;
	}

	if (ps.feedbackUrl !== undefined) {
		set.feedbackUrl = ps.feedbackUrl;
	}

	if (ps.useObjectStorage !== undefined) {
		set.useObjectStorage = ps.useObjectStorage;
	}

	if (ps.objectStorageBaseUrl !== undefined) {
		set.objectStorageBaseUrl = ps.objectStorageBaseUrl;
	}

	if (ps.objectStorageBucket !== undefined) {
		set.objectStorageBucket = ps.objectStorageBucket;
	}

	if (ps.objectStoragePrefix !== undefined) {
		set.objectStoragePrefix = ps.objectStoragePrefix;
	}

	if (ps.objectStorageEndpoint !== undefined) {
		set.objectStorageEndpoint = ps.objectStorageEndpoint;
	}

	if (ps.objectStorageRegion !== undefined) {
		set.objectStorageRegion = ps.objectStorageRegion;
	}

	if (ps.objectStoragePort !== undefined) {
		set.objectStoragePort = ps.objectStoragePort;
	}

	if (ps.objectStorageAccessKey !== undefined) {
		set.objectStorageAccessKey = ps.objectStorageAccessKey;
	}

	if (ps.objectStorageSecretKey !== undefined) {
		set.objectStorageSecretKey = ps.objectStorageSecretKey;
	}

	if (ps.objectStorageUseSSL !== undefined) {
		set.objectStorageUseSSL = ps.objectStorageUseSSL;
	}

	if (ps.objectStorageUseProxy !== undefined) {
		set.objectStorageUseProxy = ps.objectStorageUseProxy;
	}

	if (ps.objectStorageSetPublicRead !== undefined) {
		set.objectStorageSetPublicRead = ps.objectStorageSetPublicRead;
	}

	if (ps.objectStorageS3ForcePathStyle !== undefined) {
		set.objectStorageS3ForcePathStyle = ps.objectStorageS3ForcePathStyle;
	}

	if (ps.deeplAuthKey !== undefined) {
		if (ps.deeplAuthKey === '') {
			set.deeplAuthKey = null;
		} else {
			set.deeplAuthKey = ps.deeplAuthKey;
		}
	}

	if (ps.deeplIsPro !== undefined) {
		set.deeplIsPro = ps.deeplIsPro;
	}

	await getConnection().transaction(async transactionalEntityManager => {
		const meta = await transactionalEntityManager.findOne(Meta, {
			order: {
				id: 'DESC',
			},
		});

		if (meta) {
			await transactionalEntityManager.update(Meta, meta.id, set);
		} else {
			await transactionalEntityManager.save(Meta, set);
		}
	});

	insertModerationLog(me, 'updateMeta');
});
