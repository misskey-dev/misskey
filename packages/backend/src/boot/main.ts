import { DataSource, EntityTarget, ObjectLiteral } from 'typeorm';
import {
	AggregateError,
	Envs,
	IServiceCollection,
	WebAppOptions,
	addSingletonFactory,
	addSingletonInstance,
	createWebAppBuilder,
	getRequiredService,
} from 'yohira';
import { Config, loadConfig } from '@/config.js';
import { q } from '@/core/QueueModule.js';
import { DI } from '@/di-symbols.js';
import {
	AbuseUserReport,
	AccessToken,
	Ad,
	Announcement,
	AnnouncementRead,
	Antenna,
	AntennaNote,
	App,
	AttestationChallenge,
	AuthSession,
	Blocking,
	Channel,
	ChannelFollowing,
	ChannelNotePining,
	Clip,
	ClipNote,
	DriveFile,
	DriveFolder,
	Emoji,
	Flash,
	FlashLike,
	FollowRequest,
	Following,
	GalleryLike,
	GalleryPost,
	Hashtag,
	Instance,
	MessagingMessage,
	Meta,
	ModerationLog,
	MutedNote,
	Muting,
	Note,
	NoteFavorite,
	NoteReaction,
	NoteThreadMuting,
	NoteUnread,
	Notification,
	Page,
	PageLike,
	PasswordResetRequest,
	Poll,
	PollVote,
	PromoNote,
	PromoRead,
	RegistrationTicket,
	RegistryItem,
	Relay,
	RetentionAggregation,
	Role,
	RoleAssignment,
	Signin,
	SwSubscription,
	UsedUsername,
	User,
	UserGroup,
	UserGroupInvitation,
	UserGroupJoining,
	UserIp,
	UserKeypair,
	UserList,
	UserListJoining,
	UserNotePining,
	UserPending,
	UserProfile,
	UserPublickey,
	UserSecurityKey,
	Webhook,
} from '@/models/index.js';
import { createPostgresDataSource } from '@/postgres.js';
import { createRedisConnection } from '@/redis.js';

// REVIEW
async function addGlobalModule(services: IServiceCollection): Promise<void> {
	const config = loadConfig();
	addSingletonInstance(services, DI.config, config);

	const db = await createPostgresDataSource(config).initialize();
	addSingletonInstance(services, DI.db, db);

	const redisClient = createRedisConnection(config);
	addSingletonInstance(services, DI.redis, redisClient);

	const redisSubscriber = createRedisConnection(config);
	redisSubscriber.subscribe(config.host);
	addSingletonInstance(services, DI.redisSubscriber, redisSubscriber);
}

function addQueueModule(services: IServiceCollection): void {
	addSingletonFactory(services, Symbol.for('queue:system'), (services) => {
		const config = getRequiredService<Config>(services, DI.config);
		return q(config, 'system');
	});

	addSingletonFactory(
		services,
		Symbol.for('queue:endedPollNotification'),
		(services) => {
			const config = getRequiredService<Config>(services, DI.config);
			return q(config, 'endedPollNotification');
		},
	);

	addSingletonFactory(services, Symbol.for('queue:deliver'), (services) => {
		const config = getRequiredService<Config>(services, DI.config);
		return q(config, 'deliver', config.deliverJobPerSec ?? 128);
	});

	addSingletonFactory(services, Symbol.for('queue:inbox'), (services) => {
		const config = getRequiredService<Config>(services, DI.config);
		return q(config, 'inbox', config.inboxJobPerSec ?? 16);
	});

	addSingletonFactory(services, Symbol.for('queue:db'), (services) => {
		const config = getRequiredService<Config>(services, DI.config);
		return q(config, 'db');
	});

	addSingletonFactory(
		services,
		Symbol.for('queue:objectStorage'),
		(services) => {
			const config = getRequiredService<Config>(services, DI.config);
			return q(config, 'objectStorage');
		},
	);

	addSingletonFactory(
		services,
		Symbol.for('queue:webhookDeliver'),
		(services) => {
			const config = getRequiredService<Config>(services, DI.config);
			return q(config, 'webhookDeliver', 64);
		},
	);
}

function addRepositoryModule(services: IServiceCollection): void {
	const repositoryModule: [symbol, EntityTarget<ObjectLiteral>][] = [
		[DI.usersRepository, User],
		[DI.notesRepository, Note],
		[DI.announcementsRepository, Announcement],
		[DI.announcementReadsRepository, AnnouncementRead],
		[DI.appsRepository, App],
		[DI.noteFavoritesRepository, NoteFavorite],
		[DI.noteThreadMutingsRepository, NoteThreadMuting],
		[DI.noteReactionsRepository, NoteReaction],
		[DI.noteUnreadsRepository, NoteUnread],
		[DI.pollsRepository, Poll],
		[DI.pollVotesRepository, PollVote],
		[DI.userProfilesRepository, UserProfile],
		[DI.userKeypairsRepository, UserKeypair],
		[DI.userPendingsRepository, UserPending],
		[DI.attestationChallengesRepository, AttestationChallenge],
		[DI.userSecurityKeysRepository, UserSecurityKey],
		[DI.userPublickeysRepository, UserPublickey],
		[DI.userListsRepository, UserList],
		[DI.userListJoiningsRepository, UserListJoining],
		[DI.userGroupsRepository, UserGroup],
		[DI.userGroupJoiningsRepository, UserGroupJoining],
		[DI.userGroupInvitationsRepository, UserGroupInvitation],
		[DI.userNotePiningsRepository, UserNotePining],
		[DI.userIpsRepository, UserIp],
		[DI.usedUsernamesRepository, UsedUsername],
		[DI.followingsRepository, Following],
		[DI.followRequestsRepository, FollowRequest],
		[DI.instancesRepository, Instance],
		[DI.emojisRepository, Emoji],
		[DI.driveFilesRepository, DriveFile],
		[DI.driveFoldersRepository, DriveFolder],
		[DI.notificationsRepository, Notification],
		[DI.metasRepository, Meta],
		[DI.mutingsRepository, Muting],
		[DI.blockingsRepository, Blocking],
		[DI.swSubscriptionsRepository, SwSubscription],
		[DI.hashtagsRepository, Hashtag],
		[DI.abuseUserReportsRepository, AbuseUserReport],
		[DI.registrationTicketsRepository, RegistrationTicket],
		[DI.authSessionsRepository, AuthSession],
		[DI.accessTokensRepository, AccessToken],
		[DI.signinsRepository, Signin],
		[DI.messagingMessagesRepository, MessagingMessage],
		[DI.pagesRepository, Page],
		[DI.pageLikesRepository, PageLike],
		[DI.galleryPostsRepository, GalleryPost],
		[DI.galleryLikesRepository, GalleryLike],
		[DI.moderationLogsRepository, ModerationLog],
		[DI.clipsRepository, Clip],
		[DI.clipNotesRepository, ClipNote],
		[DI.antennasRepository, Antenna],
		[DI.antennaNotesRepository, AntennaNote],
		[DI.promoNotesRepository, PromoNote],
		[DI.promoReadsRepository, PromoRead],
		[DI.relaysRepository, Relay],
		[DI.mutedNotesRepository, MutedNote],
		[DI.channelsRepository, Channel],
		[DI.channelFollowingsRepository, ChannelFollowing],
		[DI.channelNotePiningsRepository, ChannelNotePining],
		[DI.registryItemsRepository, RegistryItem],
		[DI.webhooksRepository, Webhook],
		[DI.adsRepository, Ad],
		[DI.passwordResetRequestsRepository, PasswordResetRequest],
		[DI.retentionAggregationsRepository, RetentionAggregation],
		[DI.rolesRepository, Role],
		[DI.roleAssignmentsRepository, RoleAssignment],
		[DI.flashsRepository, Flash],
		[DI.flashLikesRepository, FlashLike],
	];
	for (const [serviceType, target] of repositoryModule) {
		addSingletonFactory(services, serviceType, (services) => {
			const db = getRequiredService<DataSource>(services, DI.db);
			return db.getRepository(target);
		});
	}
}

export async function main(): Promise<void> {
	try {
		const options = new WebAppOptions();
		options.envName = Envs.Development;
		const builder = createWebAppBuilder(options);
		const services = builder.services;

		await addGlobalModule(services);
		addQueueModule(services);
		addRepositoryModule(services);

		const app = builder.build();

		await app.run();
	} catch (error) {
		if (error instanceof AggregateError) {
			const messages: string[] = [];
			messages.push(error.message);
			for (const innerError of error.errors) {
				if (innerError instanceof Error) {
					messages.push(innerError.message);
				} else {
					messages.push(innerError);
				}
			}
			console.error(messages.join('\n'));
		} else {
			throw error;
		}
	}
}
