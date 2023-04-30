import type { entities } from 'misskey-js'

export function abuseUserReport() {
	return {
		id: 'someabusereportid',
		createdAt: '2016-12-28T22:49:51.000Z',
		comment: 'This user is a spammer!',
		resolved: false,
		reporterId: 'reporterid',
		targetUserId: 'targetuserid',
		assigneeId: 'assigneeid',
		reporter: userDetailed('reporterid', 'reporter', 'misskey-hub.net', 'Reporter'),
		targetUser: userDetailed('targetuserid', 'target', 'misskey-hub.net', 'Target'),
		assignee: userDetailed('assigneeid', 'assignee', 'misskey-hub.net', 'Assignee'),
		me: null,
		forwarded: false,
	};
}

export function galleryPost(isSensitive = false) {
	return {
		id: 'somepostid',
		createdAt: '2016-12-28T22:49:51.000Z',
		updatedAt: '2016-12-28T22:49:51.000Z',
		userid: 'someuserid',
		user: userDetailed(),
		title: 'Some post title',
		description: 'Some post description',
		fileIds: ['somefileid'],
		files: [
			file(isSensitive),
		],
		isSensitive,
		likedCount: 0,
		isLiked: false,
	}
}

export function file(isSensitive = false) {
	return {
		id: 'somefileid',
		createdAt: '2016-12-28T22:49:51.000Z',
		name: 'somefile.jpg',
		type: 'image/jpeg',
		md5: 'f6fc51c73dc21b1fb85ead2cdf57530a',
		size: 77752,
		isSensitive,
		blurhash: 'eQAmoa^-MH8w9ZIvNLSvo^$*MwRPbwtSxutRozjEiwR.RjWBoeozog',
		properties: {
			width: 1024,
			height: 270
		},
		url: 'https://github.com/misskey-dev/misskey/blob/master/packages/frontend/assets/fedi.jpg?raw=true',
		thumbnailUrl: 'https://github.com/misskey-dev/misskey/blob/master/packages/frontend/assets/fedi.jpg?raw=true',
		comment: null,
		folderId: null,
		folder: null,
		userId: null,
		user: null,
	};
}

export function userDetailed(id = 'someuserid', username = 'miskist', host = 'misskey-hub.net', name = 'Misskey User'): entities.UserDetailed {
	return {
		id,
		username,
		host,
		name,
		onlineStatus: 'unknown',
		avatarUrl: 'https://github.com/misskey-dev/misskey/blob/master/packages/frontend/assets/about-icon.png?raw=true',
		avatarBlurhash: 'eQFRshof5NWBRi},juayfPju53WB?0ofs;s*a{ofjuay^SoMEJR%ay',
		emojis: [],
		bannerBlurhash: 'eQA^IW^-MH8w9tE8I=S^o{$*R4RikXtSxutRozjEnNR.RQadoyozog',
		bannerColor: '#000000',
		bannerUrl: 'https://github.com/misskey-dev/misskey/blob/master/packages/frontend/assets/fedi.jpg?raw=true',
		birthday: '2014-06-20',
		createdAt: '2016-12-28T22:49:51.000Z',
		description: 'I am a cool user!',
		ffVisibility: 'public',
		roles: [],
		fields: [
			{
				name: 'Website',
				value: 'https://misskey-hub.net',
			},
		],
		followersCount: 1024,
		followingCount: 16,
		hasPendingFollowRequestFromYou: false,
		hasPendingFollowRequestToYou: false,
		isAdmin: false,
		isBlocked: false,
		isBlocking: false,
		isBot: false,
		isCat: false,
		isFollowed: false,
		isFollowing: false,
		isLocked: false,
		isModerator: false,
		isMuted: false,
		isSilenced: false,
		isSuspended: false,
		lang: 'en',
		location: 'Fediverse',
		notesCount: 65536,
		pinnedNoteIds: [],
		pinnedNotes: [],
		pinnedPage: null,
		pinnedPageId: null,
		publicReactions: false,
		securityKeys: false,
		twoFactorEnabled: false,
		updatedAt: null,
		uri: null,
		url: null,
	};
}
