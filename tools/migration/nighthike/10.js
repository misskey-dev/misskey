db.following.remove({
	deletedAt: { $exists: true }
});
