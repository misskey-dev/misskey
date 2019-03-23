import $ from 'cafy';
import User from '../../../../models/entities/user';
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
				data: $.obj()
			}).strict())
		}
	}
};

export default define(meta, async (ps, user) => {
	await User.update(user.id, {
		$set: {
			'clientSettings.mobileHome': ps.home
		}
	});

	publishMainStream(user.id, 'mobileHomeUpdated', ps.home);

	return;
});
