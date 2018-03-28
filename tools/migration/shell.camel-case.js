// このスクリプトを走らせる前か後に notifications コレクションはdropしてください

db.access_tokens.renameCollection('accessTokens');
db.accessTokens.update({}, {
	$rename: {
		created_at: 'createdAt',
		app_id: 'appId',
		user_id: 'userId',
	}
}, false, true);

db.apps.update({}, {
	$rename: {
		created_at: 'createdAt',
		user_id: 'userId',
		name_id: 'nameId',
		name_id_lower: 'nameIdLower',
		callback_url: 'callbackUrl',
	}
}, false, true);

db.auth_sessions.renameCollection('authSessions');
db.authSessions.update({}, {
	$rename: {
		created_at: 'createdAt',
		app_id: 'appId',
		user_id: 'userId',
	}
}, false, true);

db.channel_watching.renameCollection('channelWatching');
db.channelWatching.update({}, {
	$rename: {
		created_at: 'createdAt',
		deleted_at: 'deletedAt',
		channel_id: 'channelId',
		user_id: 'userId',
	}
}, false, true);

db.channels.update({}, {
	$rename: {
		created_at: 'createdAt',
		user_id: 'userId',
		watching_count: 'watchingCount'
	}
}, false, true);

db.drive_files.files.renameCollection('driveFiles.files');
db.drive_files.chunks.renameCollection('driveFiles.chunks');
db.driveFiles.files.update({}, {
	$rename: {
		'metadata.user_id': 'metadata.userId',
		'metadata.folder_id': 'metadata.folderId',
		'metadata.properties.average_color': 'metadata.properties.avgColor'
	}
}, false, true);

db.drive_folders.renameCollection('driveFolders');
db.driveFolders.update({}, {
	$rename: {
		created_at: 'createdAt',
		user_id: 'userId',
		parent_id: 'parentId',
	}
}, false, true);

db.favorites.update({}, {
	$rename: {
		created_at: 'createdAt',
		user_id: 'userId',
		post_id: 'postId',
	}
}, false, true);

db.following.update({}, {
	$rename: {
		created_at: 'createdAt',
		deleted_at: 'deletedAt',
		followee_id: 'followeeId',
		follower_id: 'followerId',
	}
}, false, true);

db.messaging_histories.renameCollection('messagingHistories');
db.messagingHistories.update({}, {
	$rename: {
		updated_at: 'updatedAt',
		user_id: 'userId',
		partner: 'partnerId',
		message: 'messageId',
	}
}, false, true);

db.messaging_messages.renameCollection('messagingMessages');
db.messagingMessages.update({}, {
	$rename: {
		created_at: 'createdAt',
		user_id: 'userId',
		recipient_id: 'recipientId',
		file_id: 'fileId',
		is_read: 'isRead'
	}
}, false, true);

db.mute.update({}, {
	$rename: {
		created_at: 'createdAt',
		deleted_at: 'deletedAt',
		mutee_id: 'muteeId',
		muter_id: 'muterId',
	}
}, false, true);

db.othello_games.renameCollection('othelloGames');
db.othelloGames.update({}, {
	$rename: {
		created_at: 'createdAt',
		started_at: 'startedAt',
		is_started: 'isStarted',
		is_ended: 'isEnded',
		user1_id: 'user1Id',
		user2_id: 'user2Id',
		user1_accepted: 'user1Accepted',
		user2_accepted: 'user2Accepted',
		winner_id: 'winnerId',
		'settings.is_llotheo': 'settings.isLlotheo',
		'settings.can_put_everywhere': 'settings.canPutEverywhere',
		'settings.looped_board': 'settings.loopedBoard',
	}
}, false, true);

db.othello_matchings.renameCollection('othelloMatchings');
db.othelloMatchings.update({}, {
	$rename: {
		created_at: 'createdAt',
		parent_id: 'parentId',
		child_id: 'childId'
	}
}, false, true);

db.poll_votes.renameCollection('pollVotes');
db.pollVotes.update({}, {
	$rename: {
		created_at: 'createdAt',
		user_id: 'userId',
		post_id: 'postId'
	}
}, false, true);

db.post_reactions.renameCollection('postReactions');
db.postReactions.update({}, {
	$rename: {
		created_at: 'createdAt',
		user_id: 'userId',
		post_id: 'postId'
	}
}, false, true);

db.post_watching.renameCollection('postWatching');
db.postWatching.update({}, {
	$rename: {
		created_at: 'createdAt',
		user_id: 'userId',
		post_id: 'postId'
	}
}, false, true);

db.posts.update({}, {
	$rename: {
		created_at: 'createdAt',
		channel_id: 'channelId',
		user_id: 'userId',
		app_id: 'appId',
		media_ids: 'mediaIds',
		reply_id: 'replyId',
		repost_id: 'repostId',
		via_mobile: 'viaMobile'
	}
}, false, true);
