db.posts.update({
	$or: [{
		mediaIds: null
	}, {
		mediaIds: {
			$exists: false
		}
	}]
}, {
	$set: {
		mediaIds: []
	}
}, false, true);
