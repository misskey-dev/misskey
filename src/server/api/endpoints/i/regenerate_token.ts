import $ from 'cafy';
import * as bcrypt from 'bcryptjs';
import User, { ILocalUser } from '../../../../models/user';
import event from '../../../../publishers/stream';
import generateUserToken from '../../common/generate-native-user-token';

/**
 * Regenerate native token
 */
export default async (params: any, user: ILocalUser) => new Promise(async (res, rej) => {
	// Get 'password' parameter
	const [password, passwordErr] = $.str.get(params.password);
	if (passwordErr) return rej('invalid password param');

	// Compare password
	const same = await bcrypt.compare(password, user.password);

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
	event(user._id, 'my_token_regenerated');
});
