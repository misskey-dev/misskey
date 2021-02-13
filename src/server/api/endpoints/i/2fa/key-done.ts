import $ from 'cafy';
import * as bcrypt from 'bcryptjs';
import { promisify } from 'util';
import * as cbor from 'cbor';
import define from '../../../define';
import {
	UserProfiles,
	UserSecurityKeys,
	AttestationChallenges,
	Users
} from '../../../../../models';
import config from '../../../../../config';
import { procedures, hash } from '../../../2fa';
import { publishMainStream } from '../../../../../services/stream';

const cborDecodeFirst = promisify(cbor.decodeFirst) as any;

export const meta = {
	requireCredential: true as const,

	secure: true,

	params: {
		clientDataJSON: {
			validator: $.str
		},
		attestationObject: {
			validator: $.str
		},
		password: {
			validator: $.str
		},
		challengeId: {
			validator: $.str
		},
		name: {
			validator: $.str
		}
	}
};

const rpIdHashReal = hash(Buffer.from(config.hostname, 'utf-8'));

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

	const clientData = JSON.parse(ps.clientDataJSON);

	if (clientData.type != 'webauthn.create') {
		throw new Error('not a creation attestation');
	}
	if (clientData.origin != config.scheme + '://' + config.host) {
		throw new Error('origin mismatch');
	}

	const clientDataJSONHash = hash(Buffer.from(ps.clientDataJSON, 'utf-8'));

	const attestation = await cborDecodeFirst(ps.attestationObject);

	const rpIdHash = attestation.authData.slice(0, 32);
	if (!rpIdHashReal.equals(rpIdHash)) {
		throw new Error('rpIdHash mismatch');
	}

	const flags = attestation.authData[32];

	// tslint:disable-next-line:no-bitwise
	if (!(flags & 1)) {
		throw new Error('user not present');
	}

	const authData = Buffer.from(attestation.authData);
	const credentialIdLength = authData.readUInt16BE(53);
	const credentialId = authData.slice(55, 55 + credentialIdLength);
	const publicKeyData = authData.slice(55 + credentialIdLength);
	const publicKey: Map<number, any> = await cborDecodeFirst(publicKeyData);
	if (publicKey.get(3) != -7) {
		throw new Error('alg mismatch');
	}

	if (!(procedures as any)[attestation.fmt]) {
		throw new Error('unsupported fmt');
	}

	const verificationData = (procedures as any)[attestation.fmt].verify({
		attStmt: attestation.attStmt,
		authenticatorData: authData,
		clientDataHash: clientDataJSONHash,
		credentialId,
		publicKey,
		rpIdHash
	});
	if (!verificationData.valid) throw new Error('signature invalid');

	const attestationChallenge = await AttestationChallenges.findOne({
		userId: user.id,
		id: ps.challengeId,
		registrationChallenge: true,
		challenge: hash(clientData.challenge).toString('hex')
	});

	if (!attestationChallenge) {
		throw new Error('non-existent challenge');
	}

	await AttestationChallenges.delete({
		userId: user.id,
		id: ps.challengeId
	});

	// Expired challenge (> 5min old)
	if (
		new Date().getTime() - attestationChallenge.createdAt.getTime() >=
		5 * 60 * 1000
	) {
		throw new Error('expired challenge');
	}

	const credentialIdString = credentialId.toString('hex');

	await UserSecurityKeys.save({
		userId: user.id,
		id: credentialIdString,
		lastUsed: new Date(),
		name: ps.name,
		publicKey: verificationData.publicKey.toString('hex')
	});

	// Publish meUpdated event
	publishMainStream(user.id, 'meUpdated', await Users.pack(user.id, user, {
		detail: true,
		includeSecrets: true
	}));

	return {
		id: credentialIdString,
		name: ps.name
	};
});
