import $ from 'cafy';
import User from '../../../../models/user';
import { publishMainStream } from '../../../../services/stream';
import define from '../../define';

export const meta = {
	requireCredential: true,

	secure: true,

	params: {
		home: {
			validator: $.arr($.obj({
				name: $.str,
				id: $.str,
				place: $.str,
				data: $.obj()
			}).strict())
		}
	}
};

export default define(meta, (ps, user) => new Promise(async (res, rej) => {
	await User.update(user._id, {
		$set: {
			'clientSettings.home': ps.home
		}
	});

	res();

	publishMainStream(user._id, 'homeUpdated', ps.home);
}));
