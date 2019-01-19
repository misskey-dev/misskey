import $ from 'cafy';
import Meta from '../../../../models/meta';
import define from '../../define';

export const meta = {
	desc: {
		'ja-JP': 'インスタンスの設定を更新します。'
	},

	requireCredential: true,
	requireModerator: true,

	params: {
		broadcasts: {
			validator: $.arr($.obj()).optional.nullable,
			desc: {
				'ja-JP': 'ブロードキャスト'
			}
		},

		disableRegistration: {
			validator: $.bool.optional.nullable,
			desc: {
				'ja-JP': '招待制か否か'
			}
		},

		disableLocalTimeline: {
			validator: $.bool.optional.nullable,
			desc: {
				'ja-JP': 'ローカルタイムライン(とソーシャルタイムライン)を無効にするか否か'
			}
		},

		hidedTags: {
			validator: $.arr($.str).optional.nullable,
			desc: {
				'ja-JP': '統計などで無視するハッシュタグ'
			}
		},

		bannerUrl: {
			validator: $.str.optional.nullable,
			desc: {
				'ja-JP': 'インスタンスのバナー画像URL'
			}
		},

		errorImageUrl: {
			validator: $.str.optional.nullable,
			desc: {
				'ja-JP': 'インスタンスのエラー画像URL'
			}
		},

		name: {
			validator: $.str.optional.nullable,
			desc: {
				'ja-JP': 'インスタンス名'
			}
		},

		description: {
			validator: $.str.optional.nullable,
			desc: {
				'ja-JP': 'インスタンスの紹介文'
			}
		},

		maxNoteTextLength: {
			validator: $.num.optional.min(1),
			desc: {
				'ja-JP': '投稿の最大文字数'
			}
		},

		localDriveCapacityMb: {
			validator: $.num.optional.min(0),
			desc: {
				'ja-JP': 'ローカルユーザーひとりあたりのドライブ容量 (メガバイト単位)',
				'en-US': 'Drive capacity of a local user (MB)'
			}
		},

		remoteDriveCapacityMb: {
			validator: $.num.optional.min(0),
			desc: {
				'ja-JP': 'リモートユーザーひとりあたりのドライブ容量 (メガバイト単位)',
				'en-US': 'Drive capacity of a remote user (MB)'
			}
		},

		cacheRemoteFiles: {
			validator: $.bool.optional,
			desc: {
				'ja-JP': 'リモートのファイルをキャッシュするか否か'
			}
		},

		enableRecaptcha: {
			validator: $.bool.optional,
			desc: {
				'ja-JP': 'reCAPTCHAを使用するか否か'
			}
		},

		recaptchaSiteKey: {
			validator: $.str.optional.nullable,
			desc: {
				'ja-JP': 'reCAPTCHA site key'
			}
		},

		recaptchaSecretKey: {
			validator: $.str.optional.nullable,
			desc: {
				'ja-JP': 'reCAPTCHA secret key'
			}
		},

		proxyAccount: {
			validator: $.str.optional.nullable,
			desc: {
				'ja-JP': 'プロキシアカウントのユーザー名'
			}
		},

		maintainerName: {
			validator: $.str.optional,
			locates: 'maintainer.name',
			desc: {
				'ja-JP': 'インスタンスの管理者名'
			}
		},

		maintainerEmail: {
			validator: $.str.optional.nullable,
			locates: 'maintainer.email',
			desc: {
				'ja-JP': 'インスタンス管理者の連絡先メールアドレス'
			}
		},

		langs: {
			validator: $.arr($.str).optional,
			desc: {
				'ja-JP': 'インスタンスの対象言語'
			}
		},

		summalyProxy: {
			validator: $.str.optional.nullable,
			desc: {
				'ja-JP': 'summalyプロキシURL'
			}
		},

		enableTwitterIntegration: {
			validator: $.bool.optional,
			desc: {
				'ja-JP': 'Twitter連携機能を有効にするか否か'
			}
		},

		twitterConsumerKey: {
			validator: $.str.optional.nullable,
			desc: {
				'ja-JP': 'TwitterアプリのConsumer key'
			}
		},

		twitterConsumerSecret: {
			validator: $.str.optional.nullable,
			desc: {
				'ja-JP': 'TwitterアプリのConsumer secret'
			}
		},

		enableGithubIntegration: {
			validator: $.bool.optional,
			desc: {
				'ja-JP': 'GitHub連携機能を有効にするか否か'
			}
		},

		githubClientId: {
			validator: $.str.optional.nullable,
			desc: {
				'ja-JP': 'GitHubアプリのClient ID'
			}
		},

		githubClientSecret: {
			validator: $.str.optional.nullable,
			desc: {
				'ja-JP': 'GitHubアプリのClient Secret'
			}
		},

		enableDiscordIntegration: {
			validator: $.bool.optional,
			desc: {
				'ja-JP': 'Discord連携機能を有効にするか否か'
			}
		},

		discordClientId: {
			validator: $.str.optional.nullable,
			desc: {
				'ja-JP': 'DiscordアプリのClient ID'
			}
		},

		discordClientSecret: {
			validator: $.str.optional.nullable,
			desc: {
				'ja-JP': 'DiscordアプリのClient Secret'
			}
		},

		enableExternalUserRecommendation: {
			validator: $.bool.optional,
			desc: {
				'ja-JP': '外部ユーザーレコメンデーションを有効にする'
			}
		},

		externalUserRecommendationEngine: {
			validator: $.str.optional.nullable,
			desc: {
				'ja-JP': '外部ユーザーレコメンデーションのサードパーティエンジン'
			}
		},

		externalUserRecommendationTimeout: {
			validator: $.num.optional.nullable.min(0),
			desc: {
				'ja-JP': '外部ユーザーレコメンデーションのタイムアウト (ミリ秒)'
			}
		},

		enableEmail: {
			validator: $.bool.optional,
			desc: {
				'ja-JP': 'メール配信を有効にするか否か'
			}
		},

		email: {
			validator: $.str.optional.nullable,
			desc: {
				'ja-JP': 'メール配信する際に利用するメールアドレス'
			}
		},

		smtpSecure: {
			validator: $.bool.optional,
			desc: {
				'ja-JP': 'SMTPサーバがSSLを使用しているか否か'
			}
		},

		smtpHost: {
			validator: $.str.optional.nullable,
			desc: {
				'ja-JP': 'SMTPサーバのホスト'
			}
		},

		smtpPort: {
			validator: $.num.optional.nullable,
			desc: {
				'ja-JP': 'SMTPサーバのポート'
			}
		},

		smtpUser: {
			validator: $.str.optional.nullable,
			desc: {
				'ja-JP': 'SMTPサーバのユーザー名'
			}
		},

		smtpPass: {
			validator: $.str.optional.nullable,
			desc: {
				'ja-JP': 'SMTPサーバのパスワード'
			}
		},

		enableServiceWorker: {
			validator: $.bool.optional,
			desc: {
				'ja-JP': 'ServiceWorkerを有効にするか否か'
			}
		},

		swPublicKey: {
			validator: $.str.optional.nullable,
			desc: {
				'ja-JP': 'ServiceWorkerのVAPIDキーペアの公開鍵'
			}
		},

		swPrivateKey: {
			validator: $.str.optional.nullable,
			desc: {
				'ja-JP': 'ServiceWorkerのVAPIDキーペアの秘密鍵'
			}
		},
	}
};

export default define(meta, ps => Meta.update({}, {
		$set: Object.entries(meta.params as {
			[x: string]: { locates?: string }
		}).reduce((a, [k, v]) => Object.assign(a, { [v.locates || k]: (ps as any)[k] }), {} as any)
	}, { upsert: true })
	.then(() => {}));
