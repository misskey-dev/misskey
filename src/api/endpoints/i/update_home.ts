/**
 * Module dependencies
 */
import $ from 'cafy';
import User from '../../models/user';

/**
 * Update myself
 *
 * @param {any} params
 * @param {any} user
 * @param {any} _
 * @param {boolean} isSecure
 * @return {Promise<any>}
 */
module.exports = async (params, user, _, isSecure) => new Promise(async (res, rej) => {
	// Get 'home' parameter
	const [home, homeErr] = $(params.home).array().each(
		$().strict.object()
			.have('name', $().string())
			.have('id', $().string())
			.have('place', $().string())
			.have('data', $().object())).$;
	if (homeErr) return rej('invalid home param');

	await User.update(user._id, {
		$set: {
			'client_settings.home': home
		}
	});

	// Send response
	res();
});
