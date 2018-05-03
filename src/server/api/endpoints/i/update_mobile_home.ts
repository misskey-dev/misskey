/**
 * Module dependencies
 */
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
		.optional().get(params.home);
	if (homeErr) return rej('invalid home param');

	// Get 'id' parameter
	const [id, idErr] = $.str.optional().get(params.id);
	if (idErr) return rej('invalid id param');

	// Get 'data' parameter
	const [data, dataErr] = $.obj.optional().get(params.data);
	if (dataErr) return rej('invalid data param');

	if (home) {
		await User.update(user._id, {
			$set: {
				'clientSettings.mobileHome': home
			}
		});

		res();

		event(user._id, 'mobile_home_updated', {
			home
		});
	} else {
		if (id == null && data == null) return rej('you need to set id and data params if home param unset');

		const _home = user.clientSettings.mobileHome || [];
		const widget = _home.find(w => w.id == id);

		if (widget == null) return rej('widget not found');

		widget.data = data;

		await User.update(user._id, {
			$set: {
				'clientSettings.mobileHome': _home
			}
		});

		res();

		event(user._id, 'mobile_home_updated', {
			id, data
		});
	}
});
