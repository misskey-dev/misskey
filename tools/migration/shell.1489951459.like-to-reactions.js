db.users.update({}, {
	$unset: {
		likes_count: 1,
		liked_count: 1
	}
}, false, true)

db.likes.renameCollection('post_reactions')

db.post_reactions.update({}, {
	$set: {
		reaction: 'like'
	}
}, false, true)

db.posts.update({}, {
	$rename: {
		likes_count: 'reaction_counts.like'
	}
}, false, true);

db.notifications.remove({})
