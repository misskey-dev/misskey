import $ from 'cafy';
import * as bcrypt from 'bcryptjs';
import { publishMainStream } from '../../../../services/stream';
import generateUserToken from '../../common/generate-native-user-token';
import define from '../../define';
import { Users } from '../../../../models';

export const meta = {
	requireCredential: true,

	secure: true,

	params: {
		password: {
			validator: $.str
		}
	}
};

export default define(meta, async (ps, user) => {
	// Compare password
	const same = await bcrypt.compare(ps.password, user.password);

	if (!same) {
		throw new Error('incorrect password');
	}

	// Generate secret
	const secret = generateUserToken();

	await Users.update(user.id, {
		token: secret
	});

	// Publish event
	publishMainStream(user.id, 'myTokenRegenerated');
});
