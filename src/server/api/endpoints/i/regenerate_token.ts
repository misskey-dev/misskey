import $ from 'cafy';
import * as bcrypt from 'bcryptjs';
import User from '../../../../models/user';
import { publishMainStream } from '../../../../services/stream';
import generateUserToken from '../../common/generate-native-user-token';
import define from '../../define';

export const meta = {
	requireCredential: true,

	secure: true,

	params: {
		password: {
			validator: $.str
		}
	}
};

export default define(meta, (ps, user) => new Promise(async (res, rej) => {
	// Compare password
	const same = await bcrypt.compare(ps.password, user.password);

	if (!same) {
		return rej('incorrect password');
	}

	// Generate secret
	const secret = generateUserToken();

	await User.update(user._id, {
		$set: {
			'token': secret
		}
	});

	res();

	// Publish event
	publishMainStream(user._id, 'myTokenRegenerated');
}));
