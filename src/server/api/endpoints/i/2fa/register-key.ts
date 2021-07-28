import $ from 'cafy';
import * as bcrypt from 'bcryptjs';
import define from '../../../define';
import { UserProfiles, AttestationChallenges } from '../../../../../models';
import { promisify } from 'util';
import * as crypto from 'crypto';
import { genId } from '@/misc/gen-id';
import { hash } from '../../../2fa';

const randomBytes = promisify(crypto.randomBytes);

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

	if (!profile.twoFactorEnabled) {
		throw new Error('2fa not enabled');
	}

	// 32 byte challenge
	const entropy = await randomBytes(32);
	const challenge = entropy.toString('base64')
		.replace(/=/g, '')
		.replace(/\+/g, '-')
		.replace(/\//g, '_');

	const challengeId = genId();

	await AttestationChallenges.save({
		userId: user.id,
		id: challengeId,
		challenge: hash(Buffer.from(challenge, 'utf-8')).toString('hex'),
		createdAt: new Date(),
		registrationChallenge: true
	});

	return {
		challengeId,
		challenge
	};
});
