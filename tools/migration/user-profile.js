db.users.find({}).forEach(function(user) {
	print(user._id);
	db.users.update({ _id: user._id }, {
		$rename: {
			bio: 'description'
		},
		$unset: {
			location: '',
			birthday: ''
		},
		$set: {
			profile: {
				location: user.location || null,
				birthday: user.birthday || null
			}
		}
	}, false, false);
});
