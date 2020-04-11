import $ from 'cafy';
import define from '../../define';
import { getConnection } from 'typeorm';
import { Meta } from '../../../../models/entities/meta';
import { insertModerationLog } from '../../../../services/insert-moderation-log';
import { DB_MAX_NOTE_TEXT_LENGTH } from '../../../../misc/hard-limits';
import { ID } from '../../../../misc/cafy-id';

export const meta = {
	desc: {
		'ja-JP': 'インスタンスの設定を更新します。'
	},

	tags: ['admin'],

	requireCredential: true as const,
	requireAdmin: true,

	params: {
		disableRegistration: {
			validator: $.optional.nullable.bool,
			desc: {
				'ja-JP': '招待制か否か'
			}
		},

		disableLocalTimeline: {
			validator: $.optional.nullable.bool,
			desc: {
				'ja-JP': 'ローカルタイムライン(とソーシャルタイムライン)を無効にするか否か'
			}
		},

		disableGlobalTimeline: {
			validator: $.optional.nullable.bool,
			desc: {
				'ja-JP': 'グローバルタイムラインを無効にするか否か'
			}
		},

		useStarForReactionFallback: {
			validator: $.optional.nullable.bool,
			desc: {
				'ja-JP': '不明なリアクションのフォールバックに star リアクションを使うか'
			}
		},

		pinnedUsers: {
			validator: $.optional.nullable.arr($.str),
			desc: {
				'ja-JP': 'ピン留めユーザー'
			}
		},

		hiddenTags: {
			validator: $.optional.nullable.arr($.str),
			desc: {
				'ja-JP': '統計などで無視するハッシュタグ'
			}
		},

		blockedHosts: {
			validator: $.optional.nullable.arr($.str),
			desc: {
				'ja-JP': 'ブロックするホスト'
			}
		},

		mascotImageUrl: {
			validator: $.optional.nullable.str,
			desc: {
				'ja-JP': 'インスタンスキャラクター画像のURL'
			}
		},

		bannerUrl: {
			validator: $.optional.nullable.str,
			desc: {
				'ja-JP': 'インスタンスのバナー画像URL'
			}
		},

		errorImageUrl: {
			validator: $.optional.nullable.str,
			desc: {
				'ja-JP': 'インスタンスのエラー画像URL'
			}
		},

		iconUrl: {
			validator: $.optional.nullable.str,
			desc: {
				'ja-JP': 'インスタンスのアイコンURL'
			}
		},

		name: {
			validator: $.optional.nullable.str,
			desc: {
				'ja-JP': 'インスタンス名'
			}
		},

		description: {
			validator: $.optional.nullable.str,
			desc: {
				'ja-JP': 'インスタンスの紹介文'
			}
		},

		maxNoteTextLength: {
			validator: $.optional.num.min(0).max(DB_MAX_NOTE_TEXT_LENGTH),
			desc: {
				'ja-JP': '投稿の最大文字数'
			}
		},

		localDriveCapacityMb: {
			validator: $.optional.num.min(0),
			desc: {
				'ja-JP': 'ローカルユーザーひとりあたりのドライブ容量 (メガバイト単位)',
				'en-US': 'Drive capacity of a local user (MB)'
			}
		},

		remoteDriveCapacityMb: {
			validator: $.optional.num.min(0),
			desc: {
				'ja-JP': 'リモートユーザーひとりあたりのドライブ容量 (メガバイト単位)',
				'en-US': 'Drive capacity of a remote user (MB)'
			}
		},

		cacheRemoteFiles: {
			validator: $.optional.bool,
			desc: {
				'ja-JP': 'リモートのファイルをキャッシュするか否か'
			}
		},

		proxyRemoteFiles: {
			validator: $.optional.bool,
			desc: {
				'ja-JP': 'ローカルにないリモートのファイルをプロキシするか否か'
			}
		},

		enableRecaptcha: {
			validator: $.optional.bool,
			desc: {
				'ja-JP': 'reCAPTCHAを使用するか否か'
			}
		},

		recaptchaSiteKey: {
			validator: $.optional.nullable.str,
			desc: {
				'ja-JP': 'reCAPTCHA site key'
			}
		},

		recaptchaSecretKey: {
			validator: $.optional.nullable.str,
			desc: {
				'ja-JP': 'reCAPTCHA secret key'
			}
		},

		proxyAccountId: {
			validator: $.optional.nullable.type(ID),
			desc: {
				'ja-JP': 'プロキシアカウントのID'
			}
		},

		maintainerName: {
			validator: $.optional.nullable.str,
			desc: {
				'ja-JP': 'インスタンスの管理者名'
			}
		},

		maintainerEmail: {
			validator: $.optional.nullable.str,
			desc: {
				'ja-JP': 'インスタンス管理者の連絡先メールアドレス'
			}
		},

		langs: {
			validator: $.optional.arr($.str),
			desc: {
				'ja-JP': 'インスタンスの対象言語'
			}
		},

		summalyProxy: {
			validator: $.optional.nullable.str,
			desc: {
				'ja-JP': 'summalyプロキシURL'
			}
		},

		enableTwitterIntegration: {
			validator: $.optional.bool,
			desc: {
				'ja-JP': 'Twitter連携機能を有効にするか否か'
			}
		},

		twitterConsumerKey: {
			validator: $.optional.nullable.str,
			desc: {
				'ja-JP': 'TwitterアプリのConsumer key'
			}
		},

		twitterConsumerSecret: {
			validator: $.optional.nullable.str,
			desc: {
				'ja-JP': 'TwitterアプリのConsumer secret'
			}
		},

		enableGithubIntegration: {
			validator: $.optional.bool,
			desc: {
				'ja-JP': 'GitHub連携機能を有効にするか否か'
			}
		},

		githubClientId: {
			validator: $.optional.nullable.str,
			desc: {
				'ja-JP': 'GitHubアプリのClient ID'
			}
		},

		githubClientSecret: {
			validator: $.optional.nullable.str,
			desc: {
				'ja-JP': 'GitHubアプリのClient Secret'
			}
		},

		enableDiscordIntegration: {
			validator: $.optional.bool,
			desc: {
				'ja-JP': 'Discord連携機能を有効にするか否か'
			}
		},

		discordClientId: {
			validator: $.optional.nullable.str,
			desc: {
				'ja-JP': 'DiscordアプリのClient ID'
			}
		},

		discordClientSecret: {
			validator: $.optional.nullable.str,
			desc: {
				'ja-JP': 'DiscordアプリのClient Secret'
			}
		},

		enableEmail: {
			validator: $.optional.bool,
			desc: {
				'ja-JP': 'メール配信を有効にするか否か'
			}
		},

		email: {
			validator: $.optional.nullable.str,
			desc: {
				'ja-JP': 'メール配信する際に利用するメールアドレス'
			}
		},

		smtpSecure: {
			validator: $.optional.bool,
			desc: {
				'ja-JP': 'SMTPサーバがSSLを使用しているか否か'
			}
		},

		smtpHost: {
			validator: $.optional.nullable.str,
			desc: {
				'ja-JP': 'SMTPサーバのホスト'
			}
		},

		smtpPort: {
			validator: $.optional.nullable.num,
			desc: {
				'ja-JP': 'SMTPサーバのポート'
			}
		},

		smtpUser: {
			validator: $.optional.nullable.str,
			desc: {
				'ja-JP': 'SMTPサーバのユーザー名'
			}
		},

		smtpPass: {
			validator: $.optional.nullable.str,
			desc: {
				'ja-JP': 'SMTPサーバのパスワード'
			}
		},

		enableServiceWorker: {
			validator: $.optional.bool,
			desc: {
				'ja-JP': 'ServiceWorkerを有効にするか否か'
			}
		},

		swPublicKey: {
			validator: $.optional.nullable.str,
			desc: {
				'ja-JP': 'ServiceWorkerのVAPIDキーペアの公開鍵'
			}
		},

		swPrivateKey: {
			validator: $.optional.nullable.str,
			desc: {
				'ja-JP': 'ServiceWorkerのVAPIDキーペアの秘密鍵'
			}
		},

		tosUrl: {
			validator: $.optional.nullable.str,
			desc: {
				'ja-JP': '利用規約のURL'
			}
		},

		repositoryUrl: {
			validator: $.optional.str,
			desc: {
				'ja-JP': 'リポジトリのURL'
			}
		},

		feedbackUrl: {
			validator: $.optional.str,
			desc: {
				'ja-JP': 'フィードバックのURL'
			}
		},

		useObjectStorage: {
			validator: $.optional.bool
		},

		objectStorageBaseUrl: {
			validator: $.optional.nullable.str
		},

		objectStorageBucket: {
			validator: $.optional.nullable.str
		},

		objectStoragePrefix: {
			validator: $.optional.nullable.str
		},

		objectStorageEndpoint: {
			validator: $.optional.nullable.str
		},

		objectStorageRegion: {
			validator: $.optional.nullable.str
		},

		objectStoragePort: {
			validator: $.optional.nullable.num
		},

		objectStorageAccessKey: {
			validator: $.optional.nullable.str
		},

		objectStorageSecretKey: {
			validator: $.optional.nullable.str
		},

		objectStorageUseSSL: {
			validator: $.optional.bool
		},
		
		objectStorageUseProxy: {
			validator: $.optional.bool
		}
	}
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

	await getConnection().transaction(async transactionalEntityManager => {
		const meta = await transactionalEntityManager.findOne(Meta, {
			order: {
				id: 'DESC'
			}
		});

		if (meta) {
			await transactionalEntityManager.update(Meta, meta.id, set);
		} else {
			await transactionalEntityManager.save(Meta, set);
		}
	});

	insertModerationLog(me, 'updateMeta');
});
