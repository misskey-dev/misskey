db.users.dropIndex({ token: 1 });

db.users.find({}).forEach(function(user) {
	print(user._id);
	db.users.update({ _id: user._id }, {
		$unset: {
			email: '',
			links: '',
			password: '',
			token: '',
			twitter: '',
			line: '',
			profile: '',
			last_used_at: '',
			is_bot: '',
			is_pro: '',
			two_factor_secret: '',
			two_factor_enabled: '',
			client_settings: '',
			settings: ''
		},
		$set: {
			account: {
				email: user.email,
				links: user.links,
				password: user.password,
				token: user.token,
				twitter: user.twitter,
				line: user.line,
				profile: user.profile,
				last_used_at: user.last_used_at,
				is_bot: user.is_bot,
				is_pro: user.is_pro,
				two_factor_secret: user.two_factor_secret,
				two_factor_enabled: user.two_factor_enabled,
				client_settings: user.client_settings,
				settings: user.settings
			}
		}
	}, false, false);
});
