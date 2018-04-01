db.posts.update({
	$or: [{
		mediaIds: null
	}, {
		mediaIds: {
			$exist: false
		}
	}]
}, {
	$set: {
		mediaIds: []
	}
}, false, true);
