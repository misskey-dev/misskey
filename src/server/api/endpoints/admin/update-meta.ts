import $ from 'cafy';
import Meta from '../../../../models/meta';
import define from '../../define';

export const meta = {
	desc: {
		'ja-JP': 'インスタンスの設定を更新します。'
	},

	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	params: {
		announcements: {
			validator: $.optional.nullable.arr($.obj()),
			desc: {
				'ja-JP': 'お知らせ'
			}
		},

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

		hidedTags: {
			validator: $.optional.nullable.arr($.str),
			desc: {
				'ja-JP': '統計などで無視するハッシュタグ'
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
			validator: $.optional.num.min(0),
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

		proxyAccount: {
			validator: $.optional.nullable.str,
			desc: {
				'ja-JP': 'プロキシアカウントのユーザー名'
			}
		},

		maintainerName: {
			validator: $.optional.str,
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

		enableExternalUserRecommendation: {
			validator: $.optional.bool,
			desc: {
				'ja-JP': '外部ユーザーレコメンデーションを有効にする'
			}
		},

		externalUserRecommendationEngine: {
			validator: $.optional.nullable.str,
			desc: {
				'ja-JP': '外部ユーザーレコメンデーションのサードパーティエンジン'
			}
		},

		externalUserRecommendationTimeout: {
			validator: $.optional.nullable.num.min(0),
			desc: {
				'ja-JP': '外部ユーザーレコメンデーションのタイムアウト (ミリ秒)'
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
	}
};

export default define(meta, async (ps) => {
	const set = {} as any;

	if (ps.announcements) {
		set.announcements = ps.announcements;
	}

	if (typeof ps.disableRegistration === 'boolean') {
		set.disableRegistration = ps.disableRegistration;
	}

	if (typeof ps.disableLocalTimeline === 'boolean') {
		set.disableLocalTimeline = ps.disableLocalTimeline;
	}

	if (typeof ps.disableGlobalTimeline === 'boolean') {
		set.disableGlobalTimeline = ps.disableGlobalTimeline;
	}

	if (Array.isArray(ps.hidedTags)) {
		set.hidedTags = ps.hidedTags;
	}

	if (ps.mascotImageUrl !== undefined) {
		set.mascotImageUrl = ps.mascotImageUrl;
	}

	if (ps.bannerUrl !== undefined) {
		set.bannerUrl = ps.bannerUrl;
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

	if (ps.enableRecaptcha !== undefined) {
		set.enableRecaptcha = ps.enableRecaptcha;
	}

	if (ps.recaptchaSiteKey !== undefined) {
		set.recaptchaSiteKey = ps.recaptchaSiteKey;
	}

	if (ps.recaptchaSecretKey !== undefined) {
		set.recaptchaSecretKey = ps.recaptchaSecretKey;
	}

	if (ps.proxyAccount !== undefined) {
		set.proxyAccount = ps.proxyAccount;
	}

	if (ps.maintainerName !== undefined) {
		set['maintainer.name'] = ps.maintainerName;
	}

	if (ps.maintainerEmail !== undefined) {
		set['maintainer.email'] = ps.maintainerEmail;
	}

	if (ps.langs !== undefined) {
		set.langs = ps.langs;
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

	if (ps.enableExternalUserRecommendation !== undefined) {
		set.enableExternalUserRecommendation = ps.enableExternalUserRecommendation;
	}

	if (ps.externalUserRecommendationEngine !== undefined) {
		set.externalUserRecommendationEngine = ps.externalUserRecommendationEngine;
	}

	if (ps.externalUserRecommendationTimeout !== undefined) {
		set.externalUserRecommendationTimeout = ps.externalUserRecommendationTimeout;
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

	await Meta.update({}, {
		$set: set
	}, { upsert: true });

	return;
});
