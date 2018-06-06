import $ from 'cafy';
import User from '../../../../models/user';
import event from '../../../../publishers/stream';

module.exports = async (params, user) => new Promise(async (res, rej) => {
	// Get 'home' parameter
	const [home, homeErr] = $.arr(
		$.obj.strict()
			.have('name', $.str)
			.have('id', $.str)
			.have('data', $.obj))
		.get(params.home);
	if (homeErr) return rej('invalid home param');

	await User.update(user._id, {
		$set: {
			'clientSettings.mobileHome': home
		}
	});

	res();

	event(user._id, 'mobile_home_updated', home);
});
