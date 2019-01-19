import $ from 'cafy';
import * as bcrypt from 'bcryptjs';
import User from '../../../../../models/user';
import define from '../../../define';
import { error } from '../../../../../prelude/promise';

export const meta = {
	requireCredential: true,

	secure: true,

	params: {
		password: {
			validator: $.str
		}
	}
};

export default define(meta, (ps, user) => bcrypt.compare(ps.password, user.password)
	.then(x =>
		!x ? error('incorrect password') :
		User.update(user._id, {
			$set: {
				'twoFactorSecret': null,
				'twoFactorEnabled': false
			}
		}))
	.then(() => {}));
