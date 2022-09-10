import bcrypt from 'bcryptjs';
import { publishInternalEvent, publishMainStream, publishUserEvent } from '@/services/stream.js';
import generateUserToken from '../../common/generate-native-user-token.js';
import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { Users, UserProfiles } from '@/models/index.js';

export const meta = {
	requireCredential: true,

	secure: true,
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		password: { type: 'string' },
	},
	required: ['password'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject('notesRepository')
    private notesRepository: typeof Notes,
	) {
		super(meta, paramDef, async (ps, user) => {
	const freshUser = await Users.findOneByOrFail({ id: user.id });
	const oldToken = freshUser.token;

	const profile = await UserProfiles.findOneByOrFail({ userId: user.id });

	// Compare password
	const same = await bcrypt.compare(ps.password, profile.password!);

	if (!same) {
		throw new Error('incorrect password');
	}

	const newToken = generateUserToken();

	await Users.update(user.id, {
		token: newToken,
	});

	// Publish event
	publishInternalEvent('userTokenRegenerated', { id: user.id, oldToken, newToken });
	publishMainStream(user.id, 'myTokenRegenerated');

	// Terminate streaming
	setTimeout(() => {
		publishUserEvent(user.id, 'terminate', {});
	}, 5000);
});
