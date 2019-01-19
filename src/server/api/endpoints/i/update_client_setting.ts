import $ from 'cafy';
import User from '../../../../models/user';
import { publishMainStream } from '../../../../stream';
import define from '../../define';

export const meta = {
	requireCredential: true,

	secure: true,

	params: {
		name: {
			validator: $.str
		},

		value: {
			validator: $.any.nullable
		}
	}
};

export default define(meta, (ps, user) => User.update(user._id, {
		$set: { [`clientSettings.${ps.name}`]: ps.value }
	})
	.then(() => {
		publishMainStream(user._id, 'clientSettingUpdated', {
			key: ps.name,
			value: ps.value
		});
	}));
