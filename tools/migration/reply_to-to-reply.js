db.posts.update({}, {
	$rename: {
		reply_to_id: 'reply_id'
	}
}, false, true);
