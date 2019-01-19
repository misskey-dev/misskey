import $ from 'cafy';
import * as bcrypt from 'bcryptjs';
import User from '../../../../models/user';
import define from '../../define';
import { error } from '../../../../prelude/promise';

export const meta = {
	requireCredential: true,

	secure: true,

	params: {
		currentPassword: {
			validator: $.str
		},

		newPassword: {
			validator: $.str
		}
	}
};

export default define(meta, (ps, user) => bcrypt.compare(ps.currentPassword, user.password)
	.then(x =>
		!x ? error('incorrect password') :
		bcrypt.genSalt(8))
	.then(x => bcrypt.hash(ps.newPassword, x))
	.then(x => User.update(user._id, {
		$set: { 'password': x }
	}))
	.then(() => {}));
