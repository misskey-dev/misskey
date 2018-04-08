db.pollVotes.update({}, {
	$rename: {
		postId: 'noteId',
	}
}, false, true);

db.postReactions.renameCollection('noteReactions');
db.noteReactions.update({}, {
	$rename: {
		postId: 'noteId',
	}
}, false, true);

db.postWatching.renameCollection('noteWatching');
db.noteWatching.update({}, {
	$rename: {
		postId: 'noteId',
	}
}, false, true);

db.posts.renameCollection('notes');
db.notes.update({}, {
	$rename: {
		_repost: '_renote',
		repostId: 'renoteId',
		repostCount: 'renoteCount'
	}
}, false, true);

db.users.update({}, {
	$rename: {
		postsCount: 'notesCount',
		pinnedPostId: 'pinnedNoteId',
		latestPost: 'latestNote'
	}
}, false, true);
