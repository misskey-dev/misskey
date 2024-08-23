/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { MiAbuseUserReport, MiNote, MiUser, MiWebhook } from '@/models/_.js';
import { bindThis } from '@/decorators.js';
import { MiSystemWebhook, type SystemWebhookEventType } from '@/models/SystemWebhook.js';
import { SystemWebhookService } from '@/core/SystemWebhookService.js';
import { Packed } from '@/misc/json-schema.js';
import { type WebhookEventTypes } from '@/models/Webhook.js';
import { UserWebhookService } from '@/core/UserWebhookService.js';

const oneDayMillis = 24 * 60 * 60 * 1000;

function generateAbuseReport(override?: Partial<MiAbuseUserReport>): MiAbuseUserReport {
	return {
		id: 'dummy-abuse-report1',
		targetUserId: 'dummy-target-user',
		targetUser: null,
		reporterId: 'dummy-reporter-user',
		reporter: null,
		assigneeId: null,
		assignee: null,
		resolved: false,
		forwarded: false,
		comment: 'This is a dummy report for testing purposes.',
		targetUserHost: null,
		reporterHost: null,
		...override,
	};
}

function generateDummyUser(override?: Partial<MiUser>): MiUser {
	return {
		id: 'dummy-user-1',
		updatedAt: new Date(Date.now() - oneDayMillis * 7),
		lastFetchedAt: new Date(Date.now() - oneDayMillis * 5),
		lastActiveDate: new Date(Date.now() - oneDayMillis * 3),
		hideOnlineStatus: false,
		username: 'dummy1',
		usernameLower: 'dummy1',
		name: 'DummyUser1',
		followersCount: 10,
		followingCount: 5,
		movedToUri: null,
		movedAt: null,
		alsoKnownAs: null,
		notesCount: 30,
		avatarId: null,
		avatar: null,
		bannerId: null,
		banner: null,
		avatarUrl: null,
		bannerUrl: null,
		avatarBlurhash: null,
		bannerBlurhash: null,
		avatarDecorations: [],
		tags: [],
		isSuspended: false,
		isLocked: false,
		isBot: false,
		isCat: true,
		isRoot: false,
		isExplorable: true,
		isHibernated: false,
		isDeleted: false,
		emojis: [],
		host: null,
		inbox: null,
		sharedInbox: null,
		featured: null,
		uri: null,
		followersUri: null,
		token: null,
		...override,
	};
}

function generateDummyNote(override?: Partial<MiNote>): MiNote {
	return {
		id: 'dummy-note-1',
		replyId: null,
		reply: null,
		renoteId: null,
		renote: null,
		threadId: null,
		text: 'This is a dummy note for testing purposes.',
		name: null,
		cw: null,
		userId: 'dummy-user-1',
		user: null,
		localOnly: true,
		reactionAcceptance: 'likeOnly',
		renoteCount: 10,
		repliesCount: 5,
		clippedCount: 0,
		reactions: {},
		visibility: 'public',
		uri: null,
		url: null,
		fileIds: [],
		attachedFileTypes: [],
		visibleUserIds: [],
		mentions: [],
		mentionedRemoteUsers: '[]',
		reactionAndUserPairCache: [],
		emojis: [],
		tags: [],
		hasPoll: false,
		channelId: null,
		channel: null,
		userHost: null,
		replyUserId: null,
		replyUserHost: null,
		renoteUserId: null,
		renoteUserHost: null,
		...override,
	};
}

function toPackedNote(note: MiNote, detail = true, override?: Packed<'Note'>): Packed<'Note'> {
	return {
		id: note.id,
		createdAt: new Date().toISOString(),
		deletedAt: null,
		text: note.text,
		cw: note.cw,
		userId: note.userId,
		user: toPackedUserLite(note.user ?? generateDummyUser()),
		replyId: note.replyId,
		renoteId: note.renoteId,
		isHidden: false,
		visibility: note.visibility,
		mentions: note.mentions,
		visibleUserIds: note.visibleUserIds,
		fileIds: note.fileIds,
		files: [],
		tags: note.tags,
		poll: null,
		emojis: note.emojis,
		channelId: note.channelId,
		channel: note.channel,
		localOnly: note.localOnly,
		reactionAcceptance: note.reactionAcceptance,
		reactionEmojis: {},
		reactions: {},
		reactionCount: 0,
		renoteCount: note.renoteCount,
		repliesCount: note.repliesCount,
		uri: note.uri ?? undefined,
		url: note.url ?? undefined,
		reactionAndUserPairCache: note.reactionAndUserPairCache,
		...(detail ? {
			clippedCount: note.clippedCount,
			reply: note.reply ? toPackedNote(note.reply, false) : null,
			renote: note.renote ? toPackedNote(note.renote, true) : null,
			myReaction: null,
		} : {}),
		...override,
	};
}

function toPackedUserLite(user: MiUser, override?: Packed<'UserLite'>): Packed<'UserLite'> {
	return {
		id: user.id,
		name: user.name,
		username: user.username,
		host: user.host,
		avatarUrl: user.avatarUrl,
		avatarBlurhash: user.avatarBlurhash,
		avatarDecorations: user.avatarDecorations.map(it => ({
			id: it.id,
			angle: it.angle,
			flipH: it.flipH,
			url: 'https://example.com/dummy-image001.png',
			offsetX: it.offsetX,
			offsetY: it.offsetY,
		})),
		isBot: user.isBot,
		isCat: user.isCat,
		emojis: user.emojis,
		onlineStatus: 'active',
		badgeRoles: [],
		...override,
	};
}

function toPackedUserDetailedNotMe(user: MiUser, override?: Packed<'UserDetailedNotMe'>): Packed<'UserDetailedNotMe'> {
	return {
		...toPackedUserLite(user),
		url: null,
		uri: null,
		movedTo: null,
		alsoKnownAs: [],
		createdAt: new Date().toISOString(),
		updatedAt: user.updatedAt?.toISOString() ?? null,
		lastFetchedAt: user.lastFetchedAt?.toISOString() ?? null,
		bannerUrl: user.bannerUrl,
		bannerBlurhash: user.bannerBlurhash,
		isLocked: user.isLocked,
		isSilenced: false,
		isSuspended: user.isSuspended,
		description: null,
		location: null,
		birthday: null,
		lang: null,
		fields: [],
		verifiedLinks: [],
		followersCount: user.followersCount,
		followingCount: user.followingCount,
		notesCount: user.notesCount,
		pinnedNoteIds: [],
		pinnedNotes: [],
		pinnedPageId: null,
		pinnedPage: null,
		publicReactions: true,
		followersVisibility: 'public',
		followingVisibility: 'public',
		twoFactorEnabled: false,
		usePasswordLessLogin: false,
		securityKeys: false,
		roles: [],
		memo: null,
		moderationNote: undefined,
		isFollowing: false,
		isFollowed: false,
		hasPendingFollowRequestFromYou: false,
		hasPendingFollowRequestToYou: false,
		isBlocking: false,
		isBlocked: false,
		isMuted: false,
		isRenoteMuted: false,
		notify: 'none',
		withReplies: true,
		...override,
	};
}

const dummyUser1 = generateDummyUser();
const dummyUser2 = generateDummyUser({
	id: 'dummy-user-2',
	updatedAt: new Date(Date.now() - oneDayMillis * 30),
	lastFetchedAt: new Date(Date.now() - oneDayMillis),
	lastActiveDate: new Date(Date.now() - oneDayMillis),
	username: 'dummy2',
	usernameLower: 'dummy2',
	name: 'DummyUser2',
	followersCount: 40,
	followingCount: 50,
	notesCount: 900,
});
const dummyUser3 = generateDummyUser({
	id: 'dummy-user-3',
	updatedAt: new Date(Date.now() - oneDayMillis * 15),
	lastFetchedAt: new Date(Date.now() - oneDayMillis * 2),
	lastActiveDate: new Date(Date.now() - oneDayMillis * 2),
	username: 'dummy3',
	usernameLower: 'dummy3',
	name: 'DummyUser3',
	followersCount: 60,
	followingCount: 70,
	notesCount: 15900,
});

@Injectable()
export class WebhookTestService {
	public static NoSuchActiveWebhookError = class extends Error {};

	constructor(
		private userWebhookService: UserWebhookService,
		private systemWebhookService: SystemWebhookService,
	) {
	}

	/**
	 * UserWebhookのテスト送信を行う.
	 * 送信されるペイロードはいずれもダミーの値で、実際にはデータベース上に存在しない.
	 */
	@bindThis
	public async testUserWebhook(
		params: { webhookId: MiWebhook | MiWebhook['id'], type: WebhookEventTypes },
		sender: MiUser | null,
	) {
		const webhook = (await this.userWebhookService.getActiveWebhooks())
			.find(a => a.id === params.webhookId && a.userId === sender?.id);
		if (!webhook || !webhook.active) {
			throw new WebhookTestService.NoSuchActiveWebhookError();
		}

		const send = (contents: unknown) => {
			// テストなのでJobの試行回数は1回だけ
			this.userWebhookService.enqueueUserWebhook(webhook, params.type, contents, { attempts: 1 });
		};

		const dummyNote1 = generateDummyNote({
			userId: dummyUser1.id,
			user: dummyUser1,
		});
		const dummyReply1 = generateDummyNote({
			id: 'dummy-reply-1',
			replyId: dummyNote1.id,
			reply: dummyNote1,
			userId: dummyUser1.id,
			user: dummyUser1,
		});
		const dummyRenote1 = generateDummyNote({
			id: 'dummy-renote-1',
			renoteId: dummyNote1.id,
			renote: dummyNote1,
			userId: dummyUser2.id,
			user: dummyUser2,
			text: null,
		});
		const dummyMention1 = generateDummyNote({
			id: 'dummy-mention-1',
			userId: dummyUser1.id,
			user: dummyUser1,
			text: `@${dummyUser2.username} This is a mention to you.`,
			mentions: [dummyUser2.id],
		});

		switch (params.type) {
			case 'note': {
				send(toPackedNote(dummyNote1));
				break;
			}
			case 'reply': {
				send(toPackedNote(dummyReply1));
				break;
			}
			case 'renote': {
				send(toPackedNote(dummyRenote1));
				break;
			}
			case 'mention': {
				send(toPackedNote(dummyMention1));
				break;
			}
			case 'follow': {
				send(toPackedUserDetailedNotMe(dummyUser1));
				break;
			}
			case 'followed': {
				send(toPackedUserLite(dummyUser2));
				break;
			}
			case 'unfollow': {
				send(toPackedUserDetailedNotMe(dummyUser3));
				break;
			}
		}
	}

	/**
	 * SystemWebhookのテスト送信を行う.
	 * 送信されるペイロードはいずれもダミーの値で、実際にはデータベース上に存在しない.
	 */
	@bindThis
	public async testSystemWebhook(
		params: { webhookId: MiSystemWebhook['id'], type: SystemWebhookEventType },
	) {
		const webhook = (await this.systemWebhookService.fetchActiveSystemWebhooks())
			.find(a => a.id === params.webhookId);
		if (!webhook || !webhook.isActive) {
			throw new WebhookTestService.NoSuchActiveWebhookError();
		}

		const send = (contents: unknown) => {
			// テストなのでJobの試行回数は1回だけ
			this.systemWebhookService.enqueueSystemWebhook(webhook, params.type, contents, { attempts: 1 });
		};

		switch (params.type) {
			case 'abuseReport': {
				send(generateAbuseReport({
					targetUserId: dummyUser1.id,
					targetUser: dummyUser1,
					reporterId: dummyUser2.id,
					reporter: dummyUser2,
				}));
				break;
			}
			case 'abuseReportResolved': {
				send(generateAbuseReport({
					targetUserId: dummyUser1.id,
					targetUser: dummyUser1,
					reporterId: dummyUser2.id,
					reporter: dummyUser2,
					assigneeId: dummyUser3.id,
					assignee: dummyUser3,
					resolved: true,
				}));
				break;
			}
			case 'userCreated': {
				send(toPackedUserLite(dummyUser1));
				break;
			}
		}
	}
}
