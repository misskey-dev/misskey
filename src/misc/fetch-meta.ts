import Meta, { IMeta } from '../models/meta';

const defaultMeta: any = {
	name: 'Misskey',
	maintainer: {},
	langs: [],
	cacheRemoteFiles: true,
	localDriveCapacityMb: 256,
	remoteDriveCapacityMb: 8,
	hidedTags: [],
	stats: {
		originalNotesCount: 0,
		originalUsersCount: 0
	},
	maxNoteTextLength: 1000,
	enableEmojiReaction: true,
	enableTwitterIntegration: false,
	enableGithubIntegration: false,
	enableDiscordIntegration: false,
	enableExternalUserRecommendation: false,
	externalUserRecommendationEngine: 'https://vinayaka.distsn.org/cgi-bin/vinayaka-user-match-misskey-api.cgi?{{host}}+{{user}}+{{limit}}+{{offset}}',
	externalUserRecommendationTimeout: 300000,
	mascotImageUrl: '/assets/ai.png',
	errorImageUrl: 'https://ai.misskey.xyz/aiart/yubitun.png',
	enableServiceWorker: false
};

export default async function(): Promise<IMeta> {
	const meta = await Meta.findOne({});

	return Object.assign({}, defaultMeta, meta);
}
