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

