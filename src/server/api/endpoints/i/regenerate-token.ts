import $ from 'cafy';
import * as bcrypt from 'bcryptjs';
import { publishMainStream, publishUserEvent } from '@/services/stream.js';
import generateUserToken from '../../common/generate-native-user-token.js';
import define from '../../define.js';
import { Users, UserProfiles } from '@/models/index.js';

export const meta = {
	requireCredential: true as const,

	secure: true,

	params: {
		password: {
			validator: $.str
		}
	}
};

export default define(meta, async (ps, user) => {
	const profile = await UserProfiles.findOneOrFail(user.id);

	// Compare password
	const same = await bcrypt.compare(ps.password, profile.password!);

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

	// Terminate streaming
	setTimeout(() => {
		publishUserEvent(user.id, 'terminate', {});
	}, 5000);
});
