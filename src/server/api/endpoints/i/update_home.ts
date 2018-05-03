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
			.have('place', $.str)
			.have('data', $.obj))
		.optional()
		.get(params.home);
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
				'clientSettings.home': home
			}
		});

		res();

		event(user._id, 'home_updated', {
			home
		});
	} else {
		if (id == null && data == null) return rej('you need to set id and data params if home param unset');

		const _home = user.clientSettings.home;
		const widget = _home.find(w => w.id == id);

		if (widget == null) return rej('widget not found');

		widget.data = data;

		await User.update(user._id, {
			$set: {
				'clientSettings.home': _home
			}
		});

		res();

		event(user._id, 'home_updated', {
			id, data
		});
	}
});
