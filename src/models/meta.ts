import db from '../db/mongodb';
import config from '../config';
import User from './user';
import { transform } from '../misc/cafy-id';

const Meta = db.get<IMeta>('meta');
export default Meta;

// 後方互換性のため。
// 過去のMisskeyではインスタンス名や紹介を設定ファイルに記述していたのでそれを移行
if ((config as any).name) {
	Meta.findOne({}).then(m => {
		if (m != null && m.name == null) {
			Meta.update({}, {
				$set: {
					name: (config as any).name
				}
			});
		}
	});
}
if ((config as any).description) {
	Meta.findOne({}).then(m => {
		if (m != null && m.description == null) {
			Meta.update({}, {
				$set: {
					description: (config as any).description
				}
			});
		}
	});
}
if ((config as any).localDriveCapacityMb) {
	Meta.findOne({}).then(m => {
		if (m != null && m.localDriveCapacityMb == null) {
			Meta.update({}, {
				$set: {
					localDriveCapacityMb: (config as any).localDriveCapacityMb
				}
			});
		}
	});
}
if ((config as any).remoteDriveCapacityMb) {
	Meta.findOne({}).then(m => {
		if (m != null && m.remoteDriveCapacityMb == null) {
			Meta.update({}, {
				$set: {
					remoteDriveCapacityMb: (config as any).remoteDriveCapacityMb
				}
			});
		}
	});
}
if ((config as any).preventCacheRemoteFiles) {
	Meta.findOne({}).then(m => {
		if (m != null && m.cacheRemoteFiles == null) {
			Meta.update({}, {
				$set: {
					cacheRemoteFiles: !(config as any).preventCacheRemoteFiles
				}
			});
		}
	});
}
if ((config as any).recaptcha) {
	Meta.findOne({}).then(m => {
		if (m != null && m.enableRecaptcha == null) {
			Meta.update({}, {
				$set: {
					enableRecaptcha: (config as any).recaptcha != null,
					recaptchaSiteKey: (config as any).recaptcha.site_key,
					recaptchaSecretKey: (config as any).recaptcha.secret_key,
				}
			});
		}
	});
}
if ((config as any).ghost) {
	Meta.findOne({}).then(async m => {
		if (m != null && m.proxyAccount == null) {
			const account = await User.findOne({ _id: transform((config as any).ghost) });
			Meta.update({}, {
				$set: {
					proxyAccount: account.username
				}
			});
		}
	});
}
if ((config as any).maintainer) {
	Meta.findOne({}).then(m => {
		if (m != null && m.maintainer == null) {
			Meta.update({}, {
				$set: {
					maintainer: (config as any).maintainer
				}
			});
		}
	});
}
if ((config as any).twitter) {
	Meta.findOne({}).then(m => {
		if (m != null && m.enableTwitterIntegration == null) {
			Meta.update({}, {
				$set: {
					enableTwitterIntegration: true,
					twitterConsumerKey: (config as any).twitter.consumer_key,
					twitterConsumerSecret: (config as any).twitter.consumer_secret
				}
			});
		}
	});
}
if ((config as any).github) {
	Meta.findOne({}).then(m => {
		if (m != null && m.enableGithubIntegration == null) {
			Meta.update({}, {
				$set: {
					enableGithubIntegration: true,
					githubClientId: (config as any).github.client_id,
					githubClientSecret: (config as any).github.client_secret
				}
			});
		}
	});
}
if ((config as any).discord) {
	Meta.findOne({}).then(m => {
		if (m != null && m.enableDiscordIntegration == null) {
			Meta.update({}, {
				$set: {
					enableDiscordIntegration: true,
					discordClientId: (config as any).discord.client_id,
					discordClientSecret: (config as any).discord.client_secret
				}
			});
		}
	});
}

export type IMeta = {
	name?: string;
	description?: string;

	/**
	 * メンテナ情報
	 */
	maintainer: {
		/**
		 * メンテナの名前
		 */
		name: string;

		/**
		 * メンテナの連絡先
		 */
		email?: string;
	};

	langs?: string[];

	broadcasts?: any[];

	stats?: {
		notesCount: number;
		originalNotesCount: number;
		usersCount: number;
		originalUsersCount: number;
	};

	disableRegistration?: boolean;
	disableLocalTimeline?: boolean;
	hidedTags?: string[];
	bannerUrl?: string;

	cacheRemoteFiles?: boolean;

	proxyAccount?: string;

	enableRecaptcha?: boolean;
	recaptchaSiteKey?: string;
	recaptchaSecretKey?: string;

	/**
	 * Drive capacity of a local user (MB)
	 */
	localDriveCapacityMb?: number;

	/**
	 * Drive capacity of a remote user (MB)
	 */
	remoteDriveCapacityMb?: number;

	/**
	 * Max allowed note text length in charactors
	 */
	maxNoteTextLength?: number;

	enableTwitterIntegration?: boolean;
	twitterConsumerKey?: string;
	twitterConsumerSecret?: string;

	enableGithubIntegration?: boolean;
	githubClientId?: string;
	githubClientSecret?: string;

	enableDiscordIntegration?: boolean;
	discordClientId?: string;
	discordClientSecret?: string;
};
