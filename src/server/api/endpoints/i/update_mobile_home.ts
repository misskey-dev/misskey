import $ from 'cafy';
import User from '../../../../models/user';
import { publishMainStream } from '../../../../stream';
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

export default define(meta, (ps, user) => User.update(user._id, {
		$set: { 'clientSettings.mobileHome': ps.home }
	})
	.then(() => {
		publishMainStream(user._id, 'mobileHomeUpdated', ps.home);
	}));
