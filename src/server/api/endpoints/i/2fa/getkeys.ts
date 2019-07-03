import $ from 'cafy';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import define from '../../../define';
import { UserProfiles, UserSecurityKeys, AttestationChallenges } from '../../../../../models';
import { ensure } from '../../../../../prelude/ensure';
import { promisify } from 'util';
import { hash } from '../../../2fa';
import { genId } from '../../../../../misc/gen-id';

export const meta = {
	requireCredential: true,

	secure: true,

	params: {
		password: {
			validator: $.str
		}
	}
};

const randomBytes = promisify(crypto.randomBytes);

export default define(meta, async (ps, user) => {
	const profile = await UserProfiles.findOne(user.id).then(ensure);

	// Compare password
	const same = await bcrypt.compare(ps.password, profile.password!);

	if (!same) {
		throw new Error('incorrect password');
	}

	const keys = await UserSecurityKeys.find({
		userId: user.id
	});

	if (keys.length === 0) {
		throw new Error('no keys found');
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
		registrationChallenge: false
	});

	return {
		challenge,
		challengeId,
		securityKeys: keys.map(key => ({
			id: key.id
		}))
	};
});
