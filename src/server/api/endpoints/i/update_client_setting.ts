import $ from 'cafy';
import User from '../../../../models/user';
import { publishMainStream } from '../../../../services/stream';
import define from '../../define';

export const meta = {
	requireCredential: true,

	secure: true,

	params: {
		name: {
			validator: $.str
		},

		value: {
			validator: $.nullable.any
		}
	}
};

export default define(meta, async (ps, user) => {
	const x: any = {};
	x[`clientSettings.${ps.name}`] = ps.value;

	await User.update(user._id, {
		$set: x
	});

	// Publish event
	publishMainStream(user._id, 'clientSettingUpdated', {
		key: ps.name,
		value: ps.value
	});

	return;
});
