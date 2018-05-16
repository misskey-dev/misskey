/**
 * Module dependencies
 */
import $ from 'cafy';
import User from '../../../../models/user';
import event from '../../../../publishers/stream';

/**
 * Update myself
 */
module.exports = async (params, user) => new Promise(async (res, rej) => {
	// Get 'name' parameter
	const [name, nameErr] = $.str.get(params.name);
	if (nameErr) return rej('invalid name param');

	// Get 'value' parameter
	const [value, valueErr] = $.any.nullable().get(params.value);
	if (valueErr) return rej('invalid value param');

	const x = {};
	x[`clientSettings.${name}`] = value;

	await User.update(user._id, {
		$set: x
	});

	res();

	// Publish event
	event(user._id, 'clientSettingUpdated', {
		key: name,
		value
	});
});
